import { initNotificationSubscribers } from "./notifications";
import { initAuditLogger } from "./audit-logger";
import { initWebhookDispatcher } from "./webhook-dispatcher";

let initialized = false;

export function initEventSystem() {
  if (initialized) return;
  initialized = true;

  initNotificationSubscribers();
  initAuditLogger();
  initWebhookDispatcher();
  console.log("[EventBus] All subscribers initialized (notifications, audit, webhooks)");
}
