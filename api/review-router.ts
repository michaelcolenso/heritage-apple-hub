import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { reviews, users } from "@db/schema";
import { createTrpcError, ErrorCode } from "./lib/errors";

export const reviewRouter = createRouter({
  list: publicQuery
    .input(z.object({ sellerId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          comment: reviews.comment,
          createdAt: reviews.createdAt,
          reviewerName: users.name,
        })
        .from(reviews)
        .innerJoin(users, eq(reviews.reviewerId, users.id))
        .where(eq(reviews.sellerId, input.sellerId))
        .orderBy(desc(reviews.createdAt));
    }),

  create: authedQuery
    .input(
      z.object({
        orderId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { orders } = await import("@db/schema");

      const order = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);

      if (!order[0]) {
        throw createTrpcError({
          code: "NOT_FOUND",
          message: "Order not found.",
          stableErrorCode: ErrorCode.notFound,
        });
      }
      if (order[0].buyerId !== ctx.user.id) {
        throw createTrpcError({
          code: "FORBIDDEN",
          message: "You can only review your own orders.",
          stableErrorCode: ErrorCode.forbidden,
        });
      }
      if (order[0].status !== "delivered") {
        throw createTrpcError({
          code: "BAD_REQUEST",
          message: "Only delivered orders can be reviewed.",
          stableErrorCode: ErrorCode.badRequest,
        });
      }

      const existing = await db
        .select()
        .from(reviews)
        .where(eq(reviews.orderId, input.orderId))
        .limit(1);

      if (existing[0]) {
        throw createTrpcError({
          code: "CONFLICT",
          message: "A review for this order already exists.",
          stableErrorCode: ErrorCode.conflict,
        });
      }

      await db.insert(reviews).values({
        orderId: input.orderId,
        reviewerId: ctx.user.id,
        sellerId: order[0].sellerId,
        rating: input.rating,
        comment: input.comment ?? null,
      });

      return { success: true };
    }),

  getStats: publicQuery
    .input(z.object({ sellerId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select({
          avgRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
          totalReviews: sql<number>`COUNT(*)`,
        })
        .from(reviews)
        .where(eq(reviews.sellerId, input.sellerId));

      return {
        avgRating: Math.round(Number(result[0].avgRating) * 10) / 10,
        totalReviews: Number(result[0].totalReviews),
      };
    }),
});
