import { Routes, Route } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import Navigation from "@/components/Navigation";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Varieties from "./pages/Varieties";
import VarietyDetail from "./pages/VarietyDetail";
import Marketplace from "./pages/Marketplace";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Sellers from "./pages/Sellers";
import Dashboard from "./pages/Dashboard";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";
import Admin from "./pages/Admin";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";

export default function App() {
  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/varieties" element={<Varieties />} />
        <Route path="/varieties/:slug" element={<VarietyDetail />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/sellers" element={<Sellers />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/cancel" element={<CheckoutCancel />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin/*" element={<Admin />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  );
}
