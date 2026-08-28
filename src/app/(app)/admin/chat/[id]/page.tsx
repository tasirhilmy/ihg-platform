import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, User, Mail, Phone, Calendar } from "lucide-react";
import { formatDateTime, timeAgo } from "@/lib/utils";
import { SessionActions } from "./actions";

export const dynamic = "force-dynamic";

export default async function ChatSessionDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "dashboard:view")) redirect("/");

  const session = await db.chatSession.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!session || session.propertyId !== user.propertyId) {
    notFound();
  }

  const intentCounts = session.messages
    .filter((m) => m.intent)
    .reduce((acc, m) => {
      const i = m.intent!;
      acc[i] = (acc[i] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/admin/chat">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-brand">
              <MessageCircle className="h-6 w-6" />
              Chat session
            </h1>
            <p className="font-mono text-xs text-slate-500">{session.id}</p>
          </div>
        </div>
        <SessionActions sessionId={session.id} currentStatus={session.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Conversation */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {session.messages.length === 0 ? (
                <p className="text-sm text-slate-500">No messages.</p>
              ) : (
                session.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${
                      m.sender === "USER" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        m.sender === "USER"
                          ? "bg-brand text-white"
                          : m.sender === "BOT"
                          ? "border border-slate-200 bg-white"
                          : "border border-emerald-200 bg-emerald-50"
                      }`}
                    >
                      <div className="mb-0.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wider opacity-70">
                        {m.sender}
                        {m.intent && <span>· {m.intent}</span>}
                        {m.confidence != null && (
                          <span>· {Math.round(m.confidence * 100)}%</span>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      <p className="mt-0.5 text-[10px] opacity-60">{timeAgo(m.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Visitor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {session.user ? (
                <>
                  <p className="font-medium">{session.user.name}</p>
                  <p className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Mail className="h-3 w-3" /> {session.user.email}
                  </p>
                  {session.user.phone && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Phone className="h-3 w-3" /> {session.user.phone}
                    </p>
                  )}
                  <Badge variant="success" className="mt-1">Registered user</Badge>
                </>
              ) : (
                <>
                  <p className="font-medium">{session.visitorName ?? "Anonymous"}</p>
                  {session.visitorEmail && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Mail className="h-3 w-3" /> {session.visitorEmail}
                    </p>
                  )}
                  <Badge variant="secondary" className="mt-1">Visitor</Badge>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Session info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-600">
              <p className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                Started {formatDateTime(session.startedAt)}
              </p>
              <p>Last message: {timeAgo(session.lastMessageAt)}</p>
              <p>Channel: {session.channel}</p>
              <p>Status: <Badge variant="info">{session.status}</Badge></p>
              <p>{session.messages.length} message(s)</p>
            </CardContent>
          </Card>

          {Object.keys(intentCounts).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detected intents</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-xs">
                  {Object.entries(intentCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([intent, count]) => (
                      <li key={intent} className="flex justify-between">
                        <span className="font-mono">{intent}</span>
                        <Badge variant="outline">{count}</Badge>
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
