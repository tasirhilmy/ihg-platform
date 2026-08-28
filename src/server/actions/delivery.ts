"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { sendEmail, deliveryAssignedEmail } from "@/lib/email";

const assignSchema = z.object({
  id: z.string().min(1),
  agentId: z.string().min(1),
});

export async function assignDeliveryAgent(input: z.infer<typeof assignSchema>) {
  const user = await getCurrentUser();
  if (!user?.propertyId) throw new Error("Unauthorized");
  if (!can(user.role, "delivery:assign")) throw new Error("Forbidden");

  const { id, agentId } = assignSchema.parse(input);
  const delivery = await db.deliveryOrder.findUnique({
    where: { id },
    include: { order: true, agent: true },
  });
  if (!delivery || delivery.propertyId !== user.propertyId) throw new Error("Not found");

  await db.$transaction([
    db.deliveryOrder.update({ where: { id }, data: { agentId } }),
    db.alert.create({
      data: {
        propertyId: user.propertyId,
        type: "DELIVERY_ASSIGNED",
        severity: "INFO",
        title: `Delivery assigned: ${delivery.order.orderNumber}`,
        message: `Agent assigned to order`,
        entityType: "delivery",
        entityId: id,
      },
    }),
  ]);

  // Email the agent
  const agent = await db.user.findUnique({ where: { id: agentId } });
  if (agent) {
    const tpl = deliveryAssignedEmail({
      agentName: agent.name,
      orderNumber: delivery.order.orderNumber,
      customerAddress: delivery.deliveryAddress,
    });
    await sendEmail({
      propertyId: user.propertyId,
      to: agent.email,
      subject: tpl.subject,
      body: tpl.body,
      template: "delivery_assigned",
    });
  }

  revalidatePath("/delivery");
  revalidatePath("/delivery/agent");
  revalidatePath("/dashboard");
}

const statusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["OUT_FOR_DELIVERY", "DELIVERED"]),
});

export async function markDeliveryStatus(input: z.infer<typeof statusSchema>) {
  const user = await getCurrentUser();
  if (!user?.propertyId) throw new Error("Unauthorized");
  if (!can(user.role, "delivery:update") && user.role !== "DELIVERY") {
    throw new Error("Forbidden");
  }

  const { id, status } = statusSchema.parse(input);
  const delivery = await db.deliveryOrder.findUnique({
    where: { id },
    include: { order: true },
  });
  if (!delivery || delivery.propertyId !== user.propertyId) throw new Error("Not found");
  if (delivery.agentId !== user.id && !can(user.role, "delivery:assign")) {
    throw new Error("Not your delivery");
  }

  const now = new Date();
  await db.$transaction([
    db.deliveryOrder.update({
      where: { id },
      data: {
        ...(status === "OUT_FOR_DELIVERY" ? { pickedUpAt: now } : {}),
        ...(status === "DELIVERED" ? { deliveredAt: now } : {}),
      },
    }),
    db.order.update({
      where: { id: delivery.orderId },
      data: { status },
    }),
  ]);

  revalidatePath("/delivery");
  revalidatePath("/delivery/agent");
  revalidatePath("/dashboard");
}
