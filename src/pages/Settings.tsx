import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Castle, Upload, Copy, Mail, MessageSquare, Twitter, Facebook, ClipboardCopy, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { Link } from "react-router-dom";

const Settings = () => {
  const { user } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [homeZip, setHomeZip] = useState("");

  const [apTier, setApTier] = useState("None");
  const [apExpiration, setApExpiration] = useState("");
  const [homePark, setHomePark] = useState("Magic Kingdom");
  const [diningPlan, setDiningPlan] = useState("none");
  const [disneyPlus, setDisneyPlus] = useState(false);
  const [disneyVisa, setDisneyVisa] = useState(false);

  const [quietHours, setQuietHours] = useState(true);
  const [alerts, setAlerts] = useState({
    dining: true, giftCard: true, hotelDrop: true, apHotel: true, apMerch: true, waitTime: true, rideClosure: true, rain: true,
  });
  const [delivery, setDelivery] = useState({
    push: true, email: true, sms: false, weekly: true,
  });

  const [savingAccount, setSavingAccount] = useState(false);
  const [savingDisney, setSavingDisney] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const { subscription } = useSubscription();

  useEffect(() => {
    if (!user) return;
    supabase.from("users_profile").select("*").eq("id", user.id).single()
      .then(({ data, error }) => {
        if (data) {
          setFirstName(data.first_name || "");
          setLastName(data.last_name || "");
          setEmail(data.email || user.email || "");
          setPhone(data.phone || "");
          setHomeZip(data.home_zip || "");
          setApTier(data.ap_pass_tier || "None");
          setApExpiration(data.ap_expiration || "");
          setHomePark(data.home_park || "Magic Kingdom");
          setDisneyPlus(data.disney_plus || false);
          setDisneyVisa(data.disney_visa || false);
        }
        setLoadingProfile(false);
      });
  }, [user]);

  const handleSaveAccount = async () => {
    if (!user) return;
    setSavingAccount(true);
    const { error } = await supabase.from("users_profile").upsert({
      id: user.id,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      home_zip: homeZip,
    });
    setSavingAccount(false);
    if (error) {
      toast.error("❌ Save failed — please try again");
    } else {
      toast.success("✅ Saved successfully");
    }
  };

  const handleSaveDisney = async () => {
    if (!user) return;
    setSavingDisney(true);
    const { error } = await supabase.from("users_profile").upsert({
      id: user.id,
      ap_pass_tier: apTier,
      ap_expiration: apExpiration || null,
      home_park: homePark,
      disney_visa: disneyVisa,
      disney_plus: disneyPlus,
    });
    setSavingDisney(false);
    if (error) {
      toast.error("❌ Save failed — please try again");
    } else {
      toast.success("✅ Saved successfully");
    }
  };

  return (
    <DashboardLayout title="⚙️ Settings" subtitle="Manage your account, subscription, and notification preferences">
      {/* Section 1: My Account */}
      <Card className="border-primary/20 bg-card/80 mb-6 overflow-hidden">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">👤 My Account</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">First Name</label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="bg-background/50 border-primary/20 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Last Name</label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="bg-background/50 border-primary/20 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email Address</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background/50 border-primary/20 text-sm" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Phone Number <span className="text-muted-foreground/60">— Used for SMS alerts</span></label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-background/50 border-primary/20 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Home Zip Code <span className="text-muted-foreground/60">— Used for local deal targeting</span></label>
              <Input value={homeZip} onChange={(e) => setHomeZip(e.target.value)} className="bg-background/50 border-primary/20 text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-lg font-bold shrink-0">
              {firstName ? firstName[0].toUpperCase() : "?"}
            </div>
            <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10 text-xs"><Upload className="w-3.5 h-3.5 mr-1" /> Upload Photo</Button>
          </div>
          <Button className="text-xs" onClick={handleSaveAccount} disabled={savingAccount}>
            {savingAccount ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Save Account Changes
          </Button>
          <p className="text-[10px] text-muted-foreground">Your information is encrypted and never sold.</p>
        </CardContent>
      </Card>

      {/* Section 2: My Subscription */}
      <Card className="border-primary/20 bg-card/80 mb-6 overflow-hidden">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">💳 My Subscription</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-4">
          {(() => {
            if (!subscription?.subscribed) {
              return (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <p className="text-sm text-muted-foreground">No active plan · Free trial available</p>
                  <Link to="/pricing">
                    <Button className="text-xs" style={{ background: "#F5C842", color: "#080E1E" }}>Choose a Plan →</Button>
                  </Link>
                </div>
              );
            }
            const status = subscription.status;
            const trialEnd = subscription.trial_end ? new Date(subscription.trial_end) : null;
            const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : null;
            const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000)) : 0;

            return (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 bg-primary/15 text-primary text-xs font-semibold px-3 py-1.5 rounded-full w-fit">
                    <Castle className="w-3 h-3" /> {subscription.plan_name || "Magic Pass Plan"}
                  </span>
                  <div>
                    {status === "trialing" && (
                      <p className="text-xs text-green-400 font-medium">🟢 Free trial · {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining</p>
                    )}
                    {status === "active" && periodEnd && (
                      <p className="text-sm text-foreground font-medium">🟢 Active · Next billing: {periodEnd.toLocaleDateString()}</p>
                    )}
                    {status === "canceled" && periodEnd && (
                      <p className="text-sm text-destructive font-medium">Canceled · Access until {periodEnd.toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button className="text-xs">⬆️ Upgrade to AP+ Plan</Button>
            <Button variant="outline" className="text-xs border-muted text-muted-foreground hover:text-foreground">Manage Billing →</Button>
          </div>
          <div className="rounded-lg border border-primary/15 bg-[var(--muted)]/60 overflow-x-auto max-w-full">
            <table className="w-full text-xs min-w-[400px]">
              <thead>
                <tr className="border-b border-primary/10">
                  <th className="text-left p-3 text-muted-foreground font-medium">Feature</th>
                  <th className="p-3 text-primary font-semibold text-center">Magic Pass<br/><span className="font-normal text-muted-foreground">(Current)</span></th>
                  <th className="p-3 text-secondary font-semibold text-center">AP Command Center+</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Dining Alerts", "✅", "✅"],
                  ["Gift Card Tracker", "✅", "✅"],
                  ["Live Park Mode", "✅", "✅"],
                  ["AP Blockout Calendar", "❌", "✅"],
                  ["AP Discount Database", "❌", "✅"],
                  ["Discount Stacking Calculator", "❌", "✅"],
                  ["AP Hotel Deal Alerts", "❌", "✅"],
                  ["AP Merch Drop Alerts", "❌", "✅"],
                ].map(([feature, current, plus]) => (
                  <tr key={feature} className="border-b border-primary/5">
                    <td className="p-3 text-foreground">{feature}</td>
                    <td className="p-3 text-center">{current}</td>
                    <td className="p-3 text-center">{plus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2">
            <p className="text-sm font-semibold text-destructive">Cancel Subscription</p>
            <p className="text-xs text-muted-foreground">You can cancel anytime. You'll keep access until the end of your billing period.</p>
            <Button variant="outline" size="sm" className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs">Cancel Subscription</Button>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: My Disney Profile */}
      <Card className="border-primary/20 bg-card/80 mb-6 overflow-hidden">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">🎟️ My Disney Profile</CardTitle>
          <CardDescription>Used to personalize your alerts, itinerary, and AP features</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Annual Pass Tier</label>
              <Select value={apTier} onValueChange={setApTier}>
                <SelectTrigger className="bg-background/50 border-primary/20 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="Pixie Dust">Pixie Dust Pass</SelectItem>
                  <SelectItem value="Pirate">Pirate Pass</SelectItem>
                  <SelectItem value="Sorcerer">Sorcerer Pass</SelectItem>
                  <SelectItem value="Incredi-Pass">Incredi-Pass</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Pass Expiration Date</label>
              <Input type="date" value={apExpiration} onChange={(e) => setApExpiration(e.target.value)} className="bg-background/50 border-primary/20 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Home Park</label>
              <Select value={homePark} onValueChange={setHomePark}>
                <SelectTrigger className="bg-background/50 border-primary/20 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Magic Kingdom">Magic Kingdom</SelectItem>
                  <SelectItem value="EPCOT">EPCOT</SelectItem>
                  <SelectItem value="Hollywood Studios">Hollywood Studios</SelectItem>
                  <SelectItem value="Animal Kingdom">Animal Kingdom</SelectItem>
                  <SelectItem value="Any">Any</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Dining Plan</label>
              <Select value={diningPlan} onValueChange={setDiningPlan}>
                <SelectTrigger className="bg-background/50 border-primary/20 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="ddp">Disney Dining Plan</SelectItem>
                  <SelectItem value="ddp-plus">Disney Dining Plan Plus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
            <div className="flex items-center gap-3">
              <Switch checked={disneyPlus} onCheckedChange={setDisneyPlus} />
              <span className="text-sm text-foreground">Disney+ Subscriber</span>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={disneyVisa} onCheckedChange={setDisneyVisa} />
              <span className="text-sm text-foreground">Disney Visa Cardholder</span>
              {disneyVisa && <span className="text-[10px] bg-green-500/20 text-green-400 font-semibold px-2 py-0.5 rounded-full">Extra savings unlocked</span>}
            </div>
          </div>
          <Button className="text-xs" onClick={handleSaveDisney} disabled={savingDisney}>
            {savingDisney ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Save Disney Profile
          </Button>
        </CardContent>
      </Card>

      {/* Section 4: Notification Preferences */}
      <Card className="border-primary/20 bg-card/80 mb-6 overflow-hidden">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">🔔 Notification Preferences</CardTitle>
          <CardDescription>Choose how and when Magic Pass contacts you</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">Alert Types</p>
              {([
                ["dining", "Dining Reservation Alerts"],
                ["giftCard", "Gift Card Deal Alerts"],
                ["hotelDrop", "Hotel Price Drop Alerts"],
                ["apHotel", "AP Hotel Deal Alerts"],
                ["apMerch", "AP Merchandise Drop Alerts"],
                ["waitTime", "Wait Time Alerts"],
                ["rideClosure", "Ride Closure Alerts"],
                ["rain", "Rain Radar Warnings"],
              ] as const).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs text-foreground">{label}</span>
                  <Switch checked={alerts[key as keyof typeof alerts]} onCheckedChange={(v) => setAlerts(prev => ({ ...prev, [key]: v }))} />
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">Delivery Methods</p>
              {([
                ["push", "Push Notifications", true],
                ["email", "Email Alerts", true],
                ["sms", "SMS Text Alerts", false],
                ["weekly", "Weekly Summary Email", true],
              ] as const).map(([key, label, enabled]) => (
                <div key={key} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-foreground">{label}</span>
                    {key === "sms" && !delivery.sms && <span className="text-[9px] bg-primary/15 text-primary font-semibold px-1.5 py-0.5 rounded-full">Upgrade to enable</span>}
                  </div>
                  <Switch checked={delivery[key as keyof typeof delivery]} onCheckedChange={(v) => setDelivery(prev => ({ ...prev, [key]: v }))} />
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">Quiet Hours</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground">Enable Quiet Hours</span>
                <Switch checked={quietHours} onCheckedChange={setQuietHours} />
              </div>
              {quietHours && (
                <>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">Quiet from:</label>
                    <Input type="time" defaultValue="22:00" className="bg-background/50 border-primary/20 text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block">Quiet until:</label>
                    <Input type="time" defaultValue="07:00" className="bg-background/50 border-primary/20 text-sm" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">No alerts will be sent during quiet hours</p>
                </>
              )}
            </div>
          </div>
          <Button className="text-xs">Save Notification Preferences</Button>
        </CardContent>
      </Card>

      {/* Section 5: Trip Profiles */}
      <Card className="border-primary/20 bg-card/80 mb-6 overflow-hidden">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">🎒 My Saved Trip Profiles</CardTitle>
          <CardDescription>Save your group, preferences, and past trips for quick planning</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-primary/25 bg-[var(--muted)]/60 p-4 space-y-2">
              <p className="text-sm font-bold text-foreground">🏰 Moss Family — May 2026</p>
              <p className="text-xs text-muted-foreground">Magic Kingdom · May 20–23 · Party of 5</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-primary/15 text-primary font-semibold px-2 py-0.5 rounded-full">Incredi-Pass ×2</span>
                <span className="text-[10px] bg-muted text-muted-foreground font-semibold px-2 py-0.5 rounded-full">Day Ticket ×2</span>
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10 text-xs">Edit</Button>
                <Button size="sm" className="text-xs">View Itinerary →</Button>
              </div>
            </div>
            <div className="rounded-xl border border-primary/10 bg-[var(--muted)]/30 p-4 space-y-2 opacity-80">
              <p className="text-sm font-bold text-foreground">🌍 EPCOT Food & Wine — Oct 2025</p>
              <p className="text-xs text-muted-foreground">EPCOT · Oct 14–16 · Party of 2</p>
              <span className="text-[10px] text-green-400 font-semibold">Completed ✅</span>
              <div className="pt-1">
                <Button variant="outline" size="sm" className="border-muted text-muted-foreground hover:text-foreground text-xs">View Summary</Button>
              </div>
            </div>
          </div>
          <button className="w-full rounded-xl border-2 border-dashed border-primary/30 py-4 text-sm font-medium text-primary hover:border-primary/60 transition-colors">+ Create New Trip Profile</button>
        </CardContent>
      </Card>

      {/* Section 6: Referral Program */}
      <Card className="border-primary/30 bg-card/80 mb-6 overflow-hidden">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">🎁 Refer a Friend — Earn Free Months</CardTitle>
          <CardDescription>Every friend who subscribes earns you 1 free month. They get their first month for $1.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input readOnly value="magicpassplus.com/ref/brandon-moss-x7k2" className="bg-background/50 border-primary/20 text-sm flex-1 font-mono" />
            <Button size="sm" className="text-xs shrink-0"><Copy className="w-3.5 h-3.5 mr-1" /> Copy Link</Button>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-primary/15 bg-[var(--muted)]/60 p-3">
              <p className="text-[10px] text-muted-foreground">Friends Referred</p>
              <p className="text-lg font-bold text-foreground">0</p>
            </div>
            <div className="rounded-lg border border-primary/15 bg-[var(--muted)]/60 p-3">
              <p className="text-[10px] text-muted-foreground">Free Months Earned</p>
              <p className="text-lg font-bold text-foreground">0</p>
            </div>
            <div className="rounded-lg border border-primary/15 bg-[var(--muted)]/60 p-3">
              <p className="text-[10px] text-muted-foreground">Total Saved</p>
              <p className="text-lg font-bold text-foreground">$0.00</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { icon: Mail, label: "Email" },
              { icon: MessageSquare, label: "SMS" },
              { icon: Twitter, label: "Twitter/X" },
              { icon: Facebook, label: "Facebook" },
              { icon: ClipboardCopy, label: "Copy" },
            ].map(s => (
              <Button key={s.label} variant="outline" size="sm" className="border-primary/20 text-muted-foreground hover:text-foreground text-xs gap-1.5">
                <s.icon className="w-3.5 h-3.5" /> {s.label}
              </Button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground italic">Share in Disney AP Facebook groups for the fastest results.</p>
        </CardContent>
      </Card>

            {/* Disney Account Connect */}
      <Card className="border-primary/20 bg-card/80 overflow-hidden">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            🏰 Disney Account
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Connect your Disney account to enable real-time dining reservation alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <DisneyConnectSection />
        </CardContent>
      </Card>

      {/* Section 7: Data & Privacy */}
      <Card className="border-primary/20 bg-card/80 overflow-hidden">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">🔐 Data & Privacy</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-primary/10">
            <span className="text-sm text-foreground">Download My Data</span>
            <Button variant="outline" size="sm" className="border-muted text-muted-foreground hover:text-foreground text-xs w-fit">Request Export</Button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-primary/10">
            <div>
              <span className="text-sm text-foreground">Delete My Account</span>
              <span className="text-xs text-muted-foreground ml-2">(This cannot be undone)</span>
            </div>
            <Button variant="outline" size="sm" className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs w-fit">Delete Account</Button>
          </div>
          <div className="flex flex-wrap items-center gap-4 py-2">
            <button className="text-xs text-primary hover:underline">Privacy Policy → View →</button>
            <button className="text-xs text-primary hover:underline">Terms of Service → View →</button>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};


// Disney Account Connect Component
function DisneyConnectSection() {
  const { session } = useAuth();
  const toastFn = (opts: { title: string; description?: string; variant?: string }) => toast(opts.title, { description: opts.description });
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";
  const SUPABASE_ANON = "sb_publishable_nQdtcwDbXVyr0Tc44YLTKA_9BfIKXQC";

  const getHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session?.access_token}`,
    "x-client-authorization": `Bearer ${session?.access_token}`,
    "apikey": SUPABASE_ANON,
  });

  useEffect(() => {
    if (!session) return;
    fetch(`${SUPABASE_URL}/functions/v1/disney-auth?action=status`, { headers: getHeaders() })
      .then(r => r.json())
      .then(d => setConnected(d.connected || false))
      .catch(() => setConnected(false))
      .finally(() => setLoading(false));
  }, [session]);

  const [manualToken, setManualToken] = useState("");
  const [showTokenInstructions, setShowTokenInstructions] = useState(false);

  const handleConnect = async () => {
    if (!manualToken.trim()) {
      setShowTokenInstructions(true);
      return;
    }
    setConnecting(true);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/disney-auth?action=save`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ access_token: manualToken.trim() }),
      });
      const data = await resp.json();
      if (data.success) {
        setConnected(true);
        setManualToken("");
        setShowTokenInstructions(false);
        toastFn({
          title: "✅ Disney account connected!",
          description: "Real-time dining alerts are now active.",
        });
      } else {
        throw new Error(data.error || "Token rejected");
      }
    } catch (err) {
      toastFn({ title: "Connection failed", description: err instanceof Error ? err.message : "Please try again", variant: "destructive" });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await fetch(`${SUPABASE_URL}/functions/v1/disney-auth?action=disconnect`, {
      method: "POST", headers: getHeaders(),
    });
    setConnected(false);
    toastFn({ title: "Disney account disconnected" });
  };

  if (loading) return <div className="h-8 bg-muted/20 rounded animate-pulse" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rounded-xl border border-white/10" style={{ background: "var(--muted)" }}>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {connected ? "✅ Disney Account Connected" : "⚠️ Not Connected"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {connected 
              ? "Real-time dining alerts active — checking every 60 seconds" 
              : "Connect to enable automatic dining reservation detection"}
          </p>
        </div>
        <div className={`w-3 h-3 rounded-full ${connected ? "bg-green-400" : "bg-yellow-400"}`} />
      </div>

      {!connected ? (
        <div className="space-y-3">
          {!showTokenInstructions ? (
            <>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-xs text-foreground font-semibold mb-1">Enable real-time dining alerts:</p>
                <p className="text-xs text-muted-foreground">Connect your Disney account to enable 60-second availability checking. Your Disney password is never stored.</p>
              </div>
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-60"
                style={{ background: "#F5C842", color: "#080E1E" }}
              >
                🏰 Connect Disney Account
              </button>
            </>
          ) : (
            <>
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
                <p className="text-xs font-bold text-foreground mb-2">📋 How to get your Disney token (2 min):</p>
                <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside leading-relaxed">
                  <li>Open <a href="https://disneyworld.disney.go.com/dine-res/availability/" target="_blank" rel="noopener noreferrer" className="text-primary underline">disneyworld.disney.go.com/dine-res/availability/</a> and log in</li>
                  <li>Press <code className="bg-white/10 px-1 rounded">F12</code> → click <strong>Network</strong> tab</li>
                  <li>Type <code className="bg-white/10 px-1 rounded">get-client-token</code> in the filter box</li>
                  <li>Change party size on the Disney page to trigger a request</li>
                  <li>Click the <code className="bg-white/10 px-1 rounded">get-client-token</code> entry → click <strong>Response</strong></li>
                  <li>Copy the value after <code className="bg-white/10 px-1 rounded">"access_token":</code></li>
                  <li>Paste it below and click Save</li>
                </ol>
                <p className="text-xs text-yellow-500 mt-2">⚠️ Token expires in 30 min — you'll reconnect periodically</p>
              </div>
              <textarea
                value={manualToken}
                onChange={e => setManualToken(e.target.value)}
                placeholder="Paste your Disney access_token here..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-white/10 text-xs text-foreground font-mono focus:outline-none focus:border-primary/40 resize-none"
                style={{ background: "var(--muted)" }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowTokenInstructions(false); setManualToken(""); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-white/10 text-muted-foreground hover:border-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConnect}
                  disabled={connecting || !manualToken.trim()}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50"
                  style={{ background: "#F5C842", color: "#080E1E" }}
                >
                  {connecting ? "Verifying..." : "✅ Save Token"}
                </button>
              </div>
            </>
          )}
          <p className="text-xs text-muted-foreground text-center">
            Your Disney password is never stored — only a temporary session token
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <p className="text-xs text-green-400">
              🍽️ Dining alerts are now checking in real-time. You'll be notified the instant a reservation opens.
            </p>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Disconnect Disney account
          </button>
        </div>
      )}
    </div>
  );
}



export default Settings;
