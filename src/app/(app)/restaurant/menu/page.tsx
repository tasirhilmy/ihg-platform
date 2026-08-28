import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { UtensilsCrossed } from "lucide-react";
import { MenuItemActions } from "./actions";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "menu:read")) redirect("/");

  const propertyId = user.propertyId!;
  const canEdit = can(user.role, "menu:write");

  const [categories, property] = await Promise.all([
    db.menuCategory.findMany({
      where: { propertyId, isActive: true },
      orderBy: { displayOrder: "asc" },
      include: {
        items: {
          where: { isAvailable: true },
          orderBy: { displayOrder: "asc" },
        },
      },
    }),
    db.property.findUnique({ where: { id: propertyId } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">Menu</h1>
        <p className="text-sm text-slate-600">
          {canEdit ? "Manage menu items, prices, and availability" : "Browse the menu"}
        </p>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <UtensilsCrossed className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">No menu items yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => (
            <Card key={cat.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{cat.name}</CardTitle>
                    {cat.description && <CardDescription>{cat.description}</CardDescription>}
                  </div>
                  <Badge variant="secondary">{cat.items.length} items</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-slate-100">
                  {cat.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 border-emerald-600">
                          {item.isVeg && <div className="h-2.5 w-2.5 rounded-full bg-emerald-600" />}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-slate-500">{item.description}</p>
                          )}
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            Prep: {item.prepTimeMins} min
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-base font-bold text-brand">
                          {formatCurrency(Number(item.price), property?.currency)}
                        </p>
                        {canEdit && <MenuItemActions item={{ id: item.id, name: item.name, price: Number(item.price), isAvailable: item.isAvailable }} />}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
