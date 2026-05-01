import type { Context } from "hono";
import { eq, inArray, and, sql } from "drizzle-orm";
import Stripe from "stripe";
import { getStripe, isStripeConfigured } from "../lib/stripe";
import { env } from "../lib/env";
import { getDb } from "../queries/connection";
import { orders, listings, users, orderIdempotencyKeys } from "@db/schema";

function parseOrderIds(metadata: Stripe.Metadata | null): number[] {
  const raw = metadata?.orderIds;
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
}

async function markOrdersConfirmed(orderIds: number[], paymentIntentId: string) {
  const db = getDb();
  await db
    .update(orders)
    .set({ status: "confirmed", stripePaymentIntent: paymentIntentId })
    .where(and(inArray(orders.id, orderIds), eq(orders.status, "pending")));

  const stripe = getStripe();
  const confirmed = await db
    .select()
    .from(orders)
    .where(inArray(orders.id, orderIds));

  for (const order of confirmed) {
    if (order.status !== "confirmed") continue;
    const seller = await db.select().from(users).where(eq(users.id, order.sellerId)).limit(1);
    const destination = seller[0]?.stripeConnectId;
    if (!destination) {
      // Buyer was charged but the seller has no Connect account. Throwing returns
      // non-2xx so Stripe retries (up to ~3 days), giving the seller a window to
      // complete onboarding. listing.create now blocks unconnected sellers, so
      // this should only fire for legacy listings; admins can resolve persistent
      // failures via the dispute flow.
      throw new Error(
        `Seller ${order.sellerId} has no stripeConnectId; cannot transfer payout for order ${order.id}`,
      );
    }
    // Stripe may deliver checkout.session.completed and payment_intent.succeeded
    // for the same payment, and retries any non-2xx webhook. The idempotency key
    // ensures a duplicate event returns the existing transfer rather than paying
    // the seller a second time. Errors are intentionally not caught: a failed
    // transfer should bubble up so the webhook returns non-2xx and Stripe retries.
    await stripe.transfers.create(
      {
        amount: Math.round(parseFloat(order.sellerPayout) * 100),
        currency: "usd",
        destination,
        transfer_group: `order_group_${orderIds.sort((a, b) => a - b).join("-")}`,
        metadata: { orderId: String(order.id) },
      },
      { idempotencyKey: `transfer_order_${order.id}_${paymentIntentId}` },
    );
  }
}

async function cancelAndRestockOrders(orderIds: number[]) {
  const db = getDb();
  const targets = await db
    .select()
    .from(orders)
    .where(and(inArray(orders.id, orderIds), eq(orders.status, "pending")));

  if (targets.length === 0) return;

  await db
    .update(orders)
    .set({ status: "cancelled" })
    .where(and(inArray(orders.id, orderIds), eq(orders.status, "pending")));

  for (const order of targets) {
    await db
      .update(listings)
      .set({ quantity: sql`${listings.quantity} + ${order.quantity}` })
      .where(eq(listings.id, order.listingId));
  }

  const buyerIds = [...new Set(targets.map((o) => o.buyerId))];
  for (const buyerId of buyerIds) {
    await db
      .delete(orderIdempotencyKeys)
      .where(eq(orderIdempotencyKeys.buyerId, buyerId));
  }
}

export async function handleStripeWebhook(c: Context): Promise<Response> {
  if (!isStripeConfigured()) {
    return c.json({ error: "stripe_not_configured" }, 503);
  }
  if (!env.stripe.webhookSecret) {
    return c.json({ error: "webhook_secret_missing" }, 503);
  }

  const signature = c.req.header("stripe-signature");
  if (!signature) {
    return c.json({ error: "missing_signature" }, 400);
  }

  const rawBody = await c.req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.stripe.webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return c.json({ error: "invalid_signature" }, 400);
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "payment_intent.succeeded": {
      const intent =
        event.type === "payment_intent.succeeded"
          ? (event.data.object as Stripe.PaymentIntent)
          : null;

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status !== "paid") break;
        const ids = parseOrderIds(session.metadata);
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? "";
        if (ids.length > 0 && paymentIntentId) {
          await markOrdersConfirmed(ids, paymentIntentId);
        }
      } else if (intent) {
        const ids = parseOrderIds(intent.metadata);
        if (ids.length > 0) {
          await markOrdersConfirmed(ids, intent.id);
        }
      }
      break;
    }

    case "checkout.session.expired":
    case "payment_intent.payment_failed":
    case "payment_intent.canceled": {
      let ids: number[] = [];
      if (event.type === "checkout.session.expired") {
        const session = event.data.object as Stripe.Checkout.Session;
        ids = parseOrderIds(session.metadata);
      } else {
        const intent = event.data.object as Stripe.PaymentIntent;
        ids = parseOrderIds(intent.metadata);
      }
      if (ids.length > 0) {
        await cancelAndRestockOrders(ids);
      }
      break;
    }

    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      const userIdMeta = account.metadata?.userId;
      if (userIdMeta) {
        const db = getDb();
        await db
          .update(users)
          .set({
            stripeChargesEnabled: !!account.charges_enabled,
            stripePayoutsEnabled: !!account.payouts_enabled,
          })
          .where(eq(users.id, Number(userIdMeta)));
      }
      break;
    }

    default:
      break;
  }

  return c.json({ received: true });
}
