// Chatbot knowledge base: intents, patterns, entities, response templates.
// In production, replace `generateResponse` in engine.ts with an LLM call
// (OpenAI, Anthropic, Gemini) — the structure here stays the same.

import { db } from "../db";

export type ChatIntent =
  | "greeting"
  | "farewell"
  | "thanks"
  | "menu_inquiry"
  | "menu_recommend"
  | "menu_item_info"
  | "room_inquiry"
  | "room_booking"
  | "room_pricing"
  | "table_reservation"
  | "order_status"
  | "place_order"
  | "delivery_inquiry"
  | "delivery_track"
  | "hours"
  | "location"
  | "contact"
  | "facilities"
  | "housekeeping_request"
  | "checkout"
  | "payment"
  | "complaint"
  | "human_handoff"
  | "fallback";

export type EntityType =
  | "item_name"
  | "room_type"
  | "date"
  | "time"
  | "party_size"
  | "order_number"
  | "phone"
  | "email"
  | "category"
  | "dietary";

interface Pattern {
  regex: RegExp;
  keywords?: string[];
  weight: number;
}

interface Intent {
  id: ChatIntent;
  patterns: Pattern[];
  entities?: EntityType[];
  requiresContext?: string[];
  description: string;
}

export const INTENTS: Intent[] = [
  {
    id: "greeting",
    patterns: [
      { regex: /^(hi|hello|hey|hola|assalam|salam|আসসালামু|নমস্কার|হ্যালো|হাই)/i, weight: 1.0 },
      { regex: /good (morning|afternoon|evening|day)/i, weight: 1.0 },
      { regex: /^(hi there|hello there)/i, weight: 0.9 },
    ],
    description: "Greeting the bot",
  },
  {
    id: "farewell",
    patterns: [
      { regex: /\b(bye|goodbye|see you|cya|আসসালামু\s*আলাইকুম|বাই|বিদায়)\b/i, weight: 1.0 },
      { regex: /talk to you (later|soon)/i, weight: 0.9 },
    ],
    description: "Ending the conversation",
  },
  {
    id: "thanks",
    patterns: [
      { regex: /\b(thanks|thank you|thx|ty|appreciated)\b/i, weight: 1.0 },
      { regex: /ধন্যবাদ|শুকরিয়া|অনেক ধন্যবাদ/i, weight: 1.0 },
    ],
    description: "Expressing gratitude",
  },
  {
    id: "menu_inquiry",
    patterns: [
      { regex: /\b(menu|food|dishes|কি\s*আছে|খাবার|মেনু|খাবারের)\b/i, weight: 0.9 },
      { regex: /what (do you|can you) (serve|offer|have)/i, weight: 0.95 },
      { regex: /show me (the )?menu/i, weight: 1.0 },
      { regex: /আপনার কি|কি কি খাবার|কি কি আছে|খাবারের তালিকা/i, weight: 0.95 },
    ],
    entities: ["category"],
    description: "Asking about the menu",
  },
  {
    id: "menu_recommend",
    patterns: [
      { regex: /recommend|suggest|what should i (eat|order|try)|best (dish|food|item)/i, weight: 0.95 },
      { regex: /\bbest\b|\bpopular\b|\btop\b|\bgood\b/i, weight: 0.6 },
      { regex: /popular|signature|chef'?s? (special|pick)/i, weight: 0.9 },
      { regex: /কোনটা ভালো|সাজেস্ট|রেকমেন্ড|জনপ্রিয়/i, weight: 0.9 },
    ],
    entities: ["dietary"],
    description: "Asking for menu recommendations",
  },
  {
    id: "menu_item_info",
    patterns: [
      { regex: /what is|tell me about|ingredients?|allergens?/i, weight: 0.7 },
      { regex: /is .+ (spicy|hot|sweet|vegetarian|veg|halal)/i, weight: 0.85 },
    ],
    entities: ["item_name", "dietary"],
    description: "Asking about a specific item",
  },
  {
    id: "room_inquiry",
    patterns: [
      { regex: /\b(room|rooms|accommodation|স্যুট|রুম|থাকার|আছে)\b/i, weight: 0.8 },
      { regex: /what (types|kinds) of room/i, weight: 1.0 },
      { regex: /show me (the )?rooms/i, weight: 0.95 },
      { regex: /কোন রুম|রুম আছে|কি কি রুম/i, weight: 0.95 },
    ],
    entities: ["room_type", "date"],
    description: "Asking about rooms",
  },
  {
    id: "room_booking",
    patterns: [
      { regex: /book|reserve|reservation|বুক|রিজার্ভ/i, weight: 0.9 },
      { regex: /i (want|need|would like) to (stay|book)/i, weight: 0.95 },
      { regex: /available (room|dates?)/i, weight: 0.85 },
    ],
    entities: ["room_type", "date"],
    description: "Booking a room",
  },
  {
    id: "room_pricing",
    patterns: [
      { regex: /\b(price|cost|rate|charge|fee|কত|ভাড়া)\b/i, weight: 0.85 },
      { regex: /how much/i, weight: 0.7 },
    ],
    entities: ["room_type"],
    description: "Asking about room prices",
  },
  {
    id: "table_reservation",
    patterns: [
      { regex: /\b(table|টেবিল)\b.*(reserve|book|বুক)/i, weight: 0.95 },
      { regex: /dinner (reservation|booking)|reserve a table/i, weight: 0.95 },
    ],
    entities: ["date", "time", "party_size"],
    description: "Reserving a restaurant table",
  },
  {
    id: "order_status",
    patterns: [
      { regex: /where is my order|order status|track.*order/i, weight: 1.0 },
      { regex: /ORD-\d{4}-\d+/i, weight: 1.0 },
    ],
    entities: ["order_number"],
    description: "Checking an order status",
  },
  {
    id: "place_order",
    patterns: [
      { regex: /i want to (order|eat|buy)|place.*order|অর্ডার/i, weight: 0.9 },
      { regex: /can i (get|have)/i, weight: 0.6 },
    ],
    entities: ["item_name"],
    description: "Wants to place an order",
  },
  {
    id: "delivery_inquiry",
    patterns: [
      { regex: /deliver(y|ies)?|home delivery/i, weight: 0.9 },
      { regex: /do you (deliver|offer delivery)/i, weight: 0.95 },
    ],
    description: "Asking about delivery",
  },
  {
    id: "delivery_track",
    patterns: [
      { regex: /track(ing)?|where is my (delivery|food)|driver|rider/i, weight: 0.95 },
    ],
    entities: ["order_number"],
    description: "Tracking a delivery",
  },
  {
    id: "hours",
    patterns: [
      { regex: /what time|opening|closing|hours|কখন|সময়/i, weight: 0.9 },
      { regex: /are you open/i, weight: 1.0 },
    ],
    description: "Asking about operating hours",
  },
  {
    id: "location",
    patterns: [
      { regex: /\b(where|location|address|find you|কোথায়|ঠিকানা)\b/i, weight: 0.85 },
      { regex: /how (do i|to) (get|find|reach)/i, weight: 0.8 },
    ],
    description: "Asking about location",
  },
  {
    id: "contact",
    patterns: [
      { regex: /phone|number|call|contact|ফোন|যোগাযোগ/i, weight: 0.85 },
      { regex: /email/i, weight: 0.7 },
    ],
    description: "Asking for contact info",
  },
  {
    id: "facilities",
    patterns: [
      { regex: /facilities|amenities|features|services|সুবিধা/i, weight: 0.9 },
      { regex: /\b(wifi|wi-fi|parking|pool|gym|breakfast|ac)\b/i, weight: 0.7 },
    ],
    description: "Asking about facilities/amenities",
  },
  {
    id: "housekeeping_request",
    patterns: [
      { regex: /\b(towel|clean|cleaning|toilet|pillow|blanket|sheet)\b/i, weight: 0.8 },
      { regex: /housekeep|room service/i, weight: 0.95 },
    ],
    description: "In-room housekeeping request",
  },
  {
    id: "checkout",
    patterns: [
      { regex: /\bcheckout|check out|check-out|bill|invoice|বিল\b/i, weight: 0.95 },
    ],
    description: "Asking about checkout",
  },
  {
    id: "payment",
    patterns: [
      { regex: /\b(pay|payment|cash|card|bkash|nagad|ssl)\b/i, weight: 0.85 },
      { regex: /accept .* payment/i, weight: 0.9 },
    ],
    description: "Asking about payment methods",
  },
  {
    id: "complaint",
    patterns: [
      { regex: /complain|complaint|problem|issue|not working|broken|disappointed/i, weight: 0.95 },
      { regex: /unhappy|dissatisfied|terrible|bad service/i, weight: 0.9 },
    ],
    description: "Filing a complaint",
  },
  {
    id: "human_handoff",
    patterns: [
      { regex: /speak to (a |someone )?(human|person|agent|staff|manager|reception)/i, weight: 1.0 },
      { regex: /talk to (a |someone )?(human|person|agent|staff)/i, weight: 1.0 },
    ],
    description: "Wants to talk to a human",
  },
];

// ----- Entity extraction patterns -----
export const ENTITY_PATTERNS: Record<EntityType, RegExp[]> = {
  item_name: [
    /\b(chicken biryani|mutton biryani|beef steak|fish & chips|paneer|pasta|burger|pizza|biryani|kacchi)\b/i,
    /\b(coke|sprite|water|lassi|coffee|tea|chai|cappuccino)\b/i,
    /\b(spring roll|samosa|satay|gulab jamun|ice cream|firni)\b/i,
  ],
  room_type: [
    /\b(standard|deluxe|suite|executive)\b/i,
  ],
  date: [
    /\b(today|tomorrow|tonight)\b/i,
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    /\b\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\b/i,
    /\b\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?\b/,
  ],
  time: [
    /\b\d{1,2}:\d{2}\s*(am|pm)?\b/i,
    /\b\d{1,2}\s*(am|pm)\b/i,
    /\b(morning|afternoon|evening|night|breakfast|lunch|dinner)\b/i,
  ],
  party_size: [
    /\b(\d+)\s*(people|persons?|guests?|pax|adults?)\b/i,
    /\bfor\s+(\d+)\b/i,
    /\b(table for|party of)\s+(\d+)/i,
  ],
  order_number: [
    /ORD-\d{4}-\d+/i,
  ],
  phone: [
    /\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/,
  ],
  email: [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  ],
  category: [
    /\b(appetizer|appetizers|starters?|main|main course|biryani|rice|beverages?|drinks?|desserts?|sweets?)\b/i,
  ],
  dietary: [
    /\b(veg(etarian)?|non[- ]?veg|halal|spicy|spiciness|mild|hot|sweet|savoury)\b/i,
  ],
};

// ----- Static response templates -----
// Some responses need dynamic data (from DB), those use placeholders {{key}}
export const STATIC_RESPONSES: Record<string, string[]> = {
  greeting: [
    "Hello! 👋 Welcome to IHG. How can I help you today? I can assist with menu, rooms, reservations, and orders.",
    "Hi there! I'm IHG's virtual assistant. What would you like to know — our menu, rooms, or to place an order?",
    "Welcome to International Hospitality Group! How may I assist you?",
  ],
  farewell: [
    "Goodbye! Have a wonderful day. 😊",
    "Thank you for chatting. We hope to see you soon!",
    "Take care! Visit us anytime.",
  ],
  thanks: [
    "You're welcome! 😊 Anything else I can help with?",
    "Glad I could help! Let me know if you need anything else.",
    "My pleasure! Feel free to ask anything else.",
  ],
  hours: [
    "Our restaurant is open daily:\n• Breakfast: 7:00 AM – 10:30 AM\n• Lunch: 12:00 PM – 3:30 PM\n• Dinner: 6:30 PM – 11:00 PM\n\nFront desk is 24/7.",
  ],
  location: [
    "We're located in the heart of the city. 📍\nFull address and directions are available on our contact page.\n\nWould you like me to connect you with our team for detailed directions?",
  ],
  contact: [
    "You can reach us:\n📞 Phone: Available on the property page\n✉️ Email: Available on the property page\n\nWould you like me to take a message for our team?",
  ],
  facilities: [
    "Our property offers:\n• 24/7 front desk & room service\n• Restaurant & bar\n• Free high-speed WiFi\n• Parking\n• Daily housekeeping\n• Laundry service\n• Airport shuttle (on request)\n\nAnything specific you'd like to know?",
  ],
  delivery_inquiry: [
    "Yes! We offer food delivery within city limits. 🚴\n• Estimated time: 30–45 minutes\n• Delivery fee: ৳50 (free for orders over ৳1000)\n\nBrowse our menu to start an order, or would you like me to help?",
  ],
  payment: [
    "We accept multiple payment methods:\n💵 Cash\n💳 Card (Visa, MasterCard, Amex)\n📱 bKash / Nagad\n🏨 Room charge (for in-house guests)\n\nOnline payment gateway is also available.",
  ],
  human_handoff: [
    "Of course! 🙋 I'll connect you with our team right away. Could you share your name and a brief description of how we can help? They'll be with you shortly.",
  ],
  complaint: [
    "I'm really sorry to hear that. 😔 Let me connect you with our manager immediately so we can make this right. Could you share your booking code or room number, and tell me what happened?",
  ],
  checkout: [
    "Check-out time is 12:00 PM (noon). 🕛\nLate check-out may be available on request (charges may apply).\n\nWould you like to request a late check-out, or do you have a question about your bill?",
  ],
  housekeeping_request: [
    "I'll arrange that for you right away. 🧺\nCould you share your room number? Our housekeeping team will bring it to you within 10–15 minutes.\n\nIf it's urgent, please call the front desk directly.",
  ],
};

// ----- Dynamic response generators (pull from DB) -----
export async function generateDynamicResponse(
  intent: ChatIntent,
  entities: Record<EntityType, string | null>,
  propertyId: string | null
): Promise<{ reply: string; suggestedActions?: ChatAction[] } | null> {
  if (!propertyId) return null;

  switch (intent) {
    case "menu_inquiry": {
      const categories = await db.menuCategory.findMany({
        where: { propertyId, isActive: true },
        include: { _count: { select: { items: { where: { isAvailable: true } } } } },
        orderBy: { displayOrder: "asc" },
        take: 8,
      });
      if (categories.length === 0) return null;
      const lines = categories.map((c) => `• **${c.name}** (${c._count.items} items)`).join("\n");
      return {
        reply: `Here's what we offer:\n\n${lines}\n\nWould you like to see items from a specific category, or get recommendations?`,
        suggestedActions: categories.slice(0, 4).map((c) => ({
          label: `View ${c.name}`,
          action: `show_category:${c.name}`,
        })),
      };
    }

    case "menu_recommend": {
      const items = await db.menuItem.findMany({
        where: { propertyId, isAvailable: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
      if (items.length === 0) return null;
      const list = items
        .map((i) => `• **${i.name}** — ৳${i.price} ${i.isVeg ? "🟢" : "🔴"}`)
        .join("\n");
      return {
        reply: `Here are some popular picks:\n\n${list}\n\nWant more details on any of these?`,
        suggestedActions: items.slice(0, 3).map((i) => ({
          label: `More about ${i.name}`,
          action: `item_info:${i.name}`,
        })),
      };
    }

    case "menu_item_info": {
      const itemName = entities.item_name;
      if (!itemName) {
        return {
          reply: "Sure! Which dish would you like to know more about?",
        };
      }
      const item = await db.menuItem.findFirst({
        where: { propertyId, name: { contains: itemName }, isAvailable: true },
      });
      if (!item) {
        return {
          reply: `I couldn't find "${itemName}" on our current menu. Would you like to see the full menu?`,
          suggestedActions: [{ label: "Show full menu", action: "show_menu" }],
        };
      }
      return {
        reply: `**${item.name}** — ৳${item.price}\n${item.description ?? ""}\n\n${item.isVeg ? "🟢 Vegetarian" : "🔴 Non-vegetarian"} · Prep time: ~${item.prepTimeMins} min\n\nWould you like to order this?`,
        suggestedActions: [
          { label: "Order now", action: `order:${item.id}` },
          { label: "See similar items", action: `category:${item.categoryId}` },
        ],
      };
    }

    case "room_inquiry": {
      const types = await db.roomType.findMany({
        where: { propertyId, isActive: true },
        include: { _count: { select: { rooms: { where: { status: "AVAILABLE" } } } } },
      });
      if (types.length === 0) return null;
      const list = types
        .map((t) => `• **${t.name}** — ৳${t.basePrice}/night (${t._count.rooms} available)`)
        .join("\n");
      return {
        reply: `We have ${types.length} room types:\n\n${list}\n\nWould you like to book a room?`,
        suggestedActions: [
          { label: "Book a room", action: "start_booking" },
        ],
      };
    }

    case "room_pricing": {
      const types = await db.roomType.findMany({
        where: { propertyId, isActive: true },
      });
      if (types.length === 0) return null;
      const list = types.map((t) => `• **${t.name}**: ৳${t.basePrice}/night`).join("\n");
      return {
        reply: `Our room rates:\n\n${list}\n\nPrices include complimentary WiFi. Breakfast is included in Deluxe and Suite categories.`,
      };
    }

    case "room_booking": {
      const types = await db.roomType.findMany({
        where: { propertyId, isActive: true },
        include: { _count: { select: { rooms: { where: { status: "AVAILABLE" } } } } },
      });
      const available = types.filter((t) => t._count.rooms > 0);
      if (available.length === 0) {
        return {
          reply: "I'm sorry, we don't have any rooms available right now. Would you like me to check again later, or contact you when something opens up?",
          suggestedActions: [{ label: "Notify me", action: "waitlist" }],
        };
      }
      const list = available
        .map((t) => `• **${t.name}** — ৳${t.basePrice}/night (${t._count.rooms} available)`)
        .join("\n");
      return {
        reply: `Great! We have these rooms available:\n\n${list}\n\nTo book, please click below or visit our booking page. Which room type would you like?`,
        suggestedActions: [
          ...available.slice(0, 3).map((t) => ({ label: `Book ${t.name}`, action: `book:${t.id}` })),
          { label: "Open booking page", action: "open:hotel/bookings/new" },
        ],
      };
    }

    case "order_status":
    case "delivery_track": {
      const orderNum = entities.order_number;
      if (!orderNum) {
        return {
          reply: "Please share your order number (e.g., ORD-2026-1001) so I can look it up.",
        };
      }
      const order = await db.order.findFirst({
        where: { orderNumber: orderNum, propertyId },
        include: { deliveryOrder: { include: { agent: true } } },
      });
      if (!order) {
        return {
          reply: `I couldn't find order ${orderNum}. Please check the number and try again.`,
        };
      }
      const statusEmoji: Record<string, string> = {
        PLACED: "📝",
        CONFIRMED: "✅",
        PREPARING: "👨‍🍳",
        READY: "🍽️",
        OUT_FOR_DELIVERY: "🚴",
        DELIVERED: "✅",
        COMPLETED: "✅",
        CANCELLED: "❌",
      };
      return {
        reply: `Order **${order.orderNumber}** — ${statusEmoji[order.status] ?? ""} ${order.status.replace("_", " ").toLowerCase()}\nTotal: ৳${order.totalAmount}\n${order.deliveryOrder ? `Agent: ${order.deliveryOrder.agent?.name ?? "Not yet assigned"}` : "Dine-in"}`,
      };
    }

    case "place_order": {
      return {
        reply: "I'd love to help you order! 🍽️\n\nBrowse our menu and add items to your cart. I'll guide you through it. Or, you can place an order directly from the order page.",
        suggestedActions: [
          { label: "Browse menu", action: "open:restaurant/menu" },
          { label: "Order now", action: "open:restaurant/orders/new" },
        ],
      };
    }

    case "table_reservation": {
      return {
        reply: "I'd be happy to help you reserve a table! 🍽️\n\nCould you share:\n• Date and time\n• Number of guests\n\nOr, visit our reservation page to choose a table.",
        suggestedActions: [
          { label: "Reserve a table", action: "open:restaurant" },
        ],
      };
    }
  }

  return null;
}

// ----- Suggested actions shown as quick-reply chips -----
export interface ChatAction {
  label: string;
  action: string; // e.g. "open:hotel/bookings/new" or "show_menu"
}
