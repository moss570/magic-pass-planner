import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import CompassButton from "@/components/CompassButton";
import WelcomeFlow from "@/components/WelcomeFlow";

const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";
const SUPABASE_ANON = "sb_publishable_nQdtcwDbXVyr0Tc44YLTKA_9BfIKXQC";

const crowdColor = (level: number) => level <= 3 ? "text-green-400" : level <= 5 ? "text-yellow-400" : level <= 7 ? "text-orange-400" : "text-red-400";
const crowdDot = (color: string) => ({ green: "bg-green-400", yellow: "bg-yellow-400", orange: "bg-orange-400", red: "bg-red-400" }[color] || "bg-gray-400");

const Dashboard = () => {
  const { user, session } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [firstName, setFirstName] = useState("there");
  const [showWelcome, setShowWelcome] = useState(false);
  const [activeAlertCount, setActiveAlertCount] = useState<number | null>(null);
  const [realAlerts, setRealAlerts] = useState<any[]>([]);
  const [mostRecentTrip, setMostRecentTrip] = useState<any>(null);
  const [activeVersion, setActiveVersion] = useState<{ name: string; version_number: number } | null>(null);
  const [tripExpenses, setTripExpenses] = useState<{ total: number; budget: number } | null>(null);
  const [weatherForecast, setWeatherForecast] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);

  // Clark's recommendation — dynamic based on real data
  const getClarkRecommendation = () => {
    if (!mostRecentTrip) return "Start by creating your first trip in Trip Planner to get personalized recommendations.";
    const daysAway = mostRecentTrip.start_date ? Math.floor((new Date(mostRecentTrip.start_date + "T12:00:00").getTime() - Date.now()) / 86400000) : null;
    if (daysAway !== null && daysAway <= 7) return `Your trip is in ${daysAway} day${daysAway !== 1 ? "s" : ""}! Check your dining alerts and make sure your Lightning Lane strategy is set. Review the Trip Planner itinerary one more time and confirm all reservations.`;
    if (daysAway !== null && daysAway <= 30) return `${daysAway} days until your trip. Now is the time to set dining reservation alerts — popular restaurants book up fast. Check the Gift Card Tracker for any Sam's Club deals to save on your trip budget.`;
    if (activeAlertCount === 0) return "You have no active dining alerts. Set alerts now for your trip dates — top restaurants like Be Our Guest and Space 220 book up 30-60 days out.";
    if (realAlerts.some(a => a.status === "found")) return `🎉 A dining reservation just became available! Check your Dining Alerts — act quickly before it's claimed.`;
    return `You have ${activeAlertCount} active dining alert${activeAlertCount !== 1 ? "s" : ""}. We're checking every 5 minutes. Set alerts for more restaurants to maximize your chances.`;
  };

  useEffect(() => {
    if (!user || !session) return;

    // Profile + welcome check
    supabase.from("users_profile")
      .select("first_name, has_seen_welcome")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setFirstName(data?.first_name?.trim() || "there");
        const seenLocally = localStorage.getItem("magic-pass:welcome-seen");
        if (!data?.has_seen_welcome && !seenLocally) setShowWelcome(true);
      });

    // Most recent trip
    supabase.from("saved_trips")
      .select("id, name, parks, start_date, end_date, itinerary, estimated_total")
      .eq("user_id", user.id)
      .not("itinerary", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .then(({ data }) => setMostRecentTrip(data?.[0] || null));

    // Active dining + extra alerts count
    supabase.from("dining_alerts")
      .select("id, status, restaurant:restaurants(name, location)")
      .eq("user_id", user.id)
      .in("status", ["watching", "found"])
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setRealAlerts(data || []);
        setActiveAlertCount(data?.length || 0);
      });

    // Trip expenses vs budget
    supabase.from("saved_trips")
      .select("id, estimated_total")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .then(async ({ data: trips }) => {
        if (!trips?.length) return;
        const tripId = trips[0].id;
        const budget = trips[0].estimated_total || 0;
        const { data: expenses } = await supabase.from("trip_expenses").select("amount").eq("trip_id", tripId);
        const total = (expenses || []).reduce((s, e) => s + parseFloat(String(e.amount)), 0);
        setTripExpenses({ total, budget });
      });

    // Subscription
    supabase.from("subscriptions")
      .select("plan_name, status, trial_end")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => setSubscription(data));

    // Checkout success toast
    if (searchParams.get("checkout") === "success") {
      sonnerToast.success("🎉 Welcome to Magic Pass Plus! Your 7-day free trial has started.", {
        duration: 6000,
        style: { background: "#F0B429", color: "#070b15", border: "none", fontWeight: 600 },
      });
      setSearchParams({}, { replace: true });
    }
  }, [user, session]);

  // Load weather after trip is loaded
  useEffect(() => {
    const park = mostRecentTrip?.parks?.[0] || "Magic Kingdom";
    fetch(`${SUPABASE_URL}/functions/v1/weather-forecast?park=${encodeURIComponent(park)}&days=7`)
      .then(r => r.json())
      .then(data => setWeatherForecast(data.forecast || []))
      .catch(() => {});
  }, [mostRecentTrip]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Days to trip calculation
  const daysToTrip = mostRecentTrip?.start_date
    ? Math.max(0, Math.floor((new Date(mostRecentTrip.start_date + "T12:00:00").getTime() - Date.now()) / 86400000))
    : null;

  // Savings calculation from trip budget
  const estimatedSavings = mostRecentTrip?.estimated_total
    ? Math.round(mostRecentTrip.estimated_total * 0.08) // ~8% from gift cards + CC
    : null;

  // Determine upcoming dates to show
  const upcomingDates = (() => {
    if (mostRecentTrip?.start_date && daysToTrip !== null && daysToTrip <= 70 && mostRecentTrip.itinerary) {
      // Use trip dates
      return mostRecentTrip.itinerary.slice(0, 5).map((day: any, i: number) => {
        const w = weatherForecast[i] || null;
        return {
          date: day.date,
          park: day.park,
          parkEmoji: day.parkEmoji,
          crowdLevel: w?.crowdLevel ?? day.crowdLevel,
          crowdLabel: w?.crowdLabel ?? (day.crowdLevel <= 3 ? "Low" : day.crowdLevel <= 5 ? "Moderate" : day.crowdLevel <= 7 ? "Busy" : "Packed"),
          crowdColor: w?.crowdColor ?? (day.crowdLevel <= 3 ? "green" : day.crowdLevel <= 5 ? "yellow" : day.crowdLevel <= 7 ? "orange" : "red"),
          weather: w,
        };
      });
    }
    // Use next 5 days with weather
    return weatherForecast.slice(0, 5).map((w: any) => ({
      date: w.date,
      park: null,
      parkEmoji: null,
      crowdLevel: w.crowdLevel,
      crowdLabel: w.crowdLabel,
      crowdColor: w.crowdColor,
      weather: w,
    }));
  })();

  const itinerary = mostRecentTrip?.itinerary?.[0]?.items || [];

  return (
    <>
      {showWelcome && <WelcomeFlow onComplete={() => setShowWelcome(false)} />}
      <DashboardLayout
        title={`${greeting}, ${firstName} 👋`}
        subtitle={mostRecentTrip
          ? `Your next trip: ${mostRecentTrip.parks?.[0] || "Disney"} ${daysToTrip !== null ? `— ${daysToTrip} day${daysToTrip !== 1 ? "s" : ""} away` : ""}`
          : "Plan your perfect Disney adventure"}
      >
        <div className="space-y-6">

          {/* ROW 1 — Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {/* Active Alerts */}
            <div className="rounded-xl p-4 md:p-5 border border-white/8" style={{ background: "#111827" }}>
              <p className="text-[10px] md:text-xs text-muted-foreground mb-1">Active Alerts</p>
              <p className="text-2xl md:text-3xl font-extrabold text-primary">{activeAlertCount ?? "—"}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                {activeAlertCount === null ? "Loading..." : activeAlertCount === 0 ? "No active alerts" : "Dining reservation alerts"}
              </p>
              {activeAlertCount === 0 && (
                <Link to="/dining-alerts" className="text-xs text-primary hover:underline block mt-1">Set one →</Link>
              )}
            </div>

            {/* Days to Trip */}
            <div className="rounded-xl p-4 md:p-5 border border-white/8" style={{ background: "#111827" }}>
              <p className="text-[10px] md:text-xs text-muted-foreground mb-1">Days to Trip</p>
              <p className="text-2xl md:text-3xl font-extrabold text-primary">{daysToTrip ?? "—"}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                {mostRecentTrip ? `${mostRecentTrip.parks?.[0] || "Disney"} · ${mostRecentTrip.start_date}` : "No trips planned"}
              </p>
              {!mostRecentTrip && (
                <Link to="/trip-planner" className="text-xs text-primary hover:underline block mt-1">Plan a trip →</Link>
              )}
            </div>

            {/* Est. Trip Savings */}
            <div className="rounded-xl p-4 md:p-5 border border-white/8" style={{ background: "#111827" }}>
              <p className="text-[10px] md:text-xs text-muted-foreground mb-1">Est. Trip Savings</p>
              <p className="text-2xl md:text-3xl font-extrabold text-green-400">
                {estimatedSavings !== null ? `$${estimatedSavings.toLocaleString()}` : "—"}
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                {estimatedSavings !== null ? "Gift cards + CC cashback" : "Add a budget to see savings"}
              </p>
              {!mostRecentTrip && (
                <Link to="/gift-card-tracker" className="text-xs text-primary hover:underline block mt-1">See how to save →</Link>
              )}
            </div>

            {/* Budget Status */}
            <div className="rounded-xl p-4 md:p-5 border border-white/8" style={{ background: "#111827" }}>
              <p className="text-[10px] md:text-xs text-muted-foreground mb-1">Budget Status</p>
              {tripExpenses !== null ? (
                <>
                  <p className="text-2xl md:text-3xl font-extrabold text-foreground">${tripExpenses.total.toLocaleString()}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1">of ${tripExpenses.budget.toLocaleString()} budget used</p>
                  <div className="w-full bg-white/10 rounded-full h-1.5 mt-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, (tripExpenses.total / tripExpenses.budget) * 100)}%`, background: tripExpenses.total > tripExpenses.budget ? "#F43F5E" : "#F0B429" }} />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-2xl md:text-3xl font-extrabold text-muted-foreground">—</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Add a budget to track spending</p>
                  <Link to="/budget-manager" className="text-xs text-primary hover:underline block mt-1">Set budget →</Link>
                </>
              )}
            </div>
          </div>

          {/* ROW 2 — Two columns */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
            {/* Itinerary — 3 cols */}
            <div className="lg:col-span-3 rounded-xl border border-white/8 p-4 md:p-5" style={{ background: "#111827" }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  📅 Your Trip Itinerary
                </h3>
                <Link to="/trip-planner" className="text-xs text-primary hover:underline">
                  {mostRecentTrip ? "Full plan →" : "Create one →"}
                </Link>
              </div>

              {itinerary.length > 0 ? (
                <>
                  {mostRecentTrip?.itinerary?.[0] && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base">{mostRecentTrip.itinerary[0].parkEmoji || "🏰"}</span>
                      <p className="text-xs font-bold text-foreground">{mostRecentTrip.itinerary[0].park} — {mostRecentTrip.itinerary[0].date}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${mostRecentTrip.itinerary[0].crowdLevel <= 4 ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                        {mostRecentTrip.itinerary[0].crowdLevel <= 4 ? "Low" : mostRecentTrip.itinerary[0].crowdLevel <= 6 ? "Moderate" : "Busy"} Crowds
                      </span>
                    </div>
                  )}
                  <div className="space-y-2 mb-3">
                    {itinerary.slice(0, 6).map((item: any, i: number) => (
                      <div key={i} className="flex gap-2 md:gap-3 items-start">
                        <div className="text-[10px] md:text-xs text-muted-foreground w-[52px] md:w-16 shrink-0 pt-0.5">{item.time}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs md:text-sm font-medium text-foreground leading-snug">{item.activity}</p>
                          {item.badge && <p className="text-[10px] md:text-xs mt-0.5 text-primary">{item.badge}</p>}
                          {item.walkMinutes > 0 && <p className="text-[10px] text-blue-400 mt-0.5">🚶 {item.walkMinutes} min walk{item.waitMinutes > 0 ? ` · ⏱️ ${item.waitMinutes} min wait` : ""}</p>}
                        </div>
                        {item.location && <CompassButton destination={item.location} context={item.land || ""} size="inline" />}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-3xl mb-3">🏰</p>
                  <p className="text-sm font-semibold text-foreground mb-1">No itinerary planned</p>
                  <p className="text-xs text-muted-foreground mb-4">Create a trip to see your day-by-day schedule here</p>
                  <Link to="/trip-planner" className="px-5 py-2 rounded-lg font-bold text-sm text-[#070b15] inline-block" style={{ background: "#F0B429" }}>
                    Create My First Trip →
                  </Link>
                </div>
              )}
            </div>

            {/* Right column — Alerts + Recommendation */}
            <div className="lg:col-span-2 space-y-4">
              {/* Active Alerts */}
              <div className="rounded-xl border border-white/8 p-4" style={{ background: "#111827" }}>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">🔔 Active Alerts</h3>
                {realAlerts.length > 0 ? (
                  <div className="space-y-2">
                    {realAlerts.map((alert: any) => (
                      <div key={alert.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🍽️</span>
                          <div>
                            <p className="text-xs font-semibold text-foreground">{alert.restaurant?.name || "Restaurant"}</p>
                            <p className="text-xs text-muted-foreground">{alert.alert_date} · Party of {alert.party_size}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${alert.status === "found" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                          {alert.status === "found" ? "AVAILABLE!" : "Watching..."}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground mb-2">No active dining alerts</p>
                    <Link to="/dining-alerts" className="text-xs text-primary hover:underline">Set a dining alert →</Link>
                  </div>
                )}
              </div>

              {/* Clark's Recommendation */}
              <div className="rounded-xl border-l-4 p-4" style={{ background: "#111827", borderLeftColor: "#F0B429" }}>
                <p className="text-xs font-bold text-primary mb-2 flex items-center gap-1">💡 Clark's Recommendation</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{getClarkRecommendation()}</p>
              </div>
            </div>
          </div>

          {/* ROW 3 — Upcoming Disney Dates with weather */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3">
              {mostRecentTrip && daysToTrip !== null && daysToTrip <= 70
                ? `📅 Your Trip — ${mostRecentTrip.name}`
                : "📅 Next 5 Days at Disney World"}
            </h3>
            {upcomingDates.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {upcomingDates.map((day: any, i: number) => {
                  const w = day.weather;
                  const dateObj = new Date(day.date + "T12:00:00");
                  const dateLabel = dateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                  return (
                    <div key={i} className="rounded-xl p-3 border border-white/8 text-center" style={{ background: "#111827" }}>
                      <p className="text-xs text-muted-foreground mb-1">{dateLabel}</p>
                      {day.park && <p className="text-xs font-semibold text-foreground mb-1 truncate">{day.parkEmoji} {day.park}</p>}
                      {w && (
                        <>
                          <p className="text-2xl mb-1">{w.emoji}</p>
                          <p className="text-xs font-bold text-foreground">{w.tempHigh}°F / {w.tempLow}°F</p>
                          <p className="text-xs text-blue-400">💧 {w.rainChance}%</p>
                          {w.windSpeed > 15 && <p className="text-xs text-muted-foreground">💨 {w.windSpeed} mph</p>}
                        </>
                      )}
                      <div className="mt-2 pt-2 border-t border-white/8">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className={`w-2.5 h-2.5 rounded-full ${crowdDot(day.crowdColor || "green")}`} />
                          <span className={`text-xs font-bold ${crowdColor(day.crowdLevel)}`}>{day.crowdLevel}/10</span>
                        </div>
                        <p className={`text-[10px] font-semibold mt-0.5 ${crowdColor(day.crowdLevel)}`}>👥 {day.crowdLabel || "Unknown"}</p>
                      </div>
                      {w?.rainChance >= 40 && <p className="text-[10px] text-yellow-400 mt-1">⚠️ Rain likely</p>}
                      {w?.isGoodDay && <p className="text-[10px] text-green-400 mt-1">✅ Great day!</p>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl p-6 text-center border border-white/8" style={{ background: "#111827" }}>
                <p className="text-xs text-muted-foreground">Loading weather forecast...</p>
              </div>
            )}
          </div>

        </div>
      </DashboardLayout>
    </>
  );
};

export default Dashboard;
