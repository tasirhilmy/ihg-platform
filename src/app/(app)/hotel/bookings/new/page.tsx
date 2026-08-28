import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { NewBookingForm } from "./form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewBookingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "booking:create")) redirect("/");

  const [roomTypes, properties] = await Promise.all([
    db.roomType.findMany({
      where: { propertyId: user.propertyId! },
      include: {
        rooms: {
          where: { status: "AVAILABLE" },
          select: { id: true, roomNumber: true },
        },
      },
    }),
    db.property.findUnique({ where: { id: user.propertyId! } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/hotel/bookings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-brand">New booking</h1>
          <p className="text-sm text-slate-600">Create a reservation for a guest</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Guest & stay details</CardTitle>
          <CardDescription>
            {properties?.name} · {properties?.city}, {properties?.country}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewBookingForm roomTypes={roomTypes} currency={properties?.currency ?? "BDT"} />
        </CardContent>
      </Card>
    </div>
  );
}
