import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bike, MapPin, Phone, Clock, Package, CheckCircle2 } from "lucide-react";
import { formatTime, timeAgo } from "@/lib/utils";
import { ORDER_STATUS_LABEL, getStatusVariant } from "@/lib/enums";
import { AgentDeliveryActions } from "../actions";

export const dynamic = "force-dynamic";

export default async function AgentDeliveriesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const myDeliveries = await db.deliveryOrder.findMany({
    where: {
      agentId: user.id,
      order: { status: { in: ["READY", "OUT_FOR_DELIVERY", "DELIVERED"] } },
    },
    include: {
      order: { include: { items: { include: { menuItem: true } } } },
      customer: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const active = myDeliveries.filter((d) => ["READY", "OUT_FOR_DELIVERY"].includes(d.order.status));
  const completed = myDeliveries.filter((d) => d.order.status === "DELIVERED").slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-brand">
          <Bike className="h-6 w-6" />
          My Deliveries
        </h1>
        <p className="text-sm text-slate-600">Pick up and deliver orders</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active ({active.length})</CardTitle>
          <CardDescription>Pick up & deliver</CardDescription>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              No active deliveries. You're all caught up.
            </p>
          ) : (
            <ul className="space-y-3">
              {active.map((d) => (
                <li key={d.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-brand">{d.order.orderNumber}</span>
                        <Badge variant={getStatusVariant(d.order.status) as any}>
                          {ORDER_STATUS_LABEL[d.order.status as keyof typeof ORDER_STATUS_LABEL]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm">
                        <span className="font-semibold">{d.order.customerName}</span> · {d.order.customerPhone}
                      </p>
                      <p className="mt-1 flex items-start gap-1 text-sm text-slate-600">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                        {d.deliveryAddress}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {d.order.items.length} item(s) · {d.order.items.reduce((s, i) => s + i.quantity, 0)} units
                      </p>
                      {d.estimatedTime && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          ETA: {d.estimatedTime} min
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <a
                        href={`tel:${d.order.customerPhone}`}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-brand hover:bg-slate-50"
                      >
                        <Phone className="h-3 w-3" />
                        Call
                      </a>
                      <AgentDeliveryActions deliveryId={d.id} status={d.order.status} />
                    </div>
                  </div>
                  <div className="mt-3 rounded border border-slate-100 bg-slate-50 p-2">
                    <p className="text-xs font-semibold text-slate-700">Items</p>
                    <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
                      {d.order.items.map((it) => (
                        <li key={it.id}>
                          {it.quantity}× {it.menuItem.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {completed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently completed</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-slate-100">
              {completed.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-mono text-xs font-semibold">{d.order.orderNumber}</p>
                    <p className="text-xs text-slate-500">{d.order.customerName}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {d.deliveredAt && (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        {timeAgo(d.deliveredAt)}
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
