import { prisma } from "./prisma";
import { eventBus, type AppEvent } from "./event-bus";

export async function createNotification(input: {
  userId: string; title: string; body: string; data?: Record<string, unknown>;
}) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      channel: "PUSH",
      title: input.title,
      body: input.body,
      data: JSON.stringify(input.data ?? {}),
      status: "PENDING",
    },
  });
}

export async function markNotificationRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { status: "READ", readAt: new Date() },
  });
}

export async function getUserNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, status: { not: "READ" } },
  });
}

async function onBookingEvent(event: AppEvent) {
  const bookingId = event.data.bookingId as string;
  if (!bookingId) return;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: { select: { id: true, name: true } },
      driver: { select: { id: true, name: true } },
    },
  });
  if (!booking) return;

  const notifications: Array<{
    userId: string; channel: string; title: string; body: string; data: string; status: string;
  }> = [];

  switch (event.type) {
    case "BOOKING_STATUS_CHANGED": {
      const status = event.data.newStatus as string;
      switch (status) {
        case "BOOKING_CONFIRMED":
          if (booking.driverId) {
            notifications.push({
              userId: booking.driverId, channel: "PUSH", status: "PENDING",
              title: "Booking Confirmed",
              body: `Booking #${bookingId.slice(0, 8)} confirmed. Check your schedule.`,
              data: JSON.stringify({ bookingId, type: "booking_confirmed" }),
            });
          }
          break;
        case "VEHICLE_ASSIGNED":
          if (booking.customerId) {
            notifications.push({
              userId: booking.customerId, channel: "PUSH", status: "PENDING",
              title: "Vehicle Assigned",
              body: "A vehicle has been assigned to your trip.",
              data: JSON.stringify({ bookingId, type: "vehicle_assigned" }),
            });
          }
          break;
        case "DRIVER_ASSIGNED":
          if (booking.customerId) {
            notifications.push({
              userId: booking.customerId, channel: "PUSH", status: "PENDING",
              title: "Driver Assigned",
              body: "A driver has been assigned to your trip.",
              data: JSON.stringify({ bookingId, type: "driver_assigned" }),
            });
          }
          break;
        case "READY_FOR_DISPATCH":
          if (booking.customerId) {
            notifications.push({
              userId: booking.customerId, channel: "PUSH", status: "PENDING",
              title: "Trip Ready",
              body: "Your trip is ready. Driver will arrive shortly.",
              data: JSON.stringify({ bookingId, type: "trip_ready" }),
            });
          }
          break;
        case "TRIP_STARTED":
          if (booking.customerId) {
            notifications.push({
              userId: booking.customerId, channel: "PUSH", status: "PENDING",
              title: "Trip Started",
              body: "Your trip has started. Safe travels!",
              data: JSON.stringify({ bookingId, type: "trip_started" }),
            });
          }
          break;
        case "TRIP_COMPLETED":
          if (booking.customerId) {
            notifications.push({
              userId: booking.customerId, channel: "PUSH", status: "PENDING",
              title: "Trip Completed",
              body: "Trip completed. Please rate your driver!",
              data: JSON.stringify({ bookingId, type: "trip_completed" }),
            });
          }
          if (booking.driverId) {
            notifications.push({
              userId: booking.driverId, channel: "PUSH", status: "PENDING",
              title: "Trip Completed",
              body: "Trip marked as completed.",
              data: JSON.stringify({ bookingId, type: "trip_completed_driver" }),
            });
          }
          break;
        case "CANCELLED": {
          if (booking.customerId) {
            notifications.push({
              userId: booking.customerId, channel: "PUSH", status: "PENDING",
              title: "Booking Cancelled",
              body: "Your booking has been cancelled.",
              data: JSON.stringify({ bookingId, type: "booking_cancelled" }),
            });
          }
          if (booking.driverId) {
            notifications.push({
              userId: booking.driverId, channel: "PUSH", status: "PENDING",
              title: "Booking Cancelled",
              body: "A booking was cancelled.",
              data: JSON.stringify({ bookingId, type: "booking_cancelled" }),
            });
          }
          break;
        }
      }
      break;
    }
  }

  if (notifications.length > 0) {
    await prisma.notification.createMany({ data: notifications as never[] });
  }
}

async function onPaymentEvent(event: AppEvent) {
  const bookingId = event.data.bookingId as string;
  const customerId = event.data.customerId as string;
  if (!customerId) return;

  await createNotification({
    userId: customerId,
    title: "Payment Received",
    body: `Payment of ₹${event.data.amount || 0} received for booking ${(bookingId || "").slice(0, 8)}`,
    data: { bookingId, type: "payment_received" },
  });
}

async function onMaintenanceEvent(event: AppEvent) {
  const vehicleId = event.data.vehicleId as string;
  if (vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { plateNumber: true, driverId: true } });
    if (vehicle?.driverId) {
      await createNotification({
        userId: vehicle.driverId,
        title: "Vehicle Maintenance",
        body: `Vehicle ${vehicle.plateNumber} has scheduled maintenance.`,
        data: { vehicleId, type: "maintenance_scheduled" },
      });
    }
  }
}

export function initNotificationSubscribers() {
  eventBus.subscribe("BOOKING_STATUS_CHANGED", onBookingEvent);
  eventBus.subscribe("PAYMENT_RECEIVED", onPaymentEvent);
  eventBus.subscribe("MAINTENANCE_SCHEDULED", onMaintenanceEvent);
}
