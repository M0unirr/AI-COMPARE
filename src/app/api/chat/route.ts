import { NextRequest } from "next/server";
import { streamText } from "ai";
import { models, JUDGE_MODEL, type ModelId } from "@/lib/llm";
import { createConversation, addMessage, addResponse } from "@/lib/store";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

let nextConvId = 1;

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  const userEmail = session?.user?.email || null;

  if (!userEmail) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { message: string; modelIds: ModelId[]; conversationId?: string };
  try {
    body = (await req.json()) as { message: string; modelIds: ModelId[]; conversationId?: string };
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { message, modelIds, conversationId } = body;

  if (!message || !modelIds?.length) {
    return Response.json({ error: "Missing message or models" }, { status: 400 });
  }

  const convId = conversationId || `conv_${nextConvId++}`;
  if (!conversationId) {
    await createConversation(convId, null, userEmail);
  }
  await addMessage(convId, message);

  const modelNameMap = {
    "deepseek-v4-flash": "DeepSeek V4 Flash",
    "gemma-4-31b": "Gemma 4 31B",
    "gemma-4-26b": "Gemma 4 26B",
    "gpt-oss-120b": "GPT-OSS 120B",
    "gpt-oss-20b": "GPT-OSS 20B",
    "llama-3.3-70b": "Llama 3.3 70B",
    "nemotron-3-super-120b": "Nemotron Super 120B",
    "laguna-m.1": "Laguna M.1",
  } as Record<string, string>;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: string) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
        } catch {
          // Controller already closed
        }
      };

      // Send convId immediately so client can link the conversation
      send("convId", convId);

      // Fan out to all selected models in parallel
      const results = await Promise.allSettled(
        modelIds.map(async (modelId) => {
          const start = Date.now();
          let fullText = "";
          let hadError = false;

          try {
            const model = models[modelId];
            if (!model) throw new Error(`Unknown model: ${modelId}`);

            const result = streamText({ 
              model, 
              prompt: message,
              onError: (error) => {
                console.error(`Error streaming ${modelId}:`, error);
              }
            });

            for await (const chunk of result.textStream) {
              fullText += chunk;
              send(`model:${modelId}`, chunk);
            }

            // Check if there was an error that didn't throw
            if (!fullText) {
              try {
                const text = await result.text;
                if (text) {
                  fullText = text;
                  send(`model:${modelId}`, text);
                }
              } catch (err) {
                hadError = true;
                throw err;
              }
            }
          } catch (err) {
            hadError = true;
            const errMsg = err instanceof Error ? err.message : String(err);
            // Filter out common non-critical errors
            if (!errMsg.includes('image') && !errMsg.includes('Image')) {
              send("error", `[${modelId}] ${errMsg}`);
            }
            throw err;
          }

          const latencyMs = Date.now() - start;
          send(`latency:${modelId}`, String(latencyMs));
          return { modelId, text: fullText, latencyMs };
        })
      );

      // Collect successful responses
      const responses: { modelId: string; text: string; latencyMs: number }[] = [];
      for (const r of results) {
        if (r.status === "fulfilled") {
          responses.push(r.value);
          const modelName = modelNameMap[r.value.modelId] || r.value.modelId;
          addResponse(convId, modelName, r.value.text, r.value.latencyMs);
        }
      }

      // Generate summary
      if (responses.length >= 2) {
        const judgeModel = models[JUDGE_MODEL];
        const responseText = responses
          .map((r, i) => `${i + 1}. [${r.modelId}]: ${r.text}`)
          .join("\n\n");

        const summaryPrompt = `You will be given ${responses.length} responses from different AI models to the same user question.

Question: ${message}

Responses:
${responseText}

Return:
1. A short (3-5 sentence) summary of the overall consensus answer.
2. A bullet-point list of the key differences between the models' responses (approach, depth, tone, any factual disagreements).

Format your response exactly like this:
SUMMARY:
[your summary here]

DIFFERENCES:
[bullet points here]`;

        try {
          const summaryResult = streamText({ model: judgeModel, prompt: summaryPrompt });

          let fullSummary = "";
          for await (const chunk of summaryResult.textStream) {
            fullSummary += chunk;
            send("summary", chunk);
          }

          // Also try .text in case stream was empty
          if (!fullSummary) {
            try {
              fullSummary = await summaryResult.text;
              if (fullSummary) {
                send("summary", fullSummary);
              }
            } catch (err) {
              send("error", `Summary failed: ${err instanceof Error ? err.message : String(err)}`);
            }
          }

          const diffMatch = fullSummary.match(/DIFFERENCES:\s*\n([\s\S]*)$/i);
          const differences = diffMatch?.[1]?.trim() || "";
          send("differences", differences);
        } catch (err) {
          send("error", `Summary failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      send("done", convId);
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Connection: "keep-alive",
    },
  });
}
