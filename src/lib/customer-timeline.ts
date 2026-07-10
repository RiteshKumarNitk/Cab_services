import { prisma } from "./prisma";

export interface TimelineEntry {
  label: string;
  status: string;
  order: number;
  timestamp: Date | null;
  completed: boolean;
  active: boolean;
}

const CUSTOMER_MAP: Record<string, { label: string; order: number }> = {
  NEW_LEAD: { label: "Inquiry Submitted", order: 1 },
  QUALIFIED: { label: "Being Reviewed", order: 2 },
  CONTACTED: { label: "Being Reviewed", order: 2 },
  QUOTE_PREPARING: { label: "Quotation Being Prepared", order: 3 },
  QUOTE_SENT: { label: "Quotation Sent", order: 4 },
  QUOTE_ACCEPTED: { label: "Waiting for Approval", order: 5 },
  BOOKING_CONFIRMED: { label: "Booking Confirmed", order: 6 },
  WAITING_ASSIGNMENT: { label: "Booking Confirmed", order: 6 },
  VEHICLE_ASSIGNED: { label: "Vehicle Assigned", order: 7 },
  DRIVER_ASSIGNED: { label: "Driver Assigned", order: 8 },
  READY_FOR_DISPATCH: { label: "Trip Ready", order: 9 },
  TRIP_STARTED: { label: "Trip Started", order: 10 },
  PICKUP_COMPLETED: { label: "In Progress", order: 11 },
  DROP_COMPLETED: { label: "In Progress", order: 11 },
  TRIP_COMPLETED: { label: "Trip Completed", order: 12 },
  INVOICE_GENERATED: { label: "Trip Completed", order: 12 },
  CLOSED: { label: "Completed", order: 13 },
  CANCELLED: { label: "Cancelled", order: 99 },
};

const UNIQUE_TIMELINE = [
  { label: "Request Submitted", order: 1 },
  { label: "Being Reviewed", order: 2 },
  { label: "Quotation Being Prepared", order: 3 },
  { label: "Quotation Sent", order: 4 },
  { label: "Waiting for Approval", order: 5 },
  { label: "Booking Confirmed", order: 6 },
  { label: "Vehicle Assigned", order: 7 },
  { label: "Driver Assigned", order: 8 },
  { label: "Trip Ready", order: 9 },
  { label: "Trip Started", order: 10 },
  { label: "In Progress", order: 11 },
  { label: "Trip Completed", order: 12 },
  { label: "Cancelled", order: 99 },
];

export function getCustomerTimeline(bookingStatus: string): TimelineEntry[] {
  const currentMapping = CUSTOMER_MAP[bookingStatus];
  if (!currentMapping) {
    return [{ label: "Unknown", status: bookingStatus, order: 0, timestamp: null, completed: false, active: false }];
  }

  const currentOrder = currentMapping.order;

  return UNIQUE_TIMELINE.map((step) => {
    const completed = step.order < currentOrder;
    const active = step.order === currentOrder;

    return {
      label: step.label,
      status: bookingStatus,
      order: step.order,
      timestamp: null,
      completed: completed || active && bookingStatus !== "CANCELLED",
      active: active,
    };
  });
}

export function getCustomerFacingStatus(status: string): string {
  return CUSTOMER_MAP[status]?.label || status;
}

export async function getBookingWithTimeline(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      driver: { select: { id: true, name: true, phone: true } },
      vehicle: { select: { id: true, name: true, plateNumber: true } },
    },
  });
  if (!booking) return null;

  return {
    ...booking,
    customerFacingStatus: getCustomerFacingStatus(booking.status),
    timeline: getCustomerTimeline(booking.status),
  };
}
