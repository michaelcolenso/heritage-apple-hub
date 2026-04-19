import { useState } from "react";
import { Link, Routes, Route, useLocation } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
  Plus,
  DollarSign,
  TrendingUp,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import Footer from "@/sections/Footer";

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navItems = [
    { icon: LayoutDashboard, label: "Overview", to: "/dashboard" },
    { icon: Package, label: "My Listings", to: "/dashboard/listings" },
    { icon: ShoppingBag, label: "Orders", to: "/dashboard/orders" },
    { icon: Settings, label: "Settings", to: "/dashboard/settings" },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bone)] pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-60 shrink-0">
            <div className="lg:sticky lg:top-24 bg-[var(--color-surface-solid)] rounded-2xl p-3">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
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

          {/* Content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function Overview() {
  const { data: stats, isLoading } = trpc.user.dashboard.useQuery();
  const { data: sellerOrders } = trpc.order.listSeller.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-[var(--color-bark)] mb-6">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active Listings", value: stats?.listings ?? 0, icon: Package },
          { label: "Total Sales", value: stats?.salesCount ?? 0, icon: TrendingUp },
          { label: "Revenue", value: `$${(stats?.salesRevenue ?? 0).toFixed(2)}`, icon: DollarSign },
          { label: "Pending Orders", value: stats?.pendingOrders ?? 0, icon: ClipboardList },
        ].map((stat) => (
          <div key={stat.label} className="bg-[var(--color-surface-solid)] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className="w-4 h-4 text-[var(--color-sage)]" />
              <span className="text-xs text-[var(--color-bark-warm)]">{stat.label}</span>
            </div>
            <p className="font-mono text-2xl font-medium text-[var(--color-bark)]">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[var(--color-surface-solid)] rounded-2xl p-6">
        <h3 className="font-body text-lg font-semibold text-[var(--color-bark)] mb-4">Recent Orders</h3>
        {!sellerOrders || sellerOrders.length === 0 ? (
          <p className="text-sm text-[var(--color-bark-warm)]">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {sellerOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-[var(--color-sage-light)]/20 last:border-0">
                <div>
                  <p className="text-sm font-medium text-[var(--color-bark)]">{order.varietyName}</p>
                  <p className="text-xs text-[var(--color-bark-warm)]">
                    {order.buyerName} · {order.quantity} sticks
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-[var(--color-bark)]">${Number(order.totalAmount).toFixed(2)}</p>
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                    order.status === "delivered"
                      ? "bg-green-50 text-green-600"
                      : order.status === "shipped"
                      ? "bg-purple-50 text-purple-600"
                      : "bg-amber-50 text-amber-600"
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MyListings() {
  const { data: listings, isLoading } = trpc.listing.myListings.useQuery();
  const utils = trpc.useUtils();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    varietyId: "",
    quantity: "",
    pricePerStick: "",
    description: "",
    shippingZones: "",
  });

  const createListing = trpc.listing.create.useMutation({
    onSuccess: () => {
      utils.listing.myListings.invalidate();
      setShowForm(false);
      setFormData({ varietyId: "", quantity: "", pricePerStick: "", description: "", shippingZones: "" });
      toast.success("Your scion listing is now live");
    },
  });

  const deleteListing = trpc.listing.delete.useMutation({
    onSuccess: () => {
      utils.listing.myListings.invalidate();
      toast.success("Listing deleted");
    },
  });

  const { data: allVarieties } = trpc.variety.list.useQuery({ page: 1, limit: 100 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createListing.mutate({
      varietyId: Number(formData.varietyId),
      quantity: Number(formData.quantity),
      pricePerStick: Number(formData.pricePerStick),
      description: formData.description,
      shippingZones: formData.shippingZones,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl text-[var(--color-bark)]">My Listings</h2>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-[var(--color-flesh)] hover:bg-[var(--color-flesh)]/90 text-white rounded-full"
        >
          <Plus className="w-4 h-4 mr-1" />
          New Listing
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[var(--color-surface-solid)] rounded-2xl p-6 mb-6 space-y-4">
          <h3 className="font-body font-semibold text-[var(--color-bark)]">Create New Listing</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--color-bark)] mb-1">Variety</label>
              <select
                value={formData.varietyId}
                onChange={(e) => setFormData({ ...formData, varietyId: e.target.value })}
                className="w-full h-10 rounded-lg border border-[var(--color-sage-light)] bg-[var(--color-bone)] px-3 text-sm"
                required
              >
                <option value="">Select variety...</option>
                {allVarieties?.items.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--color-bark)] mb-1">Quantity (sticks)</label>
              <Input
                type="number"
                min={1}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="bg-[var(--color-bone)] border-[var(--color-sage-light)]"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--color-bark)] mb-1">Price per stick ($)</label>
              <Input
                type="number"
                min={0.01}
                step={0.01}
                value={formData.pricePerStick}
                onChange={(e) => setFormData({ ...formData, pricePerStick: e.target.value })}
                className="bg-[var(--color-bone)] border-[var(--color-sage-light)]"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--color-bark)] mb-1">Shipping Zones (e.g., 4,5,6,7)</label>
              <Input
                placeholder="4,5,6,7,8"
                value={formData.shippingZones}
                onChange={(e) => setFormData({ ...formData, shippingZones: e.target.value })}
                className="bg-[var(--color-bone)] border-[var(--color-sage-light)]"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-[var(--color-bark)] mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full h-24 rounded-lg border border-[var(--color-sage-light)] bg-[var(--color-bone)] px-3 py-2 text-sm resize-none"
              placeholder="Describe your scion wood, collection date, rootstock compatibility..."
            />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={createListing.isPending} className="bg-[var(--color-flesh)] text-white rounded-full">
              {createListing.isPending ? "Creating..." : "Create Listing"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : !listings || listings.length === 0 ? (
        <div className="text-center py-12 bg-[var(--color-surface-solid)] rounded-2xl">
          <Package className="w-10 h-10 text-[var(--color-sage)] mx-auto mb-3" />
          <p className="text-[var(--color-bark-warm)] mb-3">No listings yet. Create your first scion listing!</p>
          <Button onClick={() => setShowForm(true)} className="bg-[var(--color-flesh)] text-white rounded-full">
            <Plus className="w-4 h-4 mr-1" />
            Create Listing
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <div key={listing.id} className="bg-[var(--color-surface-solid)] rounded-2xl p-5 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg text-[var(--color-bark)]">{listing.varietyName}</h3>
                <p className="text-sm text-[var(--color-bark-warm)]">
                  {listing.quantity} sticks · ${listing.pricePerStick}/stick
                </p>
                <span className={`inline-block mt-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                  listing.status === "active" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                }`}>
                  {listing.status}
                </span>
              </div>
              <button
                onClick={() => deleteListing.mutate({ id: listing.id })}
                className="p-2 text-[var(--color-sage)] hover:text-[var(--color-crimson)] transition-colors"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    </svg>
  );
}

function SellerOrders() {
  const { data: orders, isLoading } = trpc.order.listSeller.useQuery();
  const utils = trpc.useUtils();
  const updateStatus = trpc.order.updateStatus.useMutation({
    onSuccess: () => utils.order.listSeller.invalidate(),
  });

  if (isLoading) {
    return <Skeleton className="h-64 rounded-2xl" />;
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-[var(--color-bark)] mb-6">Orders</h2>
      {!orders || orders.length === 0 ? (
        <div className="text-center py-12 bg-[var(--color-surface-solid)] rounded-2xl">
          <ShoppingBag className="w-10 h-10 text-[var(--color-sage)] mx-auto mb-3" />
          <p className="text-[var(--color-bark-warm)]">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-[var(--color-surface-solid)] rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <p className="font-display text-lg text-[var(--color-bark)]">{order.varietyName}</p>
                  <p className="text-sm text-[var(--color-bark-warm)]">
                    {order.buyerName} · {order.quantity} sticks · ${Number(order.totalAmount).toFixed(2)}
                  </p>
                </div>
                <span className={`inline-flex self-start text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                  order.status === "delivered" ? "bg-green-50 text-green-600" :
                  order.status === "shipped" ? "bg-purple-50 text-purple-600" :
                  order.status === "confirmed" ? "bg-blue-50 text-blue-600" :
                  "bg-amber-50 text-amber-600"
                }`}>
                  {order.status}
                </span>
              </div>
              {order.status === "confirmed" && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => updateStatus.mutate({ orderId: order.id, status: "shipped" })}
                    className="bg-[var(--color-flesh)] text-white rounded-full text-xs"
                  >
                    Mark as Shipped
                  </Button>
                </div>
              )}
              {order.shippingAddress && (
                <p className="text-xs text-[var(--color-sage)] mt-2">
                  Ship to: {order.shippingAddress}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsPage() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const updateUser = trpc.user.update.useMutation({
    onSuccess: () => {
      utils.user.me.invalidate();
      toast.success("Profile updated");
    },
  });

  const [form, setForm] = useState({
    name: user?.name ?? "",
    bio: user?.bio ?? "",
    location: user?.location ?? "",
    hardinessZone: user?.hardinessZone ?? "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser.mutate({
      name: form.name || undefined,
      bio: form.bio || undefined,
      location: form.location || undefined,
      hardinessZone: form.hardinessZone ? Number(form.hardinessZone) : undefined,
    });
  };

  return (
    <div>
      <h2 className="font-display text-2xl text-[var(--color-bark)] mb-6">Settings</h2>
      <form onSubmit={handleSubmit} className="bg-[var(--color-surface-solid)] rounded-2xl p-6 space-y-4 max-w-lg">
        <div>
          <label className="block text-sm text-[var(--color-bark)] mb-1">Display Name</label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="bg-[var(--color-bone)] border-[var(--color-sage-light)]"
          />
        </div>
        <div>
          <label className="block text-sm text-[var(--color-bark)] mb-1">Location</label>
          <Input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="bg-[var(--color-bone)] border-[var(--color-sage-light)]"
            placeholder="City, State"
          />
        </div>
        <div>
          <label className="block text-sm text-[var(--color-bark)] mb-1">Hardiness Zone</label>
          <Input
            type="number"
            min={1}
            max={13}
            value={form.hardinessZone}
            onChange={(e) => setForm({ ...form, hardinessZone: e.target.value })}
            className="bg-[var(--color-bone)] border-[var(--color-sage-light)]"
            placeholder="1-13"
          />
        </div>
        <div>
          <label className="block text-sm text-[var(--color-bark)] mb-1">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="w-full h-24 rounded-lg border border-[var(--color-sage-light)] bg-[var(--color-bone)] px-3 py-2 text-sm resize-none"
            placeholder="Tell others about your orchard..."
          />
        </div>
        <Button type="submit" disabled={updateUser.isPending} className="bg-[var(--color-flesh)] text-white rounded-full">
          {updateUser.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}

export default function Dashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/listings" element={<MyListings />} />
        <Route path="/orders" element={<SellerOrders />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </DashboardLayout>
  );
}
