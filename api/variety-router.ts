import { z } from "zod";
import { eq, and, like, gte, lte, sql, desc, asc } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { varieties, listings, users } from "@db/schema";

export const varietyRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(12),
        search: z.string().optional(),
        zone: z.number().min(1).max(13).optional(),
        primaryUse: z.string().optional(),
        isRare: z.boolean().optional(),
        sortBy: z.enum(["popularity", "name", "newest"]).default("popularity"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const { page, limit, search, zone, primaryUse, isRare, sortBy, sortOrder } = input;
      const offset = (page - 1) * limit;

      const conditions = [];
      if (search) {
        conditions.push(like(varieties.name, `%${search}%`));
      }
      if (zone) {
        conditions.push(and(gte(varieties.hardinessZoneMin, zone - 2), lte(varieties.hardinessZoneMax, zone + 2)));
      }
      if (primaryUse) {
        conditions.push(eq(varieties.primaryUse, primaryUse));
      }
      if (isRare !== undefined) {
        conditions.push(eq(varieties.isRare, isRare));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const orderCol = sortBy === "name" ? varieties.name : sortBy === "newest" ? varieties.createdAt : varieties.popularity;
      const orderFn = sortOrder === "asc" ? asc : desc;

      const [items, countResult] = await Promise.all([
        db.select().from(varieties).where(whereClause).orderBy(orderFn(orderCol)).limit(limit).offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(varieties).where(whereClause),
      ]);

      const total = Number(countResult[0]?.count ?? 0);

      return {
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }),

  getBySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const variety = await db.select().from(varieties).where(eq(varieties.slug, input.slug)).limit(1);

      if (!variety[0]) return null;

      const availability = await db
        .select({
          id: listings.id,
          quantity: listings.quantity,
          pricePerStick: listings.pricePerStick,
          description: listings.description,
          shippingZones: listings.shippingZones,
          status: listings.status,
          images: listings.images,
          harvestDate: listings.harvestDate,
          sellerName: users.name,
          sellerId: users.id,
          sellerLocation: users.location,
          sellerZone: users.hardinessZone,
          sellerVerified: users.isVerifiedSeller,
        })
        .from(listings)
        .innerJoin(users, eq(listings.sellerId, users.id))
        .where(and(eq(listings.varietyId, variety[0].id), eq(listings.status, "active")));

      return {
        ...variety[0],
        availability,
      };
    }),

  getFeatured: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(varieties).orderBy(desc(varieties.popularity)).limit(8);
  }),

  search: publicQuery
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(varieties)
        .where(like(varieties.name, `%${input.query}%`))
        .limit(10);
    }),
});
