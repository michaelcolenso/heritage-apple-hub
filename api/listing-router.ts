import { z } from "zod";
import { eq, and, desc, asc, sql, exists, gte, lte } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { listings, listingShippingZones, varieties, users } from "@db/schema";

function parseShippingZones(raw: string) {
  const parsed = raw
    .split(",")
    .map((zone) => zone.trim())
    .filter(Boolean)
    .map((zone) => Number(zone));

  if (parsed.some((zone) => !Number.isInteger(zone) || zone < 1 || zone > 13)) {
    throw new Error("Invalid shipping zone. Zones must be integers between 1 and 13.");
  }

  return [...new Set(parsed)];
}

export const listingRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(12),
        varietyId: z.number().optional(),
        sellerId: z.number().optional(),
        zone: z.number().min(1).max(13).optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        sortBy: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const { page, limit, varietyId, sellerId, zone, minPrice, maxPrice, sortBy } = input;
      const offset = (page - 1) * limit;

      const conditions = [eq(listings.status, "active")];
      if (varietyId) conditions.push(eq(listings.varietyId, varietyId));
      if (sellerId) conditions.push(eq(listings.sellerId, sellerId));
      if (minPrice !== undefined) conditions.push(gte(listings.pricePerStick, minPrice.toFixed(2)));
      if (maxPrice !== undefined) conditions.push(lte(listings.pricePerStick, maxPrice.toFixed(2)));
      if (zone !== undefined) {
        conditions.push(
          exists(
            db
              .select({ id: listingShippingZones.id })
              .from(listingShippingZones)
              .where(
                and(
                  eq(listingShippingZones.listingId, listings.id),
                  eq(listingShippingZones.zone, zone),
                ),
              ),
          ),
        );
      }

      const whereClause = and(...conditions);

      const orderFn = sortBy === "price_asc" ? asc : sortBy === "price_desc" ? desc : desc;
      const orderCol = sortBy === "price_asc" || sortBy === "price_desc" ? listings.pricePerStick : listings.createdAt;

      const [items, countResult] = await Promise.all([
        db
          .select({
            id: listings.id,
            quantity: listings.quantity,
            pricePerStick: listings.pricePerStick,
            description: listings.description,
            shippingZones: listings.shippingZones,
            status: listings.status,
            harvestDate: listings.harvestDate,
            createdAt: listings.createdAt,
            varietyName: varieties.name,
            varietySlug: varieties.slug,
            varietyImage: varieties.imageUrl,
            sellerName: users.name,
            sellerId: users.id,
            sellerLocation: users.location,
            sellerZone: users.hardinessZone,
            sellerVerified: users.isVerifiedSeller,
          })
          .from(listings)
          .innerJoin(varieties, eq(listings.varietyId, varieties.id))
          .innerJoin(users, eq(listings.sellerId, users.id))
          .where(whereClause)
          .orderBy(orderFn(orderCol))
          .limit(limit)
          .offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(listings).where(whereClause),
      ]);

      const total = Number(countResult[0]?.count ?? 0);

      return {
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select({
          id: listings.id,
          quantity: listings.quantity,
          pricePerStick: listings.pricePerStick,
          description: listings.description,
          shippingZones: listings.shippingZones,
          status: listings.status,
          images: listings.images,
          harvestDate: listings.harvestDate,
          createdAt: listings.createdAt,
          varietyId: listings.varietyId,
          varietyName: varieties.name,
          varietySlug: varieties.slug,
          varietyDescription: varieties.description,
          varietyImage: varieties.imageUrl,
          sellerName: users.name,
          sellerId: users.id,
          sellerLocation: users.location,
          sellerZone: users.hardinessZone,
          sellerVerified: users.isVerifiedSeller,
          sellerBio: users.bio,
        })
        .from(listings)
        .innerJoin(varieties, eq(listings.varietyId, varieties.id))
        .innerJoin(users, eq(listings.sellerId, users.id))
        .where(eq(listings.id, input.id))
        .limit(1);

      return result[0] ?? null;
    }),

  myListings: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select({
        id: listings.id,
        quantity: listings.quantity,
        pricePerStick: listings.pricePerStick,
        description: listings.description,
        shippingZones: listings.shippingZones,
        status: listings.status,
        harvestDate: listings.harvestDate,
        createdAt: listings.createdAt,
        varietyName: varieties.name,
        varietySlug: varieties.slug,
      })
      .from(listings)
      .innerJoin(varieties, eq(listings.varietyId, varieties.id))
      .where(eq(listings.sellerId, ctx.user.id))
      .orderBy(desc(listings.createdAt));
  }),

  create: authedQuery
    .input(
      z.object({
        varietyId: z.number(),
        quantity: z.number().min(1),
        pricePerStick: z.number().min(0.01),
        description: z.string().optional(),
        shippingZones: z.string(),
        harvestDate: z.string().optional(),
        images: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const parsedZones = parseShippingZones(input.shippingZones);
      const normalizedShippingZones = parsedZones.join(",");

      const result = await db.insert(listings).values({
        sellerId: ctx.user.id,
        varietyId: input.varietyId,
        quantity: input.quantity,
        pricePerStick: input.pricePerStick.toFixed(2),
        description: input.description ?? null,
        shippingZones: normalizedShippingZones,
        harvestDate: input.harvestDate ? new Date(input.harvestDate) : null,
        images: input.images ? JSON.stringify(input.images) : null,
        status: "active",
      });
      const listingId = Number(result[0].insertId);
      if (parsedZones.length > 0) {
        await db.insert(listingShippingZones).values(
          parsedZones.map((zone) => ({
            listingId,
            zone,
          })),
        );
      }
      return { id: listingId, success: true };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        quantity: z.number().min(1).optional(),
        pricePerStick: z.number().min(0.01).optional(),
        description: z.string().optional(),
        shippingZones: z.string().optional(),
        status: z.enum(["active", "paused", "sold_out", "draft"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...rest } = input;
      const updateData: Record<string, unknown> = { ...rest };
      if (rest.pricePerStick !== undefined) {
        updateData.pricePerStick = rest.pricePerStick.toFixed(2);
      }
      const parsedZones = rest.shippingZones !== undefined ? parseShippingZones(rest.shippingZones) : null;
      if (parsedZones) {
        updateData.shippingZones = parsedZones.join(",");
      }

      await db
        .update(listings)
        .set(updateData)
        .where(and(eq(listings.id, id), eq(listings.sellerId, ctx.user.id)));

      if (parsedZones) {
        await db.delete(listingShippingZones).where(eq(listingShippingZones.listingId, id));
        if (parsedZones.length > 0) {
          await db.insert(listingShippingZones).values(
            parsedZones.map((zone) => ({
              listingId: id,
              zone,
            })),
          );
        }
      }

      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(listingShippingZones).where(eq(listingShippingZones.listingId, input.id));
      await db
        .delete(listings)
        .where(and(eq(listings.id, input.id), eq(listings.sellerId, ctx.user.id)));
      return { success: true };
    }),
});
