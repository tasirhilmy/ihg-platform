import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { BedDouble, CalendarCheck, LogIn, LogOut, Sparkles, Plus, ArrowRight } from "lucide-react";
import { can } from "@/lib/rbac";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, "default" | "success" | "warning" | "danger" | "info" | "secondary"> = {
  AVAILABLE: "success",
  OCCUPIED: "info",
  RESERVED: "warning",
  CLEANING: "secondary",
  DIRTY: "warning",
  MAINTENANCE: "danger",
};

export default async function HotelPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "booking:read")) redirect("/");

  const propertyId = user.propertyId!;
  const [rooms, todayArrivals, todayDepartures, currentOccupancy, pendingTasks, inHouse] = await Promise.all([
    db.room.findMany({
      where: { propertyId },
      include: { roomType: true },
      orderBy: { roomNumber: "asc" },
    }),
    db.booking.findMany({
      where: { propertyId, checkInDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      include: { guest: { include: { user: true } }, room: true, roomType: true },
      take: 10,
    }),
    db.booking.findMany({
      where: {
        propertyId,
        checkOutDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        status: "CHECKED_IN",
      },
      include: { guest: { include: { user: true } }, room: true, roomType: true },
      take: 10,
    }),
    db.booking.count({ where: { propertyId, status: "CHECKED_IN" } }),
    db.housekeepingTask.count({ where: { propertyId, status: { in: ["PENDING", "IN_PROGRESS"] } } }),
    db.booking.findMany({
      where: { propertyId, status: "CHECKED_IN" },
      include: { guest: { include: { user: true } }, room: true, roomType: true },
      take: 8,
    }),
  ]);

  const total = rooms.length;
  const occupied = rooms.filter((r) => r.status === "OCCUPIED").length;
  const available = rooms.filter((r) => r.status === "AVAILABLE").length;
  const occupancy = total > 0 ? Math.round((occupied / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand">Hotel Operations</h1>
          <p className="text-sm text-slate-600">Rooms, bookings, housekeeping</p>
        </div>
        <Button asChild variant="accent">
          <Link href="/hotel/bookings/new">
            <Plus className="h-4 w-4" />
            New booking
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total rooms" value={total} description="Across all types" icon={BedDouble} />
        <StatCard
          title="Occupancy"
          value={`${occupancy}%`}
          description={`${occupied} occupied`}
          icon={LogIn}
          accent
        />
        <StatCard
          title="Available"
          value={available}
          description="Ready to sell"
          icon={CalendarCheck}
        />
        <StatCard
          title="Housekeeping pending"
          value={pendingTasks}
          description="Tasks to complete"
          icon={Sparkles}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Room status board</CardTitle>
                <CardDescription>Click any room to view details</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/hotel/rooms">All rooms <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
              {rooms.map((r) => (
                <Link
                  key={r.id}
                  href={`/hotel/rooms/${r.id}`}
                  className="group flex flex-col items-center gap-1 rounded-lg border border-slate-200 bg-white p-2 transition hover:border-brand hover:shadow-sm"
                >
                  <span className="font-mono text-sm font-bold text-brand group-hover:text-accent">
                    {r.roomNumber}
                  </span>
                  <Badge variant={STATUS_COLORS[r.status] ?? "default"} className="text-[10px]">
                    {r.status}
                  </Badge>
                  <span className="text-[10px] text-slate-500">F{r.floor} · {r.roomType.name}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's departures</CardTitle>
            <CardDescription>Guests leaving today</CardDescription>
          </CardHeader>
          <CardContent>
            {todayDepartures.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No departures today.
              </p>
            ) : (
              <ul className="space-y-2">
                {todayDepartures.map((b) => (
                  <li key={b.id} className="flex items-center justify-between rounded-md border border-slate-100 p-2 text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{b.guest.user.name}</p>
                      <p className="text-xs text-slate-500">
                        Room {b.room?.roomNumber ?? "—"} · {b.bookingCode}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/hotel/bookings/${b.id}`}>
                        <LogOut className="h-3 w-3" />
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today's arrivals</CardTitle>
            <CardDescription>{todayArrivals.length} guest(s) expected</CardDescription>
          </CardHeader>
          <CardContent>
            {todayArrivals.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No arrivals today.
              </p>
            ) : (
              <ul className="space-y-2">
                {todayArrivals.map((b) => (
                  <li key={b.id} className="flex items-center justify-between rounded-md border border-slate-100 p-3">
                    <div>
                      <p className="font-medium text-slate-900">{b.guest.user.name}</p>
                      <p className="text-xs text-slate-500">
                        {b.roomType.name} · {b.bookingCode} · {b.adults + b.children} guest(s)
                      </p>
                    </div>
                    <Badge variant={b.status === "CHECKED_IN" ? "success" : "info"}>
                      {b.status.replace("_", " ")}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>In-house guests</CardTitle>
            <CardDescription>Currently checked in</CardDescription>
          </CardHeader>
          <CardContent>
            {inHouse.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No guests currently in-house.
              </p>
            ) : (
              <ul className="space-y-2">
                {inHouse.map((b) => (
                  <li key={b.id} className="flex items-center justify-between rounded-md border border-slate-100 p-3">
                    <div>
                      <p className="font-medium text-slate-900">{b.guest.user.name}</p>
                      <p className="text-xs text-slate-500">
                        Room {b.room?.roomNumber ?? "—"} · checks out {new Date(b.checkOutDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-brand">
                      {formatCurrency(Number(b.totalAmount))}
                    </span>
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
