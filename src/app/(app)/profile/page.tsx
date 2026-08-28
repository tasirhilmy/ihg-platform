import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Building2, Clock, Activity } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: { property: true, guestProfile: { include: { bookings: true } } },
  });

  if (!dbUser) redirect("/login");

  const auditCount = await db.auditLog.count({ where: { userId: user.id } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">My profile</h1>
        <p className="text-sm text-slate-600">Account information and activity</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white">
                {dbUser.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">{dbUser.name}</p>
                <Badge variant="default">{dbUser.role.replace("_", " ")}</Badge>
              </div>
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <span>{dbUser.email}</span>
              </div>
              {dbUser.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>{dbUser.phone}</span>
                </div>
              )}
              {dbUser.property && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span>{dbUser.property.name} · {dbUser.property.city}</span>
                </div>
              )}
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
              <div>
                <p>Joined</p>
                <p className="font-medium text-slate-700">{formatDateTime(dbUser.createdAt)}</p>
              </div>
              <div>
                <p>Last login</p>
                <p className="font-medium text-slate-700">{dbUser.lastLoginAt ? formatDateTime(dbUser.lastLoginAt) : "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {dbUser.guestProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Loyalty</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-brand">{dbUser.guestProfile.loyaltyPoints}</p>
                <p className="text-xs text-slate-500">points</p>
                <p className="mt-3 text-sm text-slate-600">
                  {dbUser.guestProfile.bookings.length} booking(s) on file
                </p>
                {dbUser.guestProfile.vipStatus && (
                  <Badge variant="accent" className="mt-2">VIP Member</Badge>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-slate-400" />
                <span>{auditCount} actions logged</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Separator() {
  return <div className="h-px w-full bg-slate-200" />;
}
