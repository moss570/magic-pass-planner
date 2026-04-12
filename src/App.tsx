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
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import SupportFaq from "./pages/SupportFaq";
import AffiliateProgram from "./pages/AffiliateProgram";
import FAQ from "./pages/FAQ";
import GameDeveloper from "./pages/GameDeveloper";
import PhotoContest from "./pages/PhotoContest";
import AdminCommandCenter from "./pages/AdminCommandCenter";
import MagicBeacon from "./pages/MagicBeacon";
import PhotoFun from "./pages/PhotoFun";
import SocialFeed from "./pages/SocialFeed";
import EventAlerts from "./pages/EventAlerts";
import LineGames from "./pages/LineGames";
import GamesDiscovery from "./pages/GamesDiscovery";
import Leaderboards from "./pages/Leaderboards";
import Feed from "./pages/Feed";
import InboxPage from "./pages/Inbox";
import HotelAlerts from "./pages/HotelAlerts";
import AirfareTracker from "./pages/AirfareTracker";
import ReservationsInbox from "./pages/ReservationsInbox";
import TripInvite from "./pages/TripInvite";
import TripCompare from "./pages/TripCompare";
import AffiliateNetworks from "./pages/admin/AffiliateNetworks";
import ParkContent from "./pages/admin/ParkContent";
import TierAccess from "./pages/admin/TierAccess";
import AttractionPriorities from "./pages/AttractionPriorities";
import CharacterMeets from "./pages/CharacterMeets";
import ShowFireworksPriorities from "./pages/ShowFireworksPriorities";
import GroupPolls from "./pages/GroupPolls";
import PhotoOpps from "./pages/PhotoOpps";
import OrlandoInsidersGuide from "./pages/OrlandoInsidersGuide";

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
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/support" element={<SupportFaq />} />
            <Route path="/affiliate" element={<AffiliateProgram />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/game-developer" element={<ProtectedRoute><GameDeveloper /></ProtectedRoute>} />
            <Route path="/photo-contest" element={<ProtectedRoute><PhotoContest /></ProtectedRoute>} />
            <Route path="/admin/command-center" element={<ProtectedRoute><AdminCommandCenter /></ProtectedRoute>} />
            <Route path="/magic-beacon" element={<ProtectedRoute><MagicBeacon /></ProtectedRoute>} />
            <Route path="/photo-fun" element={<ProtectedRoute><PhotoFun /></ProtectedRoute>} />
            <Route path="/feed" element={<ProtectedRoute><SocialFeed /></ProtectedRoute>} />
            <Route path="/event-alerts" element={<ProtectedRoute><EventAlerts /></ProtectedRoute>} />
            <Route path="/games" element={<ProtectedRoute><GamesDiscovery /></ProtectedRoute>} />
            <Route path="/leaderboards" element={<ProtectedRoute><Leaderboards /></ProtectedRoute>} />
            <Route path="/ride-line-quest" element={<ProtectedRoute><LineGames /></ProtectedRoute>} />
            <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
            <Route path="/hotel-alerts" element={<ProtectedRoute><HotelAlerts /></ProtectedRoute>} />
            <Route path="/airfare" element={<ProtectedRoute><AirfareTracker /></ProtectedRoute>} />
            <Route path="/reservations" element={<ProtectedRoute><ReservationsInbox /></ProtectedRoute>} />
            <Route path="/invite/:inviteToken" element={<TripInvite />} />
            <Route path="/trip/:tripId/compare" element={<ProtectedRoute><TripCompare /></ProtectedRoute>} />
            <Route path="/admin/affiliates" element={<ProtectedRoute><AffiliateNetworks /></ProtectedRoute>} />
            <Route path="/admin/park-content" element={<ProtectedRoute><ParkContent /></ProtectedRoute>} />
            <Route path="/admin/tier-access" element={<ProtectedRoute><TierAccess /></ProtectedRoute>} />
            <Route path="/attraction-priorities" element={<ProtectedRoute><AttractionPriorities /></ProtectedRoute>} />
            <Route path="/character-meets" element={<ProtectedRoute><CharacterMeets /></ProtectedRoute>} />
            <Route path="/shows-fireworks" element={<ProtectedRoute><ShowFireworksPriorities /></ProtectedRoute>} />
            <Route path="/group-polls" element={<ProtectedRoute><GroupPolls /></ProtectedRoute>} />
            <Route path="/photo-opps" element={<ProtectedRoute><PhotoOpps /></ProtectedRoute>} />
            <Route path="/orlando-guide" element={<ProtectedRoute><OrlandoInsidersGuide /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
