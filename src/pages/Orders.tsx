import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Package, Truck, CheckCircle, Clock, AlertCircle, CreditCard } from "lucide-react";
import Footer from "@/sections/Footer";
import ReviewDialog from "@/components/ReviewDialog";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; icon: typeof Package; color: string }> = {
  pending: { label: "Pending", icon: Clock, color: "text-amber-600 bg-amber-50" },
  confirmed: { label: "Confirmed", icon: CheckCircle, color: "text-blue-600 bg-blue-50" },
  shipped: { label: "Shipped", icon: Truck, color: "text-purple-600 bg-purple-50" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "text-green-600 bg-green-50" },
  cancelled: { label: "Cancelled", icon: AlertCircle, color: "text-red-600 bg-red-50" },
  disputed: { label: "Disputed", icon: AlertCircle, color: "text-red-600 bg-red-50" },
};

export default function Orders() {
  const { data: orders, isLoading } = trpc.order.list.useQuery();
  const resumePayment = trpc.payment.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data?.url) window.location.assign(data.url);
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="min-h-screen bg-[var(--color-bone)] pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-display text-3xl text-[var(--color-bark)] mb-8">Your Orders</h1>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-16 bg-[var(--color-surface-solid)] rounded-2xl">
            <Package className="w-10 h-10 text-[var(--color-sage)] mx-auto mb-3" />
            <h2 className="font-display text-xl text-[var(--color-bark)] mb-2">No orders yet</h2>
            <p className="text-[var(--color-bark-warm)] mb-4">
              Start exploring varieties and place your first order.
            </p>
            <Link
              to="/varieties"
              className="inline-flex items-center px-6 py-2.5 rounded-full bg-[var(--color-flesh)] text-white text-sm font-medium hover:bg-[var(--color-flesh)]/90 transition-colors"
            >
              Browse Varieties
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = order.status ?? "pending";
              const config = statusConfig[status] ?? statusConfig.pending;
              const StatusIcon = config.icon;
              return (
                <div
                  key={order.id}
                  className="bg-[var(--color-surface-solid)] rounded-2xl p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-lg text-[var(--color-bark)]">
                          {order.varietyName}
                        </h3>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${config.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--color-bark-warm)]">
                        {order.quantity} sticks × ${order.pricePerStick} from {order.sellerName}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-mono text-lg font-medium text-[var(--color-bark)]">
                        ${Number(order.totalAmount).toFixed(2)}
                      </p>
                      <p className="text-xs text-[var(--color-bark-warm)]">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ""}
                      </p>
                    </div>
                  </div>

                  {status === "pending" && (
                    <div className="flex items-center gap-3 pt-1">
                      <Button
                        size="sm"
                        onClick={() => resumePayment.mutate({ orderIds: [order.id] })}
                        disabled={resumePayment.isPending}
                        className="bg-[var(--color-flesh)] hover:bg-[var(--color-flesh)]/90 text-white rounded-full"
                      >
                        <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                        {resumePayment.isPending ? "Redirecting..." : "Pay now"}
                      </Button>
                      <p className="text-xs text-[var(--color-sage)]">
                        Awaiting payment — finish checkout to confirm your order.
                      </p>
                    </div>
                  )}
                  {status === "delivered" && !order.hasReview && (
                    <ReviewDialog orderId={order.id} varietyName={order.varietyName} />
                  )}
                  {status === "delivered" && order.hasReview && (
                    <p className="text-sm text-[var(--color-sage)]">Reviewed · thanks!</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
