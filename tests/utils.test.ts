import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  nightsBetween,
  generateCode,
  slugify,
  cn,
} from "../src/lib/utils";
import { can, type Permission } from "../src/lib/rbac";
import {
  UserRole,
  getStatusVariant,
  BookingStatus,
  RoomStatus,
  OrderStatus,
} from "../src/lib/enums";

describe("utils", () => {
  describe("formatCurrency", () => {
    it("formats BDT correctly", () => {
      const result = formatCurrency(1234.5);
      expect(result).toContain("1,234.50");
      expect(result).toContain("৳");
    });

    it("formats USD correctly", () => {
      expect(formatCurrency(100, "USD")).toBe("$100.00");
    });

    it("handles zero", () => {
      expect(formatCurrency(0)).toContain("0.00");
    });

    it("handles string input", () => {
      const result = formatCurrency("500.25");
      expect(result).toContain("500.25");
    });

    it("handles invalid input", () => {
      expect(formatCurrency("invalid")).toBe("৳0.00");
    });
  });

  describe("nightsBetween", () => {
    it("calculates 1 night for same day (min)", () => {
      const d = new Date("2026-08-13");
      expect(nightsBetween(d, d)).toBe(1);
    });

    it("calculates correct nights for multi-day stay", () => {
      const a = new Date("2026-08-13");
      const b = new Date("2026-08-16");
      expect(nightsBetween(a, b)).toBe(3);
    });
  });

  describe("generateCode", () => {
    it("generates formatted code", () => {
      const code = generateCode("BK", 1001);
      expect(code).toMatch(/^BK-\d{4}-1001$/);
    });

    it("pads sequence to 4 digits", () => {
      const code = generateCode("ORD", 5);
      expect(code).toMatch(/^ORD-\d{4}-0005$/);
    });
  });

  describe("slugify", () => {
    it("converts to lowercase with hyphens", () => {
      expect(slugify("IHG Dhaka Downtown")).toBe("ihg-dhaka-downtown");
    });

    it("removes special characters", () => {
      expect(slugify("Hello, World!")).toBe("hello-world");
    });

    it("handles multiple spaces", () => {
      expect(slugify("a   b   c")).toBe("a-b-c");
    });
  });

  describe("cn (className merge)", () => {
    it("merges classnames", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("handles falsy values", () => {
      expect(cn("foo", false, null, undefined, "bar")).toBe("foo bar");
    });

    it("deduplicates tailwind classes", () => {
      expect(cn("px-2", "px-4")).toBe("px-4");
    });
  });
});

describe("rbac", () => {
  describe("can()", () => {
    it("SUPER_ADMIN can do anything", () => {
      const permissions: Permission[] = [
        "property:delete",
        "user:create",
        "booking:create",
        "menu:write",
        "audit:view",
      ];
      for (const p of permissions) {
        expect(can(UserRole.SUPER_ADMIN, p)).toBe(true);
      }
    });

    it("returns false for null/undefined role", () => {
      expect(can(null, "booking:read")).toBe(false);
      expect(can(undefined, "booking:read")).toBe(false);
    });

    it("MANAGER can view dashboard and reports", () => {
      expect(can(UserRole.MANAGER, "dashboard:view")).toBe(true);
      expect(can(UserRole.MANAGER, "reports:view")).toBe(true);
    });

    it("RECEPTION can manage bookings but not delete property", () => {
      expect(can(UserRole.RECEPTION, "booking:create")).toBe(true);
      expect(can(UserRole.RECEPTION, "booking:checkin")).toBe(true);
      expect(can(UserRole.RECEPTION, "property:delete")).toBe(false);
      expect(can(UserRole.RECEPTION, "audit:view")).toBe(false);
    });

    it("CUSTOMER can place delivery order but not write menu", () => {
      expect(can(UserRole.CUSTOMER, "order:create")).toBe(true);
      expect(can(UserRole.CUSTOMER, "menu:write")).toBe(false);
      expect(can(UserRole.CUSTOMER, "dashboard:view")).toBe(false);
    });

    it("HOUSEKEEPING can update housekeeping but not bookings", () => {
      expect(can(UserRole.HOUSEKEEPING, "housekeeping:update")).toBe(true);
      expect(can(UserRole.HOUSEKEEPING, "booking:create")).toBe(false);
    });

    it("DELIVERY agent can update delivery status", () => {
      expect(can(UserRole.DELIVERY, "delivery:update")).toBe(true);
      expect(can(UserRole.DELIVERY, "delivery:assign")).toBe(false);
    });
  });
});

describe("enums", () => {
  describe("getStatusVariant", () => {
    it("returns success for completed states", () => {
      expect(getStatusVariant(BookingStatus.CHECKED_IN)).toBe("success");
      expect(getStatusVariant(OrderStatus.DELIVERED)).toBe("success");
    });

    it("returns danger for cancelled states", () => {
      expect(getStatusVariant(BookingStatus.CANCELLED)).toBe("danger");
      expect(getStatusVariant(RoomStatus.MAINTENANCE)).toBe("danger");
    });

    it("returns warning for pending states", () => {
      expect(getStatusVariant(BookingStatus.PENDING)).toBe("warning");
      expect(getStatusVariant(RoomStatus.DIRTY)).toBe("warning");
    });

    it("returns info for in-progress states", () => {
      expect(getStatusVariant(RoomStatus.OCCUPIED)).toBe("info");
      expect(getStatusVariant(OrderStatus.PREPARING)).toBe("info");
    });
  });
});
