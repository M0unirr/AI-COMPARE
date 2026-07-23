export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description: string;
  category: string;
}

export interface ComparisonResult {
  modelId: string;
  modelName: string;
  response: string;
  latencyMs: number;
  success: boolean;
  error?: string;
}

export interface ComparisonOutput {
  question: string;
  models_requested: string[];
  models_succeeded: string[];
  models_failed: string[];
  responses: ComparisonResult[];
  summary?: string;
  differences?: string;
  total_latency_ms: number;
}
