import { z } from "zod";
import { MODEL_METADATA, MODEL_IDS } from "../models.js";

export const ListModelsInputSchema = z
  .object({
    category: z
      .string()
      .optional()
      .describe("Filter by category: 'reasoning', 'general', 'agent', 'coding'"),
    provider: z
      .string()
      .optional()
      .describe("Filter by provider name (e.g., 'OpenAI', 'Google')"),
  })
  .strict();

export type ListModelsInput = z.infer<typeof ListModelsInputSchema>;

export interface ModelListOutput {
  total: number;
  models: typeof MODEL_METADATA;
}

export async function listModels(params: ListModelsInput): Promise<{
  content: { type: "text"; text: string }[];
}> {
  let filtered = [...MODEL_METADATA];

  if (params.category) {
    filtered = filtered.filter(
      (m) => m.category.toLowerCase() === params.category!.toLowerCase()
    );
  }

  if (params.provider) {
    filtered = filtered.filter(
      (m) => m.provider.toLowerCase() === params.provider!.toLowerCase()
    );
  }

  const textLines: string[] = [
    `# Available LLM Models (${filtered.length} total)`,
    "",
  ];

  const byProvider = new Map<string, typeof filtered>();
  for (const model of filtered) {
    const existing = byProvider.get(model.provider) || [];
    existing.push(model);
    byProvider.set(model.provider, existing);
  }

  for (const [provider, models] of byProvider) {
    textLines.push(`## ${provider}`);
    for (const m of models) {
      textLines.push(`- **${m.id}** (${m.name}) - ${m.description} [${m.category}]`);
    }
    textLines.push("");
  }

  textLines.push(`Use these model IDs in the llm_compare_send_prompt tool.`);

  return {
    content: [{ type: "text", text: textLines.join("\n") }],
  };
}
