import type { ReactNode } from "react";
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

export type AppRoute = {
  path: string;
  element: ReactNode;
};

export const appRoutes: AppRoute[] = [
  { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> },
  { path: "/varieties", element: <Varieties /> },
  { path: "/varieties/:slug", element: <VarietyDetail /> },
  { path: "/marketplace", element: <Marketplace /> },
  { path: "/cart", element: <Cart /> },
  { path: "/orders", element: <Orders /> },
  { path: "/sellers", element: <Sellers /> },
  { path: "/dashboard/*", element: <Dashboard /> },
  { path: "*", element: <NotFound /> },
];
