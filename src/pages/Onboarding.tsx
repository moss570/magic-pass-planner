import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Castle, ChevronRight, ChevronLeft, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

const steps = ["Your Profile", "Your Disney Info", "Your First Trip"];

const visitFrequencies = ["First time", "Once a year", "2-3 times", "4+ times", "Annual Passholder"];
const parkPreferences = ["Magic Kingdom", "EPCOT", "Hollywood Studios", "Animal Kingdom", "No preference"];
const passTiers = ["Pixie Dust", "Pirate", "Sorcerer", "Incredi-Pass"];
const tripParks = ["Magic Kingdom", "EPCOT", "Hollywood Studios", "Animal Kingdom", "Typhoon Lagoon", "Blizzard Beach"];

const PillSelector = ({ options, value, onChange, multi = false }: {
  options: string[];
  value: string | string[];
  onChange: (val: string | string[]) => void;
  multi?: boolean;
}) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => {
      const selected = multi ? (value as string[]).includes(opt) : value === opt;
      return (
        <button
          key={opt}
          type="button"
          onClick={() => {
            if (multi) {
              const arr = value as string[];
              onChange(selected ? arr.filter((v) => v !== opt) : [...arr, opt]);
            } else {
              onChange(opt);
            }
          }}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
            selected
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted/30 text-muted-foreground border-border hover:border-primary/50"
          )}
        >
          {opt}
        </button>
      );
    })}
  </div>
);

const Toggle = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-foreground">{label}</span>
    <div className="flex gap-2">
      {["Yes", "No"].map((opt) => {
        const isSelected = opt === "Yes" ? value : !value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt === "Yes")}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors",
              isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/30 text-muted-foreground border-border hover:border-primary/50"
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  </div>
);

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [homeZip, setHomeZip] = useState("");
  const [step1Error, setStep1Error] = useState("");

  // Step 2
  const [hasAP, setHasAP] = useState(false);
  const [apTier, setApTier] = useState("");
  const [apExpiration, setApExpiration] = useState<Date>();
  const [visitFreq, setVisitFreq] = useState("");
  const [homePark, setHomePark] = useState("");
  const [hasDisneyVisa, setHasDisneyVisa] = useState(false);
  const [hasDisneyPlus, setHasDisneyPlus] = useState(false);

  // Step 3
  const [planningTrip, setPlanningTrip] = useState(false);
  const [selectedParks, setSelectedParks] = useState<string[]>([]);
  const [travelStart, setTravelStart] = useState<Date>();
  const [travelEnd, setTravelEnd] = useState<Date>();
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [specialNote, setSpecialNote] = useState("");

  const progressValue = ((step + 1) / steps.length) * 100;

  const validateStep1 = () => {
    if (!firstName.trim() || !lastName.trim() || !homeZip.trim()) {
      setStep1Error("Please fill in all required fields.");
      return false;
    }
    setStep1Error("");
    return true;
  };

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("users_profile").update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || null,
        home_zip: homeZip.trim(),
        ap_pass_tier: hasAP ? apTier : "None",
        ap_expiration: hasAP && apExpiration ? format(apExpiration, "yyyy-MM-dd") : null,
        home_park: homePark || "Magic Kingdom",
        disney_visa: hasDisneyVisa,
        disney_plus: hasDisneyPlus,
        onboarding_complete: true,
      }).eq("id", user.id);

      if (error) throw error;

      toast.success(`🎉 Welcome to Magic Pass Plus, ${firstName.trim()}!`, {
        duration: 5000,
        style: { background: "#F5C842", color: "#080E1E", border: "none", fontWeight: 600 },
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ background: "#080E1E" }}>
      {/* Logo */}
      <div className="pt-8 pb-4 flex items-center gap-2">
        <Castle className="w-7 h-7 text-primary" />
        <span className="text-xl font-bold text-primary">Magic Pass</span>
      </div>

      {/* Progress */}
      <div className="w-full max-w-md px-6 mb-2">
        <div className="flex justify-between mb-2">
          {steps.map((s, i) => (
            <span key={s} className={cn("text-[11px] font-semibold", i <= step ? "text-primary" : "text-muted-foreground")}>{s}</span>
          ))}
        </div>
        <Progress value={progressValue} className="h-1.5 bg-muted" />
        <p className="text-primary text-xs font-semibold mt-2">Step {step + 1} of {steps.length}</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-[480px] mx-auto px-4 mt-4 pb-12">
        <div className="rounded-xl bg-card border border-border p-6 md:p-8">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">Welcome to Magic Pass Plus! 🏰</h2>
                <p className="text-sm text-muted-foreground mt-1">Let's set up your account — takes about 2 minutes</p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-foreground">First Name *</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1" placeholder="Walt" />
                </div>
                <div>
                  <Label className="text-foreground">Last Name *</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1" placeholder="Disney" />
                </div>
                <div>
                  <Label className="text-foreground">Phone Number</Label>
                  <p className="text-[11px] text-muted-foreground mb-1">For SMS alerts — optional</p>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-0" placeholder="(555) 123-4567" />
                </div>
                <div>
                  <Label className="text-foreground">Home Zip Code *</Label>
                  <p className="text-[11px] text-muted-foreground mb-1">Used to personalize your experience</p>
                  <Input value={homeZip} onChange={(e) => setHomeZip(e.target.value)} className="mt-0" placeholder="32830" />
                </div>
              </div>
              {step1Error && <p className="text-xs text-destructive">{step1Error}</p>}
              <Button className="w-full" onClick={() => validateStep1() && setStep(1)}>
                Continue <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">Tell us about your Disney experience 🎟️</h2>
                <p className="text-sm text-muted-foreground mt-1">This personalizes your itineraries, alerts, and recommendations</p>
              </div>
              <div className="space-y-5">
                <Toggle label="Do you have a Disney Annual Pass?" value={hasAP} onChange={setHasAP} />
                {hasAP && (
                  <div className="space-y-3 pl-2 border-l-2 border-primary/20">
                    <div>
                      <Label className="text-foreground text-xs">Pass Tier</Label>
                      <Select value={apTier} onValueChange={setApTier}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select tier" /></SelectTrigger>
                        <SelectContent>
                          {passTiers.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-foreground text-xs">Pass Expiration</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full mt-1 justify-start text-left font-normal", !apExpiration && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {apExpiration ? format(apExpiration, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={apExpiration} onSelect={setApExpiration} initialFocus className="p-3 pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-foreground text-xs mb-2 block">How often do you visit Disney World?</Label>
                  <PillSelector options={visitFrequencies} value={visitFreq} onChange={(v) => setVisitFreq(v as string)} />
                </div>

                <div>
                  <Label className="text-foreground text-xs mb-2 block">Home park preference</Label>
                  <PillSelector options={parkPreferences} value={homePark} onChange={(v) => setHomePark(v as string)} />
                </div>

                <Toggle label="Do you have a Disney Visa Card?" value={hasDisneyVisa} onChange={setHasDisneyVisa} />
                <Toggle label="Are you a Disney+ subscriber?" value={hasDisneyPlus} onChange={setHasDisneyPlus} />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button onClick={() => setStep(0)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <Button onClick={() => setStep(2)}>
                  Continue <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">Planning a trip? Let's add it 🗺️</h2>
                <p className="text-sm text-muted-foreground mt-1">You can always add or change this later</p>
              </div>
              <div className="space-y-5">
                <Toggle label="Are you planning a Disney trip?" value={planningTrip} onChange={setPlanningTrip} />

                {planningTrip ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-foreground text-xs mb-2 block">Which park(s)?</Label>
                      <PillSelector options={tripParks} value={selectedParks} onChange={(v) => setSelectedParks(v as string[])} multi />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-foreground text-xs">Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full mt-1 justify-start text-left font-normal text-xs", !travelStart && "text-muted-foreground")}>
                              <CalendarIcon className="mr-1 h-3 w-3" />
                              {travelStart ? format(travelStart, "MMM d, yyyy") : "Start"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={travelStart} onSelect={setTravelStart} initialFocus className="p-3 pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label className="text-foreground text-xs">End Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full mt-1 justify-start text-left font-normal text-xs", !travelEnd && "text-muted-foreground")}>
                              <CalendarIcon className="mr-1 h-3 w-3" />
                              {travelEnd ? format(travelEnd, "MMM d, yyyy") : "End"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={travelEnd} onSelect={setTravelEnd} initialFocus className="p-3 pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-foreground text-xs">Adults</Label>
                        <div className="flex items-center gap-3 mt-1">
                          <button type="button" onClick={() => setAdults(Math.max(1, adults - 1))} className="w-8 h-8 rounded-lg bg-muted/30 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"><Minus className="w-3 h-3" /></button>
                          <span className="text-sm font-semibold text-foreground w-6 text-center">{adults}</span>
                          <button type="button" onClick={() => setAdults(adults + 1)} className="w-8 h-8 rounded-lg bg-muted/30 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"><Plus className="w-3 h-3" /></button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-foreground text-xs">Children</Label>
                        <div className="flex items-center gap-3 mt-1">
                          <button type="button" onClick={() => setChildren(Math.max(0, children - 1))} className="w-8 h-8 rounded-lg bg-muted/30 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"><Minus className="w-3 h-3" /></button>
                          <span className="text-sm font-semibold text-foreground w-6 text-center">{children}</span>
                          <button type="button" onClick={() => setChildren(children + 1)} className="w-8 h-8 rounded-lg bg-muted/30 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"><Plus className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-foreground text-xs">Anything special?</Label>
                      <Input value={specialNote} onChange={(e) => setSpecialNote(e.target.value)} className="mt-1" placeholder="e.g. birthday trip, first time, anniversary" />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground bg-muted/20 rounded-lg p-4">No problem — you can add a trip anytime from your dashboard.</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <Button onClick={handleComplete} disabled={saving} className="min-w-[160px]">
                  {saving ? "Saving..." : "Complete Setup"} {!saving && <ChevronRight className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
