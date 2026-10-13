// Role groups. These mirror the role lists already used across the API routes
// (see docs/PROJECT_STATUS.md, "Role mapping") so behaviour stays consistent.
// Kept free of imports so pure modules and tests can use it.

export const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];
export const OPS_ROLES = ["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER", "FLEET_MANAGER", "DRIVER_MANAGER"];
export const CRM_ROLES = ["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER", "SUPPORT_EXECUTIVE"];
export const FINANCE_ROLES = ["SUPER_ADMIN", "ADMIN", "FINANCE"];
// Read-only access to finance data (permission matrix: Ops Mgr has R on payments/invoices/settlements)
export const FINANCE_READ_ROLES = [...FINANCE_ROLES, "BOOKING_MANAGER"];
// Any back-office employee (excludes CUSTOMER and DRIVER)
export const STAFF_ROLES = [
  "SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER", "BOOKING_MANAGER", "FLEET_MANAGER",
  "DRIVER_MANAGER", "SUPPORT_EXECUTIVE", "FINANCE",
];

export function hasRole(role: string | undefined | null, roles: readonly string[]): boolean {
  return !!role && roles.includes(role);
}
