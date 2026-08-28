import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { processMessage, logChatExchange } from "@/lib/chatbot/engine";
import { randomUUID } from "crypto";

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().optional(),
  visitorName: z.string().optional(),
  visitorEmail: z.string().email().optional(),
  context: z.record(z.string(), z.any()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, sessionId: providedSessionId, visitorName, visitorEmail, context } =
      chatSchema.parse(body);

    const user = await getCurrentUser();

    // Find or pick a property
    // - Logged-in users: their property
    // - Anonymous visitors: first active property
    let propertyId: string | null = null;
    if (user?.propertyId) {
      propertyId = user.propertyId;
    } else if (!user) {
      const first = await db.property.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      });
      propertyId = first?.id ?? null;
    } else {
      propertyId = user.propertyId;
    }

    // Find or create chat session
    let sessionId = providedSessionId;
    if (!sessionId) {
      const session = await db.chatSession.create({
        data: {
          propertyId,
          userId: user?.id ?? null,
          visitorName: visitorName ?? null,
          visitorEmail: visitorEmail ?? null,
          context: context ? JSON.stringify(context) : null,
          channel: "WEB",
        },
      });
      sessionId = session.id;
    } else {
      // Verify the session exists; if not, create new
      const existing = await db.chatSession.findUnique({ where: { id: sessionId } });
      if (!existing) {
        const session = await db.chatSession.create({
          data: {
            id: sessionId,
            propertyId,
            userId: user?.id ?? null,
            visitorName: visitorName ?? null,
            visitorEmail: visitorEmail ?? null,
          },
        });
        sessionId = session.id;
      } else if (user?.id && !existing.userId) {
        // Link anonymous session to logged-in user
        await db.chatSession.update({
          where: { id: sessionId },
          data: { userId: user.id },
        });
      }
    }

    // Process the message
    const result = await processMessage({
      message,
      propertyId,
      context,
    });

    // Log the exchange
    await logChatExchange({
      sessionId,
      userMessage: message,
      botReply: result.reply,
      intent: result.intent,
      confidence: result.confidence,
      entities: result.entities,
      escalated: result.escalated,
    });

    // If escalated, create an alert for staff
    if (result.escalated) {
      await db.alert.create({
        data: {
          propertyId: propertyId ?? (await db.property.findFirst())?.id ?? "",
          type: "SERVICE_REQUEST",
          severity: "WARNING",
          title: `Chat escalation: ${result.intent === "complaint" ? "Complaint" : "Human handoff requested"}`,
          message: `Session ${sessionId.slice(0, 8)}... — needs staff response`,
          entityType: "chat",
          entityId: sessionId,
        },
      });
    }

    return NextResponse.json({
      sessionId,
      reply: result.reply,
      intent: result.intent,
      confidence: result.confidence,
      suggestedActions: result.suggestedActions ?? [],
      escalated: result.escalated ?? false,
    });
  } catch (err: any) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process message" },
      { status: 400 }
    );
  }
}

// GET — fetch chat history for a session
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }
  const messages = await db.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return NextResponse.json({ messages });
}
