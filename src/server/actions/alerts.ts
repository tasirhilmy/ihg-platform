"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function markAllAlertsRead() {
  const user = await getCurrentUser();
  if (!user?.propertyId) throw new Error("Unauthorized");
  await db.alert.updateMany({
    where: { propertyId: user.propertyId, isRead: false },
    data: { isRead: true, readById: user.id, readAt: new Date() },
  });
  revalidatePath("/alerts");
  revalidatePath("/dashboard");
}
