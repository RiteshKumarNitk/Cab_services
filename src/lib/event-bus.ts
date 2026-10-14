export type EventType =
  | "BOOKING_CREATED"
  | "BOOKING_STATUS_CHANGED"
  | "BOOKING_CANCELLED"
  | "LEAD_CREATED"
  | "LEAD_STATUS_CHANGED"
  | "QUOTATION_CREATED"
  | "QUOTATION_APPROVED"
  | "QUOTATION_REJECTED"
  | "VEHICLE_ASSIGNED"
  | "DRIVER_ASSIGNED"
  | "DISPATCH_FINALIZED"
  | "TRIP_STARTED"
  | "TRIP_COMPLETED"
  | "PAYMENT_RECEIVED"
  | "INVOICE_GENERATED"
  | "INVOICE_SKIPPED"
  | "SETTLEMENTS_CALCULATED"
  | "MAINTENANCE_SCHEDULED"
  | "REMINDER_DUE";

export interface AppEvent {
  type: EventType;
  timestamp: Date;
  data: Record<string, unknown>;
  metadata?: {
    userId?: string;
    organizationId?: string;
    branchId?: string;
    correlationId?: string;
  };
}

type EventHandler = (event: AppEvent) => Promise<void>;

class EventBus {
  private handlers: Map<EventType, Set<EventHandler>> = new Map();
  private history: AppEvent[] = [];
  private maxHistory = 1000;

  subscribe(eventType: EventType, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  async emit(event: AppEvent): Promise<void> {
    // Subscribers (notifications, audit log, webhooks) register themselves on first use.
    // Previously initEventSystem() was never called, so no subscriber ever ran.
    await ensureSubscribers();

    this.history.push(event);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    const handlers = this.handlers.get(event.type);
    if (!handlers) return;

    const promises: Promise<void>[] = [];
    for (const handler of handlers) {
      promises.push(handler(event).catch((err) => {
        console.error(`[EventBus] Handler failed for ${event.type}:`, err);
      }));
    }

    await Promise.allSettled(promises);
  }

  getHistory(eventType?: EventType, limit = 50): AppEvent[] {
    if (eventType) {
      return this.history.filter((e) => e.type === eventType).slice(-limit);
    }
    return this.history.slice(-limit);
  }

  getRecentByEntity(entityId: string, limit = 20): AppEvent[] {
    return this.history
      .filter((e) => e.data?.entityId === entityId || e.data?.bookingId === entityId || e.data?.leadId === entityId)
      .slice(-limit);
  }
}

let subscribersReady: Promise<void> | null = null;

function ensureSubscribers(): Promise<void> {
  // Dynamic import breaks the static cycle event-bus -> event-init -> notifications -> event-bus.
  subscribersReady ??= import("./event-init")
    .then((m) => m.initEventSystem())
    .catch((err) => {
      subscribersReady = null;
      console.error("[EventBus] Failed to initialize subscribers:", err);
    });
  return subscribersReady;
}

export const eventBus = new EventBus();

export function createEvent(
  type: EventType,
  data: Record<string, unknown>,
  metadata?: AppEvent["metadata"]
): AppEvent {
  return {
    type,
    timestamp: new Date(),
    data,
    metadata: {
      ...metadata,
      correlationId: metadata?.correlationId || crypto.randomUUID(),
    },
  };
}
