export const ORDER_STATUS_FLOW = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled", "disputed"],
  shipped: ["delivered", "disputed"],
  delivered: [],
  cancelled: [],
  disputed: [],
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS_FLOW;

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus) {
  return (ORDER_STATUS_FLOW[from] as readonly OrderStatus[]).includes(to);
}
