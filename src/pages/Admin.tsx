import { useState } from "react";
import { Link, Routes, Route, useLocation } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, Apple, AlertTriangle, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import Footer from "@/sections/Footer";

function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navItems = [
    { icon: Users, label: "Sellers", to: "/admin/sellers" },
    { icon: Apple, label: "Varieties", to: "/admin/varieties" },
    { icon: AlertTriangle, label: "Disputes", to: "/admin/disputes" },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bone)] pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-display text-3xl text-[var(--color-bark)] mb-6">Admin</h1>
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-56 shrink-0">
            <div className="lg:sticky lg:top-24 bg-[var(--color-surface-solid)] rounded-2xl p-3">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[var(--color-flesh)]/10 text-[var(--color-flesh)]"
                        : "text-[var(--color-bark-warm)] hover:bg-[var(--color-bone)]"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </aside>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function AdminSellers() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.listSellers.useQuery({ pendingOnly: false });
  const setVerified = trpc.admin.setSellerVerified.useMutation({
    onSuccess: () => {
      utils.admin.listSellers.invalidate();
      toast.success("Seller updated");
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <Skeleton className="h-64 rounded-2xl" />;

  return (
    <div className="space-y-3">
      <h2 className="font-display text-2xl text-[var(--color-bark)] mb-4">Sellers</h2>
      {!data || data.length === 0 ? (
        <p className="text-[var(--color-bark-warm)]">No sellers yet.</p>
      ) : (
        data.map((seller) => (
          <div key={seller.id} className="bg-[var(--color-surface-solid)] rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium text-[var(--color-bark)] truncate">{seller.name ?? `User #${seller.id}`}</p>
              <p className="text-xs text-[var(--color-bark-warm)] truncate">{seller.email}</p>
              <p className="text-xs text-[var(--color-sage)]">
                {seller.location ?? "—"} · payouts {seller.stripePayoutsEnabled ? "on" : "off"}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {seller.isVerifiedSeller ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setVerified.mutate({ userId: seller.id, verified: false })}
                  disabled={setVerified.isPending}
                >
                  Revoke
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setVerified.mutate({ userId: seller.id, verified: true })}
                  disabled={setVerified.isPending}
                  className="bg-[var(--color-flesh)] hover:bg-[var(--color-flesh)]/90 text-white rounded-full"
                >
                  Verify
                </Button>
              )}
              {seller.sellerVerificationRequested && !seller.isVerifiedSeller && (
                <span className="text-[10px] font-mono uppercase bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                  Requested
                </span>
              )}
              {seller.isVerifiedSeller && (
                <span className="text-[10px] font-mono uppercase bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                  Verified
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

type VarietyForm = {
  name: string;
  slug: string;
  description: string;
  primaryUse: string;
  hardinessZoneMin: string;
  hardinessZoneMax: string;
  isRare: boolean;
  imageUrl: string;
};

const emptyForm: VarietyForm = {
  name: "",
  slug: "",
  description: "",
  primaryUse: "",
  hardinessZoneMin: "",
  hardinessZoneMax: "",
  isRare: false,
  imageUrl: "",
};

function AdminVarieties() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.variety.list.useQuery({ page: 1, limit: 100 });
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<VarietyForm>(emptyForm);

  const createVariety = trpc.admin.varietyCreate.useMutation({
    onSuccess: () => {
      utils.variety.list.invalidate();
      setOpen(false);
      setForm(emptyForm);
      toast.success("Variety created");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateVariety = trpc.admin.varietyUpdate.useMutation({
    onSuccess: () => {
      utils.variety.list.invalidate();
      setOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      toast.success("Variety updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteVariety = trpc.admin.varietyDelete.useMutation({
    onSuccess: () => {
      utils.variety.list.invalidate();
      toast.success("Variety deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const startEdit = (id: number) => {
    const v = data?.items.find((item) => item.id === id);
    if (!v) return;
    setEditingId(id);
    setForm({
      name: v.name ?? "",
      slug: v.slug ?? "",
      description: v.description ?? "",
      primaryUse: v.primaryUse ?? "",
      hardinessZoneMin: v.hardinessZoneMin ? String(v.hardinessZoneMin) : "",
      hardinessZoneMax: v.hardinessZoneMax ? String(v.hardinessZoneMax) : "",
      isRare: !!v.isRare,
      imageUrl: v.imageUrl ?? "",
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || undefined,
      primaryUse: form.primaryUse || undefined,
      hardinessZoneMin: form.hardinessZoneMin ? Number(form.hardinessZoneMin) : undefined,
      hardinessZoneMax: form.hardinessZoneMax ? Number(form.hardinessZoneMax) : undefined,
      isRare: form.isRare,
      imageUrl: form.imageUrl || undefined,
    };
    if (editingId !== null) {
      updateVariety.mutate({ id: editingId, ...payload });
    } else {
      createVariety.mutate(payload);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl text-[var(--color-bark)]">Varieties</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={startCreate} className="bg-[var(--color-flesh)] hover:bg-[var(--color-flesh)]/90 text-white rounded-full">
              <Plus className="w-4 h-4 mr-1" /> New variety
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit variety" : "Create variety"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <Input
                  placeholder="slug-like-this"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  required
                />
              </div>
              <Input
                placeholder="Primary use (Fresh Eating, Cider, ...)"
                value={form.primaryUse}
                onChange={(e) => setForm({ ...form, primaryUse: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Zone min"
                  min={1}
                  max={13}
                  value={form.hardinessZoneMin}
                  onChange={(e) => setForm({ ...form, hardinessZoneMin: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Zone max"
                  min={1}
                  max={13}
                  value={form.hardinessZoneMax}
                  onChange={(e) => setForm({ ...form, hardinessZoneMax: e.target.value })}
                />
              </div>
              <Input
                placeholder="Image URL"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description"
                className="w-full h-24 rounded-lg border border-[var(--color-sage-light)] bg-[var(--color-bone)] px-3 py-2 text-sm resize-none"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isRare}
                  onChange={(e) => setForm({ ...form, isRare: e.target.checked })}
                />
                Heritage / rare
              </label>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createVariety.isPending || updateVariety.isPending}
                  className="bg-[var(--color-flesh)] hover:bg-[var(--color-flesh)]/90 text-white rounded-full"
                >
                  {editingId ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : (
        <div className="space-y-2">
          {data?.items.map((v) => (
            <div key={v.id} className="bg-[var(--color-surface-solid)] rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-[var(--color-bark)] truncate">{v.name}</p>
                <p className="text-xs text-[var(--color-sage)]">
                  /{v.slug} · zones {v.hardinessZoneMin ?? "?"}-{v.hardinessZoneMax ?? "?"}
                  {v.isRare ? " · heritage" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => startEdit(v.id)} className="p-2 text-[var(--color-bark-warm)] hover:text-[var(--color-flesh)]">
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete variety "${v.name}"?`)) {
                      deleteVariety.mutate({ id: v.id });
                    }
                  }}
                  className="p-2 text-[var(--color-sage)] hover:text-[var(--color-crimson)]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminDisputes() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.listDisputedOrders.useQuery();
  const resolve = trpc.admin.resolveDispute.useMutation({
    onSuccess: () => {
      utils.admin.listDisputedOrders.invalidate();
      toast.success("Dispute resolved");
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <Skeleton className="h-64 rounded-2xl" />;

  return (
    <div>
      <h2 className="font-display text-2xl text-[var(--color-bark)] mb-4">Disputed orders</h2>
      {!data || data.length === 0 ? (
        <p className="text-[var(--color-bark-warm)]">No disputed orders.</p>
      ) : (
        <div className="space-y-3">
          {data.map((order) => (
            <div key={order.id} className="bg-[var(--color-surface-solid)] rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-[var(--color-bark)]">
                  Order #{order.id} · {order.varietyName}
                </p>
                <p className="text-xs text-[var(--color-bark-warm)]">
                  ${Number(order.totalAmount).toFixed(2)} · qty {order.quantity}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => resolve.mutate({ orderId: order.id, action: "release" })}
                  disabled={resolve.isPending}
                >
                  Release
                </Button>
                <Button
                  size="sm"
                  onClick={() => resolve.mutate({ orderId: order.id, action: "refund" })}
                  disabled={resolve.isPending}
                  className="bg-[var(--color-crimson)] hover:bg-[var(--color-crimson)]/90 text-white rounded-full"
                >
                  Refund
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<AdminSellers />} />
        <Route path="/sellers" element={<AdminSellers />} />
        <Route path="/varieties" element={<AdminVarieties />} />
        <Route path="/disputes" element={<AdminDisputes />} />
      </Routes>
    </AdminLayout>
  );
}
