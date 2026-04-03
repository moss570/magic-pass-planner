import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TripPlanner from "./pages/TripPlanner";
import DiningAlerts from "./pages/DiningAlerts";
import GiftCardTracker from "./pages/GiftCardTracker";
import LivePark from "./pages/LivePark";
import APCommandCenter from "./pages/APCommandCenter";
import GroupCoordinator from "./pages/GroupCoordinator";
import BudgetManager from "./pages/BudgetManager";
import Friends from "./pages/Friends";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/trip-planner" element={<TripPlanner />} />
          <Route path="/dining-alerts" element={<DiningAlerts />} />
          <Route path="/gift-card-tracker" element={<GiftCardTracker />} />
          <Route path="/live-park" element={<LivePark />} />
          <Route path="/ap-command-center" element={<APCommandCenter />} />
          <Route path="/group-coordinator" element={<GroupCoordinator />} />
          <Route path="/budget-manager" element={<BudgetManager />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
