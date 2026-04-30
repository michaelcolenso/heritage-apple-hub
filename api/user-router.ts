import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, listings, orders, reviews } from "@db/schema";
import { sql } from "drizzle-orm";

export const userRouter = createRouter({
  me: authedQuery.query(async ({ ctx }) => {
    return ctx.user;
  }),

  update: authedQuery
    .input(
      z.object({
        name: z.string().optional(),
        bio: z.string().optional(),
        location: z.string().optional(),
        hardinessZone: z.number().min(1).max(13).optional(),
        avatar: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.update(users).set(input).where(eq(users.id, ctx.user.id));
      return { success: true };
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const user = await db.select().from(users).where(eq(users.id, input.id)).limit(1);
      if (!user[0]) return null;

      const activeListings = await db
        .select({ count: sql<number>`count(*)` })
        .from(listings)
        .where(eq(listings.sellerId, input.id));

      const reviewStats = await db
        .select({
          avgRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
          totalReviews: sql<number>`COUNT(*)`,
        })
        .from(reviews)
        .where(eq(reviews.sellerId, input.id));

      const { unionId, stripeConnectId, ...publicUser } = user[0];
      void unionId;
      void stripeConnectId;

      return {
        ...publicUser,
        listingCount: Number(activeListings[0]?.count ?? 0),
        avgRating: Math.round(Number(reviewStats[0]?.avgRating ?? 0) * 10) / 10,
        totalReviews: Number(reviewStats[0]?.totalReviews ?? 0),
      };
    }),

  listSellers: publicQuery.query(async () => {
    const db = getDb();
    const sellers = await db
      .select()
      .from(users)
      .where(eq(users.isVerifiedSeller, true))
      .orderBy(desc(users.createdAt));

    const sellersWithStats = await Promise.all(
      sellers.map(async (seller) => {
        const reviewStats = await db
          .select({
            avgRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
            totalReviews: sql<number>`COUNT(*)`,
          })
          .from(reviews)
          .where(eq(reviews.sellerId, seller.id));

        const listingCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(listings)
          .where(eq(listings.sellerId, seller.id));

        const { unionId, stripeConnectId, ...publicSeller } = seller;
        void unionId;
        void stripeConnectId;

        return {
          ...publicSeller,
          avgRating: Math.round(Number(reviewStats[0]?.avgRating ?? 0) * 10) / 10,
          totalReviews: Number(reviewStats[0]?.totalReviews ?? 0),
          listingCount: Number(listingCount[0]?.count ?? 0),
        };
      })
    );

    return sellersWithStats;
  }),

  requestSellerVerification: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    await db
      .update(users)
      .set({ sellerVerificationRequested: true })
      .where(eq(users.id, ctx.user.id));
    return { success: true };
  }),

  dashboard: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    const myListings = await db
      .select({ count: sql<number>`count(*)` })
      .from(listings)
      .where(eq(listings.sellerId, userId));

    const myOrdersAsSeller = await db
      .select({
        count: sql<number>`count(*)`,
        revenue: sql<number>`COALESCE(SUM(${orders.sellerPayout}), 0)`,
      })
      .from(orders)
      .where(eq(orders.sellerId, userId));

    const myOrdersAsBuyer = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.buyerId, userId));

    const pendingOrders = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(sql`${orders.sellerId} = ${userId} AND ${orders.status} IN ('pending', 'confirmed')`);

    return {
      listings: Number(myListings[0]?.count ?? 0),
      salesRevenue: Math.round(Number(myOrdersAsSeller[0]?.revenue ?? 0) * 100) / 100,
      salesCount: Number(myOrdersAsSeller[0]?.count ?? 0),
      purchases: Number(myOrdersAsBuyer[0]?.count ?? 0),
      pendingOrders: Number(pendingOrders[0]?.count ?? 0),
    };
  }),
});
