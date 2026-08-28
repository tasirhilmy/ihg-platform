import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { DollarSign, BedDouble, UtensilsCrossed, TrendingUp, Bike } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { RevenueChart } from "./chart";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "reports:view")) redirect("/");
  if (!user.propertyId) redirect("/");

  const propertyId = user.propertyId;
  const property = await db.property.findUnique({ where: { id: propertyId } });
  const currency = property?.currency ?? "BDT";

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  // Daily revenue for last 7 days
  const days: { date: string; revenue: number; orders: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const [paymentSum, orderCount] = await Promise.all([
      db.payment.aggregate({
        where: { propertyId, status: "COMPLETED", paidAt: { gte: d, lt: next } },
        _sum: { amount: true },
      }),
      db.order.count({ where: { propertyId, placedAt: { gte: d, lt: next } } }),
    ]);
    days.push({
      date: d.toISOString().slice(0, 10),
      revenue: Number(paymentSum._sum.amount ?? 0),
      orders: orderCount,
    });
  }

  // Current month
  const [monthRevenue, monthOrders, monthBookings, topItems, occupancyStats] = await Promise.all([
    db.payment.aggregate({
      where: { propertyId, status: "COMPLETED", paidAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    db.order.count({ where: { propertyId, placedAt: { gte: startOfMonth } } }),
    db.booking.count({ where: { propertyId, createdAt: { gte: startOfMonth } } }),
    db.orderItem.groupBy({
      by: ["menuItemId"],
      where: { order: { propertyId, placedAt: { gte: startOfMonth } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    db.room.groupBy({
      by: ["status"],
      where: { propertyId },
      _count: true,
    }),
  ]);

  const topItemDetails = await db.menuItem.findMany({
    where: { id: { in: topItems.map((t) => t.menuItemId) } },
  });
  const topItemsWithNames = topItems.map((t) => ({
    name: topItemDetails.find((m) => m.id === t.menuItemId)?.name ?? "Unknown",
    quantity: t._sum.quantity ?? 0,
  }));

  const totalRooms = occupancyStats.reduce((s, r) => s + r._count, 0);
  const occupiedRooms = occupancyStats.find((r) => r.status === "OCCUPIED")?._count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">Reports & Analytics</h1>
        <p className="text-sm text-slate-600">{property?.name} · This month</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Month revenue"
          value={formatCurrency(Number(monthRevenue._sum.amount ?? 0), currency)}
          description="All sources"
          icon={DollarSign}
        />
        <StatCard
          title="Month orders"
          value={monthOrders}
          description="All types"
          icon={UtensilsCrossed}
        />
        <StatCard
          title="Month bookings"
          value={monthBookings}
          description="Hotel reservations"
          icon={BedDouble}
        />
        <StatCard
          title="Current occupancy"
          value={`${totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0}%`}
          description={`${occupiedRooms} of ${totalRooms} rooms`}
          icon={BedDouble}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily revenue — last 7 days</CardTitle>
          <CardDescription>Completed payments</CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueChart data={days} currency={currency} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top menu items</CardTitle>
            <CardDescription>Most ordered this month</CardDescription>
          </CardHeader>
          <CardContent>
            {topItemsWithNames.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet.</p>
            ) : (
              <ol className="space-y-2">
                {topItemsWithNames.map((item, i) => (
                  <li key={item.name} className="flex items-center justify-between rounded-md border border-slate-100 p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-brand">{item.quantity} sold</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Room status</CardTitle>
            <CardDescription>Current snapshot</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {occupancyStats.map((r) => {
                const pct = totalRooms > 0 ? Math.round((r._count / totalRooms) * 100) : 0;
                return (
                  <li key={r.status}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{r.status.replace("_", " ")}</span>
                      <span className="text-slate-500">{r._count} ({pct}%)</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full ${
                          r.status === "OCCUPIED" ? "bg-brand" :
                          r.status === "DIRTY" ? "bg-amber-500" :
                          r.status === "AVAILABLE" ? "bg-emerald-500" :
                          "bg-slate-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
