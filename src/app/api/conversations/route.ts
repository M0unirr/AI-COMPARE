import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    const userEmail = session?.user?.email || null;

    if (!userEmail) {
      return Response.json({ conversations: [] });
    }

    if (!db) {
      return Response.json({ conversations: [] });
    }

    const user = await db.user.findUnique({ where: { email: userEmail } });
    if (!user) {
      return Response.json({ conversations: [] });
    }

    const conversations = await db.conversation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, createdAt: true },
    });

    return Response.json({ conversations });
  } catch {
    return Response.json({ conversations: [] });
  }
}
