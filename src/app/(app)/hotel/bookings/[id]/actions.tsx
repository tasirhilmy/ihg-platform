"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LogIn, LogOut, X, Loader2 } from "lucide-react";
import { checkInAction, checkOutAction, cancelBookingAction } from "@/server/actions/bookings";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function CheckInButton({
  bookingId,
  availableRooms,
}: {
  bookingId: string;
  availableRooms: { id: string; roomNumber: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [roomId, setRoomId] = useState(availableRooms[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("bookingId", bookingId);
    formData.append("roomId", roomId);
    startTransition(async () => {
      try {
        await checkInAction(formData);
        toast.success("Guest checked in");
        setOpen(false);
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to check in");
      }
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="accent" size="sm">
        <LogIn className="h-4 w-4" />
        Check in
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Check guest in</DialogTitle>
              <DialogDescription>Assign a room to complete check-in.</DialogDescription>
            </DialogHeader>
            <div className="my-4 space-y-2">
              <label className="text-sm font-medium text-slate-700">Room</label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {availableRooms.length === 0 ? (
                  <option value="">No available rooms</option>
                ) : (
                  availableRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room #{r.roomNumber}
                    </option>
                  ))
                )}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent" disabled={isPending || !roomId}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                Confirm check-in
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CheckOutButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (!confirm("Confirm check-out? This will mark the room as dirty.")) return;
    const formData = new FormData();
    formData.append("bookingId", bookingId);
    startTransition(async () => {
      try {
        await checkOutAction(formData);
        toast.success("Guest checked out");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to check out");
      }
    });
  };

  return (
    <Button onClick={handleClick} variant="accent" size="sm" disabled={isPending}>
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      Check out
    </Button>
  );
}

export function CancelButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("bookingId", bookingId);
    formData.append("reason", reason);
    startTransition(async () => {
      try {
        await cancelBookingAction(formData);
        toast.success("Booking cancelled");
        setOpen(false);
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to cancel");
      }
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" size="sm">
        <X className="h-4 w-4" />
        Cancel
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Cancel booking</DialogTitle>
              <DialogDescription>This cannot be undone.</DialogDescription>
            </DialogHeader>
            <div className="my-4 space-y-2">
              <label className="text-sm font-medium text-slate-700">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                required
                className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                placeholder="Why is this booking being cancelled?"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Keep booking
              </Button>
              <Button type="submit" variant="destructive" disabled={isPending || !reason}>
                Cancel booking
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
