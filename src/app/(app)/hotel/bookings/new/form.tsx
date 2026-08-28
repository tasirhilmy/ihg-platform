"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { formatCurrency, nightsBetween } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createBookingAction } from "@/server/actions/bookings";

interface RoomType {
  id: string;
  name: string;
  basePrice: any;
  capacity: number;
  description: string | null;
  rooms: { id: string; roomNumber: string }[];
}

export function NewBookingForm({
  roomTypes,
  currency,
}: {
  roomTypes: RoomType[];
  currency: string;
}) {
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [roomTypeId, setRoomTypeId] = useState(roomTypes[0]?.id ?? "");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  const selectedType = roomTypes.find((r) => r.id === roomTypeId);
  const nights = checkIn && checkOut ? nightsBetween(new Date(checkIn), new Date(checkOut)) : 0;
  const subtotal = selectedType ? Number(selectedType.basePrice) * nights : 0;
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createBookingAction(formData);
        toast.success("Booking created successfully");
      } catch (err: any) {
        toast.error(err.message || "Failed to create booking");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Guest info */}
      <div>
        <h3 className="text-sm font-semibold text-brand">Guest information</h3>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="guestName">Full name *</Label>
            <Input id="guestName" name="guestName" required placeholder="Guest name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="guestEmail">Email *</Label>
            <Input id="guestEmail" name="guestEmail" type="email" required placeholder="guest@email.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="guestPhone">Phone *</Label>
            <Input id="guestPhone" name="guestPhone" required placeholder="+880 ..." />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="idType">ID type</Label>
              <select
                id="idType"
                name="idType"
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">—</option>
                <option value="NID">NID</option>
                <option value="Passport">Passport</option>
                <option value="Driving">Driving License</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="idNumber">ID number</Label>
              <Input id="idNumber" name="idNumber" />
            </div>
          </div>
        </div>
      </div>

      {/* Stay info */}
      <div>
        <h3 className="text-sm font-semibold text-brand">Stay details</h3>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="roomTypeId">Room type *</Label>
            <select
              id="roomTypeId"
              name="roomTypeId"
              value={roomTypeId}
              onChange={(e) => setRoomTypeId(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {roomTypes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} — {formatCurrency(Number(r.basePrice), currency)}/night
                </option>
              ))}
            </select>
            {selectedType && (
              <p className="text-xs text-slate-500">{selectedType.description}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="roomId">Assign specific room (optional)</Label>
            <select
              id="roomId"
              name="roomId"
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Auto-assign</option>
              {selectedType?.rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room #{r.roomNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="checkInDate">Check-in date *</Label>
            <Input
              id="checkInDate"
              name="checkInDate"
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="checkOutDate">Check-out date *</Label>
            <Input
              id="checkOutDate"
              name="checkOutDate"
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adults">Adults</Label>
            <Input
              id="adults"
              name="adults"
              type="number"
              min={1}
              max={10}
              value={adults}
              onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="children">Children</Label>
            <Input
              id="children"
              name="children"
              type="number"
              min={0}
              max={10}
              value={children}
              onChange={(e) => setChildren(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-brand">Additional</h3>
        <div className="mt-3 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="specialRequests">Special requests</Label>
            <textarea
              id="specialRequests"
              name="specialRequests"
              rows={2}
              className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              placeholder="E.g. high floor, late check-in, extra bed"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Internal notes</Label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              placeholder="Notes for staff (not shown to guest)"
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      {selectedType && nights > 0 && (
        <Card className="bg-brand-50/50">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-brand">Booking summary</h3>
            <div className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Room</span>
                <span className="font-medium">{selectedType.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">{nights} night(s) × {formatCurrency(Number(selectedType.basePrice), currency)}</span>
                <span className="font-medium">{formatCurrency(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>VAT (5%)</span>
                <span>{formatCurrency(tax, currency)}</span>
              </div>
              <div className="border-t border-brand-200 pt-2 flex justify-between text-base font-bold text-brand">
                <span>Total</span>
                <span>{formatCurrency(total, currency)}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" variant="accent" size="lg" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating booking…
            </>
          ) : (
            "Confirm booking"
          )}
        </Button>
      </div>
    </form>
  );
}
