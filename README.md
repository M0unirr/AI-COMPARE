# LLM Compare Chat

Compare AI models side-by-side with streaming responses. Ask a question, see multiple LLM responses in real-time, and get an AI-generated summary of differences.

![Chat Interface](screenshots/final_result.png)

## Features

- **Multi-model comparison** — Send one question to up to 8 LLM models simultaneously
- **Real-time streaming** — Watch responses appear token-by-token
- **AI-powered summary** — A judge model generates a consensus and highlights differences
- **8 free models** via OpenRouter — No API key charges for included models
- **OAuth login** — Google and GitHub sign-in via Better Auth
- **Conversation history** — Browse, search, and revisit past comparisons
- **Markdown rendering** — Rich formatting in responses (code blocks, tables, lists)
- **MCP Server** — Model Context Protocol integration for AI assistants

## Models Included

| Model | Tags |
|-------|------|
| DeepSeek V4 Flash | reasoning, coding, fast |
| Gemma 4 31B | general, multilingual, vision |
| Gemma 4 26B | general, multilingual, efficient |
| GPT-OSS 120B | general, reasoning, balanced |
| GPT-OSS 20B | fast, lightweight, general |
| Llama 3.3 70B | chat, multilingual, stable |
| Nemotron Super 120B | multi-agent, tool-calling, reasoning |
| Laguna M.1 | coding, agentic, software-engineering |

All models are **free** on OpenRouter.

## Tech Stack

- **Framework:** Next.js 16 (Turbopack), React 19
- **Auth:** Better Auth (Google + GitHub OAuth)
- **Database:** Prisma 7 + SQLite (via LibSQL adapter)
- **AI:** AI SDK v7 + OpenRouter
- **UI:** Inline styles (no Tailwind in components)
- **MCP:** Model Context Protocol server (stdio transport)

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:

| Variable | Where to get it |
|----------|----------------|
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) (free, no credit card) |
| `BETTER_AUTH_SECRET` | Run `npx auth@latest secret` |
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console (same page as above) |
| `GITHUB_CLIENT_ID` | [GitHub Developer Settings](https://github.com/settings/developers) |
| `GITHUB_CLIENT_SECRET` | GitHub Developer Settings (same page) |

### 3. Initialize the database

```bash
npx prisma generate
npx prisma db push
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## OAuth Setup

### Google

1. Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials)
2. Create an OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy the Client ID and Client Secret to `.env`

### GitHub

1. Go to [GitHub > Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Register a new OAuth application
3. Set authorization callback URL to: `http://localhost:3000/api/auth/callback/github`
4. Copy the Client ID and Client Secret to `.env`

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page (OAuth login)
│   │   ├── chat/page.tsx         # Main chat interface
│   │   ├── layout.tsx            # Root layout
│   │   └── api/
│   │       ├── auth/[...all]/    # Better Auth catch-all
│   │       ├── chat/route.ts     # Multi-model fan-out + SSE streaming
│   │       └── conversations/    # CRUD for conversation history
│   ├── components/
│   │   ├── login.tsx             # OAuth login buttons
│   │   ├── markdown-renderer.tsx # Markdown rendering for LLM responses
│   │   └── providers.tsx         # React providers
│   ├── lib/
│   │   ├── auth.ts               # Better Auth server config
│   │   ├── auth-client.ts        # Better Auth client
│   │   ├── db.ts                 # Prisma client singleton
│   │   ├── llm.ts                # AI SDK model map + OpenRouter config
│   │   └── store.ts              # Database operations (conversations, messages)
│   └── proxy.ts                  # Auth guard for /chat routes
├── mcp-server/                   # MCP server (stdio transport)
│   └── src/
│       ├── index.ts              # MCP server entry point
│       ├── models.ts             # Model configuration
│       └── tools/
│           ├── compare.ts        # Multi-model comparison tool
│           └── list.ts           # Model listing tool
├── prisma/
│   └── schema.prisma             # Database schema
├── prisma.config.ts              # Prisma config
├── next.config.ts                # Next.js config + security headers
├── .env.example                  # Environment template
└── package.json
```

## MCP Server

The MCP server provides tools for AI assistants to compare LLM models.

### Setup

```bash
cd mcp-server
npm install
npm run build
```

### Usage

Add to your MCP client config:

```json
{
  "mcpServers": {
    "llm-compare": {
      "command": "node",
      "args": ["path/to/mcp-server/dist/index.js"],
      "env": {
        "OPENROUTER_API_KEY": "your-key"
      }
    }
  }
}
```

### Available Tools

- **`llm_compare_models`** — Compare a question across multiple LLM models
- **`llm_compare_list_models`** — List all available models

## API Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/chat` | Required | Send question to multiple models, returns SSE stream |
| GET | `/api/conversations` | Required | List user's conversations |
| GET | `/api/conversations/[id]` | Required | Get conversation with messages |
| DELETE | `/api/conversations/[id]` | Required | Delete a conversation |
| POST | `/api/auth/sign-in/social` | Public | OAuth sign-in (Google/GitHub) |

### SSE Events (POST /api/chat)

| Event | Data | Description |
|-------|------|-------------|
| `model:<id>` | Response text chunk | Streaming model output |
| `latency:<id>` | Milliseconds | Model response time |
| `error` | Error message | Model/request error |
| `summary` | Summary text | AI-generated consensus |
| `differences` | Diff text | Key differences between models |
| `done` | Conversation ID | Stream complete |

## Scripts

```bash
npm run dev       # Start dev server (0.0.0.0:3000)
npm run build     # Production build
npm start         # Start production server
npm run lint      # Run ESLint
```

## License

MIT
