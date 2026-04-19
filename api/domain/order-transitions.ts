export const ORDER_STATUS_VALUES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
  "disputed",
] as const;

export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number];
export type OrderActorRole = "seller" | "buyer" | "admin";

export type TransitionValidationInput = {
  actorRole: OrderActorRole;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
};

export type TransitionValidationResult =
  | { ok: true }
  | {
      ok: false;
      code: "FORBIDDEN" | "BAD_REQUEST";
      reason: string;
      details: {
        actorRole: OrderActorRole;
        fromStatus: OrderStatus;
        toStatus: OrderStatus;
      };
    };

const transitionMap: Record<OrderActorRole, Partial<Record<OrderStatus, readonly OrderStatus[]>>> = {
  seller: {
    confirmed: ["shipped", "cancelled"],
    pending: ["cancelled"],
  },
  buyer: {
    shipped: ["delivered"],
    confirmed: ["cancelled"],
    pending: ["cancelled"],
  },
  admin: {
    disputed: ["confirmed", "cancelled"],
  },
};

export function validateOrderStatusTransition(
  input: TransitionValidationInput,
): TransitionValidationResult {
  const { actorRole, fromStatus, toStatus } = input;

  if (fromStatus === toStatus) {
    return {
      ok: false,
      code: "BAD_REQUEST",
      reason: "Order is already in the requested status",
      details: input,
    };
  }

  if (fromStatus === "disputed" && actorRole !== "admin") {
    return {
      ok: false,
      code: "FORBIDDEN",
      reason: "Only admins can resolve disputed orders",
      details: input,
    };
  }

  const allowedTransitions = transitionMap[actorRole][fromStatus] ?? [];

  if (!allowedTransitions.includes(toStatus)) {
    return {
      ok: false,
      code: "BAD_REQUEST",
      reason: `Invalid status transition for ${actorRole}`,
      details: input,
    };
  }

  return { ok: true };
}
