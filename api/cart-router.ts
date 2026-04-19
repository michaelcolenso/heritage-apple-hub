import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { cartItems, listings, varieties, users } from "@db/schema";

export const cartRouter = createRouter({
  get: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select({
        id: cartItems.id,
        quantity: cartItems.quantity,
        listingId: cartItems.listingId,
        pricePerStick: listings.pricePerStick,
        varietyName: varieties.name,
        varietySlug: varieties.slug,
        sellerName: users.name,
        sellerId: users.id,
        available: listings.quantity,
      })
      .from(cartItems)
      .innerJoin(listings, eq(cartItems.listingId, listings.id))
      .innerJoin(varieties, eq(listings.varietyId, varieties.id))
      .innerJoin(users, eq(listings.sellerId, users.id))
      .where(eq(cartItems.userId, ctx.user.id))
      .orderBy(cartItems.createdAt);
  }),

  add: authedQuery
    .input(
      z.object({
        listingId: z.number(),
        quantity: z.number().min(1).default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const existing = await db
        .select()
        .from(cartItems)
        .where(and(eq(cartItems.userId, ctx.user.id), eq(cartItems.listingId, input.listingId)))
        .limit(1);

      if (existing[0]) {
        await db
          .update(cartItems)
          .set({ quantity: existing[0].quantity + input.quantity })
          .where(eq(cartItems.id, existing[0].id));
      } else {
        await db.insert(cartItems).values({
          userId: ctx.user.id,
          listingId: input.listingId,
          quantity: input.quantity,
        });
      }

      return { success: true };
    }),

  update: authedQuery
    .input(
      z.object({
        cartItemId: z.number(),
        quantity: z.number().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(cartItems)
        .set({ quantity: input.quantity })
        .where(and(eq(cartItems.id, input.cartItemId), eq(cartItems.userId, ctx.user.id)));
      return { success: true };
    }),

  remove: authedQuery
    .input(z.object({ cartItemId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(cartItems)
        .where(and(eq(cartItems.id, input.cartItemId), eq(cartItems.userId, ctx.user.id)));
      return { success: true };
    }),

  clear: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    await db.delete(cartItems).where(eq(cartItems.userId, ctx.user.id));
    return { success: true };
  }),
});
