// Chat engine: input → intent classification → entity extraction → response generation
// Drop-in replacement for LLM: swap `classifyIntent` + `generateDynamicResponse` with an LLM call.

import {
  INTENTS,
  ENTITY_PATTERNS,
  STATIC_RESPONSES,
  generateDynamicResponse,
  type ChatIntent,
  type EntityType,
  type ChatAction,
} from "./knowledge";
import { db } from "../db";

export interface ChatResult {
  reply: string;
  intent: ChatIntent;
  confidence: number;
  entities: Partial<Record<EntityType, string>>;
  suggestedActions?: ChatAction[];
  escalated?: boolean;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/['']/g, "'")
    .replace(/[^\w\s\u0980-\u09FF\-]/g, " ") // keep word chars + Bangla unicode
    .replace(/\s+/g, " ");
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Classify user input into an intent using weighted pattern matching.
 * Returns the highest-scoring intent above a minimum threshold.
 */
export function classifyIntent(input: string): { intent: ChatIntent; confidence: number } {
  const norm = normalize(input);
  let bestIntent: ChatIntent = "fallback";
  let bestScore = 0;

  for (const intent of INTENTS) {
    let score = 0;
    for (const pattern of intent.patterns) {
      if (pattern.regex.test(norm)) {
        score += pattern.weight;
      } else if (pattern.keywords) {
        const keywordHits = pattern.keywords.filter((kw) => norm.includes(kw.toLowerCase())).length;
        score += (keywordHits / pattern.keywords.length) * pattern.weight * 0.7;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent.id;
    }
  }

  // Normalize confidence to 0-1
  const confidence = Math.min(1, bestScore);
  return { intent: bestIntent, confidence };
}

/**
 * Extract entities from the input using regex patterns.
 */
export function extractEntities(input: string): Partial<Record<EntityType, string>> {
  const found: Partial<Record<EntityType, string>> = {};

  for (const [type, patterns] of Object.entries(ENTITY_PATTERNS) as [EntityType, RegExp[]][]) {
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        found[type] = match[0].trim();
        break; // First match wins
      }
    }
  }

  return found;
}

/**
 * Main entry: turn a user message into a structured chat response.
 * In production, replace this with an LLM call (OpenAI / Anthropic / Gemini)
 * — same interface, smarter answers.
 */
export async function processMessage(opts: {
  message: string;
  propertyId: string | null;
  context?: Record<string, any>;
}): Promise<ChatResult> {
  const { message, propertyId, context } = opts;

  const { intent, confidence } = classifyIntent(message);
  const entities = extractEntities(message);

  // Low confidence → ask for clarification or handoff
  if (confidence < 0.2 && intent !== "greeting" && intent !== "farewell" && intent !== "thanks") {
    return {
      reply:
        "I'm not quite sure what you're asking. I can help with:\n• Menu & food recommendations\n• Room booking & pricing\n• Table reservations\n• Order tracking\n• Delivery info\n• General hotel info\n\nWhat would you like to know?",
      intent: "fallback",
      confidence: 0,
      entities,
      suggestedActions: [
        { label: "Show menu", action: "show_menu" },
        { label: "Book a room", action: "open:hotel/bookings/new" },
        { label: "Talk to staff", action: "human_handoff" },
      ],
    };
  }

  // Complaint or human handoff → escalate
  if (intent === "complaint" || intent === "human_handoff") {
    const replies = STATIC_RESPONSES[intent] ?? ["Let me connect you with our team."];
    return {
      reply: pickRandom(replies),
      intent,
      confidence,
      entities,
      escalated: true,
      suggestedActions: [
        { label: "Call front desk", action: "show_contact" },
      ],
    };
  }

  // Try dynamic (DB-backed) responses first
  if (propertyId) {
    const dynamic = await generateDynamicResponse(intent, entities as Record<EntityType, string | null>, propertyId);
    if (dynamic) {
      return {
        reply: dynamic.reply,
        intent,
        confidence,
        entities,
        suggestedActions: dynamic.suggestedActions,
      };
    }
  }

  // Fall back to static responses
  const staticReplies = STATIC_RESPONSES[intent];
  if (staticReplies && staticReplies.length > 0) {
    return {
      reply: pickRandom(staticReplies),
      intent,
      confidence,
      entities,
    };
  }

  // No match
  return {
    reply: "I'm not sure how to help with that. Would you like to speak with our team?",
    intent: "fallback",
    confidence: 0,
    entities,
    suggestedActions: [
      { label: "Talk to staff", action: "human_handoff" },
    ],
  };
}

/**
 * Log a chat exchange to the database for analytics and audit.
 */
export async function logChatExchange(opts: {
  sessionId: string;
  userMessage: string;
  botReply: string;
  intent: ChatIntent;
  confidence: number;
  entities: Record<string, any>;
  escalated?: boolean;
}) {
  await db.$transaction([
    db.chatMessage.create({
      data: {
        sessionId: opts.sessionId,
        sender: "USER",
        content: opts.userMessage,
      },
    }),
    db.chatMessage.create({
      data: {
        sessionId: opts.sessionId,
        sender: "BOT",
        content: opts.botReply,
        intent: opts.intent,
        confidence: opts.confidence,
        metadata: JSON.stringify({ entities: opts.entities, escalated: opts.escalated ?? false }),
      },
    }),
    db.chatSession.update({
      where: { id: opts.sessionId },
      data: { lastMessageAt: new Date() },
    }),
  ]);
}
