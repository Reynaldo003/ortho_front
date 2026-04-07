import { Routes, Route } from "react-router-dom";
import "./presentacion.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Book from "./pages/Book";
import NotFound from "./pages/NotFound";
import DoctorProfile from "./pages/DoctorProfile";
import AgendarFisioterapia from "./pages/AgendarFisioterapia";
import FisioProfiles from "./pages/FisioProfiles";

export default function AppPresentacion() {
    return (
        <div className="flex min-h-screen min-h-dvh w-full flex-col overflow-x-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-950">
            <Navbar />

            <main className="flex-1 min-w-0 w-full">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/book/:slug" element={<Book />} />
                    <Route path="/doctor/:slug" element={<DoctorProfile />} />
                    <Route path="/agenda/fisioterapia" element={<AgendarFisioterapia />} />
                    <Route path="/fisioterapia/equipo" element={<FisioProfiles />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>

            <Footer />
        </div>
    );
}