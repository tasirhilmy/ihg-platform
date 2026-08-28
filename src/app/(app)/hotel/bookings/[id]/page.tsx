import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, User, BedDouble, Calendar, Users, CreditCard,
  FileText, Phone, Mail, MapPin, AlertTriangle,
} from "lucide-react";
import { formatCurrency, formatDate, formatDateTime, nightsBetween } from "@/lib/utils";
import { getStatusVariant } from "@/lib/enums";
import { CheckInButton, CheckOutButton, CancelButton } from "./actions";

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "booking:read")) redirect("/");

  const booking = await db.booking.findUnique({
    where: { id: params.id },
    include: {
      guest: { include: { user: true } },
      room: { include: { roomType: true } },
      roomType: true,
      payments: true,
      serviceRequests: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!booking || booking.propertyId !== user.propertyId) {
    notFound();
  }

  const property = await db.property.findUnique({ where: { id: user.propertyId! } });
  const nights = nightsBetween(booking.checkInDate, booking.checkOutDate);
  const balance = Number(booking.totalAmount) - Number(booking.paidAmount);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/hotel/bookings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-mono text-2xl font-bold text-brand">{booking.bookingCode}</h1>
            <p className="text-sm text-slate-600">
              {property?.name} · Created {formatDateTime(booking.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant(booking.status) as any} className="text-sm">
            {booking.status.replace("_", " ")}
          </Badge>
          {(booking.status === "CONFIRMED" || booking.status === "PENDING") && can(user.role, "booking:checkin") && (
            <CheckInButton bookingId={booking.id} availableRooms={booking.roomId ? [] : await getAvailableRooms(user.propertyId!, booking.roomTypeId)} />
          )}
          {booking.status === "CHECKED_IN" && can(user.role, "booking:checkout") && (
            <CheckOutButton bookingId={booking.id} />
          )}
          {!["CHECKED_IN", "CHECKED_OUT", "CANCELLED"].includes(booking.status) && can(user.role, "booking:cancel") && (
            <CancelButton bookingId={booking.id} />
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Guest info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Guest
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-base font-semibold text-slate-900">{booking.guest.user.name}</p>
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="h-3.5 w-3.5" />
              {booking.guest.user.email}
            </div>
            {booking.guest.user.phone && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="h-3.5 w-3.5" />
                {booking.guest.user.phone}
              </div>
            )}
            {booking.guest.idType && (
              <div className="flex items-center gap-2 text-slate-600">
                <FileText className="h-3.5 w-3.5" />
                {booking.guest.idType}: {booking.guest.idNumber ?? "—"}
              </div>
            )}
            {booking.guest.vipStatus && (
              <Badge variant="accent" className="mt-2">VIP Guest</Badge>
            )}
            <Separator />
            <div className="text-xs text-slate-500">
              Loyalty points: <span className="font-semibold text-brand">{booking.guest.loyaltyPoints}</span>
            </div>
          </CardContent>
        </Card>

        {/* Stay details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BedDouble className="h-4 w-4" />
              Stay details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500">Check-in</p>
                <p className="font-medium">{formatDate(booking.checkInDate)}</p>
                {booking.actualCheckIn && (
                  <p className="text-xs text-emerald-600">
                    Actual: {formatDateTime(booking.actualCheckIn)}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500">Check-out</p>
                <p className="font-medium">{formatDate(booking.checkOutDate)}</p>
                {booking.actualCheckOut && (
                  <p className="text-xs text-emerald-600">
                    Actual: {formatDateTime(booking.actualCheckOut)}
                  </p>
                )}
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Room type:</span>
              <span className="font-medium">{booking.roomType.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Room:</span>
              <span className="font-medium">
                {booking.room ? `#${booking.room.roomNumber} (Floor ${booking.room.floor})` : "Not yet assigned"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs text-slate-500">
                {booking.adults} adult(s){booking.children > 0 ? `, ${booking.children} child(ren)` : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs text-slate-500">{nights} night(s)</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span>{formatCurrency(Number(booking.totalAmount) - Number(booking.taxAmount), property?.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">VAT (5%)</span>
              <span>{formatCurrency(Number(booking.taxAmount), property?.currency)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-bold text-brand">
              <span>Total</span>
              <span>{formatCurrency(Number(booking.totalAmount), property?.currency)}</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Paid</span>
              <span>{formatCurrency(Number(booking.paidAmount), property?.currency)}</span>
            </div>
            {balance > 0 && (
              <div className="flex justify-between text-base font-bold text-accent">
                <span>Balance due</span>
                <span>{formatCurrency(balance, property?.currency)}</span>
              </div>
            )}
            {booking.payments.length > 0 && (
              <>
                <Separator />
                <p className="text-xs font-semibold text-slate-700">Payment history</p>
                <ul className="space-y-1 text-xs">
                  {booking.payments.map((p) => (
                    <li key={p.id} className="flex justify-between">
                      <span>{p.method} · {p.reference}</span>
                      <span className="font-semibold">
                        {formatCurrency(Number(p.amount), property?.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Special requests */}
      {(booking.specialRequests || booking.notes) && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {booking.specialRequests && (
              <div>
                <p className="text-xs font-semibold text-slate-700">Guest requests</p>
                <p className="text-slate-600">{booking.specialRequests}</p>
              </div>
            )}
            {booking.notes && (
              <div>
                <p className="text-xs font-semibold text-slate-700">Internal notes</p>
                <p className="whitespace-pre-wrap text-slate-600">{booking.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Service requests */}
      {booking.serviceRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Service requests</CardTitle>
            <CardDescription>Requests made by this guest</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {booking.serviceRequests.map((sr) => (
                <li key={sr.id} className="flex items-center justify-between rounded-md border border-slate-100 p-3 text-sm">
                  <div>
                    <p className="font-medium">{sr.description}</p>
                    <p className="text-xs text-slate-500">
                      {sr.category} · {formatDateTime(sr.createdAt)}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(sr.status) as any}>{sr.status.replace("_", " ")}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

async function getAvailableRooms(propertyId: string, roomTypeId: string) {
  return db.room.findMany({
    where: { propertyId, roomTypeId, status: "AVAILABLE" },
    select: { id: true, roomNumber: true },
  });
}
