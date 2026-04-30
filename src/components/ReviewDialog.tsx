import { useState } from "react";
import { Star } from "lucide-react";
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
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";

type ReviewDialogProps = {
  orderId: number;
  varietyName: string;
};

export default function ReviewDialog({ orderId, varietyName }: ReviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const utils = trpc.useUtils();

  const create = trpc.review.create.useMutation({
    onSuccess: () => {
      utils.order.list.invalidate();
      toast.success("Thanks for the review!");
      setOpen(false);
      setRating(0);
      setComment("");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) {
      toast.error("Please select a rating");
      return;
    }
    create.mutate({ orderId, rating, comment: comment.trim() || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-sm text-[var(--color-flesh)] hover:underline">
          Leave a review →
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review {varietyName}</DialogTitle>
          <DialogDescription>Share how this seller did with your order.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => {
              const filled = (hover || rating) >= n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  className="p-1"
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      filled ? "fill-amber-400 text-amber-400" : "text-[var(--color-sage)]"
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How were the scions? Did they graft well?"
            className="w-full h-28 rounded-lg border border-[var(--color-sage-light)] bg-[var(--color-bone)] px-3 py-2 text-sm resize-none"
            maxLength={1000}
          />
          <DialogFooter>
            <Button
              type="submit"
              disabled={create.isPending}
              className="bg-[var(--color-flesh)] hover:bg-[var(--color-flesh)]/90 text-white rounded-full"
            >
              {create.isPending ? "Submitting..." : "Submit review"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
