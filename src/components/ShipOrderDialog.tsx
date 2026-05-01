import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";

type ShipOrderDialogProps = {
  orderId: number;
  varietyName: string;
};

export default function ShipOrderDialog({ orderId, varietyName }: ShipOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [tracking, setTracking] = useState("");
  const utils = trpc.useUtils();

  const updateStatus = trpc.order.updateStatus.useMutation({
    onSuccess: () => {
      utils.order.listSeller.invalidate();
      toast.success("Marked as shipped");
      setOpen(false);
      setTracking("");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = tracking.trim();
    if (!trimmed) {
      toast.error("Tracking number is required");
      return;
    }
    updateStatus.mutate({ orderId, status: "shipped", trackingNumber: trimmed });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-[var(--color-flesh)] text-white rounded-full text-xs">
          Mark as Shipped
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ship {varietyName}</DialogTitle>
          <DialogDescription>
            Enter the carrier tracking number so the buyer can follow the package.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="e.g. USPS 9400 1111 2222 3333 4444 55"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            autoFocus
          />
          <DialogFooter>
            <Button
              type="submit"
              disabled={updateStatus.isPending}
              className="bg-[var(--color-flesh)] hover:bg-[var(--color-flesh)]/90 text-white rounded-full"
            >
              {updateStatus.isPending ? "Updating..." : "Confirm shipment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
