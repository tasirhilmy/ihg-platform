"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Hotel, UtensilsCrossed, Bike, BarChart3, LayoutDashboard,
  BedDouble, Sparkles, BookOpen, Users, Settings, Package, Bell, MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { can, type Permission } from "@/lib/rbac";
import { type UserRole } from "@/lib/enums";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
  roles?: UserRole[]; // explicit role list (overrides permission)
}

const NAV: NavItem[] = [
  // Admin / Manager
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "PROPERTY_ADMIN", "MANAGER"] },
  { label: "Properties", href: "/admin/properties", icon: Settings, roles: ["SUPER_ADMIN"] },
  { label: "Users", href: "/admin/users", icon: Users, permission: "user:read" },
  { label: "Reports", href: "/reports", icon: BarChart3, permission: "reports:view" },
  { label: "Inventory", href: "/inventory", icon: Package, permission: "inventory:read" },
  { label: "Alerts", href: "/alerts", icon: Bell },
  { label: "AI Chat", href: "/admin/chat", icon: MessageCircle, permission: "dashboard:view" },

  // Hotel
  { label: "Hotel", href: "/hotel", icon: Hotel, roles: ["SUPER_ADMIN", "PROPERTY_ADMIN", "MANAGER", "RECEPTION", "HOUSEKEEPING"] },
  { label: "Bookings", href: "/hotel/bookings", icon: BookOpen, permission: "booking:read" },
  { label: "Rooms", href: "/hotel/rooms", icon: BedDouble, permission: "room:read" },
  { label: "Housekeeping", href: "/hotel/housekeeping", icon: Sparkles, roles: ["SUPER_ADMIN", "PROPERTY_ADMIN", "MANAGER", "RECEPTION", "HOUSEKEEPING"] },

  // Restaurant
  { label: "Restaurant", href: "/restaurant", icon: UtensilsCrossed, roles: ["SUPER_ADMIN", "PROPERTY_ADMIN", "MANAGER", "RECEPTION", "WAITER", "KITCHEN", "CUSTOMER"] },
  { label: "Kitchen Display", href: "/restaurant/kitchen", icon: Sparkles, roles: ["SUPER_ADMIN", "PROPERTY_ADMIN", "MANAGER", "KITCHEN", "WAITER"] },
  { label: "Menu", href: "/restaurant/menu", icon: UtensilsCrossed, permission: "menu:write" },
  { label: "Tables", href: "/restaurant/tables", icon: BedDouble, permission: "table:write" },

  // Delivery
  { label: "Delivery", href: "/delivery", icon: Bike, roles: ["SUPER_ADMIN", "PROPERTY_ADMIN", "MANAGER", "DELIVERY", "KITCHEN"] },
  { label: "My Deliveries", href: "/delivery/agent", icon: Bike, roles: ["DELIVERY"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;

  const visible = NAV.filter((item) => {
    if (item.roles) return item.roles.includes(role as UserRole);
    if (item.permission) return can(role, item.permission);
    return true;
  });

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white font-bold">
          IH
        </div>
        <div>
          <div className="text-sm font-bold text-brand">IHG Platform</div>
          <div className="text-xs text-slate-500">Hospitality OS</div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {visible.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-brand text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-100"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-3 text-xs text-slate-500">
        v1.0 · IHG © {new Date().getFullYear()}
      </div>
    </aside>
  );
}
