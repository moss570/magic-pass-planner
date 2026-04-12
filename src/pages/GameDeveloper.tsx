import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, MapPin, Upload, Check, X, AlertTriangle, Image as ImageIcon } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PARKS = ["Magic Kingdom", "EPCOT", "Hollywood Studios", "Animal Kingdom", "Typhoon Lagoon", "Blizzard Beach", "Disney Springs", "Grand Floridian Resort", "Polynesian Resort", "Contemporary Resort", "Wilderness Lodge", "Animal Kingdom Lodge", "Caribbean Beach", "Coronado Springs", "Boardwalk Inn"];

const GAME_TYPES = [
  { id: "where_am_i", label: "📸 Where Am I?", description: "Close-up photo of a location detail — players guess where it was taken" },
  { id: "scavenger_hunt", label: "🔍 Queue Scavenger Hunt", description: "Photo of an item hidden in a ride queue — players find and photograph it" },
];

const MK_QUEUES = ["TRON Lightcycle / Run", "Space Mountain", "Seven Dwarfs Mine Train", "Big Thunder Mountain Railroad", "Haunted Mansion", "Pirates of the Caribbean", "Jungle Cruise", "Peter Pan's Flight", "Tiana's Bayou Adventure"];
const EPCOT_QUEUES = ["Guardians of the Galaxy: Cosmic Rewind", "Test Track", "Frozen Ever After", "Remy's Ratatouille Adventure", "Soarin'"];
const HS_QUEUES = ["Star Wars: Rise of the Resistance", "Millennium Falcon: Smugglers Run", "Slinky Dog Dash", "Tower of Terror", "Mickey & Minnie's Runaway Railway"];
const AK_QUEUES = ["Avatar Flight of Passage", "Na'vi River Journey", "Kilimanjaro Safaris", "Expedition Everest"];

const QUEUE_MAP: Record<string, string[]> = {
  "Magic Kingdom": MK_QUEUES,
  "EPCOT": EPCOT_QUEUES,
  "Hollywood Studios": HS_QUEUES,
  "Animal Kingdom": AK_QUEUES,
};

export default function GameDeveloper() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isGameDev, setIsGameDev] = useState<boolean | null>(null);
  const [gameType, setGameType] = useState("where_am_i");
  const [selectedPark, setSelectedPark] = useState("Magic Kingdom");
  const [selectedQueue, setSelectedQueue] = useState("");
  const [locationName, setLocationName] = useState("");
  const [title, setTitle] = useState("");
  const [clueDescription, setClueDescription] = useState("");
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState(["", "", "", ""]);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{lat: number; lng: number} | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);

  // Check if user is a game developer
  useEffect(() => {
    if (!session) return;
    supabase.from("vip_accounts")
      .select("is_game_developer")
      .eq("user_id", session.user.id)
      .single()
      .then(({ data }) => {
        setIsGameDev(data?.is_game_developer || false);
      });

    // Load my submissions
    supabase.from("game_content")
      .select("*")
      .eq("submitted_by", session.user.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setMySubmissions(data || []));

    // Get GPS
    navigator.geolocation?.getCurrentPosition(pos => {
      setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }, [session]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submitContent = async () => {
    if (!session || !selectedImage || !title.trim()) {
      toast({ title: "Please fill in all required fields and select a photo", variant: "destructive" });
      return;
    }
    if (gameType === "where_am_i" && multipleChoiceOptions.filter(o => o.trim()).length < 4) {
      toast({ title: "Please fill in all 4 multiple choice options", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // Upload image to Supabase Storage
      const fileName = `${session.user.id}-${Date.now()}.${selectedImage.name.split('.').pop()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("game-photos")
        .upload(fileName, selectedImage, { contentType: selectedImage.type });

      let imageUrl = "";
      if (uploadError) {
        // Fallback: store as base64 if storage fails
        imageUrl = imagePreview || "";
      } else {
        const { data: { publicUrl } } = supabase.storage.from("game-photos").getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      // Insert game content record
      const { error: insertError } = await supabase.from("game_content").insert({
        game_type: gameType,
        title: title.trim(),
        image_url: imageUrl,
        location_name: locationName.trim() || selectedQueue || selectedPark,
        park: selectedPark,
        queue_name: gameType === "scavenger_hunt" ? selectedQueue : null,
        gps_lat: gpsLocation?.lat || null,
        gps_lng: gpsLocation?.lng || null,
        multiple_choice: gameType === "where_am_i" ? multipleChoiceOptions.filter(o => o.trim()) : null,
        correct_answer: gameType === "where_am_i" ? correctAnswerIndex : null,
        clue_description: clueDescription.trim() || null,
        submitted_by: session.user.id,
        status: "pending",
      });

      if (insertError) throw insertError;

      setSubmitted(true);
      toast({ title: "✅ Submitted for review!", description: "An admin will review and approve your content within 24 hours." });
      
      // Reset form
      setTitle(""); setClueDescription(""); setLocationName("");
      setMultipleChoiceOptions(["", "", "", ""]);
      setSelectedImage(null); setImagePreview(null);
      
      // Reload submissions
      const { data } = await supabase.from("game_content").select("*").eq("submitted_by", session.user.id).order("created_at", { ascending: false }).limit(10);
      setMySubmissions(data || []);

    } catch (err) {
      toast({ title: "Submission failed", description: String(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (isGameDev === null) return (
    <DashboardLayout title="🎮 Game Developer Mode" subtitle="Loading...">
      <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
    </DashboardLayout>
  );

  if (!isGameDev) return (
    <DashboardLayout title="🎮 Game Developer Mode" subtitle="Exclusive access">
      <div className="text-center py-16 max-w-sm mx-auto">
        <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
        <p className="text-sm font-semibold text-foreground mb-2">Game Developer Access Required</p>
        <p className="text-xs text-muted-foreground mb-6">This mode is only available to designated Game Developers. Contact Brandon to get access.</p>
        <button onClick={() => navigate("/live-park")} className="px-6 py-2.5 rounded-xl font-bold text-sm text-[#070b15]" style={{ background: "#F0B429" }}>Back to Live Park →</button>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="🎮 Game Developer Mode" subtitle={`Submitting content for ${selectedPark}`}>
      <div className="space-y-5">
        {/* GPS Status */}
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold ${gpsLocation ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"}`}>
          <MapPin className="w-4 h-4" />
          {gpsLocation ? `📍 GPS Active — ${gpsLocation.lat.toFixed(4)}, ${gpsLocation.lng.toFixed(4)}` : "📍 Enable GPS for automatic location tagging"}
        </div>

        {/* Game type selector */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Game Type</p>
          <div className="space-y-2">
            {GAME_TYPES.map(gt => (
              <button key={gt.id} onClick={() => setGameType(gt.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${gameType === gt.id ? "border-primary/50 bg-primary/10" : "border-white/10 hover:border-white/20"}`}>
                <p className="text-sm font-bold text-foreground">{gt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{gt.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Park selector */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Location</p>
          <select value={selectedPark} onChange={e => { setSelectedPark(e.target.value); setSelectedQueue(""); }}
            className="w-full px-3 py-2.5 rounded-xl border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40"
            style={{ background: "var(--card)", minHeight: 44 }}>
            {PARKS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Queue selector (scavenger hunt only) */}
        {gameType === "scavenger_hunt" && QUEUE_MAP[selectedPark] && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Queue / Attraction</p>
            <select value={selectedQueue} onChange={e => setSelectedQueue(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40"
              style={{ background: "var(--card)", minHeight: 44 }}>
              <option value="">Select queue...</option>
              {QUEUE_MAP[selectedPark].map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>
        )}

        {/* Photo capture */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Photo *</p>
          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden border border-white/10" style={{ aspectRatio: "4/3" }}>
              <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
              <button onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80">
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-green-500/80 text-white text-xs font-semibold">
                ✅ Photo ready
              </div>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-white/20 hover:border-primary/40 transition-colors flex flex-col items-center justify-center gap-3 py-10">
              <Camera className="w-10 h-10 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">Tap to take or select photo</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, HEIC up to 5MB</p>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} />
        </div>

        {/* Title */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Title / Description *</p>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder={gameType === "where_am_i" ? "e.g. The Grand Mosaic Floor" : "e.g. Hidden Mickey on the Wall"}
            className="w-full px-3 py-2.5 rounded-xl border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40"
            style={{ background: "var(--card)", minHeight: 44 }} />
        </div>

        {/* Clue description */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Clue / Hint (optional)</p>
          <textarea value={clueDescription} onChange={e => setClueDescription(e.target.value)} rows={2}
            placeholder={gameType === "where_am_i" ? "e.g. A stunning mosaic visible from the queue entrance" : "e.g. Look for it about halfway through the outdoor queue section"}
            className="w-full px-3 py-2.5 rounded-xl border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40 resize-none"
            style={{ background: "var(--card)" }} />
        </div>

        {/* Multiple choice (Where Am I? only) */}
        {gameType === "where_am_i" && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Multiple Choice Options * (mark the correct one)</p>
            <div className="space-y-2">
              {multipleChoiceOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button onClick={() => setCorrectAnswerIndex(i)}
                    className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border-2 transition-all ${correctAnswerIndex === i ? "border-green-500 bg-green-500/20" : "border-white/20"}`}>
                    {correctAnswerIndex === i ? <Check className="w-4 h-4 text-green-400" /> : <span className="text-xs text-muted-foreground">{i+1}</span>}
                  </button>
                  <input value={opt} onChange={e => { const n = [...multipleChoiceOptions]; n[i] = e.target.value; setMultipleChoiceOptions(n); }}
                    placeholder={`Option ${i+1}${i === correctAnswerIndex ? " ✅ (correct)" : ""}`}
                    className="flex-1 px-3 py-2 rounded-lg border text-sm text-foreground focus:outline-none focus:border-primary/40"
                    style={{ background: "var(--card)", borderColor: correctAnswerIndex === i ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.1)", minHeight: 40 }} />
                </div>
              ))}
              <p className="text-xs text-muted-foreground">Tap the circle to mark which option is correct</p>
            </div>
          </div>
        )}

        {/* Submit button */}
        <button onClick={submitContent} disabled={submitting || !selectedImage || !title.trim()}
          className="w-full py-4 rounded-2xl font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: "#F0B429", color: "#070b15" }}>
          {submitting ? <><span className="w-5 h-5 rounded-full border-2 border-[#070b15] border-t-transparent animate-spin" /> Submitting...</> : <><Upload className="w-5 h-5" /> Submit for Review</>}
        </button>
        <p className="text-xs text-muted-foreground text-center">Your submission will be reviewed by an admin before going live in the game</p>

        {/* My submissions */}
        {mySubmissions.length > 0 && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">My Submissions ({mySubmissions.length})</p>
            <div className="space-y-2">
              {mySubmissions.map(sub => (
                <div key={sub.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/8" style={{ background: "var(--card)" }}>
                  {sub.image_url && <img src={sub.image_url} className="w-12 h-12 rounded-lg object-cover shrink-0" alt="" onError={e => (e.currentTarget.style.display='none')} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{sub.title}</p>
                    <p className="text-xs text-muted-foreground">{sub.park} · {sub.game_type === "where_am_i" ? "Where Am I?" : "Scavenger Hunt"}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${sub.status === "approved" ? "bg-green-500/20 text-green-400" : sub.status === "rejected" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                    {sub.status === "approved" ? "✅ Live" : sub.status === "rejected" ? "❌ Rejected" : "⏳ Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
