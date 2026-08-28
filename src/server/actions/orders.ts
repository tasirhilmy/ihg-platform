"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { sendEmail, orderReadyEmail } from "@/lib/email";

const updateStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum([
    "PLACED", "CONFIRMED", "PREPARING", "READY", "SERVED",
    "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED", "CANCELLED",
  ]),
  agentId: z.string().optional(),
});

export async function updateOrderStatus(input: z.infer<typeof updateStatusSchema>) {
  const user = await getCurrentUser();
  if (!user?.propertyId) throw new Error("Unauthorized");
  if (!can(user.role, "order:update")) throw new Error("Forbidden");

  const { id, status, agentId } = updateStatusSchema.parse(input);
  const order = await db.order.findUnique({
    where: { id },
    include: { deliveryOrder: true },
  });
  if (!order || order.propertyId !== user.propertyId) throw new Error("Not found");

  const now = new Date();
  const data: any = { status };
  if (status === "PREPARING" && !order.preparedAt) data.preparedAt = now;
  if (status === "READY" || status === "SERVED" || status === "DELIVERED" || status === "COMPLETED") {
    if (!order.preparedAt) data.preparedAt = now;
  }
  if (status === "SERVED" || status === "DELIVERED" || status === "COMPLETED") {
    data.servedAt = now;
  }
  if (status === "COMPLETED") data.completedAt = now;
  if (status === "CANCELLED") data.cancelledAt = now;

  await db.$transaction([
    db.order.update({ where: { id }, data }),
    // Mark items too
    ...(status === "PREPARING"
      ? [
          db.orderItem.updateMany({
            where: { orderId: id, status: "PLACED" },
            data: { status: "PREPARING" },
          }),
        ]
      : []),
    ...(status === "READY"
      ? [
          db.orderItem.updateMany({
            where: { orderId: id, status: { in: ["PLACED", "PREPARING"] } },
            data: { status: "READY" },
          }),
        ]
      : []),
    ...(status === "SERVED" || status === "DELIVERED" || status === "COMPLETED"
      ? [
          db.orderItem.updateMany({
            where: { orderId: id, status: { not: "CANCELLED" } },
            data: { status: "SERVED" },
          }),
        ]
      : []),
    // Update delivery order
    ...(order.deliveryOrder && (status === "OUT_FOR_DELIVERY" || status === "DELIVERED")
      ? [
          db.deliveryOrder.update({
            where: { id: order.deliveryOrder.id },
            data: {
              ...(status === "OUT_FOR_DELIVERY" ? { pickedUpAt: now } : {}),
              ...(status === "DELIVERED" ? { deliveredAt: now } : {}),
              ...(agentId ? { agentId } : {}),
            },
          }),
        ]
      : []),
  ]);

  // Side effects: alerts + emails
  if (status === "READY") {
    await db.alert.create({
      data: {
        propertyId: user.propertyId,
        type: "ORDER_READY",
        severity: "SUCCESS",
        title: `Order ${order.orderNumber} ready`,
        message: `${order.orderType} for ${order.customerName}`,
        entityType: "order",
        entityId: id,
      },
    });
    if (order.customerEmail) {
      const tpl = orderReadyEmail({
        customerName: order.customerName,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
      });
      await sendEmail({
        propertyId: user.propertyId,
        to: order.customerEmail,
        subject: tpl.subject,
        body: tpl.body,
        template: "order_ready",
      });
    }
  }
  if (status === "DELIVERED") {
    await db.alert.create({
      data: {
        propertyId: user.propertyId,
        type: "DELIVERY_DELIVERED",
        severity: "SUCCESS",
        title: `Delivered: ${order.orderNumber}`,
        message: `Order delivered to ${order.customerName}`,
        entityType: "order",
        entityId: id,
      },
    });
  }

  revalidatePath("/restaurant");
  revalidatePath("/restaurant/kitchen");
  revalidatePath("/delivery");
  revalidatePath("/dashboard");
  revalidatePath(`/orders/${id}`);
}

const createOrderSchema = z.object({
  orderType: z.enum(["DINE_IN", "DELIVERY", "ROOM_SERVICE"]),
  tableId: z.string().optional(),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  customerEmail: z.string().email().optional().or(z.literal("")),
  items: z.string(), // JSON: [{ menuItemId, quantity, notes }]
  notes: z.string().optional(),
  // Delivery specific
  deliveryAddress: z.string().optional(),
  deliveryCity: z.string().optional(),
  deliveryPhone: z.string().optional(),
});

export async function createOrderAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.propertyId) throw new Error("Unauthorized");
  if (!can(user.role, "order:create")) throw new Error("Forbidden");

  const raw = Object.fromEntries(formData);
  const parsed = createOrderSchema.parse(raw);

  type ItemInput = { menuItemId: string; quantity: number; notes?: string };
  const items: ItemInput[] = JSON.parse(parsed.items);
  if (items.length === 0) throw new Error("No items in order");

  // Compute totals
  const menuItems = await db.menuItem.findMany({
    where: { id: { in: items.map((i) => i.menuItemId) }, propertyId: user.propertyId },
  });
  if (menuItems.length !== new Set(items.map((i) => i.menuItemId)).size) {
    throw new Error("Some menu items are invalid");
  }

  const subtotal = items.reduce((sum, i) => {
    const mi = menuItems.find((m) => m.id === i.menuItemId)!;
    return sum + Number(mi.price) * i.quantity;
  }, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  // Generate order number
  const lastOrder = await db.order.findFirst({
    where: { orderNumber: { startsWith: `ORD-${new Date().getFullYear()}-` } },
    orderBy: { orderNumber: "desc" },
  });
  const lastNum = lastOrder
    ? parseInt(lastOrder.orderNumber.split("-")[2] || "0", 10)
    : 1000;
  const orderNumber = `ORD-${new Date().getFullYear()}-${lastNum + 1}`;

  // Create the order
  const order = await db.order.create({
    data: {
      propertyId: user.propertyId,
      orderNumber,
      orderType: parsed.orderType,
      tableId: parsed.orderType === "DINE_IN" ? parsed.tableId : null,
      waiterId: user.role === "WAITER" ? user.id : null,
      customerName: parsed.customerName,
      customerPhone: parsed.customerPhone,
      customerEmail: parsed.customerEmail || null,
      status: "PLACED",
      subtotal,
      taxAmount: tax,
      totalAmount: total,
      notes: parsed.notes,
      items: {
        create: items.map((i) => {
          const mi = menuItems.find((m) => m.id === i.menuItemId)!;
          return {
            menuItemId: i.menuItemId,
            quantity: i.quantity,
            unitPrice: mi.price,
            notes: i.notes,
          };
        }),
      },
      deliveryOrder: parsed.orderType === "DELIVERY"
        ? {
            create: {
              propertyId: user.propertyId,
              deliveryAddress: parsed.deliveryAddress ?? "",
              deliveryCity: parsed.deliveryCity,
              deliveryPhone: parsed.deliveryPhone ?? parsed.customerPhone,
              estimatedTime: 35,
              deliveryFee: 50,
            },
          }
        : undefined,
    },
  });

  // Update table status if dine-in
  if (parsed.orderType === "DINE_IN" && parsed.tableId) {
    await db.restaurantTable.update({
      where: { id: parsed.tableId },
      data: { status: "OCCUPIED" },
    });
  }

  // Alert
  await db.alert.create({
    data: {
      propertyId: user.propertyId,
      type: "ORDER_PLACED",
      severity: "INFO",
      title: `New order ${orderNumber}`,
      message: `${parsed.orderType} · ${parsed.customerName} · ${total.toFixed(2)}`,
      entityType: "order",
      entityId: order.id,
    },
  });

  revalidatePath("/restaurant");
  revalidatePath("/restaurant/kitchen");
  revalidatePath("/delivery");
  revalidatePath("/dashboard");
  revalidatePath("/hotel/bookings");

  return { orderId: order.id, orderNumber: order.orderNumber };
}
