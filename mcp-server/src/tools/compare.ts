import { streamText } from "ai";
import { z } from "zod";
import { models, MODEL_IDS, isValidModelId, getModelMetadata, type ModelId } from "../models.js";
import type { ComparisonResult, ComparisonOutput } from "../types.js";

const MODEL_DESCRIPTIONS = MODEL_IDS.map((id) => {
  const meta = getModelMetadata(id);
  return meta ? `  - ${id}: ${meta.name} (${meta.provider}) - ${meta.description}` : `  - ${id}`;
}).join("\n");

export const CompareModelsInputSchema = z
  .object({
    question: z
      .string()
      .min(1, "Question is required")
      .max(10000, "Question must not exceed 10000 characters")
      .describe("The question or prompt to send to the LLM models"),
    model_ids: z
      .array(z.string())
      .min(2, "At least 2 models required for comparison")
      .max(8, "Maximum 8 models allowed")
      .describe("Array of model IDs to compare"),
    include_summary: z
      .boolean()
      .default(true)
      .describe("Whether to generate a summary comparing the responses"),
  })
  .strict();

export type CompareModelsInput = z.infer<typeof CompareModelsInputSchema>;

export async function compareModels(params: CompareModelsInput): Promise<{
  content: { type: "text"; text: string }[];
}> {
  const start = Date.now();
  const invalidModels = params.model_ids.filter((id) => !isValidModelId(id));

  if (invalidModels.length > 0) {
    const output: ComparisonOutput = {
      question: params.question,
      models_requested: params.model_ids,
      models_succeeded: [],
      models_failed: invalidModels,
      responses: [],
      total_latency_ms: 0,
    };
    return {
      content: [
        {
          type: "text",
          text: `Error: Invalid model IDs: ${invalidModels.join(", ")}. Available models:\n${MODEL_DESCRIPTIONS}`,
        },
      ],
    };
  }

  const validModelIds = params.model_ids as ModelId[];

  const responses: ComparisonResult[] = await Promise.all(
    validModelIds.map(async (modelId) => {
      const modelStart = Date.now();
      try {
        const model = models[modelId];
        const result = streamText({ model, prompt: params.question });
        let fullText = "";
        for await (const chunk of result.textStream) {
          fullText += chunk;
        }
        return {
          modelId,
          modelName: getModelMetadata(modelId)?.name || modelId,
          response: fullText,
          latencyMs: Date.now() - modelStart,
          success: true,
        };
      } catch (err) {
        return {
          modelId,
          modelName: getModelMetadata(modelId)?.name || modelId,
          response: "",
          latencyMs: Date.now() - modelStart,
          success: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    })
  );

  const succeeded = responses.filter((r) => r.success);
  const failed = responses.filter((r) => !r.success);

  let summary: string | undefined;
  let differences: string | undefined;

  if (params.include_summary && succeeded.length >= 2) {
    const responseText = succeeded
      .map((r, i) => `${i + 1}. [${r.modelName}]: ${r.response}`)
      .join("\n\n");

    const summaryPrompt = `You will be given ${succeeded.length} responses from different AI models to the same user question.

Question: ${params.question}

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
      const judgeModel = models["deepseek-v4-flash"];
      const summaryResult = streamText({ model: judgeModel, prompt: summaryPrompt });
      let fullSummary = "";
      for await (const chunk of summaryResult.textStream) {
        fullSummary += chunk;
      }
      const diffMatch = fullSummary.match(/DIFFERENCES:\s*\n([\s\S]*)$/i);
      summary = fullSummary.split("DIFFERENCES:")[0]?.replace("SUMMARY:", "").trim();
      differences = diffMatch?.[1]?.trim();
    } catch {
      summary = "Summary generation failed";
    }
  }

  const output: ComparisonOutput = {
    question: params.question,
    models_requested: params.model_ids,
    models_succeeded: succeeded.map((r) => r.modelId),
    models_failed: failed.map((r) => r.modelId),
    responses,
    summary,
    differences,
    total_latency_ms: Date.now() - start,
  };

  const textLines: string[] = [
    `# LLM Comparison`,
    `**Question:** ${params.question}`,
    "",
    `## Responses (${succeeded.length}/${params.model_ids.length} succeeded)`,
    "",
  ];

  for (const r of responses) {
    const status = r.success ? "✓" : "✗";
    textLines.push(`### ${status} ${r.modelName} (${r.modelId})`);
    textLines.push(`*Latency: ${r.latencyMs}ms*`);
    if (r.success) {
      textLines.push(r.response);
    } else {
      textLines.push(`**Error:** ${r.error}`);
    }
    textLines.push("");
  }

  if (summary) {
    textLines.push("## Summary");
    textLines.push(summary);
    textLines.push("");
  }

  if (differences) {
    textLines.push("## Differences");
    textLines.push(differences);
  }

  return {
    content: [{ type: "text", text: textLines.join("\n") }],
  };
}
