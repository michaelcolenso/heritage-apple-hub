import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { orders, listings, users, varieties, orderIdempotencyKeys, reviews } from "@db/schema";
import { cartItems } from "@db/schema";
import {
  ORDER_STATUS_VALUES,
  type OrderActorRole,
  validateOrderStatusTransition,
} from "./domain/order-transitions";

const CreateOrderErrorCode = {
  stockConflict: "ORDER_STOCK_CONFLICT",
  partialSelection: "ORDER_PARTIAL_CART_SELECTION_INVALID",
  emptySelection: "ORDER_EMPTY_SELECTION",
  idempotencyInProgress: "ORDER_IDEMPOTENCY_IN_PROGRESS",
  idempotencyKeyMismatch: "ORDER_IDEMPOTENCY_KEY_MISMATCH",
} as const;

function normalizeCartItemIds(ids: number[]): number[] {
  return [...new Set(ids)].sort((a, b) => a - b);
}

function buildIdempotencyFingerprint(shippingAddress: string, cartItemIds: number[]): string {
  return JSON.stringify({ shippingAddress, cartItemIds });
}

function extractInsertId(result: unknown): number {
  if (
    Array.isArray(result) &&
    typeof result[0] === "object" &&
    result[0] !== null &&
    "insertId" in result[0]
  ) {
    return Number((result[0] as { insertId: number | string }).insertId);
  }
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "ORDER_INSERT_FAILED",
  });
}

function extractAffectedRows(result: unknown): number {
  if (
    Array.isArray(result) &&
    typeof result[0] === "object" &&
    result[0] !== null &&
    "affectedRows" in result[0]
  ) {
    return Number((result[0] as { affectedRows: number | string }).affectedRows);
  }
  return 0;
}

export const orderRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select({
        id: orders.id,
        varietyName: orders.varietyName,
        quantity: orders.quantity,
        pricePerStick: orders.pricePerStick,
        totalAmount: orders.totalAmount,
        status: orders.status,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        sellerName: users.name,
        sellerId: users.id,
        hasReview: sql<boolean>`EXISTS(SELECT 1 FROM ${reviews} WHERE ${reviews.orderId} = ${orders.id})`,
      })
      .from(orders)
      .innerJoin(users, eq(orders.sellerId, users.id))
      .where(eq(orders.buyerId, ctx.user.id))
      .orderBy(desc(orders.createdAt));
  }),

  listSeller: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select({
        id: orders.id,
        varietyName: orders.varietyName,
        quantity: orders.quantity,
        pricePerStick: orders.pricePerStick,
        totalAmount: orders.totalAmount,
        sellerPayout: orders.sellerPayout,
        status: orders.status,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        shippingAddress: orders.shippingAddress,
        trackingNumber: orders.trackingNumber,
        buyerName: users.name,
        buyerId: users.id,
      })
      .from(orders)
      .innerJoin(users, eq(orders.buyerId, users.id))
      .where(eq(orders.sellerId, ctx.user.id))
      .orderBy(desc(orders.createdAt));
  }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db
        .select({
          id: orders.id,
          varietyName: orders.varietyName,
          quantity: orders.quantity,
          pricePerStick: orders.pricePerStick,
          totalAmount: orders.totalAmount,
          platformFee: orders.platformFee,
          sellerPayout: orders.sellerPayout,
          status: orders.status,
          shippingAddress: orders.shippingAddress,
          trackingNumber: orders.trackingNumber,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
          buyerId: orders.buyerId,
          sellerId: orders.sellerId,
        })
        .from(orders)
        .where(eq(orders.id, input.id))
        .limit(1);

      if (!result[0]) return null;
      const order = result[0];

      if (order.buyerId !== ctx.user.id && order.sellerId !== ctx.user.id) {
        return null;
      }

      const buyer = await db.select().from(users).where(eq(users.id, order.buyerId)).limit(1);
      const seller = await db.select().from(users).where(eq(users.id, order.sellerId)).limit(1);

      return { ...order, buyer: buyer[0], seller: seller[0] };
    }),

  create: authedQuery
    .input(
      z.object({
        shippingAddress: z.string(),
        cartItemIds: z.array(z.number()),
        idempotencyKey: z.string().trim().min(8).max(120).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const selectedCartItemIds = normalizeCartItemIds(input.cartItemIds);

      if (selectedCartItemIds.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: CreateOrderErrorCode.emptySelection,
        });
      }

      const headerKey =
        ctx.req.headers.get("x-idempotency-key") ??
        ctx.req.headers.get("idempotency-key") ??
        undefined;
      const idempotencyKey = input.idempotencyKey ?? headerKey;
      const requestFingerprint = buildIdempotencyFingerprint(
        input.shippingAddress,
        selectedCartItemIds,
      );

      return db.transaction(async (tx) => {
        if (idempotencyKey) {
          const existingKeyRows = await tx
            .select()
            .from(orderIdempotencyKeys)
            .where(
              and(
                eq(orderIdempotencyKeys.buyerId, ctx.user.id),
                eq(orderIdempotencyKeys.key, idempotencyKey),
              ),
            )
            .limit(1);

          const existingKey = existingKeyRows[0];
          if (existingKey) {
            if (existingKey.requestFingerprint !== requestFingerprint) {
              throw new TRPCError({
                code: "CONFLICT",
                message: CreateOrderErrorCode.idempotencyKeyMismatch,
              });
            }

            if (Array.isArray(existingKey.orderIds)) {
              return { success: true, orderIds: existingKey.orderIds.map((id) => Number(id)) };
            }

            throw new TRPCError({
              code: "CONFLICT",
              message: CreateOrderErrorCode.idempotencyInProgress,
            });
          }

          await tx.insert(orderIdempotencyKeys).values({
            buyerId: ctx.user.id,
            key: idempotencyKey,
            requestFingerprint,
            orderIds: null,
          });
        }

        const toPurchase = await tx
          .select({
            id: cartItems.id,
            listingId: cartItems.listingId,
            cartQuantity: cartItems.quantity,
            listingQuantity: listings.quantity,
            pricePerStick: listings.pricePerStick,
            sellerId: listings.sellerId,
            varietyName: varieties.name,
          })
          .from(cartItems)
          .innerJoin(listings, eq(cartItems.listingId, listings.id))
          .innerJoin(varieties, eq(listings.varietyId, varieties.id))
          .where(
            and(
              eq(cartItems.userId, ctx.user.id),
              inArray(cartItems.id, selectedCartItemIds),
            ),
          );

        if (toPurchase.length !== selectedCartItemIds.length) {
          const foundIds = new Set(toPurchase.map((item) => item.id));
          const invalidIds = selectedCartItemIds.filter((id) => !foundIds.has(id));
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `${CreateOrderErrorCode.partialSelection}:${invalidIds.join(",")}`,
          });
        }

        const createdOrders: number[] = [];

        for (const item of toPurchase) {
          if (item.cartQuantity > item.listingQuantity) {
            throw new TRPCError({
              code: "CONFLICT",
              message: `${CreateOrderErrorCode.stockConflict}:${item.listingId}`,
            });
          }

          const price = parseFloat(item.pricePerStick);
          const total = price * item.cartQuantity;
          const platformFee = total * 0.15;
          const sellerPayout = total - platformFee;

          const insertResult = await tx.insert(orders).values({
            buyerId: ctx.user.id,
            sellerId: item.sellerId,
            listingId: item.listingId,
            varietyName: item.varietyName,
            quantity: item.cartQuantity,
            pricePerStick: item.pricePerStick,
            totalAmount: total.toFixed(2),
            platformFee: platformFee.toFixed(2),
            sellerPayout: sellerPayout.toFixed(2),
            status: "pending",
            shippingAddress: input.shippingAddress,
          });

          const updateResult = await tx
            .update(listings)
            .set({ quantity: sql`${listings.quantity} - ${item.cartQuantity}` })
            .where(
              and(
                eq(listings.id, item.listingId),
                sql`${listings.quantity} >= ${item.cartQuantity}`,
              ),
            );

          if (extractAffectedRows(updateResult) !== 1) {
            throw new TRPCError({
              code: "CONFLICT",
              message: `${CreateOrderErrorCode.stockConflict}:${item.listingId}`,
            });
          }

          createdOrders.push(extractInsertId(insertResult));
        }

        await tx
          .delete(cartItems)
          .where(
            and(
              eq(cartItems.userId, ctx.user.id),
              inArray(cartItems.id, selectedCartItemIds),
            ),
          );

        if (idempotencyKey) {
          await tx
            .update(orderIdempotencyKeys)
            .set({ orderIds: createdOrders })
            .where(
              and(
                eq(orderIdempotencyKeys.buyerId, ctx.user.id),
                eq(orderIdempotencyKeys.key, idempotencyKey),
              ),
            );
        }

        return { success: true, orderIds: createdOrders };
      });
    }),

  updateStatus: authedQuery
    .input(
      z.object({
        orderId: z.number(),
        status: z.enum(ORDER_STATUS_VALUES),
        trackingNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const order = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);

      if (!order[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      const isSeller = order[0].sellerId === ctx.user.id;
      const isBuyer = order[0].buyerId === ctx.user.id;
      const isAdmin = ctx.user.role === "admin";

      if (!isSeller && !isBuyer && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not allowed to update this order",
          cause: {
            orderId: input.orderId,
            userId: ctx.user.id,
            role: ctx.user.role,
          },
        });
      }

      const actorRole: OrderActorRole = isAdmin && !isSeller && !isBuyer
        ? "admin"
        : isSeller
          ? "seller"
          : "buyer";

      const validation = validateOrderStatusTransition({
        actorRole,
        fromStatus: order[0].status ?? "pending",
        toStatus: input.status,
      });

      if (!validation.ok) {
        throw new TRPCError({
          code: validation.code,
          message: validation.reason,
          cause: validation.details,
        });
      }

      if (input.status === "shipped" && !input.trackingNumber) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tracking number is required when marking an order as shipped",
          cause: {
            actorRole,
            orderId: input.orderId,
            toStatus: input.status,
          },
        });
      }

      const updateData: Record<string, unknown> = { status: input.status };
      if (input.trackingNumber) updateData.trackingNumber = input.trackingNumber;

      await db.update(orders).set(updateData).where(eq(orders.id, input.orderId));
      return { success: true };
    }),
});
