import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Castle, Upload, Copy, Mail, MessageSquare, Twitter, Facebook, ClipboardCopy, Loader2, Trash2, Pencil, Eye } from "lucide-react";
import WalkingSpeedCalibrator from "@/components/settings/WalkingSpeedCalibrator";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PLANS, type PlanId } from "@/lib/stripe";

const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrbmVsaHJtZ3NwdXp0ZWhldHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzcyNzgsImV4cCI6MjA5MDgxMzI3OH0.vjT4Iun32HsCfoO7nVnfzLBnJy-Lye6N9ZryBbWuAjo";

const Settings = () => {
  const navigate = useNavigate();
  const { user, session } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [homeZip, setHomeZip] = useState("");
  const [username, setUsername] = useState("");
  const [membershipCategory, setMembershipCategory] = useState("Annual Passholder");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [walkingSpeedKmh, setWalkingSpeedKmh] = useState<number | null>(null);

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
  const { subscription, planId, planName, billingInterval, periodEnd, subscribed, refresh: refreshSubscription } = useSubscription();

  // Cancel subscription dialog state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showFinalCancel, setShowFinalCancel] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);

  // Delete account dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Manage billing loading
  const [loadingBilling, setLoadingBilling] = useState(false);

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
          setUsername((data as any).username || "");
          setMembershipCategory((data as any).membership_category || "Annual Passholder");
          setAvatarUrl((data as any).avatar_url || null);
          setWalkingSpeedKmh((data as any).walking_speed_kmh || null);
        }
        setLoadingProfile(false);
      });
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
    if (uploadError) {
      toast.error("Upload failed — please try again");
      setUploadingAvatar(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const url = `${publicUrl}?t=${Date.now()}`;
    await supabase.from("users_profile").upsert({ id: user.id, avatar_url: url } as any);
    setAvatarUrl(url);
    setUploadingAvatar(false);
    toast.success("Profile photo updated!");
  };

  const handleSaveAccount = async () => {
    if (!username.trim()) {
      toast.error("Username required — please set a username for your public profile");
      return;
    }
    if (!user) return;
    setSavingAccount(true);
    const updateData: any = {
      id: user.id,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      home_zip: homeZip,
    };
    if (username.trim()) updateData.username = username.trim();
    if (membershipCategory) updateData.membership_category = membershipCategory;
    const { error } = await supabase.from("users_profile").upsert(updateData);
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

  const getHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session?.access_token}`,
    "x-client-authorization": `Bearer ${session?.access_token}`,
    "apikey": SUPABASE_ANON_KEY,
  });

  const handleManageBilling = async () => {
    if (!session) return;
    setLoadingBilling(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/customer-portal`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        toast.error(data.error || "Could not open billing portal");
      }
    } catch {
      toast.error("Failed to open billing portal");
    } finally {
      setLoadingBilling(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!session) return;
    setCancellingSubscription(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/cancel-subscription`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Subscription cancelled. You'll keep access until the end of your billing period.");
        setShowFinalCancel(false);
        setShowCancelDialog(false);
        refreshSubscription();
      } else {
        toast.error(data.error || "Cancellation failed");
      }
    } catch {
      toast.error("Cancellation failed — please try again");
    } finally {
      setCancellingSubscription(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!session) return;
    setDeletingAccount(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Account deleted. We're sorry to see you go.");
        await supabase.auth.signOut();
        navigate("/");
      } else {
        toast.error(data.error || "Account deletion failed");
      }
    } catch {
      toast.error("Account deletion failed — please try again");
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleRequestExport = async () => {
    if (!user) return;
    const { data: profile } = await supabase.from("users_profile").select("*").eq("id", user.id).single();
    const { data: trips } = await supabase.from("saved_trips").select("*").eq("user_id", user.id);
    const exportData = { profile, trips, exported_at: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `magic-pass-data-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data export downloaded!");
  };

  // Get current plan display info
  const currentPlan = PLANS[planId];
  const planDisplayName = currentPlan?.displayName || planName || "Free";

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Username <span className="text-red-400 font-bold">*</span> <span className="text-muted-foreground/60">— Shown publicly on Social Feed</span></label>
              <Input value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, "").toLowerCase())} placeholder="@magicfan123" className="bg-background/50 border-primary/20 text-sm" maxLength={30} required />
              <p className="text-xs text-muted-foreground mt-1">This is your public identity — your real name is never shown on Social Feed</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Membership Category</label>
              <Select value={membershipCategory} onValueChange={setMembershipCategory}>
                <SelectTrigger className="bg-background/50 border-primary/20 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Annual Passholder">🎟️ Annual Passholder</SelectItem>
                  <SelectItem value="DVC Member">🏰 DVC Member</SelectItem>
                  <SelectItem value="Out of State Traveler">✈️ Out of State Traveler</SelectItem>
                </SelectContent>
              </Select>
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
            <Avatar className="w-14 h-14">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile" />}
              <AvatarFallback className="text-lg font-bold">{firstName ? firstName[0].toUpperCase() : "?"}</AvatarFallback>
            </Avatar>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10 text-xs" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}>
              {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
              {uploadingAvatar ? "Uploading…" : "Upload Photo"}
            </Button>
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
            if (!subscribed) {
              return (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <p className="text-sm text-muted-foreground">No active plan · Free trial available</p>
                  <Link to="/pricing">
                    <Button className="text-xs" style={{ background: "#F0B429", color: "#070b15" }}>Choose a Plan →</Button>
                  </Link>
                </div>
              );
            }
            const status = subscription?.status;
            const trialEnd = subscription?.trial_end ? new Date(subscription.trial_end) : null;
            const pEnd = periodEnd ? new Date(periodEnd) : null;
            const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000)) : 0;

            return (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 bg-primary/15 text-primary text-xs font-semibold px-3 py-1.5 rounded-full w-fit">
                    <Castle className="w-3 h-3" /> {planDisplayName}
                  </span>
                  <div>
                    {billingInterval && (
                      <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full mr-2">
                        {billingInterval === 'annual' ? 'Annual' : billingInterval === 'monthly' ? 'Monthly' : 'One-Time'}
                      </span>
                    )}
                    {status === "trialing" && (
                      <p className="text-xs text-green-400 font-medium mt-1">🟢 Free trial · {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining</p>
                    )}
                    {status === "active" && pEnd && (
                      <p className="text-sm text-foreground font-medium mt-1">🟢 Active · Next billing: {pEnd.toLocaleDateString()}</p>
                    )}
                    {status === "canceled" && pEnd && (
                      <p className="text-sm text-destructive font-medium mt-1">Canceled · Access until {pEnd.toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </>
            );
          })()}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Link to="/pricing">
              <Button className="text-xs">⬆️ Upgrade / Change Plan</Button>
            </Link>
            {subscribed && (
              <Button
                variant="outline"
                className="text-xs border-muted text-muted-foreground hover:text-foreground"
                onClick={handleManageBilling}
                disabled={loadingBilling}
              >
                {loadingBilling ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
                Manage Billing →
              </Button>
            )}
          </div>

          {/* Cancel Subscription */}
          {subscribed && subscription?.status !== "canceled" && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2">
              <p className="text-sm font-semibold text-destructive">Cancel Subscription</p>
              <p className="text-xs text-muted-foreground">You can cancel anytime. You'll keep access until the end of your billing period. Your account and data will be preserved.</p>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs"
                onClick={() => setShowCancelDialog(true)}
              >
                Cancel Subscription
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Subscription Dialog — Step 1: Offer downgrade */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Before you go…</DialogTitle>
            <DialogDescription>
              Would you consider switching to a more affordable plan instead of cancelling completely?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {planId !== 'magic_pass_planner' && planId !== 'free' && (
              <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                <p className="text-sm font-semibold text-foreground">Magic Pass Planner — ${PLANS.magic_pass_planner.monthlyPrice}/mo</p>
                <p className="text-xs text-muted-foreground mt-1">Keep Dining Alerts, Trip Planner, Gift Card Tracker, and Live Park Mode at a lower price.</p>
                <Link to="/pricing">
                  <Button size="sm" className="mt-2 text-xs" onClick={() => setShowCancelDialog(false)}>
                    Switch to This Plan →
                  </Button>
                </Link>
              </div>
            )}
            {planId !== 'ninety_day_planner' && planId !== 'free' && (
              <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                <p className="text-sm font-semibold text-foreground">90 Day Magic Pass Planner — ${PLANS.ninety_day_planner.oneTimePrice} one-time</p>
                <p className="text-xs text-muted-foreground mt-1">One-time purchase, no recurring charges. Perfect for a single trip.</p>
                <Link to="/pricing">
                  <Button size="sm" variant="outline" className="mt-2 text-xs border-primary/30" onClick={() => setShowCancelDialog(false)}>
                    View Plans →
                  </Button>
                </Link>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setShowCancelDialog(false)}>
              Never mind, keep my plan
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => { setShowCancelDialog(false); setShowFinalCancel(true); }}
            >
              I still want to cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog — Step 2: Final confirmation */}
      <AlertDialog open={showFinalCancel} onOpenChange={setShowFinalCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Cancellation</AlertDialogTitle>
            <AlertDialogDescription>
              Your subscription will remain active until the end of your current billing period. After that, you'll lose access to premium features but your account and data will be kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Keep My Subscription</AlertDialogCancel>
            <AlertDialogAction
              className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleCancelSubscription}
              disabled={cancellingSubscription}
            >
              {cancellingSubscription ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
              Yes, Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                ["push", "Push Notifications"],
                ["email", "Email Alerts"],
                ["sms", "SMS Text Alerts"],
                ["weekly", "Weekly Summary Email"],
              ] as const).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-foreground">{label}</span>
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

      {/* Section 5b: Trip Preferences — Walking Speed */}
      {isFeatureEnabled("budgetUpgrades") && user && (
        <div className="mb-6">
          <WalkingSpeedCalibrator userId={user.id} currentSpeed={walkingSpeedKmh} />
        </div>
      )}

      {/* Section 5c: Trip Planner Defaults */}
      <TripPlannerDefaultsSection userId={user?.id} />

      {/* My Trips link card */}
      <Card className="border-primary/20 bg-card/80 mb-6 overflow-hidden">
        <CardContent className="p-4 md:p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-foreground">🎒 My Saved Trips</p>
            <p className="text-xs text-muted-foreground">View and manage all your trip plans</p>
          </div>
          <Link to="/my-trips">
            <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10 text-xs">
              View Trips →
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Section 6: Referral Program — Coming Soon */}
      <Card className="border-primary/30 bg-card/80 mb-6 overflow-hidden relative">
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-lg">
          <span className="bg-primary/15 text-primary text-sm font-bold px-4 py-2 rounded-full">🚀 Coming Soon</span>
        </div>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">🎁 Refer a Friend — Earn Free Months</CardTitle>
          <CardDescription>Every friend who subscribes earns you 1 free month. They get their first month for $1.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input readOnly value="magicpassplus.com/ref/your-code" className="bg-background/50 border-primary/20 text-sm flex-1 font-mono" />
            <Button size="sm" className="text-xs shrink-0" disabled><Copy className="w-3.5 h-3.5 mr-1" /> Copy Link</Button>
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
            <Button variant="outline" size="sm" className="border-muted text-muted-foreground hover:text-foreground text-xs w-fit" onClick={handleRequestExport}>
              Request Export
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-primary/10">
            <div>
              <span className="text-sm text-foreground">Delete My Account</span>
              <span className="text-xs text-muted-foreground ml-2">(This permanently removes all data and cannot be undone)</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs w-fit"
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete Account
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            <strong>Cancel Subscription</strong> stops billing but keeps your account and data. <strong>Delete Account</strong> permanently removes everything.
          </p>
          <div className="flex flex-wrap items-center gap-4 py-2">
            <Link to="/privacy-policy" className="text-xs text-primary hover:underline">Privacy Policy →</Link>
            <Link to="/terms" className="text-xs text-primary hover:underline">Terms of Service →</Link>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Your Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account, all saved trips, alerts, profile data, and subscription. This action cannot be undone. If you just want to stop billing, use "Cancel Subscription" instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Keep My Account</AlertDialogCancel>
            <AlertDialogAction
              className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
            >
              {deletingAccount ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
              Yes, Delete Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};


// Trip Planner Defaults Section Component
function TripPlannerDefaultsSection({ userId }: { userId?: string }) {
  const [defaults, setDefaults] = useState({
    default_trip_mode: 'vacation',
    default_party_adults: 2,
    default_party_children: 0,
    default_ride_preference: 'mix',
    default_ll_option: 'multi',
  });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("users_profile")
      .select("default_trip_mode, default_party_adults, default_party_children, default_ride_preference, default_ll_option")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        if (data) {
          setDefaults({
            default_trip_mode: (data as any).default_trip_mode || 'vacation',
            default_party_adults: (data as any).default_party_adults ?? 2,
            default_party_children: (data as any).default_party_children ?? 0,
            default_ride_preference: (data as any).default_ride_preference || 'mix',
            default_ll_option: (data as any).default_ll_option || 'multi',
          });
        }
        setLoaded(true);
      });
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase.from("users_profile").upsert({
      id: userId,
      ...defaults,
    } as any);
    setSaving(false);
    if (error) {
      toast.error("❌ Save failed — please try again");
    } else {
      toast.success("✅ Trip Planner defaults saved");
    }
  };

  if (!loaded) return null;

  return (
    <Card className="border-primary/20 bg-card/80 mb-6 overflow-hidden">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-base md:text-lg">🗺️ Trip Planner Defaults</CardTitle>
        <CardDescription>Pre-fill your Trip Planner wizard with your usual preferences</CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Default Planning Mode</label>
            <Select value={defaults.default_trip_mode} onValueChange={(v) => setDefaults(d => ({ ...d, default_trip_mode: v }))}>
              <SelectTrigger className="bg-background/50 border-primary/20 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="vacation">🏰 Vacation Planner</SelectItem>
                <SelectItem value="day-trip">☀️ Day Trip Itinerary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Default Ride Preference</label>
            <Select value={defaults.default_ride_preference} onValueChange={(v) => setDefaults(d => ({ ...d, default_ride_preference: v }))}>
              <SelectTrigger className="bg-background/50 border-primary/20 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="thrill">🎢 Thrill Seeker</SelectItem>
                <SelectItem value="family">🎠 Family Friendly</SelectItem>
                <SelectItem value="little">👶 Little Ones First</SelectItem>
                <SelectItem value="mix">⚖️ Mix of Everything</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Default Adults</label>
            <Input
              type="number"
              min={1}
              max={20}
              value={defaults.default_party_adults}
              onChange={(e) => setDefaults(d => ({ ...d, default_party_adults: parseInt(e.target.value) || 1 }))}
              className="bg-background/50 border-primary/20 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Default Children</label>
            <Input
              type="number"
              min={0}
              max={20}
              value={defaults.default_party_children}
              onChange={(e) => setDefaults(d => ({ ...d, default_party_children: parseInt(e.target.value) || 0 }))}
              className="bg-background/50 border-primary/20 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Lightning Lane Preference</label>
            <Select value={defaults.default_ll_option} onValueChange={(v) => setDefaults(d => ({ ...d, default_ll_option: v }))}>
              <SelectTrigger className="bg-background/50 border-primary/20 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="multi">Multi Pass</SelectItem>
                <SelectItem value="individual">Individual LL</SelectItem>
                <SelectItem value="both">Both</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">These defaults auto-fill the Trip Planner wizard. Your Annual Pass status is pulled from your Disney Profile above.</p>
        <Button className="text-xs" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
          Save Trip Planner Defaults
        </Button>
      </CardContent>
    </Card>
  );
}

export default Settings;
