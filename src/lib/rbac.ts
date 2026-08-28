import { UserRole } from "./enums";

/**
 * Centralized RBAC permission matrix.
 * Each role maps to a set of allowed actions.
 * SUPER_ADMIN can do anything (handled in can()).
 */
export const PERMISSIONS = {
  // Property management
  "property:read": [
    "SUPER_ADMIN",
    "PROPERTY_ADMIN",
    "MANAGER",
    "RECEPTION",
    "HOUSEKEEPING",
    "KITCHEN",
    "WAITER",
    "DELIVERY",
  ],
  "property:write": ["SUPER_ADMIN", "PROPERTY_ADMIN"],
  "property:create": ["SUPER_ADMIN"],
  "property:delete": ["SUPER_ADMIN"],

  // User management
  "user:read": ["SUPER_ADMIN", "PROPERTY_ADMIN", "MANAGER"],
  "user:write": ["SUPER_ADMIN", "PROPERTY_ADMIN", "MANAGER"],
  "user:create": ["SUPER_ADMIN", "PROPERTY_ADMIN", "MANAGER"],
  "user:delete": ["SUPER_ADMIN", "PROPERTY_ADMIN"],

  // Hotel
  "booking:read": [
    "SUPER_ADMIN",
    "PROPERTY_ADMIN",
    "MANAGER",
    "RECEPTION",
  ],
  "booking:create": [
    "SUPER_ADMIN",
    "PROPERTY_ADMIN",
    "MANAGER",
    "RECEPTION",
    "CUSTOMER",
  ],
  "booking:update": [
    "SUPER_ADMIN",
    "PROPERTY_ADMIN",
    "MANAGER",
    "RECEPTION",
  ],
  "booking:cancel": ["SUPER_ADMIN", "PROPERTY_ADMIN", "MANAGER", "RECEPTION"],
  "booking:checkin": [
    "SUPER_ADMIN",
    "PROPERTY_ADMIN",
    "MANAGER",
    "RECEPTION",
  ],
  "booking:checkout": [
    "SUPER_ADMIN",
    "PROPERTY_ADMIN",
    "MANAGER",
    "RECEPTION",
  ],

  "room:read": [
    "SUPER_ADMIN",
    "PROPERTY_ADMIN",
    "MANAGER",
    "RECEPTION",
    "HOUSEKEEPING",
    "CUSTOMER",
  ],
  "room:write": ["SUPER_ADMIN", "PROPERTY_ADMIN", "MANAGER"],
  "roomType:write": ["SUPER_ADMIN", "PROPERTY_ADMIN", "MANAGER"],

  "housekeeping:read": [
    "SUPER_ADMIN",
    "PROPERTY_ADMIN",
    "MANAGER",
    "RECEPTION",
    "HOUSEKEEPING",
  ],
  "housekeeping:update": [
    "SUPER_ADMIN",
    "PROPERTY_ADMIN",
    "MANAGER",
    "HOUSEKEEPING",
  ],

  "serviceRequest:read": [
    "SUPER_ADMIN",
    "PROPERTY_ADMIN",
    "MANAGER",
    "RECEPTION",
    "HOUSEKEEPING",
    "KITCHEN",
    "WAITER",
  ],
  "serviceRequest:create": [
    "SUPER_ADMIN",
    "PROPERTY_ADMIN",
    "MANAGER",
    "RECEPTION",
    "CUSTOMER",
  ],
  "serviceRequest:update": [
    "SUPER_ADMIN",
    "PROPERTY_ADMIN",
    "MANAGER",
    "RECEPTION",
    "HOUSEKEEPING",
    "KITCHEN",
    "WAITER",
  ],

  // Restaurant
  "table:read": [
    "SUPER_ADMIN",
    "PROPERTY_ADMIN",
    "MANAGER",
    "RECEPTION",
    "WAITER",
    "CUSTOMER",
  ],
  "table:write": ["SUPER_ADMIN", "PROPERTY_ADMIN", "MANAGER"],
  "reservation:read": [
    "SUPER_ADMIN",
    "PROPERTY_ADMIN",
    "MANAGER",
    "RECEPTION",
    "WAITER",
    "CUSTOMER",
  ],
  "reservation:create": [
    "SUPER_ADMIN",
    "PROPERTY_ADMIN",
    "MANAGER",
    "RECEPTION",
    "WAITER",
    "CUSTOMER",
  ],
  "reservation:update": [
    "SUPER_ADMIN",
    "PROPERTY_ADMIN",
    "MANAGER",
    "RECEPTION",
    "WAITER",
  ],
  "menu:read": [
    "SUPER_ADMIN",
    "PROPERTY_ADMIN",
    "MANAGER",
    "RECEPTION",
    "KITCHEN",
    "WAITER",
    "DELIVERY",
    "CUSTOMER",
  ],
  "menu:write": ["SUPER_ADMIN", "PROPERTY_ADMIN", "MANAGER", "KITCHEN"],

  // Orders (restaurant + delivery + room service)
  "order:read": [
    "SUPER_ADMIN",
    "PROPERTY_ADMIN",
    "MANAGER",
    "RECEPTION",
    "KITCHEN",
    "WAITER",
    "DELIVERY",
    "CUSTOMER",
  ],
  "order:create": [
    "SUPER_ADMIN",
    "PROPERTY_ADMIN",
    "MANAGER",
    "WAITER",
    "RECEPTION",
    "CUSTOMER",
  ],
  "order:update": [
    "SUPER_ADMIN",
    "PROPERTY_ADMIN",
    "MANAGER",
    "KITCHEN",
    "WAITER",
  ],
  "order:cancel": [
    "SUPER_ADMIN",
    "PROPERTY_ADMIN",
    "MANAGER",
    "WAITER",
    "CUSTOMER",
  ],

  // Delivery
  "delivery:read": [
    "SUPER_ADMIN",
    "PROPERTY_ADMIN",
    "MANAGER",
    "DELIVERY",
    "CUSTOMER",
  ],
  "delivery:assign": ["SUPER_ADMIN", "PROPERTY_ADMIN", "MANAGER"],
  "delivery:update": ["SUPER_ADMIN", "PROPERTY_ADMIN", "MANAGER", "DELIVERY"],

  // Inventory
  "inventory:read": [
    "SUPER_ADMIN",
    "PROPERTY_ADMIN",
    "MANAGER",
    "KITCHEN",
  ],
  "inventory:write": ["SUPER_ADMIN", "PROPERTY_ADMIN", "MANAGER", "KITCHEN"],

  // Payments
  "payment:read": [
    "SUPER_ADMIN",
    "PROPERTY_ADMIN",
    "MANAGER",
    "RECEPTION",
    "CUSTOMER",
  ],
  "payment:create": [
    "SUPER_ADMIN",
    "PROPERTY_ADMIN",
    "MANAGER",
    "RECEPTION",
  ],
  "payment:refund": ["SUPER_ADMIN", "PROPERTY_ADMIN", "MANAGER"],

  // Reports & dashboard
  "dashboard:view": [
    "SUPER_ADMIN",
    "PROPERTY_ADMIN",
    "MANAGER",
  ],
  "reports:view": ["SUPER_ADMIN", "PROPERTY_ADMIN", "MANAGER"],
  "audit:view": ["SUPER_ADMIN", "PROPERTY_ADMIN"],
} as const satisfies Record<string, readonly UserRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: UserRole | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  if (role === "SUPER_ADMIN") return true; // super admin can do anything
  const allowed = PERMISSIONS[permission] as readonly UserRole[];
  return allowed?.includes(role) ?? false;
}

export function requirePermission(role: UserRole | undefined | null, permission: Permission) {
  if (!can(role, permission)) {
    throw new Error(`FORBIDDEN: missing permission ${permission}`);
  }
}

/**
 * Returns routes accessible to a given role.
 * Used to filter sidebar nav.
 */
export const ROLE_HOMES: Record<UserRole, string> = {
  SUPER_ADMIN: "/admin",
  PROPERTY_ADMIN: "/admin",
  MANAGER: "/dashboard",
  RECEPTION: "/hotel",
  HOUSEKEEPING: "/hotel/housekeeping",
  KITCHEN: "/restaurant/kitchen",
  WAITER: "/restaurant",
  DELIVERY: "/delivery",
  CUSTOMER: "/portal",
};
