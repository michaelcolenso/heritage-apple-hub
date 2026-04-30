import Stripe from "stripe";
import { env } from "./env";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!env.stripe.secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!client) {
    client = new Stripe(env.stripe.secretKey, {
      apiVersion: "2025-08-27.basil",
      typescript: true,
    });
  }
  return client;
}

export function isStripeConfigured(): boolean {
  return Boolean(env.stripe.secretKey);
}
