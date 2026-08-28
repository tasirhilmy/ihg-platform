import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { db } from "@/lib/db";
import { UserRole } from "@/lib/enums";
import { ChatWidget } from "@/components/chat/chat-widget";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Verify user is still active in DB
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { isActive: true, role: true, propertyId: true, property: { select: { name: true } } },
  });

  if (!dbUser?.isActive) {
    redirect("/login?error=inactive");
  }

  // Super admin / property admin without a property should go to /admin
  if (!dbUser.propertyId) {
    if (dbUser.role === UserRole.SUPER_ADMIN || dbUser.role === UserRole.PROPERTY_ADMIN) {
      redirect("/admin/properties");
    } else {
      redirect("/login?error=no-property");
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-4 lg:p-6">
          <div className="page-enter mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
      <ChatWidget />
    </div>
  );
}
