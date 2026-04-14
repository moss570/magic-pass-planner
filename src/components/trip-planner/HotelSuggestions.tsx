import { useState } from "react";
import { Hotel, MapPin, ChevronDown, ChevronUp, ExternalLink, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { buildBookingUrl } from "@/lib/affiliate";
import { CURATED_HOTELS, CuratedHotel } from "@/lib/curatedHotels";

interface HotelCategory {
  label: string;
  emoji: string;
  description: string;
  hotels: CuratedHotel[];
}

interface Props {
  lodging: string;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
}

export default function HotelSuggestions({ lodging, startDate, endDate, adults, children }: Props) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [expandedCategory, setExpandedCategory] = useState<string | null>("Budget-Friendly");
  const [maxPrice, setMaxPrice] = useState("");

  if (lodging === "disney-resort") return null;

  const filteredHotels = CURATED_HOTELS.filter(h => !maxPrice || h.defaultTargetPrice <= Number(maxPrice));

  const nights = startDate && endDate
    ? Math.max(1, Math.round((new Date(endDate + "T12:00:00").getTime() - new Date(startDate + "T12:00:00").getTime()) / 86400000))
    : 1;

  const categories: HotelCategory[] = [
    { label: "Budget-Friendly", emoji: "💰", description: "Great value hotels under $120/night", hotels: filteredHotels.filter(h => h.category === "Budget-Friendly") },
    { label: "Family Suites", emoji: "👨‍👩‍👧‍👦", description: "Room for the whole crew with kitchens", hotels: filteredHotels.filter(h => h.category === "Family Suites") },
    { label: "Close to Parks", emoji: "🏰", description: "5 minutes or less from Disney gates", hotels: filteredHotels.filter(h => h.category === "Close to Parks") },
  ].filter(c => c.hotels.length > 0);

  const handleBookNow = async (hotel: CuratedHotel) => {
    const url = await buildBookingUrl({
      category: "hotels",
      rawDeeplink: hotel.bookingSearchUrl,
      context: { checkIn: startDate, checkOut: endDate, adults: String(adults), children: String(children), userId: session?.user?.id },
    });
    window.open(url, "_blank");
  };

  const handleWatchPrice = (hotel: CuratedHotel) => {
    const params = new URLSearchParams({
      hotel: hotel.name, checkIn: startDate || "", checkOut: endDate || "",
      adults: String(adults), children: String(children), targetPrice: String(hotel.defaultTargetPrice),
    });
    navigate(`/hotel-alerts?${params.toString()}`);
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Hotel className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">🏨 Off-Site Hotel Recommendations</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Curated picks for {nights} night{nights > 1 ? "s" : ""} · {adults} adult{adults > 1 ? "s" : ""}{children > 0 ? ` + ${children} kid${children > 1 ? "s" : ""}` : ""}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <label className="text-[10px] text-muted-foreground">Max $/night:</label>
          <input
            type="number" min={1} value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
            placeholder="Any" className="w-20 px-2 py-1 rounded-lg bg-muted border border-border text-[10px] text-foreground placeholder:text-muted-foreground"
          />
          {maxPrice && (
            <button onClick={() => setMaxPrice("")} className="text-[10px] text-primary hover:underline">Clear</button>
          )}
        </div>
      </div>

      <div className="divide-y divide-border">
        {categories.map(category => {
          const isExpanded = expandedCategory === category.label;
          return (
            <div key={category.label}>
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category.label)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{category.emoji}</span>
                  <div>
                    <p className="text-xs font-bold text-foreground">{category.label}</p>
                    <p className="text-[10px] text-muted-foreground">{category.description}</p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>

              {isExpanded && (
                <div className="px-5 pb-4 space-y-2">
                  {category.hotels.map((hotel, i) => (
                    <div key={hotel.name} className={`p-3 rounded-xl border transition-colors ${i === 0 ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-foreground">{hotel.name}</p>
                            {i === 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">Top Pick</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-primary font-semibold">{hotel.priceRange}/night</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" /> {hotel.distanceMiles} mi from Disney
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">✨ {hotel.bestFor}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {hotel.amenities.map(a => (
                          <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{a}</span>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleBookNow(hotel)} className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
                          <ExternalLink className="w-3 h-3" /> Book
                        </button>
                        <button onClick={() => handleWatchPrice(hotel)} className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg border border-primary/40 text-primary font-semibold hover:bg-primary/10 transition-colors">
                          <Bell className="w-3 h-3" /> Watch Price
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-5 py-3 bg-muted/20 border-t border-border">
        <p className="text-[10px] text-muted-foreground">
          💡 <strong>Pro tip:</strong> Hotels with kitchens can save $50-80/day on meals.{" "}
          <button onClick={() => navigate("/hotel-alerts")} className="text-primary font-semibold hover:underline">Search all hotels →</button>
        </p>
      </div>
    </div>
  );
}
