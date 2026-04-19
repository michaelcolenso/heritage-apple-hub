import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  int,
  decimal,
  boolean,
  json,
  date,
  bigint,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// ─── Users ──────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  hardinessZone: int("hardinessZone"),
  location: varchar("location", { length: 100 }),
  bio: text("bio"),
  isVerifiedSeller: boolean("isVerifiedSeller").default(false),
  stripeConnectId: varchar("stripeConnectId", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

// ─── Varieties ──────────────────────────────────────────────────
export const varieties = mysqlTable("varieties", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  originYear: int("originYear"),
  originCountry: varchar("originCountry", { length: 100 }),
  description: text("description"),
  flavorProfile: varchar("flavorProfile", { length: 255 }),
  primaryUse: varchar("primaryUse", { length: 50 }),
  skinColor: varchar("skinColor", { length: 100 }),
  fleshColor: varchar("fleshColor", { length: 100 }),
  diseaseResistance: varchar("diseaseResistance", { length: 255 }),
  hardinessZoneMin: int("hardinessZoneMin"),
  hardinessZoneMax: int("hardinessZoneMax"),
  parentage: varchar("parentage", { length: 255 }),
  imageUrl: varchar("imageUrl", { length: 500 }),
  popularity: int("popularity").default(0),
  isRare: boolean("isRare").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_variety_slug").on(table.slug),
  index("idx_variety_use").on(table.primaryUse),
  index("idx_variety_zone_min").on(table.hardinessZoneMin),
  index("idx_variety_zone_max").on(table.hardinessZoneMax),
  index("idx_variety_rare").on(table.isRare),
]);

// ─── Listings ───────────────────────────────────────────────────
export const listings = mysqlTable("listings", {
  id: serial("id").primaryKey(),
  sellerId: bigint("sellerId", { mode: "number", unsigned: true }).notNull(),
  varietyId: bigint("varietyId", { mode: "number", unsigned: true }).notNull(),
  quantity: int("quantity").notNull(),
  pricePerStick: decimal("pricePerStick", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  shippingZones: varchar("shippingZones", { length: 255 }),
  status: mysqlEnum("status", ["active", "paused", "sold_out", "draft"]).default("active"),
  images: json("images"),
  harvestDate: date("harvestDate"),
  expiresAt: date("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  index("idx_listing_seller").on(table.sellerId),
  index("idx_listing_variety").on(table.varietyId),
  index("idx_listing_status").on(table.status),
  index("idx_listing_price").on(table.pricePerStick),
]);

export const listingShippingZones = mysqlTable("listing_shipping_zones", {
  id: serial("id").primaryKey(),
  listingId: bigint("listingId", { mode: "number", unsigned: true }).notNull(),
  zone: int("zone").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_lsz_listing").on(table.listingId),
  index("idx_lsz_zone").on(table.zone),
  uniqueIndex("idx_lsz_listing_zone").on(table.listingId, table.zone),
]);

// ─── Orders ─────────────────────────────────────────────────────
export const orders = mysqlTable("orders", {
  id: serial("id").primaryKey(),
  buyerId: bigint("buyerId", { mode: "number", unsigned: true }).notNull(),
  sellerId: bigint("sellerId", { mode: "number", unsigned: true }).notNull(),
  listingId: bigint("listingId", { mode: "number", unsigned: true }).notNull(),
  varietyName: varchar("varietyName", { length: 100 }).notNull(),
  quantity: int("quantity").notNull(),
  pricePerStick: decimal("pricePerStick", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platformFee", { precision: 10, scale: 2 }).notNull(),
  sellerPayout: decimal("sellerPayout", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "shipped", "delivered", "cancelled", "disputed"]).default("pending"),
  shippingAddress: text("shippingAddress"),
  trackingNumber: varchar("trackingNumber", { length: 100 }),
  stripePaymentIntent: varchar("stripePaymentIntent", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  index("idx_order_buyer").on(table.buyerId),
  index("idx_order_seller").on(table.sellerId),
  index("idx_order_listing").on(table.listingId),
  index("idx_order_status").on(table.status),
]);

export const orderIdempotencyKeys = mysqlTable("order_idempotency_keys", {
  id: serial("id").primaryKey(),
  buyerId: bigint("buyerId", { mode: "number", unsigned: true }).notNull(),
  key: varchar("key", { length: 120 }).notNull(),
  requestFingerprint: varchar("requestFingerprint", { length: 500 }).notNull(),
  orderIds: json("orderIds"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("idx_order_idempotency_buyer_key").on(table.buyerId, table.key),
]);

// ─── Reviews ────────────────────────────────────────────────────
export const reviews = mysqlTable("reviews", {
  id: serial("id").primaryKey(),
  orderId: bigint("orderId", { mode: "number", unsigned: true }).notNull(),
  reviewerId: bigint("reviewerId", { mode: "number", unsigned: true }).notNull(),
  sellerId: bigint("sellerId", { mode: "number", unsigned: true }).notNull(),
  rating: int("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_review_seller").on(table.sellerId),
  index("idx_review_order").on(table.orderId),
]);

// ─── Cart Items ─────────────────────────────────────────────────
export const cartItems = mysqlTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  listingId: bigint("listingId", { mode: "number", unsigned: true }).notNull(),
  quantity: int("quantity").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("idx_cart_user_listing").on(table.userId, table.listingId),
]);

// ─── Wishlists ──────────────────────────────────────────────────
export const wishlists = mysqlTable("wishlists", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  varietyId: bigint("varietyId", { mode: "number", unsigned: true }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("idx_wishlist_user_variety").on(table.userId, table.varietyId),
]);

// ─── Trade Offers ───────────────────────────────────────────────
export const tradeOffers = mysqlTable("trade_offers", {
  id: serial("id").primaryKey(),
  offererId: bigint("offererId", { mode: "number", unsigned: true }).notNull(),
  offererVarietyId: bigint("offererVarietyId", { mode: "number", unsigned: true }).notNull(),
  offererQuantity: int("offererQuantity").notNull(),
  targetVarietyId: bigint("targetVarietyId", { mode: "number", unsigned: true }).notNull(),
  targetQuantity: int("targetQuantity").notNull(),
  status: mysqlEnum("status", ["open", "accepted", "completed", "cancelled"]).default("open"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Types ──────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Variety = typeof varieties.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type Wishlist = typeof wishlists.$inferSelect;
export type TradeOffer = typeof tradeOffers.$inferSelect;
