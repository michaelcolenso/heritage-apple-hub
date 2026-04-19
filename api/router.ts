import { authRouter } from "./auth-router";
import { varietyRouter } from "./variety-router";
import { listingRouter } from "./listing-router";
import { cartRouter } from "./cart-router";
import { orderRouter } from "./order-router";
import { reviewRouter } from "./review-router";
import { userRouter } from "./user-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  variety: varietyRouter,
  listing: listingRouter,
  cart: cartRouter,
  order: orderRouter,
  review: reviewRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
