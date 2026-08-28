import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Clock, User, AlertTriangle, ArrowRight } from "lucide-react";
import { formatTime, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ChatDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "dashboard:view")) redirect("/");
  if (!user.propertyId) redirect("/admin/properties");

  const sessions = await db.chatSession.findMany({
    where: { propertyId: user.propertyId },
    include: {
      user: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
  });

  const open = sessions.filter((s) => s.status === "OPEN");
  const escalated = await db.alert.count({
    where: {
      propertyId: user.propertyId,
      type: "SERVICE_REQUEST",
      entityType: "chat",
      isRead: false,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-brand">
            <MessageCircle className="h-6 w-6" />
            Chat Conversations
          </h1>
          <p className="text-sm text-slate-600">
            AI chat sessions from guests and customers
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Open sessions</p>
            <p className="mt-1 text-2xl font-bold text-brand">{open.length}</p>
          </CardContent>
        </Card>
        <Card className={escalated > 0 ? "border-amber-300 bg-amber-50/50" : ""}>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Needs response</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{escalated}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Total sessions</p>
            <p className="mt-1 text-2xl font-bold text-brand">{sessions.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent conversations</CardTitle>
          <CardDescription>Click a session to view the full transcript</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {sessions.length === 0 ? (
            <p className="p-12 text-center text-sm text-slate-500">
              No chat sessions yet. The AI assistant is available on the public site.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {sessions.map((s) => {
                const lastMsg = s.messages[0];
                return (
                  <li key={s.id}>
                    <Link
                      href={`/admin/chat/${s.id}`}
                      className="flex items-center justify-between p-4 transition hover:bg-slate-50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand">
                          {s.user?.name?.charAt(0) ?? s.visitorName?.charAt(0) ?? "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {s.user?.name ?? s.visitorName ?? "Anonymous visitor"}
                          </p>
                          <p className="line-clamp-1 text-xs text-slate-500">
                            {lastMsg?.content ?? "No messages yet"}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                            <Clock className="h-3 w-3" />
                            {timeAgo(s.lastMessageAt)}
                            {s.user && (
                              <>
                                <User className="ml-2 h-3 w-3" />
                                Registered
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            s.status === "OPEN" ? "info" : s.status === "RESOLVED" ? "success" : "warning"
                          }
                        >
                          {s.status}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
