import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { formatDateTime, timeAgo } from "@/lib/utils";
import { MarkAllRead } from "./actions";

export const dynamic = "force-dynamic";

const SEVERITY_ICON: Record<string, any> = {
  INFO: Info,
  SUCCESS: CheckCircle2,
  WARNING: AlertTriangle,
  ERROR: XCircle,
};

const SEVERITY_COLOR: Record<string, string> = {
  INFO: "bg-sky-100 text-sky-700",
  SUCCESS: "bg-emerald-100 text-emerald-700",
  WARNING: "bg-amber-100 text-amber-700",
  ERROR: "bg-red-100 text-red-700",
};

export default async function AlertsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.propertyId) redirect("/");

  const alerts = await db.alert.findMany({
    where: { propertyId: user.propertyId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unread = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-brand">
            <Bell className="h-6 w-6" />
            Notifications
          </h1>
          <p className="text-sm text-slate-600">
            {unread} unread of {alerts.length} total
          </p>
        </div>
        {unread > 0 && <MarkAllRead />}
      </div>

      <Card>
        <CardContent className="p-0">
          {alerts.length === 0 ? (
            <p className="p-12 text-center text-sm text-slate-500">No alerts yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {alerts.map((a) => {
                const Icon = SEVERITY_ICON[a.severity] ?? Info;
                return (
                  <li
                    key={a.id}
                    className={`flex items-start gap-3 p-4 ${!a.isRead ? "bg-brand-50/30" : ""}`}
                  >
                    <div className={`rounded-lg p-2 ${SEVERITY_COLOR[a.severity] ?? "bg-slate-100"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!a.isRead ? "font-semibold" : "font-medium"} text-slate-900`}>
                          {a.title}
                        </p>
                        {!a.isRead && <Badge variant="accent" className="text-[10px]">New</Badge>}
                      </div>
                      <p className="text-sm text-slate-600">{a.message}</p>
                      <p className="mt-1 text-xs text-slate-400">{timeAgo(a.createdAt)}</p>
                    </div>
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
