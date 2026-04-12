import { useState, useEffect } from "react";
import { Clock, MapPin, Star, RefreshCw } from "lucide-react";
import CompassButton from "@/components/CompassButton";

// Show times data by park (will be enhanced with real API data)
const SHOW_DATA: Record<string, Array<{
  name: string; type: "show" | "parade" | "fireworks" | "character";
  times: string[]; location: string; duration: string;
  description: string; tips: string; emoji: string;
}>> = {
  "Magic Kingdom": [
    { name: "Happily Ever After Fireworks", type: "fireworks", times: ["9:00 PM"], location: "Cinderella Castle / Main Street Hub", duration: "20 min", description: "Disney's signature nightly fireworks spectacular with projection mapping on the castle", tips: "Arrive at Main Street Hub by 8:45 PM for the best view. Crowd forms 30-45 min early.", emoji: "🎆" },
    { name: "Festival of Fantasy Parade", type: "parade", times: ["3:00 PM"], location: "Starts at Frontierland, ends at Main Street", duration: "12 min", description: "Daytime parade with floats from The Little Mermaid, Sleeping Beauty, Brave, Peter Pan, and more", tips: "Stake out Main Street USA 30 min early. Frontierland side has smaller crowds.", emoji: "🎠" },
    { name: "Move It! Shake It! MousekeDance", type: "show", times: ["10:30 AM", "12:00 PM", "2:30 PM", "5:00 PM"], location: "Main Street U.S.A. Hub", duration: "15 min", description: "Interactive celebration with Mickey, Minnie, and Disney characters. Guests join the parade.", tips: "Get close to the hub if you want to dance with Mickey.", emoji: "🎵" },
    { name: "Mickey's Magical Friendship Faire", type: "show", times: ["11:30 AM", "1:30 PM", "3:30 PM", "5:30 PM"], location: "Cinderella Castle Stage", duration: "20 min", description: "Stage show at Cinderella Castle with Mickey, Minnie, Donald, Daisy, and Goofy", tips: "The castle steps get crowded. Arrive 15 min early for a good view.", emoji: "🏰" },
    { name: "Disney Enchantment", type: "fireworks", times: ["Seasonal"], location: "Main Street U.S.A.", duration: "16 min", description: "Alternate nighttime spectacular (seasonal replacement)", tips: "Check Times Guide for current schedule", emoji: "✨" },
  ],
  "EPCOT": [
    { name: "EPCOT Forever / Luminous", type: "fireworks", times: ["9:00 PM"], location: "World Showcase Lagoon", duration: "12-15 min", description: "Nighttime spectacular over the World Showcase Lagoon with music and pyrotechnics", tips: "France pavilion or Italy side of the lagoon for the best uncrowded views.", emoji: "🎆" },
    { name: "Harmonious (archived)", type: "fireworks", times: ["Seasonal"], location: "World Showcase Lagoon", duration: "18 min", description: "Check current schedule — show may have changed since last update", tips: "Check Times Guide on arrival", emoji: "🎇" },
    { name: "Mariachi Cobre", type: "show", times: ["Various"], location: "Mexico Pavilion", duration: "20-30 min", description: "Live mariachi music at the Mexico pavilion — multiple performances throughout the day", tips: "Great background music while dining at San Angel Inn", emoji: "🎺" },
    { name: "EPCOT International Flower & Garden Festival", type: "show", times: ["Seasonal"], location: "World Showcase", duration: "All day", description: "Seasonal outdoor kitchens, topiaries, and live outdoor concerts on the Garden Rocks stage", tips: "Garden Rocks concerts are free with park admission — great evening entertainment", emoji: "🌸" },
  ],
  "Hollywood Studios": [
    { name: "Fantasmic!", type: "show", times: ["9:30 PM", "10:30 PM (busy nights)"], location: "Hollywood Hills Amphitheater", duration: "30 min", description: "Mickey Mouse battles villains in a spectacular water, fire, and projection show", tips: "Arrive 45 min early for good seats. Dining package gets reserved seating.", emoji: "🎭" },
    { name: "Indiana Jones Epic Stunt Spectacular", type: "show", times: ["11:30 AM", "1:30 PM", "3:30 PM"], location: "Echo Lake Theater", duration: "30 min", description: "Live stunt show recreating scenes from Raiders of the Lost Ark", tips: "Audience members can volunteer to be extras. Check Times Guide for schedule.", emoji: "🎬" },
    { name: "Star Wars: A Galactic Spectacular", type: "fireworks", times: ["9:30 PM (select nights)"], location: "Chinese Theater / Hollywood Blvd", duration: "14 min", description: "Star Wars nighttime spectacular projected on the Chinese Theater with fireworks", tips: "View from Hollywood Blvd or the far end looking toward the Chinese Theater", emoji: "⭐" },
    { name: "Beauty and the Beast - Live on Stage", type: "show", times: ["11:00 AM", "1:00 PM", "3:30 PM", "5:30 PM"], location: "Theater of the Stars, Sunset Blvd", duration: "30 min", description: "Beloved stage version of Beauty and the Beast with all the classic songs", tips: "Great show to see in the afternoon heat — sit in the shaded area", emoji: "🌹" },
    { name: "For the First Time in Forever: A Frozen Sing-Along Celebration", type: "show", times: ["Multiple daily"], location: "Hyperion Theater", duration: "30 min", description: "Interactive Frozen sing-along show with Royal Historians of Arendelle", tips: "Very popular — arrive 20 min early. Kids love singing along!", emoji: "❄️" },
  ],
  "Animal Kingdom": [
    { name: "Rivers of Light: We Are One", type: "show", times: ["9:00 PM (seasonal)"], location: "Discovery River Theater", duration: "25 min", description: "Nighttime spectacular with floating lanterns, water effects, and animal imagery", tips: "Arrive 30 min early. The left side offers slightly better views.", emoji: "🏮" },
    { name: "Finding Nemo: The Big Blue... and Beyond!", type: "show", times: ["11:00 AM", "12:30 PM", "2:00 PM", "3:30 PM"], location: "Theater in the Wild, DinoLand", duration: "40 min", description: "Musical stage show bringing Finding Nemo and Finding Dory to life with puppets and live performers", tips: "Great for families with young kids. Indoor — good break from the heat.", emoji: "🐠" },
    { name: "UP! A Great Bird Adventure", type: "show", times: ["12:00 PM", "2:00 PM", "4:00 PM"], location: "Caravan Stage, Asia", duration: "25 min", description: "Live bird show featuring Russell and Dug from Pixar's UP, with macaws, eagles, and more", tips: "The eagle flying low over the audience is a showstopper — sit in the middle sections", emoji: "🦅" },
    { name: "Harambe Wildlife Parti", type: "show", times: ["5:00 PM", "7:00 PM (seasonal)"], location: "Harambe Market, Africa", duration: "60 min", description: "Afternoon/evening dance party in the Africa section with live music", tips: "Great place to be at closing time — energetic and fun", emoji: "🎶" },
  ],
  "Typhoon Lagoon": [
    { name: "Shark Reef Snorkeling", type: "show", times: ["10:00 AM - 5:00 PM"], location: "Shark Reef", duration: "Self-paced", description: "Snorkel with real sharks, rays, and tropical fish in a saltwater habitat", tips: "Equipment included. Go early morning for clearest water and shortest wait.", emoji: "🦈" },
  ],
  "Blizzard Beach": [
    { name: "Ski Patrol Training Camp", type: "show", times: ["All day"], location: "Teen area", duration: "Self-paced", description: "Teen-focused fun zone with challenges and interactive elements", tips: "Less crowded than main slides. Good break area.", emoji: "🎿" },
  ],
};

export default function ShowTimes({ selectedPark = "Magic Kingdom", inPark = false }: { selectedPark?: string; inPark?: boolean }) {
  const [filter, setFilter] = useState<"all" | "show" | "parade" | "fireworks" | "character">("all");
  const [loading, setLoading] = useState(false);

  const shows = SHOW_DATA[selectedPark] || [];
  const filtered = filter === "all" ? shows : shows.filter(s => s.type === filter);

  const typeColors: Record<string, string> = {
    fireworks: "bg-purple-500/20 text-purple-400",
    parade: "bg-blue-500/20 text-blue-400",
    show: "bg-orange-500/20 text-orange-400",
    character: "bg-pink-500/20 text-pink-400",
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {["all", "show", "parade", "fireworks", "character"].map(f => (
          <button key={f} onClick={() => setFilter(f as any)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors border ${filter === f ? "bg-primary text-[#070b15] border-primary" : "border-white/10 text-muted-foreground"}`}>
            {f === "all" ? "All" : f === "fireworks" ? "🎆 Fireworks" : f === "parade" ? "🎠 Parades" : f === "show" ? "🎭 Shows" : "🎪 Characters"}
          </button>
        ))}
      </div>

      {/* Note */}
      <div className="rounded-xl p-3 border border-yellow-500/20 bg-yellow-500/5">
        <p className="text-xs text-yellow-400 font-semibold">⚠️ Always verify times on the day</p>
        <p className="text-xs text-muted-foreground mt-0.5">Show times change daily. Check the My Disney Experience app or Times Guide at park entrance for today's exact schedule.</p>
      </div>

      {/* Shows list */}
      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No {filter === "all" ? "shows" : filter + "s"} found for {selectedPark}</p>
        </div>
      ) : filtered.map((show, i) => (
        <div key={i} className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "#111827" }}>
          <div className="px-4 py-3">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">{show.emoji}</span>
                <div>
                  <p className="text-sm font-bold text-foreground">{show.name}</p>
                  <p className="text-xs text-muted-foreground">{show.location} · {show.duration}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${typeColors[show.type] || "bg-white/10 text-muted-foreground"}`}>
                {show.type}
              </span>
            </div>

            {/* Show times */}
            <div className="flex flex-wrap gap-1.5 my-2">
              {show.times.map((time, j) => (
                <span key={j} className="text-xs px-2.5 py-1 rounded-full bg-primary/20 text-primary font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {time}
                </span>
              ))}
            </div>

            <p className="text-xs text-muted-foreground mb-1">{show.description}</p>
            <p className="text-xs text-primary">💡 {show.tips}</p>

            {inPark && (
              <div className="mt-2">
                <CompassButton destination={show.location} context={`${selectedPark} · Show location`} size="inline" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
