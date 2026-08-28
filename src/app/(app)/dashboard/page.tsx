import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import {
  BedDouble, UtensilsCrossed, Bike, DollarSign, Users, AlertTriangle,
  TrendingUp, CalendarCheck, ArrowRight, Activity,
} from "lucide-react";
import { can } from "@/lib/rbac";
import { formatCurrency, formatTime, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!can(user.role, "dashboard:view")) {
    redirect("/");
  }

  const propertyId = user.propertyId;
  if (!propertyId) redirect("/admin");

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  // Parallel queries
  const [
    property,
    totalRooms,
    occupiedRooms,
    todayBookings,
    activeOrders,
    todayRevenueAggregate,
    pendingServiceRequests,
    lowStock,
    recentAlerts,
    todayCheckIns,
  ] = await Promise.all([
    db.property.findUnique({ where: { id: propertyId } }),
    db.room.count({ where: { propertyId } }),
    db.room.count({ where: { propertyId, status: "OCCUPIED" } }),
    db.booking.count({
      where: { propertyId, checkInDate: { gte: startOfDay, lt: endOfDay } },
    }),
    db.order.count({
      where: {
        propertyId,
        status: { in: ["PLACED", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"] },
      },
    }),
    db.payment.aggregate({
      where: {
        propertyId,
        status: "COMPLETED",
        paidAt: { gte: startOfDay, lt: endOfDay },
      },
      _sum: { amount: true },
    }),
    db.roomServiceRequest.count({
      where: { propertyId, status: { in: ["PENDING", "ACKNOWLEDGED", "IN_PROGRESS"] } },
    }),
    db.inventoryItem.findMany({
      where: { propertyId },
      take: 50,
    }),
    db.alert.findMany({
      where: { propertyId },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.booking.findMany({
      where: {
        propertyId,
        status: { in: ["CONFIRMED", "CHECKED_IN"] },
        checkInDate: { gte: startOfDay, lt: endOfDay },
      },
      include: { guest: { include: { user: true } }, room: true, roomType: true },
      take: 5,
      orderBy: { checkInDate: "asc" },
    }),
  ]);

  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const lowStockCount = lowStock.filter((i) => Number(i.quantity) <= Number(i.minQuantity)).length;
  const todayRevenue = Number(todayRevenueAggregate._sum.amount ?? 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand">Welcome, {user.name.split(" ")[0]}</h1>
          <p className="text-sm text-slate-600">
            {property?.name} · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/reports">View reports</Link>
          </Button>
          <Button asChild size="sm" variant="accent">
            <Link href="/alerts">
              Alerts
              {recentAlerts.filter((a) => !a.isRead).length > 0 && (
                <Badge variant="accent">{recentAlerts.filter((a) => !a.isRead).length} new</Badge>
              )}
            </Link>
          </Button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Occupancy"
          value={`${occupancyRate}%`}
          description={`${occupiedRooms} of ${totalRooms} rooms`}
          icon={BedDouble}
        />
        <StatCard
          title="Active orders"
          value={activeOrders}
          description="Restaurant + delivery + room service"
          icon={UtensilsCrossed}
          accent
        />
        <StatCard
          title="Today's revenue"
          value={formatCurrency(todayRevenue, property?.currency ?? "BDT")}
          description="Completed payments"
          icon={DollarSign}
        />
        <StatCard
          title="Pending requests"
          value={pendingServiceRequests}
          description="Service requests awaiting action"
          icon={Activity}
        />
      </div>

      {/* Secondary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Today's check-ins</CardTitle>
            <CalendarCheck className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand">{todayBookings}</div>
            <Link href="/hotel/bookings" className="mt-1 inline-flex items-center text-xs text-slate-500 hover:text-brand">
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Low stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{lowStockCount}</div>
            <Link href="/inventory" className="mt-1 inline-flex items-center text-xs text-slate-500 hover:text-brand">
              Manage <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Delivery agents</CardTitle>
            <Bike className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand">—</div>
            <p className="mt-1 text-xs text-slate-500">Active today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Staff on shift</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand">—</div>
            <p className="mt-1 text-xs text-slate-500">Across all roles</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's check-ins */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Today's arrivals</CardTitle>
                <CardDescription>Guests checking in today</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/hotel/bookings">All bookings</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {todayCheckIns.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                No check-ins scheduled for today.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="pb-2 font-medium">Code</th>
                      <th className="pb-2 font-medium">Guest</th>
                      <th className="pb-2 font-medium">Room</th>
                      <th className="pb-2 font-medium">Nights</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayCheckIns.map((b) => (
                      <tr key={b.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-3 font-mono text-xs">{b.bookingCode}</td>
                        <td className="py-3">{b.guest.user.name}</td>
                        <td className="py-3">
                          {b.room ? `#${b.room.roomNumber}` : `Any ${b.roomType.name}`}
                        </td>
                        <td className="py-3">
                          {Math.ceil((b.checkOutDate.getTime() - b.checkInDate.getTime()) / 86400000)}
                        </td>
                        <td className="py-3">
                          <Badge variant={b.status === "CHECKED_IN" ? "success" : "info"}>
                            {b.status.replace("_", " ")}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent alerts</CardTitle>
                <CardDescription>System + operational</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/alerts">All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentAlerts.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                No alerts. All clear.
              </p>
            ) : (
              <ul className="space-y-3">
                {recentAlerts.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-start gap-3 rounded-lg border border-slate-100 p-3"
                  >
                    <div
                      className={`mt-0.5 h-2 w-2 rounded-full ${
                        a.severity === "ERROR"
                          ? "bg-red-500"
                          : a.severity === "WARNING"
                          ? "bg-amber-500"
                          : a.severity === "SUCCESS"
                          ? "bg-emerald-500"
                          : "bg-sky-500"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{a.title}</p>
                      <p className="text-xs text-slate-500">{a.message}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{timeAgo(a.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
