"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { generateCode, nightsBetween } from "@/lib/utils";
import { sendEmail, bookingConfirmationEmail } from "@/lib/email";
import { BookingStatus, HousekeepingStatus, HousekeepingTaskType } from "@/lib/enums";

const newBookingSchema = z.object({
  guestName: z.string().min(2, "Name is required"),
  guestEmail: z.string().email("Valid email required"),
  guestPhone: z.string().min(7, "Phone is required"),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  roomTypeId: z.string().min(1, "Select a room type"),
  roomId: z.string().optional(),
  checkInDate: z.string().min(1, "Check-in date required"),
  checkOutDate: z.string().min(1, "Check-out date required"),
  adults: z.coerce.number().min(1).max(10),
  children: z.coerce.number().min(0).max(10),
  specialRequests: z.string().optional(),
  notes: z.string().optional(),
});

export async function createBookingAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.propertyId) throw new Error("Unauthorized");
  if (!can(user.role, "booking:create")) throw new Error("Forbidden");

  const raw = Object.fromEntries(formData.entries());
  const parsed = newBookingSchema.parse(raw);

  const checkIn = new Date(parsed.checkInDate);
  const checkOut = new Date(parsed.checkOutDate);
  if (checkOut <= checkIn) {
    throw new Error("Check-out must be after check-in");
  }

  const property = await db.property.findUnique({ where: { id: user.propertyId } });
  if (!property) throw new Error("Property not found");

  const roomType = await db.roomType.findUnique({ where: { id: parsed.roomTypeId } });
  if (!roomType || roomType.propertyId !== user.propertyId) {
    throw new Error("Invalid room type");
  }

  // Find or create guest user
  let guestUser = await db.user.findUnique({ where: { email: parsed.guestEmail } });
  if (!guestUser) {
    const bcrypt = await import("bcryptjs");
    guestUser = await db.user.create({
      data: {
        email: parsed.guestEmail,
        passwordHash: await bcrypt.hash("welcome123", 10), // they can change later
        name: parsed.guestName,
        phone: parsed.guestPhone,
        role: "CUSTOMER",
      },
    });
  }

  let guest = await db.guest.findUnique({ where: { userId: guestUser.id } });
  if (!guest) {
    guest = await db.guest.create({
      data: {
        userId: guestUser.id,
        propertyId: user.propertyId,
        idType: parsed.idType,
        idNumber: parsed.idNumber,
      },
    });
  } else if (parsed.idType && !guest.idType) {
    guest = await db.guest.update({
      where: { id: guest.id },
      data: { idType: parsed.idType, idNumber: parsed.idNumber },
    });
  }

  // Find available room if not specified
  let roomId: string | null = parsed.roomId || null;
  if (!roomId) {
    // Find any room of the requested type that's available
    const roomsOfType = await db.room.findMany({
      where: { propertyId: user.propertyId, roomTypeId: parsed.roomTypeId },
    });
    for (const r of roomsOfType) {
      const conflicting = await db.booking.findFirst({
        where: {
          roomId: r.id,
          status: { in: ["CONFIRMED", "CHECKED_IN"] },
          OR: [
            {
              checkInDate: { lte: checkOut },
              checkOutDate: { gte: checkIn },
            },
          ],
        },
      });
      if (!conflicting) {
        roomId = r.id;
        break;
      }
    }
  }

  // Calculate pricing
  const nights = nightsBetween(checkIn, checkOut);
  const subtotal = Number(roomType.basePrice) * nights;
  const tax = subtotal * 0.05; // 5% VAT
  const total = subtotal + tax;

  // Generate booking code
  const lastBooking = await db.booking.findFirst({
    where: { bookingCode: { startsWith: `BK-${new Date().getFullYear()}-` } },
    orderBy: { bookingCode: "desc" },
  });
  const lastNum = lastBooking
    ? parseInt(lastBooking.bookingCode.split("-")[2] || "0", 10)
    : 1000;
  const bookingCode = generateCode("BK", lastNum + 1);

  const booking = await db.booking.create({
    data: {
      propertyId: user.propertyId,
      bookingCode,
      guestId: guest.id,
      roomTypeId: parsed.roomTypeId,
      roomId,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      adults: parsed.adults,
      children: parsed.children,
      status: BookingStatus.CONFIRMED,
      totalAmount: total,
      taxAmount: tax,
      specialRequests: parsed.specialRequests,
      notes: parsed.notes,
    },
    include: { guest: { include: { user: true } }, room: true, roomType: true },
  });

  // If checked in today or already past, also create a housekeeping prep task
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (checkIn.getTime() <= today.getTime() + 86400000) {
    if (roomId) {
      await db.housekeepingTask.create({
        data: {
          propertyId: user.propertyId,
          roomId,
          bookingId: booking.id,
          taskType: HousekeepingTaskType.TURNDOWN,
          status: HousekeepingStatus.PENDING,
          scheduledFor: checkIn,
          notes: `Prepare for ${parsed.guestName}`,
        },
      });
    }
  }

  // Create alert
  await db.alert.create({
    data: {
      propertyId: user.propertyId,
      type: "BOOKING_NEW",
      severity: "INFO",
      title: `New booking ${bookingCode}`,
      message: `${parsed.guestName} — ${roomType.name}, ${nights} night(s)`,
      entityType: "booking",
      entityId: booking.id,
    },
  });

  // Email confirmation
  const emailTpl = bookingConfirmationEmail({
    guestName: parsed.guestName,
    bookingCode,
    checkIn: checkIn.toDateString(),
    checkOut: checkOut.toDateString(),
    roomType: roomType.name,
    total: `${total.toFixed(2)} ${property.currency}`,
  });
  await sendEmail({
    propertyId: user.propertyId,
    to: parsed.guestEmail,
    subject: emailTpl.subject,
    body: emailTpl.body,
    template: "booking_confirmation",
  });

  // Audit
  await db.auditLog.create({
    data: {
      propertyId: user.propertyId,
      userId: user.id,
      action: "booking.create",
      entityType: "booking",
      entityId: booking.id,
      metadata: JSON.stringify({ bookingCode, total, nights }),
    },
  });

  revalidatePath("/hotel/bookings");
  revalidatePath("/dashboard");
  redirect(`/hotel/bookings/${booking.id}?created=1`);
}

const checkInSchema = z.object({
  bookingId: z.string().min(1),
  roomId: z.string().min(1, "Assign a room"),
});

export async function checkInAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.propertyId) throw new Error("Unauthorized");
  if (!can(user.role, "booking:checkin")) throw new Error("Forbidden");

  const { bookingId, roomId } = checkInSchema.parse(Object.fromEntries(formData));

  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.propertyId !== user.propertyId) {
    throw new Error("Booking not found");
  }
  if (booking.status !== "CONFIRMED" && booking.status !== "PENDING") {
    throw new Error(`Cannot check in: status is ${booking.status}`);
  }

  await db.$transaction([
    db.booking.update({
      where: { id: bookingId },
      data: {
        roomId,
        actualCheckIn: new Date(),
        status: "CHECKED_IN",
      },
    }),
    db.room.update({
      where: { id: roomId },
      data: { status: "OCCUPIED" },
    }),
    db.alert.create({
      data: {
        propertyId: user.propertyId,
        type: "BOOKING_CHECKIN",
        severity: "SUCCESS",
        title: `Check-in: ${booking.bookingCode}`,
        message: `Guest checked in to room ${roomId}`,
        entityType: "booking",
        entityId: bookingId,
      },
    }),
    db.auditLog.create({
      data: {
        propertyId: user.propertyId,
        userId: user.id,
        action: "booking.checkin",
        entityType: "booking",
        entityId: bookingId,
        metadata: JSON.stringify({ roomId }),
      },
    }),
  ]);

  revalidatePath(`/hotel/bookings/${bookingId}`);
  revalidatePath("/dashboard");
  revalidatePath("/hotel");
}

const checkOutSchema = z.object({
  bookingId: z.string().min(1),
});

export async function checkOutAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.propertyId) throw new Error("Unauthorized");
  if (!can(user.role, "booking:checkout")) throw new Error("Forbidden");

  const { bookingId } = checkOutSchema.parse(Object.fromEntries(formData));
  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.propertyId !== user.propertyId) {
    throw new Error("Booking not found");
  }
  if (booking.status !== "CHECKED_IN") {
    throw new Error(`Cannot check out: status is ${booking.status}`);
  }

  // Mark room as dirty + create housekeeping task
  await db.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        actualCheckOut: new Date(),
        status: "CHECKED_OUT",
      },
    });

    if (booking.roomId) {
      await tx.room.update({
        where: { id: booking.roomId },
        data: { status: "DIRTY" },
      });
      await tx.housekeepingTask.create({
        data: {
          propertyId: user.propertyId!,
          roomId: booking.roomId,
          bookingId: booking.id,
          taskType: "CHECKOUT_CLEAN",
          status: "PENDING",
          scheduledFor: new Date(),
          notes: `Checkout cleaning for ${booking.bookingCode}`,
        },
      });
    }

    await tx.alert.create({
      data: {
        propertyId: user.propertyId!,
        type: "BOOKING_CHECKOUT",
        severity: "INFO",
        title: `Check-out: ${booking.bookingCode}`,
        message: `Guest checked out. Total: ${booking.totalAmount}`,
        entityType: "booking",
        entityId: bookingId,
      },
    });

    await tx.auditLog.create({
      data: {
        propertyId: user.propertyId!,
        userId: user.id,
        action: "booking.checkout",
        entityType: "booking",
        entityId: bookingId,
      },
    });
  });

  revalidatePath(`/hotel/bookings/${bookingId}`);
  revalidatePath("/dashboard");
  revalidatePath("/hotel");
}

export async function cancelBookingAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.propertyId) throw new Error("Unauthorized");
  if (!can(user.role, "booking:cancel")) throw new Error("Forbidden");

  const id = formData.get("bookingId")?.toString();
  if (!id) throw new Error("Missing bookingId");
  const reason = formData.get("reason")?.toString() || "Cancelled by staff";

  const booking = await db.booking.findUnique({ where: { id } });
  if (!booking || booking.propertyId !== user.propertyId) throw new Error("Not found");
  if (["CHECKED_IN", "CHECKED_OUT", "CANCELLED"].includes(booking.status)) {
    throw new Error(`Cannot cancel: status is ${booking.status}`);
  }

  await db.$transaction([
    db.booking.update({
      where: { id },
      data: { status: "CANCELLED", notes: `${booking.notes ?? ""}\nCancelled: ${reason}` },
    }),
    db.alert.create({
      data: {
        propertyId: user.propertyId,
        type: "BOOKING_NEW",
        severity: "WARNING",
        title: `Booking cancelled: ${booking.bookingCode}`,
        message: reason,
        entityType: "booking",
        entityId: id,
      },
    }),
  ]);

  revalidatePath("/hotel/bookings");
  revalidatePath("/dashboard");
}
