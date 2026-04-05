import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
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
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/trip-planner" element={<ProtectedRoute><TripPlanner /></ProtectedRoute>} />
            <Route path="/dining-alerts" element={<ProtectedRoute><DiningAlerts /></ProtectedRoute>} />
            <Route path="/gift-card-tracker" element={<ProtectedRoute><GiftCardTracker /></ProtectedRoute>} />
            <Route path="/live-park" element={<ProtectedRoute><LivePark /></ProtectedRoute>} />
            <Route path="/ap-command-center" element={<ProtectedRoute><APCommandCenter /></ProtectedRoute>} />
            <Route path="/group-coordinator" element={<ProtectedRoute><GroupCoordinator /></ProtectedRoute>} />
            <Route path="/budget-manager" element={<ProtectedRoute><BudgetManager /></ProtectedRoute>} />
            <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
