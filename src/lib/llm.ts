import { createOpenAI } from "@ai-sdk/openai";

// OpenRouter - verified working models via OpenAI-compatible API (July 2026)
const freeOpenrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || "",
  baseURL: "https://openrouter.ai/api/v1",
});

// Map of model IDs to their provider instances
// Only verified working models included
export const models = {
  // DeepSeek models - Reasoning & Coding specialists
  "deepseek-v4-flash": freeOpenrouter("deepseek/deepseek-v4-flash"),
  
  // Google Gemma models - General & Multilingual
  "gemma-4-31b": freeOpenrouter("google/gemma-4-31b-it"),
  "gemma-4-26b": freeOpenrouter("google/gemma-4-26b-a4b-it"),
  
  // OpenAI GPT-OSS models - General purpose
  "gpt-oss-120b": freeOpenrouter("openai/gpt-oss-120b"),
  "gpt-oss-20b": freeOpenrouter("openai/gpt-oss-20b"),
  
  // Meta Llama models - Multilingual chat
  "llama-3.3-70b": freeOpenrouter("meta-llama/llama-3.3-70b-instruct"),
  
  // NVIDIA Nemotron models - Multi-agent & Tool calling
  "nemotron-3-super-120b": freeOpenrouter("nvidia/nemotron-3-super-120b-a12b"),
  
  // Poolside models - Coding agents
  "laguna-m.1": freeOpenrouter("poolside/laguna-m.1"),
} as const;

export type ModelId = keyof typeof models;

export const JUDGE_MODEL = "deepseek-v4-flash";
