"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";

const toggleSchema = z.object({
  id: z.string().min(1),
  isAvailable: z.boolean(),
});

export async function toggleMenuItemAvailability(input: z.infer<typeof toggleSchema>) {
  const user = await getCurrentUser();
  if (!user?.propertyId) throw new Error("Unauthorized");
  if (!can(user.role, "menu:write")) throw new Error("Forbidden");

  const { id, isAvailable } = toggleSchema.parse(input);
  const item = await db.menuItem.findUnique({ where: { id } });
  if (!item || item.propertyId !== user.propertyId) throw new Error("Not found");

  await db.menuItem.update({ where: { id }, data: { isAvailable } });
  revalidatePath("/restaurant/menu");
}
