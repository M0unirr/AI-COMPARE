#!/usr/bin/env node
/**
 * MCP Server for LLM Compare.
 *
 * This server provides tools to compare responses from multiple LLM models,
 * list available models, and explore model capabilities.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MODEL_IDS, MODEL_METADATA } from "./models.js";
import {
  CompareModelsInputSchema,
  compareModels,
  type CompareModelsInput,
} from "./tools/compare.js";
import {
  ListModelsInputSchema,
  listModels,
  type ListModelsInput,
} from "./tools/list.js";

const server = new McpServer({
  name: "llm-compare-mcp-server",
  version: "1.0.0",
});

// Register compare tool
server.registerTool(
  "llm_compare_send_prompt",
  {
    title: "Compare LLM Responses",
    description: `Send a question to multiple LLM models and get a side-by-side comparison with an optional AI-generated summary.

Available models: ${MODEL_IDS.join(", ")}

This tool fans out your question to all specified models in parallel, collects their responses, and optionally generates a summary highlighting the key differences between them.

Returns:
  - Individual responses from each model with latency
  - Success/failure status per model
  - Summary and differences (if include_summary=true)
  - Total latency

Use when:
  - You want to see how different AI models answer the same question
  - You need to compare model strengths/weaknesses on a topic
  - You want a quick consensus view from multiple models

Don't use when:
  - You only need a single model's response
  - You want to have a multi-turn conversation (this is single-turn only)`,
    inputSchema: CompareModelsInputSchema.shape,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: CompareModelsInput) => {
    return compareModels(params);
  }
);

// Register list models tool
server.registerTool(
  "llm_compare_list_models",
  {
    title: "List Available Models",
    description: `List all available LLM models with their providers, descriptions, and categories.

Optional filters:
  - category: Filter by 'reasoning', 'general', 'agent', 'coding'
  - provider: Filter by provider name (e.g., 'OpenAI', 'Google')

Returns:
  - List of models with IDs, names, providers, and descriptions
  - Organized by provider
  - Count of matching models

Use when:
  - You need to know which models are available
  - You want to find models by category or provider
  - You need model IDs for the compare tool`,
    inputSchema: ListModelsInputSchema.shape,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (params: ListModelsInput) => {
    return listModels(params);
  }
);

// Run server
async function run(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("LLM Compare MCP server running via stdio");
}

run().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
