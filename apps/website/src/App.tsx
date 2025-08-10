
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "./contexts/LanguageContext";
import AnalyticsProvider from "./components/AnalyticsProvider";
import HomePage from "./pages/HomePage";
import HomePageNew from "./pages/HomePageNew";
import CreatorsPage from "./pages/CreatorsPage";
import BuyersPage from "./pages/BuyersPage";
import PricingPage from "./pages/PricingPage";
import AboutPage from "./pages/AboutPage";
import SignupPage from "./pages/SignupPage";
import BuyerSignupPage from "./pages/BuyerSignupPage";
import CreatorSignupPage from "./pages/CreatorSignupPage";
import SigninPage from "./pages/SigninPage";
import TitleDetailPage from "./pages/TitleDetailPage";
import DashboardInvited from "./pages/DashboardInvited";
import CreatorInvited from "./pages/CreatorInvited";
import NotFound from "./pages/NotFound";

const App = () => (
  <LanguageProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnalyticsProvider />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/new-design" element={<HomePageNew />} />
          <Route path="/creators" element={<CreatorsPage />} />
          <Route path="/buyers" element={<BuyersPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/signup/buyer" element={<BuyerSignupPage />} />
          <Route path="/signup/creator" element={<CreatorSignupPage />} />
          <Route path="/signin" element={<SigninPage />} />
          <Route path="/title/:titleId" element={<TitleDetailPage />} />
          <Route path="/invited" element={<DashboardInvited />} />
          <Route path="/creator/invited" element={<CreatorInvited />} />
          {/* Legacy redirect for old dashboard routes */}
          <Route path="/dashboard/invited" element={<Navigate to="/invited" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </LanguageProvider>
);

export default App;
