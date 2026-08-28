import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Phone, Mail, Users, BedDouble } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "SUPER_ADMIN") redirect("/");

  const properties = await db.property.findMany({
    include: {
      _count: {
        select: {
          users: true,
          rooms: true,
          bookings: true,
          orders: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">Properties</h1>
        <p className="text-sm text-slate-600">All properties in the IHG chain</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {properties.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {p.name}
                  </CardTitle>
                  <CardDescription className="mt-1">{p.description}</CardDescription>
                </div>
                <Badge variant={p.isActive ? "success" : "secondary"}>
                  {p.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="h-3.5 w-3.5" />
                {p.address}, {p.city}, {p.country}
              </div>
              {p.phone && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="h-3.5 w-3.5" />
                  {p.phone}
                </div>
              )}
              {p.email && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="h-3.5 w-3.5" />
                  {p.email}
                </div>
              )}
              <div className="grid grid-cols-4 gap-2 border-t border-slate-100 pt-3 text-center">
                <div>
                  <p className="text-lg font-bold text-brand">{p._count.users}</p>
                  <p className="text-xs text-slate-500">Staff</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-brand">{p._count.rooms}</p>
                  <p className="text-xs text-slate-500">Rooms</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-brand">{p._count.bookings}</p>
                  <p className="text-xs text-slate-500">Bookings</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-brand">{p._count.orders}</p>
                  <p className="text-xs text-slate-500">Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
