"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "INSPECTED"]).optional(),
  assigneeId: z.string().optional().nullable(),
});

export async function updateHousekeepingStatus(input: z.infer<typeof updateSchema>) {
  const user = await getCurrentUser();
  if (!user?.propertyId) throw new Error("Unauthorized");
  if (!can(user.role, "housekeeping:update")) throw new Error("Forbidden");

  const { id, status, assigneeId } = updateSchema.parse(input);
  const task = await db.housekeepingTask.findUnique({ where: { id } });
  if (!task || task.propertyId !== user.propertyId) throw new Error("Not found");

  const data: any = {};
  if (status !== undefined) {
    data.status = status;
    if (status === "IN_PROGRESS" && !task.startedAt) data.startedAt = new Date();
    if (status === "COMPLETED" && !task.completedAt) data.completedAt = new Date();
  }
  if (assigneeId !== undefined) {
    data.assigneeId = assigneeId || null;
  }
  data.updatedById = user.id;

  await db.$transaction([
    db.housekeepingTask.update({ where: { id }, data }),
    // If checkout clean completed, set room to AVAILABLE
    ...(status === "COMPLETED" && task.taskType === "CHECKOUT_CLEAN"
      ? [
          db.room.update({
            where: { id: task.roomId },
            data: { status: "AVAILABLE" },
          }),
        ]
      : []),
    ...(status === "IN_PROGRESS" && task.taskType === "CHECKOUT_CLEAN"
      ? [
          db.room.update({
            where: { id: task.roomId },
            data: { status: "CLEANING" },
          }),
        ]
      : []),
  ]);

  // If task completed, create alert
  if (status === "COMPLETED") {
    await db.alert.create({
      data: {
        propertyId: user.propertyId,
        type: "HOUSEKEEPING_DONE",
        severity: "SUCCESS",
        title: `Room ${task.roomId} cleaned`,
        message: "Housekeeping task completed",
        entityType: "housekeeping",
        entityId: id,
      },
    });
  }

  revalidatePath("/hotel/housekeeping");
  revalidatePath("/dashboard");
  revalidatePath("/hotel");
}
