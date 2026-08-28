"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Trash2, Loader2, ShoppingCart, Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { createOrderAction } from "@/server/actions/orders";

type Item = { id: string; name: string; price: number; isVeg: boolean; prepTimeMins: number };
type CartItem = { menuItemId: string; name: string; price: number; quantity: number; notes?: string };

export function NewOrderForm({
  categories,
  tables,
  currency,
}: {
  categories: { id: string; name: string; items: Item[] }[];
  tables: { id: string; tableNumber: string; capacity: number }[];
  currency: string;
}) {
  const router = useRouter();
  const [orderType, setOrderType] = useState<"DINE_IN" | "DELIVERY" | "ROOM_SERVICE">("DINE_IN");
  const [tableId, setTableId] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState(categories[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  const filteredItems = useMemo(() => {
    const cat = categories.find((c) => c.id === activeCat);
    if (!cat) return [];
    if (!search) return cat.items;
    const q = search.toLowerCase();
    return cat.items.filter((i) => i.name.toLowerCase().includes(q));
  }, [categories, activeCat, search]);

  const addToCart = (item: Item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.menuItemId === id ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const remove = (id: string) => setCart((prev) => prev.filter((c) => c.menuItemId !== id));

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    if (orderType === "DINE_IN" && !tableId) {
      toast.error("Select a table");
      return;
    }
    if (!customerName || !customerPhone) {
      toast.error("Customer name and phone required");
      return;
    }

    const formData = new FormData();
    formData.append("orderType", orderType);
    if (tableId) formData.append("tableId", tableId);
    formData.append("customerName", customerName);
    formData.append("customerPhone", customerPhone);
    if (customerEmail) formData.append("customerEmail", customerEmail);
    formData.append("items", JSON.stringify(cart.map((c) => ({ menuItemId: c.menuItemId, quantity: c.quantity, notes: c.notes }))));
    if (notes) formData.append("notes", notes);
    if (orderType === "DELIVERY") {
      formData.append("deliveryAddress", deliveryAddress);
      formData.append("deliveryPhone", customerPhone);
    }

    startTransition(async () => {
      try {
        const res = await createOrderAction(formData);
        toast.success(`Order ${res.orderNumber} created`);
        router.push("/restaurant/kitchen");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-3">
      {/* Menu */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Menu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items…"
              className="pl-9"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCat(c.id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  activeCat === c.id
                    ? "border-brand bg-brand text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-brand-300"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Items grid */}
          <div className="grid gap-2 sm:grid-cols-2">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => addToCart(item)}
                className="group flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-brand hover:bg-brand-50"
              >
                <div className="flex items-start gap-2">
                  <div className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${item.isVeg ? "border-emerald-600" : "border-red-600"}`}>
                    <div className={`h-2 w-2 rounded-full ${item.isVeg ? "bg-emerald-600" : "bg-red-600"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.prepTimeMins} min</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-brand">
                  {formatCurrency(item.price, currency)}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cart + customer */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Cart ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cart.length === 0 ? (
              <p className="rounded-lg border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                Click menu items to add
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {cart.map((c) => (
                  <li key={c.menuItemId} className="flex items-center justify-between py-2 text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-slate-500">
                        {formatCurrency(c.price, currency)} × {c.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(c.menuItemId, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-semibold">{c.quantity}</span>
                      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(c.menuItemId, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => remove(c.menuItemId)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {cart.length > 0 && (
              <div className="space-y-1 border-t border-slate-200 pt-3 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal, currency)}</span></div>
                <div className="flex justify-between text-slate-500"><span>VAT (5%)</span><span>{formatCurrency(tax, currency)}</span></div>
                <div className="flex justify-between text-base font-bold text-brand"><span>Total</span><span>{formatCurrency(total, currency)}</span></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Order type</Label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="DINE_IN">Dine-in</option>
                <option value="DELIVERY">Delivery</option>
                <option value="ROOM_SERVICE">Room service</option>
              </select>
            </div>

            {orderType === "DINE_IN" && (
              <div className="space-y-1.5">
                <Label>Table</Label>
                <select
                  value={tableId}
                  onChange={(e) => setTableId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select table…</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>{t.tableNumber} ({t.capacity} seats)</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Email (optional)</Label>
              <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
            </div>

            {orderType === "DELIVERY" && (
              <div className="space-y-1.5">
                <Label>Delivery address</Label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={2}
                  required
                  className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  placeholder="House, road, area, city"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                placeholder="Special instructions (optional)"
              />
            </div>

            <Button type="submit" variant="accent" className="w-full" disabled={isPending || cart.length === 0}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Place order · {formatCurrency(total, currency)}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
