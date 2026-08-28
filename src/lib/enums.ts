// Type-safe enum constants. SQLite doesn't support Prisma enums,
// so we use String fields with these constants for compile-time safety.
// When switching to PostgreSQL, replace String fields with proper `enum` declarations.

// =====================================================================
//  UserRole
// =====================================================================
export const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  PROPERTY_ADMIN: "PROPERTY_ADMIN",
  MANAGER: "MANAGER",
  RECEPTION: "RECEPTION",
  HOUSEKEEPING: "HOUSEKEEPING",
  KITCHEN: "KITCHEN",
  WAITER: "WAITER",
  DELIVERY: "DELIVERY",
  CUSTOMER: "CUSTOMER",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// =====================================================================
//  RoomStatus
// =====================================================================
export const RoomStatus = {
  AVAILABLE: "AVAILABLE",
  OCCUPIED: "OCCUPIED",
  RESERVED: "RESERVED",
  CLEANING: "CLEANING",
  MAINTENANCE: "MAINTENANCE",
  DIRTY: "DIRTY",
} as const;
export type RoomStatus = (typeof RoomStatus)[keyof typeof RoomStatus];

export const ROOM_STATUS_LABEL: Record<RoomStatus, string> = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  RESERVED: "Reserved",
  CLEANING: "Cleaning",
  MAINTENANCE: "Maintenance",
  DIRTY: "Dirty",
};

// =====================================================================
//  BookingStatus
// =====================================================================
export const BookingStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CHECKED_IN: "CHECKED_IN",
  CHECKED_OUT: "CHECKED_OUT",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked in",
  CHECKED_OUT: "Checked out",
  CANCELLED: "Cancelled",
  NO_SHOW: "No show",
};

// =====================================================================
//  HousekeepingTaskType
// =====================================================================
export const HousekeepingTaskType = {
  CHECKOUT_CLEAN: "CHECKOUT_CLEAN",
  STAY_OVER: "STAY_OVER",
  TOUCH_UP: "TOUCH_UP",
  DEEP_CLEAN: "DEEP_CLEAN",
  TURNDOWN: "TURNDOWN",
} as const;
export type HousekeepingTaskType = (typeof HousekeepingTaskType)[keyof typeof HousekeepingTaskType];

export const HOUSEKEEPING_TASK_LABEL: Record<HousekeepingTaskType, string> = {
  CHECKOUT_CLEAN: "Checkout clean",
  STAY_OVER: "Stay-over service",
  TOUCH_UP: "Touch-up",
  DEEP_CLEAN: "Deep clean",
  TURNDOWN: "Turndown",
};

// =====================================================================
//  HousekeepingStatus
// =====================================================================
export const HousekeepingStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  INSPECTED: "INSPECTED",
} as const;
export type HousekeepingStatus = (typeof HousekeepingStatus)[keyof typeof HousekeepingStatus];

// =====================================================================
//  Priority
// =====================================================================
export const Priority = {
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

// =====================================================================
//  ServiceRequestCategory
// =====================================================================
export const ServiceRequestCategory = {
  FOOD: "FOOD",
  HOUSEKEEPING: "HOUSEKEEPING",
  AMENITIES: "AMENITIES",
  MAINTENANCE: "MAINTENANCE",
  OTHER: "OTHER",
} as const;
export type ServiceRequestCategory =
  (typeof ServiceRequestCategory)[keyof typeof ServiceRequestCategory];

export const SERVICE_REQUEST_CATEGORY_LABEL: Record<ServiceRequestCategory, string> = {
  FOOD: "Food",
  HOUSEKEEPING: "Housekeeping",
  AMENITIES: "Amenities",
  MAINTENANCE: "Maintenance",
  OTHER: "Other",
};

// =====================================================================
//  ServiceRequestStatus
// =====================================================================
export const ServiceRequestStatus = {
  PENDING: "PENDING",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type ServiceRequestStatus =
  (typeof ServiceRequestStatus)[keyof typeof ServiceRequestStatus];

// =====================================================================
//  TableStatus
// =====================================================================
export const TableStatus = {
  AVAILABLE: "AVAILABLE",
  RESERVED: "RESERVED",
  OCCUPIED: "OCCUPIED",
  CLEANING: "CLEANING",
} as const;
export type TableStatus = (typeof TableStatus)[keyof typeof TableStatus];

export const TABLE_STATUS_LABEL: Record<TableStatus, string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  OCCUPIED: "Occupied",
  CLEANING: "Cleaning",
};

// =====================================================================
//  ReservationStatus
// =====================================================================
export const ReservationStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  SEATED: "SEATED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
} as const;
export type ReservationStatus = (typeof ReservationStatus)[keyof typeof ReservationStatus];

// =====================================================================
//  OrderType
// =====================================================================
export const OrderType = {
  DINE_IN: "DINE_IN",
  DELIVERY: "DELIVERY",
  ROOM_SERVICE: "ROOM_SERVICE",
} as const;
export type OrderType = (typeof OrderType)[keyof typeof OrderType];

export const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  DINE_IN: "Dine-in",
  DELIVERY: "Delivery",
  ROOM_SERVICE: "Room service",
};

// =====================================================================
//  OrderStatus
// =====================================================================
export const OrderStatus = {
  PLACED: "PLACED",
  CONFIRMED: "CONFIRMED",
  PREPARING: "PREPARING",
  READY: "READY",
  SERVED: "SERVED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PLACED: "Placed",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY: "Ready",
  SERVED: "Served",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

// =====================================================================
//  OrderItemStatus
// =====================================================================
export const OrderItemStatus = {
  PLACED: "PLACED",
  PREPARING: "PREPARING",
  READY: "READY",
  SERVED: "SERVED",
  CANCELLED: "CANCELLED",
} as const;
export type OrderItemStatus = (typeof OrderItemStatus)[keyof typeof OrderItemStatus];

// =====================================================================
//  PaymentMethod
// =====================================================================
export const PaymentMethod = {
  CASH: "CASH",
  CARD: "CARD",
  BKASH: "BKASH",
  NAGAD: "NAGAD",
  ONLINE_GATEWAY: "ONLINE_GATEWAY",
  ROOM_CHARGE: "ROOM_CHARGE",
  OTHER: "OTHER",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Cash",
  CARD: "Card",
  BKASH: "bKash",
  NAGAD: "Nagad",
  ONLINE_GATEWAY: "Online gateway",
  ROOM_CHARGE: "Room charge",
  OTHER: "Other",
};

// =====================================================================
//  PaymentStatus
// =====================================================================
export const PaymentStatus = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
  CANCELLED: "CANCELLED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

// =====================================================================
//  EmailStatus
// =====================================================================
export const EmailStatus = {
  QUEUED: "QUEUED",
  SENT: "SENT",
  FAILED: "FAILED",
  BOUNCED: "BOUNCED",
} as const;
export type EmailStatus = (typeof EmailStatus)[keyof typeof EmailStatus];

// =====================================================================
//  AlertType
// =====================================================================
export const AlertType = {
  BOOKING_NEW: "BOOKING_NEW",
  BOOKING_CHECKIN: "BOOKING_CHECKIN",
  BOOKING_CHECKOUT: "BOOKING_CHECKOUT",
  ORDER_PLACED: "ORDER_PLACED",
  ORDER_READY: "ORDER_READY",
  DELIVERY_ASSIGNED: "DELIVERY_ASSIGNED",
  DELIVERY_DELIVERED: "DELIVERY_DELIVERED",
  SERVICE_REQUEST: "SERVICE_REQUEST",
  HOUSEKEEPING_DONE: "HOUSEKEEPING_DONE",
  INVENTORY_LOW: "INVENTORY_LOW",
  PAYMENT_RECEIVED: "PAYMENT_RECEIVED",
  SYSTEM: "SYSTEM",
} as const;
export type AlertType = (typeof AlertType)[keyof typeof AlertType];

// =====================================================================
//  AlertSeverity
// =====================================================================
export const AlertSeverity = {
  INFO: "INFO",
  SUCCESS: "SUCCESS",
  WARNING: "WARNING",
  ERROR: "ERROR",
} as const;
export type AlertSeverity = (typeof AlertSeverity)[keyof typeof AlertSeverity];

// =====================================================================
//  Helpers
// =====================================================================

/**
 * Returns a Tailwind/badge variant for a given status.
 */
export function getStatusVariant(
  status: string
): "default" | "success" | "warning" | "danger" | "info" | "secondary" {
  switch (status) {
    case "AVAILABLE":
    case "COMPLETED":
    case "DELIVERED":
    case "PAID":
    case "SERVED":
      return "success";
    case "OCCUPIED":
    case "CONFIRMED":
    case "PREPARING":
    case "PLACED":
    case "OUT_FOR_DELIVERY":
    case "INFO":
      return "info";
    case "PENDING":
    case "DIRTY":
    case "RESERVED":
    case "WARNING":
    case "IN_PROGRESS":
      return "warning";
    case "CANCELLED":
    case "NO_SHOW":
    case "FAILED":
    case "MAINTENANCE":
    case "ERROR":
      return "danger";
    case "CHECKED_IN":
    case "CHECKED_OUT":
    case "READY":
    case "SUCCESS":
      return "success";
    default:
      return "secondary";
  }
}
