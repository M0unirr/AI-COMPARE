import { db } from "./db";

type ResponseData = { modelName: string; content: string; latencyMs?: number };
type MessageData = { prompt: string; responses: ResponseData[] };
type ConversationData = { id: string; title: string | null; createdAt: Date; messages: MessageData[] };

// Create a new conversation tied to a user email
export async function createConversation(id: string, title: string | null, userEmail: string) {
  try {
    if (!db) {
      console.warn("Database not available, using in-memory fallback");
      return null;
    }

    // Find or create user by email
    let user = await db.user.findUnique({ where: { email: userEmail } });
    if (!user) {
      user = await db.user.create({ data: { email: userEmail } });
    }

    // Create conversation
    const conv = await db.conversation.create({
      data: {
        id,
        userId: user.id,
        title,
      },
    });

    return conv;
  } catch (error) {
    console.error("Error creating conversation:", error);
    return null;
  }
}

// Get a conversation by ID
export async function getConversation(id: string) {
  try {
    if (!db) return null;

    return await db.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          include: {
            responses: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  } catch (error) {
    console.error("Error getting conversation:", error);
    return null;
  }
}

// Add a message to a conversation
export async function addMessage(conversationId: string, prompt: string) {
  try {
    if (!db) return false;

    const message = await db.message.create({
      data: {
        conversationId,
        prompt,
        role: "user",
      },
    });

    // Update conversation title if it's the first message
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: true },
    });

    if (conversation && conversation.messages.length === 1 && !conversation.title) {
      const title = prompt.length > 50 ? prompt.slice(0, 47) + "..." : prompt;
      await db.conversation.update({
        where: { id: conversationId },
        data: { title },
      });
    }

    return true;
  } catch (error) {
    console.error("Error adding message:", error);
    return false;
  }
}

// Add a response to the last message in a conversation
export async function addResponse(
  conversationId: string,
  modelName: string,
  content: string,
  latencyMs?: number
) {
  try {
    if (!db) return;

    // Get the last message in this conversation
    const lastMessage = await db.message.findFirst({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
    });

    if (lastMessage) {
      await db.modelResponse.create({
        data: {
          messageId: lastMessage.id,
          modelName,
          content,
          latencyMs,
        },
      });
    }
  } catch (error) {
    console.error("Error adding response:", error);
  }
}

// List all conversations for a user email
export async function listConversations(userEmail: string) {
  try {
    if (!db) return [];

    // Find user by email
    const user = await db.user.findUnique({ where: { email: userEmail } });
    if (!user) return [];

    const conversations = await db.conversation.findMany({
      where: { userId: user.id },
      include: {
        messages: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return conversations.map((c) => ({
      id: c.id,
      title: c.title,
      createdAt: c.createdAt,
      messageCount: c.messages.length,
    }));
  } catch (error) {
    console.error("Error listing conversations:", error);
    return [];
  }
}

// Get a conversation with all messages and responses
export async function getConversationWithMessages(id: string) {
  try {
    if (!db) return null;

    return await db.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          include: {
            responses: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  } catch (error) {
    console.error("Error getting conversation with messages:", error);
    return null;
  }
}
