import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChefHat, Clock } from "lucide-react";
import { formatTime, timeAgo } from "@/lib/utils";
import { KitchenTicketActions } from "./actions";

export const dynamic = "force-dynamic";

export default async function KitchenPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "order:update") && user.role !== "KITCHEN") redirect("/");

  const propertyId = user.propertyId!;

  const activeOrders = await db.order.findMany({
    where: {
      propertyId,
      status: { in: ["PLACED", "CONFIRMED", "PREPARING", "READY"] },
      orderType: { in: ["DINE_IN", "DELIVERY", "ROOM_SERVICE"] },
    },
    include: {
      items: { include: { menuItem: true } },
      table: true,
    },
    orderBy: { placedAt: "asc" },
  });

  // Group by status
  const placed = activeOrders.filter((o) => o.status === "PLACED" || o.status === "CONFIRMED");
  const preparing = activeOrders.filter((o) => o.status === "PREPARING");
  const ready = activeOrders.filter((o) => o.status === "READY");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-brand">
          <ChefHat className="h-6 w-6" />
          Kitchen Display
        </h1>
        <p className="text-sm text-slate-600">
          {activeOrders.length} active order(s) · {placed.length} new · {preparing.length} cooking · {ready.length} ready
        </p>
      </div>

      {activeOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ChefHat className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">No active orders. All caught up!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { title: "New", orders: placed, color: "border-amber-400" },
            { title: "Preparing", orders: preparing, color: "border-sky-400" },
            { title: "Ready", orders: ready, color: "border-emerald-400" },
          ].map((col) => (
            <div key={col.title} className={`rounded-xl border-t-4 ${col.color} bg-slate-50 p-3`}>
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold text-brand">{col.title}</h3>
                <Badge variant="secondary">{col.orders.length}</Badge>
              </div>
              <div className="space-y-2">
                {col.orders.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-4 text-center text-xs text-slate-400">
                    Empty
                  </div>
                ) : (
                  col.orders.map((o) => <KitchenTicket key={o.id} order={o} canUpdate={can(user.role, "order:update")} />)
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KitchenTicket({ order, canUpdate }: { order: any; canUpdate: boolean }) {
  const ageMins = Math.floor((Date.now() - new Date(order.placedAt).getTime()) / 60000);
  const isUrgent = ageMins > 20;

  return (
    <Card className={isUrgent ? "border-red-300 bg-red-50/50" : "border-slate-200"}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold">{order.orderNumber}</CardTitle>
          {isUrgent && <Badge variant="danger" className="text-[10px]">URGENT</Badge>}
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          <span>{order.orderType.replace("_", " ")}</span>
          {order.table && <span>· {order.table.tableNumber}</span>}
          <span>· {order.customerName}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <Clock className="h-3 w-3" />
          {timeAgo(order.placedAt)} ({ageMins}m)
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pb-3">
        <ul className="space-y-1.5">
          {order.items.map((it: any) => (
            <li key={it.id} className="flex items-start gap-2 text-sm">
              <span className="font-mono text-xs font-bold text-accent">{it.quantity}×</span>
              <div className="flex-1">
                <p className="font-medium text-slate-900">
                  {it.menuItem.name}
                </p>
                {it.notes && <p className="text-[11px] italic text-slate-500">Note: {it.notes}</p>}
              </div>
            </li>
          ))}
        </ul>
        {order.notes && (
          <p className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
            📝 {order.notes}
          </p>
        )}
        {canUpdate && <KitchenTicketActions orderId={order.id} currentStatus={order.status} />}
      </CardContent>
    </Card>
  );
}
