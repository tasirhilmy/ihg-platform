import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { can } from "@/lib/rbac";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "info" | "secondary"> = {
  PENDING: "warning",
  CONFIRMED: "info",
  CHECKED_IN: "success",
  CHECKED_OUT: "secondary",
  CANCELLED: "danger",
  NO_SHOW: "danger",
};

interface PageProps {
  searchParams: { status?: string; q?: string };
}

export default async function BookingsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "booking:read")) redirect("/");

  const propertyId = user.propertyId!;
  const statusFilter = searchParams.status;
  const searchQuery = searchParams.q;

  const where: any = { propertyId };
  if (statusFilter && statusFilter !== "all") where.status = statusFilter;
  if (searchQuery) {
    where.OR = [
      { bookingCode: { contains: searchQuery } },
      { guest: { user: { name: { contains: searchQuery } } } },
      { guest: { user: { email: { contains: searchQuery } } } },
    ];
  }

  const bookings = await db.booking.findMany({
    where,
    include: {
      guest: { include: { user: true } },
      room: true,
      roomType: true,
    },
    orderBy: { checkInDate: "desc" },
    take: 50,
  });

  const counts = await db.booking.groupBy({
    by: ["status"],
    where: { propertyId },
    _count: true,
  });
  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand">Bookings</h1>
          <p className="text-sm text-slate-600">All reservations, check-ins, and check-outs</p>
        </div>
        <Button asChild variant="accent">
          <Link href="/hotel/bookings/new">
            <Plus className="h-4 w-4" />
            New booking
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 p-4">
          <form className="flex flex-1 items-center gap-2 min-w-[200px]">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              name="q"
              placeholder="Search by code, name, or email…"
              defaultValue={searchQuery}
              className="max-w-xs"
            />
            {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          </form>
          <div className="flex flex-wrap gap-1">
            {[
              { v: "all", label: "All" },
              { v: "PENDING", label: "Pending" },
              { v: "CONFIRMED", label: "Confirmed" },
              { v: "CHECKED_IN", label: "In-house" },
              { v: "CHECKED_OUT", label: "Checked out" },
              { v: "CANCELLED", label: "Cancelled" },
            ].map((s) => {
              const params = new URLSearchParams();
              if (s.v !== "all") params.set("status", s.v);
              if (searchQuery) params.set("q", searchQuery);
              const href = `/hotel/bookings${params.toString() ? "?" + params.toString() : ""}`;
              const isActive = (statusFilter ?? "all") === s.v;
              const count = s.v === "all"
                ? Object.values(countMap).reduce((a, b) => a + b, 0)
                : countMap[s.v] ?? 0;
              return (
                <Link
                  key={s.v}
                  href={href}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    isActive
                      ? "border-brand bg-brand text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-brand-300"
                  }`}
                >
                  {s.label} ({count})
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Bookings table */}
      <Card>
        <CardContent className="p-0">
          {bookings.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-slate-500">No bookings found.</p>
              <Button asChild variant="outline" className="mt-3">
                <Link href="/hotel/bookings/new">Create your first booking</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 font-medium">Code</th>
                    <th className="px-4 py-3 font-medium">Guest</th>
                    <th className="px-4 py-3 font-medium">Room</th>
                    <th className="px-4 py-3 font-medium">Check-in</th>
                    <th className="px-4 py-3 font-medium">Check-out</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs">{b.bookingCode}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{b.guest.user.name}</div>
                        <div className="text-xs text-slate-500">{b.guest.user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        {b.room ? `#${b.room.roomNumber}` : <span className="text-slate-400">—</span>}
                        <div className="text-xs text-slate-500">{b.roomType.name}</div>
                      </td>
                      <td className="px-4 py-3">{formatDate(b.checkInDate)}</td>
                      <td className="px-4 py-3">{formatDate(b.checkOutDate)}</td>
                      <td className="px-4 py-3 font-semibold text-brand">
                        {formatCurrency(Number(b.totalAmount))}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[b.status] ?? "default"}>
                          {b.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/hotel/bookings/${b.id}`}>View</Link>
                        </Button>
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
