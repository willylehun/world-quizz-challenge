import { env } from "cloudflare:workers";
import { buildPushPayload, type PushSubscription, type VapidKeys } from "@block65/webcrypto-web-push";
import { getRawDb } from "@/db";

type SubscriptionRow = { endpoint: string; p256dh: string; auth: string };

export async function sendGameNotification(profileId: string, title: string, body: string, url = "/game.html") {
  if (!env.VAPID_SUBJECT || !env.VAPID_SERVER_PUBLIC_KEY || !env.VAPID_SERVER_PRIVATE_KEY) return;
  const db = getRawDb();
  const rows = await db.prepare("SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE profile_id = ?")
    .bind(profileId).all<SubscriptionRow>();
  const vapid: VapidKeys = {
    subject: env.VAPID_SUBJECT,
    publicKey: env.VAPID_SERVER_PUBLIC_KEY,
    privateKey: env.VAPID_SERVER_PRIVATE_KEY,
  };
  await Promise.all((rows.results || []).map(async (row) => {
    const subscription: PushSubscription = {
      endpoint: row.endpoint,
      expirationTime: null,
      keys: { p256dh: row.p256dh, auth: row.auth },
    };
    try {
      const payload = await buildPushPayload({
        data: JSON.stringify({ title, body, url }),
        options: { ttl: 60 * 60 * 24 },
      }, subscription, vapid);
      const response = await fetch(subscription.endpoint, payload);
      if (response.status === 404 || response.status === 410) {
        await db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").bind(row.endpoint).run();
      }
    } catch (error) {
      console.error("WQC push notification failed", error);
    }
  }));
}
