import { db } from "@/lib/db";
import { getConversationWithMessages } from "@/lib/store";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!db) {
      const conv = getConversationWithMessages(id);
      if (!conv) return Response.json({ error: "Not found" }, { status: 404 });
      return Response.json(conv);
    }

    const conversation = await db.conversation.findFirst({
      where: { id },
      include: {
        messages: {
          include: { responses: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json(conversation);
  } catch {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const userEmail = await auth.api.getSession({ headers: req.headers }).then(s => s?.user?.email || null);
    if (!userEmail) return Response.json({ error: "Unauthorized" }, { status: 401 });

    if (!db) return Response.json({ error: "Database not available" }, { status: 503 });

    const user = await db.user.findUnique({ where: { email: userEmail } });
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const conversation = await db.conversation.findFirst({
      where: { id, userId: user.id },
    });
    if (!conversation) return Response.json({ error: "Not found" }, { status: 404 });

    await db.conversation.delete({ where: { id } });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Failed to delete" }, { status: 500 });
  }
}
