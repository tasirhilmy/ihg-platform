import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { NewOrderForm } from "./form";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "order:create")) redirect("/");

  const [menuItems, tables, property] = await Promise.all([
    db.menuItem.findMany({
      where: { propertyId: user.propertyId!, isAvailable: true },
      include: { category: true },
      orderBy: [{ category: { displayOrder: "asc" } }, { displayOrder: "asc" }],
    }),
    db.restaurantTable.findMany({
      where: { propertyId: user.propertyId!, isActive: true },
      orderBy: { tableNumber: "asc" },
    }),
    db.property.findUnique({ where: { id: user.propertyId! } }),
  ]);

  // Group by category
  const categories: Record<string, { id: string; name: string; items: any[] }> = {};
  for (const m of menuItems) {
    if (!categories[m.categoryId]) {
      categories[m.categoryId] = { id: m.categoryId, name: m.category.name, items: [] };
    }
    categories[m.categoryId].items.push({
      id: m.id,
      name: m.name,
      price: Number(m.price),
      isVeg: m.isVeg,
      prepTimeMins: m.prepTimeMins,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">New order</h1>
        <p className="text-sm text-slate-600">Take a dine-in, delivery, or room service order</p>
      </div>
      <NewOrderForm
        categories={Object.values(categories)}
        tables={tables.map((t) => ({ id: t.id, tableNumber: t.tableNumber, capacity: t.capacity }))}
        currency={property?.currency ?? "BDT"}
      />
    </div>
  );
}
