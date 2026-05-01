import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, inArray } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { orders, users } from "@db/schema";
import { getStripe, isStripeConfigured } from "./lib/stripe";
import { env } from "./lib/env";

function ensureConfigured() {
  if (!isStripeConfigured()) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Payments are not configured on this server",
    });
  }
}

export const paymentRouter = createRouter({
  createCheckoutSession: authedQuery
    .input(z.object({ orderIds: z.array(z.number()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      ensureConfigured();
      const db = getDb();

      const myOrders = await db
        .select()
        .from(orders)
        .where(
          and(
            inArray(orders.id, input.orderIds),
            eq(orders.buyerId, ctx.user.id),
          ),
        );

      if (myOrders.length !== input.orderIds.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Some orders are not yours or do not exist",
        });
      }

      if (myOrders.some((o) => o.status !== "pending")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only pending orders can be paid",
        });
      }

      const stripe = getStripe();

      const lineItems = myOrders.map((o) => ({
        quantity: o.quantity,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(parseFloat(o.pricePerStick) * 100),
          product_data: {
            name: `${o.varietyName} (scion wood)`,
          },
        },
      }));

      const transferGroup = `order_group_${myOrders.map((o) => o.id).sort((a, b) => a - b).join("-")}`;

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: lineItems,
        success_url: `${env.appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.appUrl}/checkout/cancel?session_id={CHECKOUT_SESSION_ID}`,
        client_reference_id: String(ctx.user.id),
        metadata: {
          orderIds: myOrders.map((o) => o.id).join(","),
          buyerId: String(ctx.user.id),
        },
        payment_intent_data: {
          transfer_group: transferGroup,
          metadata: {
            orderIds: myOrders.map((o) => o.id).join(","),
            buyerId: String(ctx.user.id),
          },
        },
      });

      return { url: session.url, sessionId: session.id };
    }),

  createConnectOnboardingLink: authedQuery.mutation(async ({ ctx }) => {
    ensureConfigured();
    const db = getDb();
    const stripe = getStripe();

    let accountId = ctx.user.stripeConnectId;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: ctx.user.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { userId: String(ctx.user.id) },
      });
      accountId = account.id;
      await db
        .update(users)
        .set({ stripeConnectId: accountId })
        .where(eq(users.id, ctx.user.id));
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${env.appUrl}/dashboard/payments?refresh=1`,
      return_url: `${env.appUrl}/dashboard/payments?return=1`,
      type: "account_onboarding",
    });

    return { url: link.url };
  }),

  getConnectStatus: authedQuery.query(async ({ ctx }) => {
    if (!ctx.user.stripeConnectId) {
      return {
        connected: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
      };
    }
    if (!isStripeConfigured()) {
      return {
        connected: true,
        chargesEnabled: ctx.user.stripeChargesEnabled ?? false,
        payoutsEnabled: ctx.user.stripePayoutsEnabled ?? false,
        detailsSubmitted: false,
      };
    }
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(ctx.user.stripeConnectId);

    const db = getDb();
    await db
      .update(users)
      .set({
        stripeChargesEnabled: !!account.charges_enabled,
        stripePayoutsEnabled: !!account.payouts_enabled,
      })
      .where(eq(users.id, ctx.user.id));

    return {
      connected: true,
      chargesEnabled: !!account.charges_enabled,
      payoutsEnabled: !!account.payouts_enabled,
      detailsSubmitted: !!account.details_submitted,
    };
  }),
});
