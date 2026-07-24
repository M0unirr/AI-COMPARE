import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "SET" : "MISSING",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "SET" : "MISSING",
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ? "SET" : "MISSING",
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ? "SET" : "MISSING",
    DATABASE_URL: process.env.DATABASE_URL ? "SET" : "MISSING",
    DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN ? "SET" : "MISSING",
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ? "SET" : "MISSING",
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ? "SET" : "MISSING",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ? "SET" : "MISSING",
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? "SET" : "MISSING",
    VERCEL_ENV: process.env.VERCEL_ENV || "MISSING",
  });
}
