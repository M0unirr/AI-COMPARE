import { createOpenAI } from "@ai-sdk/openai";
import type { ModelInfo } from "./types.js";

const freeOpenrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || "",
  baseURL: "https://openrouter.ai/api/v1",
});

export const models = {
  "deepseek-v4-flash": freeOpenrouter("deepseek/deepseek-v4-flash"),
  "gemma-4-31b": freeOpenrouter("google/gemma-4-31b-it"),
  "gemma-4-26b": freeOpenrouter("google/gemma-4-26b-a4b-it"),
  "gpt-oss-120b": freeOpenrouter("openai/gpt-oss-120b"),
  "gpt-oss-20b": freeOpenrouter("openai/gpt-oss-20b"),
  "llama-3.3-70b": freeOpenrouter("meta-llama/llama-3.3-70b-instruct"),
  "nemotron-3-super-120b": freeOpenrouter("nvidia/nemotron-3-super-120b-a12b"),
  "laguna-m.1": freeOpenrouter("poolside/laguna-m.1"),
} as const;

export type ModelId = keyof typeof models;

export const JUDGE_MODEL: ModelId = "deepseek-v4-flash";

export const MODEL_METADATA: ModelInfo[] = [
  {
    id: "deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    provider: "DeepSeek",
    description: "Reasoning & coding specialist",
    category: "reasoning",
  },
  {
    id: "gemma-4-31b",
    name: "Gemma 4 31B",
    provider: "Google",
    description: "General & multilingual",
    category: "general",
  },
  {
    id: "gemma-4-26b",
    name: "Gemma 4 26B",
    provider: "Google",
    description: "General & multilingual",
    category: "general",
  },
  {
    id: "gpt-oss-120b",
    name: "GPT-OSS 120B",
    provider: "OpenAI",
    description: "General purpose",
    category: "general",
  },
  {
    id: "gpt-oss-20b",
    name: "GPT-OSS 20B",
    provider: "OpenAI",
    description: "General purpose",
    category: "general",
  },
  {
    id: "llama-3.3-70b",
    name: "Llama 3.3 70B",
    provider: "Meta",
    description: "Multilingual chat",
    category: "general",
  },
  {
    id: "nemotron-3-super-120b",
    name: "Nemotron Super 120B",
    provider: "NVIDIA",
    description: "Multi-agent & tool calling",
    category: "agent",
  },
  {
    id: "laguna-m.1",
    name: "Laguna M.1",
    provider: "Poolside",
    description: "Coding agents",
    category: "coding",
  },
];

export const MODEL_IDS = Object.keys(models) as ModelId[];

export function isValidModelId(id: string): id is ModelId {
  return id in models;
}

export function getModelMetadata(id: ModelId): ModelInfo | undefined {
  return MODEL_METADATA.find((m) => m.id === id);
}
