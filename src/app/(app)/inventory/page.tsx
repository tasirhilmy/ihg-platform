import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "inventory:read")) redirect("/");

  const [items, property] = await Promise.all([
    db.inventoryItem.findMany({
      where: { propertyId: user.propertyId! },
      orderBy: { name: "asc" },
    }),
    db.property.findUnique({ where: { id: user.propertyId! } }),
  ]);

  const lowStock = items.filter((i) => Number(i.quantity) <= Number(i.minQuantity));
  const totalValue = items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitCost), 0);

  // Group by category
  const grouped = items.reduce((acc, item) => {
    const cat = item.category ?? "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-brand">
            <Package className="h-6 w-6" />
            Inventory
          </h1>
          <p className="text-sm text-slate-600">{items.length} items tracked</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Total value</p>
          <p className="text-xl font-bold text-brand">{formatCurrency(totalValue, property?.currency)}</p>
        </div>
      </div>

      {lowStock.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              Low stock — {lowStock.length} item(s) need reorder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              {lowStock.map((i) => (
                <li key={i.id} className="flex items-center justify-between">
                  <span className="font-medium">{i.name}</span>
                  <span className="text-amber-800">
                    {Number(i.quantity)} {i.unit} (min {Number(i.minQuantity)})
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {Object.entries(grouped).map(([cat, list]) => (
          <Card key={cat}>
            <CardHeader>
              <CardTitle>{cat}</CardTitle>
              <CardDescription>{list.length} item(s)</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-2 font-medium">Item</th>
                    <th className="px-4 py-2 font-medium">SKU</th>
                    <th className="px-4 py-2 font-medium">Quantity</th>
                    <th className="px-4 py-2 font-medium">Min</th>
                    <th className="px-4 py-2 font-medium">Unit cost</th>
                    <th className="px-4 py-2 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((i) => {
                    const isLow = Number(i.quantity) <= Number(i.minQuantity);
                    return (
                      <tr key={i.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-2 font-medium">{i.name}</td>
                        <td className="px-4 py-2 font-mono text-xs text-slate-500">{i.sku ?? "—"}</td>
                        <td className="px-4 py-2">
                          <span className={isLow ? "font-semibold text-amber-700" : ""}>
                            {Number(i.quantity)} {i.unit}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-slate-500">
                          {Number(i.minQuantity)} {i.unit}
                        </td>
                        <td className="px-4 py-2">{formatCurrency(Number(i.unitCost), property?.currency)}</td>
                        <td className="px-4 py-2 font-semibold text-brand">
                          {formatCurrency(Number(i.quantity) * Number(i.unitCost), property?.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
