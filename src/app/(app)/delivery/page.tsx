import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Bike, MapPin, Phone, User, ArrowRight } from "lucide-react";
import { formatCurrency, formatTime, timeAgo } from "@/lib/utils";
import { ORDER_STATUS_LABEL, getStatusVariant } from "@/lib/enums";
import { DeliveryRowActions } from "./actions";

export const dynamic = "force-dynamic";

export default async function DeliveryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "delivery:read")) redirect("/");

  const propertyId = user.propertyId!;

  const [activeDeliveries, readyForPickup, todayStats, agents, property] = await Promise.all([
    db.deliveryOrder.findMany({
      where: { propertyId, order: { status: { in: ["PREPARING", "READY", "OUT_FOR_DELIVERY"] } } },
      include: {
        order: { include: { items: { include: { menuItem: true } } } },
        customer: true,
        agent: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    db.deliveryOrder.findMany({
      where: { propertyId, order: { status: "READY" }, agentId: null },
      include: { order: { include: { items: true } }, customer: true },
      orderBy: { createdAt: "asc" },
    }),
    db.deliveryOrder.findMany({
      where: {
        propertyId,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        order: { status: "DELIVERED" },
      },
    }),
    db.user.findMany({
      where: { propertyId, role: "DELIVERY", isActive: true },
      select: { id: true, name: true, phone: true },
    }),
    db.property.findUnique({ where: { id: propertyId } }),
  ]);

  const todayDelivered = todayStats.length;
  const todayRevenue = todayStats.reduce((s, d) => s + Number(d.deliveryFee), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-brand">
            <Bike className="h-6 w-6" />
            Delivery Management
          </h1>
          <p className="text-sm text-slate-600">Track and assign delivery orders</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active deliveries" value={activeDeliveries.length} description="Out for delivery" icon={Bike} accent />
        <StatCard title="Ready to assign" value={readyForPickup.length} description="Awaiting agent" icon={MapPin} />
        <StatCard title="Delivered today" value={todayDelivered} description="Completed" icon={Bike} />
        <StatCard title="Delivery fees today" value={formatCurrency(todayRevenue, property?.currency)} description="Net delivery income" icon={Bike} />
      </div>

      {readyForPickup.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/50">
          <CardHeader>
            <CardTitle>Ready for pickup ({readyForPickup.length})</CardTitle>
            <CardDescription>Assign an agent to start delivery</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {readyForPickup.map((d) => (
                <li key={d.id} className="flex items-center justify-between rounded-md border border-amber-200 bg-white p-3 text-sm">
                  <div>
                    <p className="font-semibold text-brand">{d.order.orderNumber}</p>
                    <p className="text-xs text-slate-600">{d.deliveryAddress}</p>
                    <p className="text-xs text-slate-500">{d.order.customerName} · {d.order.customerPhone}</p>
                  </div>
                  <DeliveryRowActions deliveryId={d.id} agents={agents} currentAgentId={d.agentId} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          {activeDeliveries.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              No active deliveries.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="pb-2 font-medium">Order</th>
                    <th className="pb-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium">Address</th>
                    <th className="pb-2 font-medium">Agent</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Picked up</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDeliveries.map((d) => (
                    <tr key={d.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 font-mono text-xs">{d.order.orderNumber}</td>
                      <td className="py-3">
                        <p className="font-medium">{d.order.customerName}</p>
                        <p className="text-xs text-slate-500">{d.order.customerPhone}</p>
                      </td>
                      <td className="py-3 max-w-[200px] truncate">{d.deliveryAddress}</td>
                      <td className="py-3">{d.agent?.name ?? <span className="text-slate-400">Unassigned</span>}</td>
                      <td className="py-3">
                        <Badge variant={getStatusVariant(d.order.status) as any}>
                          {ORDER_STATUS_LABEL[d.order.status as keyof typeof ORDER_STATUS_LABEL] ?? d.order.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-xs text-slate-500">
                        {d.pickedUpAt ? timeAgo(d.pickedUpAt) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
