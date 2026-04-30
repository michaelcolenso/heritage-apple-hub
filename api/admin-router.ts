import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, sql, or } from "drizzle-orm";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, varieties, orders, listings } from "@db/schema";
import { getStripe, isStripeConfigured } from "./lib/stripe";

const varietyInput = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  originYear: z.number().int().optional(),
  originCountry: z.string().max(100).optional(),
  description: z.string().optional(),
  flavorProfile: z.string().max(255).optional(),
  primaryUse: z.string().max(50).optional(),
  skinColor: z.string().max(100).optional(),
  fleshColor: z.string().max(100).optional(),
  diseaseResistance: z.string().max(255).optional(),
  hardinessZoneMin: z.number().int().min(1).max(13).optional(),
  hardinessZoneMax: z.number().int().min(1).max(13).optional(),
  parentage: z.string().max(255).optional(),
  imageUrl: z.string().max(500).optional(),
  popularity: z.number().int().min(0).optional(),
  isRare: z.boolean().optional(),
});

export const adminRouter = createRouter({
  listSellers: adminQuery
    .input(z.object({ pendingOnly: z.boolean().optional() }))
    .query(async ({ input }) => {
      const db = getDb();
      const where = input.pendingOnly
        ? eq(users.sellerVerificationRequested, true)
        : or(
            eq(users.sellerVerificationRequested, true),
            eq(users.isVerifiedSeller, true),
          );
      return db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          location: users.location,
          bio: users.bio,
          isVerifiedSeller: users.isVerifiedSeller,
          sellerVerificationRequested: users.sellerVerificationRequested,
          stripeChargesEnabled: users.stripeChargesEnabled,
          stripePayoutsEnabled: users.stripePayoutsEnabled,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt));
    }),

  setSellerVerified: adminQuery
    .input(z.object({ userId: z.number(), verified: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(users)
        .set({
          isVerifiedSeller: input.verified,
          sellerVerificationRequested: input.verified ? false : sql`${users.sellerVerificationRequested}`,
        })
        .where(eq(users.id, input.userId));
      return { success: true };
    }),

  listDisputedOrders: adminQuery.query(async () => {
    const db = getDb();
    return db
      .select({
        id: orders.id,
        varietyName: orders.varietyName,
        quantity: orders.quantity,
        totalAmount: orders.totalAmount,
        status: orders.status,
        stripePaymentIntent: orders.stripePaymentIntent,
        buyerId: orders.buyerId,
        sellerId: orders.sellerId,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.status, "disputed"))
      .orderBy(desc(orders.createdAt));
  }),

  resolveDispute: adminQuery
    .input(
      z.object({
        orderId: z.number(),
        action: z.enum(["refund", "release"]),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const target = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1);

      const order = target[0];
      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      if (input.action === "refund") {
        if (isStripeConfigured() && order.stripePaymentIntent) {
          const stripe = getStripe();
          await stripe.refunds.create({ payment_intent: order.stripePaymentIntent });
        }
        await db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, input.orderId));
        await db
          .update(listings)
          .set({ quantity: sql`${listings.quantity} + ${order.quantity}` })
          .where(eq(listings.id, order.listingId));
      } else {
        await db.update(orders).set({ status: "delivered" }).where(eq(orders.id, input.orderId));
      }
      return { success: true };
    }),

  varietyCreate: adminQuery.input(varietyInput).mutation(async ({ input }) => {
    const db = getDb();
    const existing = await db.select().from(varieties).where(eq(varieties.slug, input.slug)).limit(1);
    if (existing[0]) {
      throw new TRPCError({ code: "CONFLICT", message: "A variety with that slug already exists" });
    }
    const result = await db.insert(varieties).values(input);
    return { id: Number(result[0].insertId), success: true };
  }),

  varietyUpdate: adminQuery
    .input(varietyInput.partial().extend({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...rest } = input;
      if (rest.slug) {
        const conflict = await db
          .select()
          .from(varieties)
          .where(eq(varieties.slug, rest.slug))
          .limit(1);
        if (conflict[0] && conflict[0].id !== id) {
          throw new TRPCError({ code: "CONFLICT", message: "A variety with that slug already exists" });
        }
      }
      await db.update(varieties).set(rest).where(eq(varieties.id, id));
      return { success: true };
    }),

  varietyDelete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const dependent = await db
        .select({ count: sql<number>`count(*)` })
        .from(listings)
        .where(eq(listings.varietyId, input.id));
      if (Number(dependent[0]?.count ?? 0) > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Cannot delete a variety while listings reference it",
        });
      }
      await db.delete(varieties).where(eq(varieties.id, input.id));
      return { success: true };
    }),
});
