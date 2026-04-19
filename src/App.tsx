import { Routes, Route } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import Navigation from "@/components/Navigation";
import { appRoutes } from "./routes";

export default function App() {
  return (
    <>
      <Navigation />
      <Routes>
        {appRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Routes>
      <Toaster />
    </>
  );
}
