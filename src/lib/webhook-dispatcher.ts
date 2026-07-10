import { prisma } from "./prisma";
import { eventBus, type AppEvent, type EventType } from "./event-bus";

async function dispatchWebhooks(event: AppEvent) {
  const webhooks = await prisma.webhook.findMany({
    where: { isActive: true },
  });

  for (const webhook of webhooks) {
    const subscribedEvents: EventType[] = JSON.parse(webhook.events || "[]");
    if (subscribedEvents.length > 0 && !subscribedEvents.includes(event.type)) continue;

    try {
      const payload = JSON.stringify({
        event: event.type,
        timestamp: event.timestamp,
        data: event.data,
      });

      const signature = webhook.secret
        ? await createSignature(payload, webhook.secret)
        : undefined;

      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(signature ? { "X-Webhook-Signature": signature } : {}),
          "X-Event-Type": event.type,
        },
        body: payload,
      });

      if (response.ok) {
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: { lastTriggeredAt: new Date(), failureCount: 0 },
        });
      } else {
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: { failureCount: { increment: 1 } },
        });
      }
    } catch (err) {
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: { failureCount: { increment: 1 } },
      });
      console.error(`[Webhook] Failed to dispatch to ${webhook.url}:`, err);
    }
  }
}

async function createSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function initWebhookDispatcher() {
  eventBus.subscribe("BOOKING_STATUS_CHANGED", dispatchWebhooks);
  eventBus.subscribe("BOOKING_CREATED", dispatchWebhooks);
  eventBus.subscribe("PAYMENT_RECEIVED", dispatchWebhooks);
  eventBus.subscribe("INVOICE_GENERATED", dispatchWebhooks);
  eventBus.subscribe("BOOKING_CANCELLED", dispatchWebhooks);
  eventBus.subscribe("TRIP_STARTED", dispatchWebhooks);
  eventBus.subscribe("TRIP_COMPLETED", dispatchWebhooks);
}
