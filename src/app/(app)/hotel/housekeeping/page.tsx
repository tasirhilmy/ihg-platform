import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { HousekeepingBoard } from "./board";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HousekeepingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "housekeeping:read")) redirect("/");

  const propertyId = user.propertyId!;

  const [tasks, housekeepingStaff] = await Promise.all([
    db.housekeepingTask.findMany({
      where: { propertyId },
      include: {
        room: { include: { roomType: true } },
        assignee: true,
        booking: { include: { guest: { include: { user: true } } } },
      },
      orderBy: [{ priority: "desc" }, { scheduledFor: "asc" }],
    }),
    db.user.findMany({
      where: { propertyId, role: "HOUSEKEEPING", isActive: true },
      select: { id: true, name: true },
    }),
  ]);

  const pending = tasks.filter((t) => t.status === "PENDING");
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS");
  const completed = tasks.filter((t) => ["COMPLETED", "INSPECTED"].includes(t.status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-brand">
          <Sparkles className="h-6 w-6" />
          Housekeeping Board
        </h1>
        <p className="text-sm text-slate-600">Live task management · {tasks.length} total tasks</p>
      </div>

      <HousekeepingBoard
        tasks={tasks.map((t) => ({
          id: t.id,
          taskType: t.taskType,
          priority: t.priority,
          status: t.status,
          notes: t.notes,
          scheduledFor: t.scheduledFor.toISOString(),
          startedAt: t.startedAt?.toISOString() ?? null,
          completedAt: t.completedAt?.toISOString() ?? null,
          room: { id: t.room.id, roomNumber: t.room.roomNumber, roomType: t.room.roomType.name, floor: t.room.floor },
          assignee: t.assignee ? { id: t.assignee.id, name: t.assignee.name } : null,
          booking: t.booking ? { code: t.booking.bookingCode, guestName: t.booking.guest.user.name } : null,
        }))}
        staff={housekeepingStaff}
        canUpdate={can(user.role, "housekeeping:update")}
      />
    </div>
  );
}
