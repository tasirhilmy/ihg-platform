"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["OPEN", "RESOLVED", "ESCALATED"]),
});

export async function updateSessionStatus(input: z.infer<typeof updateSchema>) {
  const user = await getCurrentUser();
  if (!user?.propertyId) throw new Error("Unauthorized");
  if (!can(user.role, "dashboard:view")) throw new Error("Forbidden");

  const { id, status } = updateSchema.parse(input);
  const session = await db.chatSession.findUnique({ where: { id } });
  if (!session || session.propertyId !== user.propertyId) throw new Error("Not found");

  await db.chatSession.update({
    where: { id },
    data: {
      status,
      ...(status === "RESOLVED" ? { endedAt: new Date() } : { endedAt: null }),
    },
  });

  // If resolved, mark related alert as read
  if (status === "RESOLVED") {
    await db.alert.updateMany({
      where: { entityType: "chat", entityId: id },
      data: { isRead: true, readById: user.id, readAt: new Date() },
    });
  }

  revalidatePath("/admin/chat");
  revalidatePath(`/admin/chat/${id}`);
}
