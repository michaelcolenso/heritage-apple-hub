import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { orders, listings, users, varieties } from "@db/schema";
import { cartItems } from "@db/schema";

const normalizeShippingAddress = (value: string) =>
  value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .join(", ");

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
        shippingAddress: z
          .string()
          .trim()
          .min(10, "Shipping address is required")
          .max(300)
          .transform(normalizeShippingAddress)
          .refine((value) => value.length > 0, "Shipping address is required"),
        cartItemIds: z.array(z.number()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const cartItemsData = await db
        .select({
          id: cartItems.id,
          listingId: cartItems.listingId,
          cartQuantity: cartItems.quantity,
          listingQuantity: listings.quantity,
          pricePerStick: listings.pricePerStick,
          sellerId: listings.sellerId,
          varietyId: listings.varietyId,
        })
        .from(cartItems)
        .innerJoin(listings, eq(cartItems.listingId, listings.id))
        .where(and(eq(cartItems.userId, ctx.user.id)));

      const toPurchase = cartItemsData.filter((ci) => input.cartItemIds.includes(ci.id));

      if (toPurchase.length === 0) {
        throw new Error("No valid cart items selected");
      }

      const createdOrders = [];
      for (const item of toPurchase) {
        if (item.cartQuantity > item.listingQuantity) {
          throw new Error(`Only ${item.listingQuantity} sticks available for one of your selections`);
        }

        const variety = await db.select().from(varieties).where(eq(varieties.id, item.varietyId)).limit(1);
        const varietyName = variety[0]?.name ?? "Unknown";
        const price = parseFloat(item.pricePerStick);
        const total = price * item.cartQuantity;
        const platformFee = total * 0.15;
        const sellerPayout = total - platformFee;

        const result = await db.insert(orders).values({
          buyerId: ctx.user.id,
          sellerId: item.sellerId,
          listingId: item.listingId,
          varietyName,
          quantity: item.cartQuantity,
          pricePerStick: item.pricePerStick,
          totalAmount: total.toFixed(2),
          platformFee: platformFee.toFixed(2),
          sellerPayout: sellerPayout.toFixed(2),
          status: "confirmed",
          shippingAddress: input.shippingAddress,
        });

        await db
          .update(listings)
          .set({ quantity: item.listingQuantity - item.cartQuantity })
          .where(eq(listings.id, item.listingId));

        createdOrders.push(Number(result[0].insertId));
      }

      await db.delete(cartItems).where(eq(cartItems.userId, ctx.user.id));

      return { success: true, orderIds: createdOrders };
    }),

  updateStatus: authedQuery
    .input(
      z.object({
        orderId: z.number(),
        status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled", "disputed"]),
        trackingNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const order = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);

      if (!order[0]) throw new Error("Order not found");
      if (order[0].sellerId !== ctx.user.id && order[0].buyerId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      const updateData: Record<string, unknown> = { status: input.status };
      if (input.trackingNumber) updateData.trackingNumber = input.trackingNumber;

      await db.update(orders).set(updateData).where(eq(orders.id, input.orderId));
      return { success: true };
    }),
});
