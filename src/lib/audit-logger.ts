import { prisma } from "./prisma";
import { eventBus, type AppEvent, type EventType } from "./event-bus";

async function onAnyEvent(event: AppEvent) {
  await prisma.auditLog.create({
    data: {
      userId: event.metadata?.userId || null,
      action: event.type,
      entity: deriveEntity(event.type),
      // An explicit entityId names the record the event is about (e.g. a quotation); otherwise infer it.
      entityId: (event.data?.entityId || event.data?.bookingId || event.data?.leadId || event.data?.paymentId) as string || null,
      metadata: JSON.stringify({
        event,
        data: event.data,
      }),
      branchId: event.metadata?.branchId || null,
    },
  });
}

function deriveEntity(type: string): string {
  if (type.startsWith("BOOKING") || type.startsWith("TRIP")) return "Booking";
  if (type.startsWith("LEAD")) return "Lead";
  if (type.startsWith("QUOTATION")) return "Quotation";
  if (type.startsWith("PAYMENT") || type.startsWith("INVOICE")) return "Finance";
  if (type.startsWith("VEHICLE") || type.startsWith("MAINTENANCE")) return "Vehicle";
  if (type.startsWith("DRIVER")) return "Driver";
  return "System";
}

export function initAuditLogger() {
  const eventTypes: EventType[] = [
    "BOOKING_CREATED", "BOOKING_STATUS_CHANGED", "BOOKING_CANCELLED",
    "LEAD_CREATED", "LEAD_STATUS_CHANGED",
    "QUOTATION_CREATED", "QUOTATION_APPROVED", "QUOTATION_REJECTED",
    "VEHICLE_ASSIGNED", "DRIVER_ASSIGNED",
    "DISPATCH_FINALIZED",
    "TRIP_STARTED", "TRIP_COMPLETED",
    "PAYMENT_RECEIVED", "INVOICE_GENERATED",
    "MAINTENANCE_SCHEDULED", "REMINDER_DUE",
  ];
  for (const type of eventTypes) {
    eventBus.subscribe(type, onAnyEvent);
  }
}
