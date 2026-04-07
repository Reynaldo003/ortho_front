import { Routes, Route } from "react-router-dom";
import "./App.css";

import Login from "@/components/Login";
import ResetPassword from "@/pages/ResetPassword";
import Administrativa from "@/Administrativa";
import AppPresentacion from "@/presentacion/AppPresentacion";

export default function App() {
  return (
    <Routes>
      {/* Rutas administrativas, no se tocan */}
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
      <Route path="/administrativa/*" element={<Administrativa />} />

      {/* Web de presentación nueva */}
      <Route path="/*" element={<AppPresentacion />} />
    </Routes>
  );
}