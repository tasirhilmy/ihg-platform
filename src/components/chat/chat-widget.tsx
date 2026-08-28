"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MessageCircle, X, Send, Loader2, Sparkles, Phone, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  sender: "USER" | "BOT" | "STAFF";
  content: string;
  intent?: string;
  createdAt: string;
}

interface SuggestedAction {
  label: string;
  action: string;
}

const SUGGESTED_PROMPTS = [
  "Show me the menu",
  "What rooms are available?",
  "Book a table for 4",
  "Track my order",
  "Do you deliver?",
];

export function ChatWidget({
  initialOpen = false,
  variant = "floating",
}: {
  initialOpen?: boolean;
  variant?: "floating" | "inline";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(initialOpen);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [suggestedActions, setSuggestedActions] = useState<SuggestedAction[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load session from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("ihg_chat_session");
      if (stored) {
        setSessionId(stored);
        loadHistory(stored);
      }
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  async function loadHistory(sid: string) {
    try {
      const res = await fetch(`/api/chat?sessionId=${sid}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        }
      }
    } catch {
      // ignore
    }
  }

  async function sendMessage(text?: string) {
    const message = (text ?? input).trim();
    if (!message || sending) return;

    setInput("");
    setSending(true);
    setSuggestedActions([]);

    // Optimistic add
    const tempId = `tmp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        sender: "USER",
        content: message,
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sessionId }),
      });
      if (!res.ok) throw new Error("Failed to send");

      const data = await res.json();

      if (!sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem("ihg_chat_session", data.sessionId);
      }

      // Replace temp message + add bot reply
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        { id: tempId, sender: "USER", content: message, createdAt: new Date().toISOString() },
        {
          id: `bot-${Date.now()}`,
          sender: "BOT",
          content: data.reply,
          intent: data.intent,
          createdAt: new Date().toISOString(),
        },
      ]);

      setSuggestedActions(data.suggestedActions ?? []);
    } catch (err) {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        {
          id: `err-${Date.now()}`,
          sender: "BOT",
          content: "Sorry, I'm having trouble right now. Please try again or call our front desk.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleAction(action: string) {
    if (action.startsWith("open:")) {
      const path = action.slice(5);
      router.push(path);
      setOpen(false);
    } else if (action.startsWith("show_category:") || action.startsWith("category:")) {
      sendMessage(`Tell me about ${action.split(":")[1]}`);
    } else if (action === "show_menu") {
      sendMessage("Show me the menu");
    } else if (action === "start_booking" || action.startsWith("book:")) {
      router.push("/hotel/bookings/new");
      setOpen(false);
    } else if (action === "human_handoff") {
      sendMessage("I want to speak to a person");
    } else if (action === "show_contact") {
      router.push("/portal");
      setOpen(false);
    } else if (action === "waitlist") {
      sendMessage("Please add me to the waitlist");
    } else {
      sendMessage(action);
    }
  }

  // Don't show on the login page
  if (pathname?.startsWith("/login")) return null;

  return (
    <>
      {/* Floating button */}
      {variant === "floating" && !open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg transition hover:scale-105 hover:bg-accent-600"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
          </span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className={cn(
            "z-50 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl",
            variant === "floating"
              ? "fixed bottom-6 right-6 h-[600px] w-[380px] max-w-[calc(100vw-2rem)]"
              : "h-full w-full"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between gradient-bg p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">IHG Assistant</h3>
                <p className="flex items-center gap-1 text-xs text-brand-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Online · Usually replies instantly
                </p>
              </div>
            </div>
            {variant === "floating" && (
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1 hover:bg-white/10"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {messages.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-medium text-brand">
                  👋 Hi! I'm the IHG assistant.
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  I can help you with menu, rooms, reservations, and order tracking.
                </p>
                <p className="mt-2 text-xs text-slate-500">Try one of these:</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SUGGESTED_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => sendMessage(p)}
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 transition hover:border-brand hover:bg-brand-50 hover:text-brand"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={cn("flex", m.sender === "USER" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
                    m.sender === "USER"
                      ? "bg-brand text-white"
                      : m.sender === "BOT"
                      ? "border border-slate-200 bg-white text-slate-900"
                      : "border border-emerald-200 bg-emerald-50 text-slate-900"
                  )}
                >
                  {m.content.split("\n").map((line, i) => {
                    // Simple markdown bold parsing
                    const parts = line.split(/(\*\*[^*]+\*\*)/g);
                    return (
                      <p key={i} className={i > 0 ? "mt-1" : ""}>
                        {parts.map((part, j) =>
                          part.startsWith("**") ? (
                            <strong key={j}>{part.slice(2, -2)}</strong>
                          ) : (
                            <span key={j}>{part}</span>
                          )
                        )}
                      </p>
                    );
                  })}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {suggestedActions.length > 0 && !sending && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {suggestedActions.map((a, i) => (
                  <button
                    key={i}
                    onClick={() => handleAction(a.action)}
                    className="rounded-full border border-accent bg-white px-3 py-1 text-xs font-medium text-accent transition hover:bg-accent hover:text-white"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 bg-white p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                disabled={sending}
                className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              <Button
                type="submit"
                size="icon"
                variant="accent"
                disabled={sending || !input.trim()}
                className="rounded-full"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
            <p className="mt-1.5 text-center text-[10px] text-slate-400">
              Powered by IHG AI · Responses are automated
            </p>
          </div>
        </div>
      )}
    </>
  );
}
