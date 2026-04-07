import { useState, useEffect, useRef } from "react";
import { Heart, Upload, Camera, Star, Trophy, Sparkles, X, Filter, Image as ImageIcon, Sunset } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const PHOTO_TYPES = [
  { id: "fireworks", label: "🎆 Fireworks from a Ride", description: "Photos taken while on a ride during fireworks" },
  { id: "sunset", label: "🌅 Sunset at Disney", description: "Golden hour and sunset shots from around the parks" },
  { id: "golden_hour", label: "✨ Golden Hour Magic", description: "Magical golden hour lighting at Disney" },
];

const PARKS = ["Magic Kingdom", "EPCOT", "Hollywood Studios", "Animal Kingdom", "Disney Springs", "Typhoon Lagoon", "Blizzard Beach", "Grand Floridian", "Polynesian", "Contemporary", "Wilderness Lodge", "Animal Kingdom Lodge"];
const FIREWORKS_RIDES = ["Big Thunder Mountain Railroad", "Tiana's Bayou Adventure", "TRON Lightcycle / Run", "Seven Dwarfs Mine Train", "Jungle Cruise", "Haunted Mansion", "Astro Orbiter", "Dumbo the Flying Elephant"];

interface Photo {
  id: string; user_id: string; display_name: string; photo_type: string;
  image_url: string; title: string; location: string; park: string;
  ride_name?: string; description?: string; vote_count: number;
  is_featured: boolean; created_at: string;
}

export default function PhotoContest() {
  const { session } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Upload form
  const [photoType, setPhotoType] = useState("fireworks");
  const [selectedPark, setSelectedPark] = useState("Magic Kingdom");
  const [rideName, setRideName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const loadPhotos = async () => {
    setLoading(true);
    let query = supabase.from("photo_submissions").select("*").neq("status", "removed").order("vote_count", { ascending: false }).order("created_at", { ascending: false }).limit(50);
    if (filter !== "all") query = query.eq("photo_type", filter);
    const { data } = await query;
    setPhotos(data || []);

    if (session) {
      const { data: votes } = await supabase.from("photo_votes").select("photo_id").eq("user_id", session.user.id);
      setMyVotes(new Set((votes || []).map(v => v.photo_id)));
    }
    setLoading(false);
  };

  useEffect(() => { loadPhotos(); }, [filter, session]);

  const handleVote = async (photoId: string, currentVotes: number) => {
    if (!session) { toast({ title: "Please log in to vote", variant: "destructive" }); return; }
    const hasVoted = myVotes.has(photoId);

    if (hasVoted) {
      await supabase.from("photo_votes").delete().eq("photo_id", photoId).eq("user_id", session.user.id);
      await supabase.from("photo_submissions").update({ vote_count: currentVotes - 1 }).eq("id", photoId);
      setMyVotes(v => { const n = new Set(v); n.delete(photoId); return n; });
      setPhotos(p => p.map(ph => ph.id === photoId ? { ...ph, vote_count: ph.vote_count - 1 } : ph));
    } else {
      await supabase.from("photo_votes").insert({ photo_id: photoId, user_id: session.user.id });
      await supabase.from("photo_submissions").update({ vote_count: currentVotes + 1 }).eq("id", photoId);
      setMyVotes(v => new Set([...v, photoId]));
      setPhotos(p => p.map(ph => ph.id === photoId ? { ...ph, vote_count: ph.vote_count + 1 } : ph));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submitPhoto = async () => {
    if (!session || !selectedFile || !title.trim()) {
      toast({ title: "Please fill in all required fields", variant: "destructive" }); return;
    }
    setUploading(true);
    try {
      // Get user display name
      const { data: profile } = await supabase.from("users_profile").select("first_name, last_name").eq("id", session.user.id).single();
      const displayName = profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : "Magic Pass Member";

      // Upload to storage
      const ext = selectedFile.name.split('.').pop();
      const fileName = `${session.user.id}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("game-photos").upload(`contest/${fileName}`, selectedFile, { contentType: selectedFile.type });
      
      let imageUrl = preview || ""; // fallback to base64 if storage fails
      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage.from("game-photos").getPublicUrl(`contest/${fileName}`);
        imageUrl = publicUrl;
      }

      await supabase.from("photo_submissions").insert({
        user_id: session.user.id,
        display_name: displayName,
        photo_type: photoType,
        image_url: imageUrl,
        title: title.trim(),
        location: selectedPark,
        park: selectedPark,
        ride_name: photoType === "fireworks" ? rideName || null : null,
        description: description.trim() || null,
      });

      toast({ title: "🎉 Photo submitted!", description: "Your photo is now live in the contest!" });
      setShowUpload(false);
      setTitle(""); setDescription(""); setRideName(""); setSelectedFile(null); setPreview(null);
      loadPhotos();
    } catch (err) {
      toast({ title: "Upload failed", description: String(err), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const topPhotos = [...photos].slice(0, 3);

  return (
    <DashboardLayout title="📸 Community Photo Contest" subtitle="Share your best Disney fireworks & sunset shots — vote for your favorites">
      <div className="space-y-5">

        {/* Weekly winners banner */}
        {topPhotos.length > 0 && (
          <div className="rounded-xl p-4 border" style={{ background: "linear-gradient(135deg, var(--card), rgba(124,58,237,0.1))", borderColor: "rgba(124,58,237,0.3)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <p className="text-sm font-bold text-foreground">🏆 Top Photos This Week</p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {topPhotos.map((photo, i) => (
                <div key={photo.id} className="shrink-0 w-24">
                  <div className="relative rounded-lg overflow-hidden" style={{ aspectRatio: "3/4" }}>
                    <img src={photo.image_url} className="w-full h-full object-cover" alt={photo.title} onError={e => (e.currentTarget.style.display='none')} />
                    <div className="absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black" style={{ background: i===0?"#FFD700":i===1?"#C0C0C0":"#CD7F32", color:"#000" }}>
                      {i+1}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{photo.title}</p>
                  <p className="text-xs text-primary font-semibold">❤️ {photo.vote_count}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload button + filter */}
        <div className="flex gap-3">
          <button onClick={() => setShowUpload(s => !s)}
            className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            style={{ background: "#F5C842", color: "#080E1E" }}>
            <Camera className="w-4 h-4" /> {showUpload ? "Cancel" : "Submit Your Photo"}
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[{ id: "all", label: "All Photos" }, ...PHOTO_TYPES.map(t => ({ id: t.id, label: t.label }))].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors border ${filter === f.id ? "bg-primary text-[#080E1E] border-primary" : "border-white/10 text-muted-foreground"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Upload form */}
        {showUpload && (
          <div className="rounded-xl p-5 border border-primary/20" style={{ background: "var(--card)" }}>
            <h3 className="text-sm font-bold text-foreground mb-4">📤 Submit Your Photo</h3>
            <div className="space-y-3">
              {/* Photo type */}
              <div className="grid grid-cols-1 gap-2">
                {PHOTO_TYPES.map(pt => (
                  <button key={pt.id} onClick={() => setPhotoType(pt.id)}
                    className={`text-left p-3 rounded-xl border transition-all ${photoType === pt.id ? "border-primary/50 bg-primary/10" : "border-white/10"}`}>
                    <p className="text-xs font-bold text-foreground">{pt.label}</p>
                    <p className="text-xs text-muted-foreground">{pt.description}</p>
                  </button>
                ))}
              </div>

              {/* Photo picker */}
              {preview ? (
                <div className="relative rounded-xl overflow-hidden border border-white/10" style={{ maxHeight: 200 }}>
                  <img src={preview} className="w-full object-cover" style={{ maxHeight: 200 }} alt="Preview" />
                  <button onClick={() => { setSelectedFile(null); setPreview(null); }} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-xl border-2 border-dashed border-white/20 hover:border-primary/40 py-8 flex flex-col items-center gap-2 transition-colors">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Tap to select your photo</p>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

              {/* Park */}
              <select value={selectedPark} onChange={e => setSelectedPark(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-white/10 text-sm text-foreground focus:outline-none"
                style={{ background: "var(--muted)", minHeight: 44 }}>
                {PARKS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              {/* Ride name for fireworks */}
              {photoType === "fireworks" && (
                <select value={rideName} onChange={e => setRideName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-white/10 text-sm text-foreground focus:outline-none"
                  style={{ background: "var(--muted)", minHeight: 44 }}>
                  <option value="">Select ride (optional)</option>
                  {FIREWORKS_RIDES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              )}

              {/* Title */}
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Photo title *" required
                className="w-full px-3 py-2.5 rounded-xl border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40"
                style={{ background: "var(--muted)", minHeight: 44 }} />

              {/* Description */}
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                placeholder="Share the story behind this shot (optional)"
                className="w-full px-3 py-2 rounded-xl border border-white/10 text-sm text-foreground focus:outline-none resize-none"
                style={{ background: "var(--muted)" }} />

              <button onClick={submitPhoto} disabled={uploading || !selectedFile || !title.trim()}
                className="w-full py-3 rounded-xl font-bold text-sm text-[#080E1E] disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "#F5C842" }}>
                {uploading ? <><span className="w-4 h-4 rounded-full border-2 border-[#080E1E] border-t-transparent animate-spin" /> Submitting...</> : <><Upload className="w-4 h-4" /> Submit Photo</>}
              </button>
            </div>
          </div>
        )}

        {/* Photo grid */}
        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" /></div>
        ) : photos.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm font-semibold text-foreground mb-2">No photos yet!</p>
            <p className="text-xs text-muted-foreground mb-4">Be the first to share a fireworks ride shot or Disney sunset photo.</p>
            <button onClick={() => setShowUpload(true)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-[#080E1E]" style={{ background: "#F5C842" }}>
              Submit the First Photo →
            </button>
          </div>
        ) : (
          <div className="columns-2 gap-3 space-y-3">
            {photos.map(photo => {
              const hasVoted = myVotes.has(photo.id);
              const typeLabel = PHOTO_TYPES.find(t => t.id === photo.photo_type)?.label || "";
              return (
                <div key={photo.id} className="break-inside-avoid rounded-xl overflow-hidden border border-white/8" style={{ background: "var(--card)" }}>
                  <div className="relative">
                    <img src={photo.image_url} className="w-full object-cover" alt={photo.title} loading="lazy" onError={e => (e.currentTarget.style.display='none')} />
                    {photo.is_featured && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-yellow-400/90 text-[#080E1E] text-xs font-bold">⭐ Featured</div>
                    )}
                    <span className="absolute top-2 right-2 text-lg">{typeLabel.split(" ")[0]}</span>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-bold text-foreground mb-0.5 leading-tight">{photo.title}</p>
                    <p className="text-xs text-muted-foreground mb-1">{photo.park}{photo.ride_name ? ` · ${photo.ride_name}` : ""}</p>
                    {photo.description && <p className="text-xs text-muted-foreground mb-2 italic line-clamp-2">{photo.description}</p>}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{photo.display_name}</span>
                      <button onClick={() => handleVote(photo.id, photo.vote_count)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all ${hasVoted ? "bg-red-500/20 text-red-400" : "bg-white/8 text-muted-foreground hover:bg-red-500/10 hover:text-red-400"}`}>
                        <Heart className={`w-3.5 h-3.5 ${hasVoted ? "fill-red-400" : ""}`} /> {photo.vote_count}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
