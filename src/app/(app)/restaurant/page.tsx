import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { UtensilsCrossed, ChefHat, CalendarCheck, DollarSign, ArrowRight, Plus } from "lucide-react";
import { can } from "@/lib/rbac";
import { formatCurrency, formatTime } from "@/lib/utils";
import { TABLE_STATUS_LABEL, getStatusVariant } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function RestaurantPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "table:read")) redirect("/");

  const propertyId = user.propertyId!;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    tables,
    activeOrders,
    todayReservations,
    todayDineInRevenue,
    pendingKitchenOrders,
  ] = await Promise.all([
    db.restaurantTable.findMany({
      where: { propertyId },
      orderBy: { tableNumber: "asc" },
    }),
    db.order.count({
      where: { propertyId, status: { in: ["PLACED", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"] } },
    }),
    db.tableReservation.count({
      where: { propertyId, reservedAt: { gte: today, lt: tomorrow }, status: "CONFIRMED" },
    }),
    db.payment.aggregate({
      where: {
        propertyId,
        status: "COMPLETED",
        paidAt: { gte: today, lt: tomorrow },
        order: { orderType: "DINE_IN" },
      },
      _sum: { amount: true },
    }),
    db.order.count({
      where: { propertyId, status: { in: ["PLACED", "CONFIRMED", "PREPARING"] } },
    }),
  ]);

  const property = await db.property.findUnique({ where: { id: propertyId } });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand">Restaurant</h1>
          <p className="text-sm text-slate-600">Tables, orders, kitchen & reservations</p>
        </div>
        <div className="flex gap-2">
          {can(user.role, "order:create") && (
            <Button asChild variant="accent">
              <Link href="/restaurant/orders/new">
                <Plus className="h-4 w-4" />
                New order
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active orders"
          value={activeOrders}
          description="Dine-in + delivery + room service"
          icon={UtensilsCrossed}
          accent
        />
        <StatCard
          title="Today's reservations"
          value={todayReservations}
          description="Confirmed bookings"
          icon={CalendarCheck}
        />
        <StatCard
          title="Dine-in revenue"
          value={formatCurrency(Number(todayDineInRevenue._sum.amount ?? 0), property?.currency)}
          description="Today"
          icon={DollarSign}
        />
        <StatCard
          title="Kitchen queue"
          value={pendingKitchenOrders}
          description="Orders being prepared"
          icon={ChefHat}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Table layout</CardTitle>
              <CardDescription>Visual status of all restaurant tables</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/restaurant/tables">
                Manage tables <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {tables.map((t) => (
              <Link
                key={t.id}
                href={`/restaurant/tables/${t.id}`}
                className="group flex flex-col items-center gap-1 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-brand hover:shadow-sm"
              >
                <span className="text-lg font-bold text-brand group-hover:text-accent">
                  {t.tableNumber}
                </span>
                <Badge variant={getStatusVariant(t.status) as any} className="text-[10px]">
                  {TABLE_STATUS_LABEL[t.status as keyof typeof TABLE_STATUS_LABEL] ?? t.status}
                </Badge>
                <span className="text-[10px] text-slate-500">
                  {t.capacity} seats · {t.section ?? "Main"}
                </span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
