import { relations } from "drizzle-orm";
import { users, varieties, listings, orders, reviews, cartItems, wishlists, tradeOffers } from "./schema";

// ─── User Relations ─────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  listings: many(listings),
  ordersAsBuyer: many(orders, { relationName: "buyerOrders" }),
  ordersAsSeller: many(orders, { relationName: "sellerOrders" }),
  reviews: many(reviews, { relationName: "sellerReviews" }),
  cartItems: many(cartItems),
  wishlists: many(wishlists),
  tradeOffers: many(tradeOffers),
}));

// ─── Variety Relations ──────────────────────────────────────────
export const varietiesRelations = relations(varieties, ({ many }) => ({
  listings: many(listings),
  wishlists: many(wishlists),
}));

// ─── Listing Relations ──────────────────────────────────────────
export const listingsRelations = relations(listings, ({ one, many }) => ({
  seller: one(users, { fields: [listings.sellerId], references: [users.id] }),
  variety: one(varieties, { fields: [listings.varietyId], references: [varieties.id] }),
  orders: many(orders),
}));

// ─── Order Relations ────────────────────────────────────────────
export const ordersRelations = relations(orders, ({ one }) => ({
  buyer: one(users, { fields: [orders.buyerId], references: [users.id], relationName: "buyerOrders" }),
  seller: one(users, { fields: [orders.sellerId], references: [users.id], relationName: "sellerOrders" }),
  listing: one(listings, { fields: [orders.listingId], references: [listings.id] }),
}));

// ─── Review Relations ───────────────────────────────────────────
export const reviewsRelations = relations(reviews, ({ one }) => ({
  order: one(orders, { fields: [reviews.orderId], references: [orders.id] }),
  reviewer: one(users, { fields: [reviews.reviewerId], references: [users.id] }),
  seller: one(users, { fields: [reviews.sellerId], references: [users.id], relationName: "sellerReviews" }),
}));

// ─── Cart Item Relations ────────────────────────────────────────
export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, { fields: [cartItems.userId], references: [users.id] }),
  listing: one(listings, { fields: [cartItems.listingId], references: [listings.id] }),
}));

// ─── Wishlist Relations ─────────────────────────────────────────
export const wishlistsRelations = relations(wishlists, ({ one }) => ({
  user: one(users, { fields: [wishlists.userId], references: [users.id] }),
  variety: one(varieties, { fields: [wishlists.varietyId], references: [varieties.id] }),
}));

// ─── Trade Offer Relations ──────────────────────────────────────
export const tradeOffersRelations = relations(tradeOffers, ({ one }) => ({
  offerer: one(users, { fields: [tradeOffers.offererId], references: [users.id] }),
  offererVariety: one(varieties, { fields: [tradeOffers.offererVarietyId], references: [varieties.id] }),
  targetVariety: one(varieties, { fields: [tradeOffers.targetVarietyId], references: [varieties.id] }),
}));
