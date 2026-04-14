import { useState } from "react";
import { Plane, ExternalLink, Bell, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { buildBookingUrl } from "@/lib/affiliate";

interface Props {
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
}

interface SimulatedFlight {
  id: string;
  origin: string;
  destination: string;
  airline: string;
  price: number;
  stops: number;
  duration: string;
}

function generateFlights(origin: string, budget: number): SimulatedFlight[] {
  const airlines = ["Delta", "United", "American", "Southwest", "JetBlue"];
  const results: SimulatedFlight[] = [];
  for (const dest of ["MCO", "SFB"]) {
    for (let i = 0; i < 3; i++) {
      const price = Math.round(budget * (0.7 + Math.random() * 0.6));
      const stops = Math.floor(Math.random() * 3);
      const hrs = 2 + stops * 1.5 + Math.random() * 2;
      results.push({
        id: `${origin || "ANY"}-${dest}-${i}`,
        origin: origin || "ANY",
        destination: dest,
        airline: airlines[Math.floor(Math.random() * airlines.length)],
        price, stops,
        duration: `${Math.floor(hrs)}h ${Math.round((hrs % 1) * 60)}m`,
      });
    }
  }
  return results.sort((a, b) => a.price - b.price).slice(0, 5);
}

export default function AirfareSuggestions({ startDate, endDate, adults, children }: Props) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [origin, setOrigin] = useState("");
  const [budget, setBudget] = useState("400");
  const [results, setResults] = useState<SimulatedFlight[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    if (!origin) { toast.error("Enter an origin airport code"); return; }
    setResults(generateFlights(origin, Number(budget) || 400));
    setHasSearched(true);
  };

  const handleBookNow = async (flight: SimulatedFlight) => {
    const url = await buildBookingUrl({
      category: "flights",
      rawDeeplink: "https://www.google.com/travel/flights",
      context: { origin: flight.origin, destination: flight.destination, depart_date: startDate, return_date: endDate, adults: String(adults), children: String(children), userId: session?.user?.id },
    });
    window.open(url, "_blank");
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Plane className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">✈️ Flight Options</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Find flights to Orlando for your trip</p>
      </div>

      <div className="px-5 py-3 space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <input value={origin} onChange={e => setOrigin(e.target.value.toUpperCase())} placeholder="From (e.g. LAX)" maxLength={4}
              className="w-full px-2.5 py-1.5 rounded-lg bg-muted border border-border text-xs text-foreground uppercase placeholder:normal-case placeholder:text-muted-foreground" />
          </div>
          <div className="w-20">
            <input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="Budget"
              className="w-full px-2.5 py-1.5 rounded-lg bg-muted border border-border text-xs text-foreground placeholder:text-muted-foreground" />
          </div>
          <button onClick={handleSearch} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
            <Search className="w-3 h-3" />
          </button>
        </div>

        {hasSearched && results.length > 0 && (
          <div className="space-y-1.5">
            {results.map(flight => (
              <div key={flight.id} className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/30">
                <div>
                  <p className="text-[10px] font-semibold text-foreground">{flight.origin} → {flight.destination}</p>
                  <p className="text-[10px] text-muted-foreground">{flight.airline} · {flight.duration} · {flight.stops === 0 ? "Nonstop" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-primary">${flight.price}</span>
                  <button onClick={() => handleBookNow(flight)} className="p-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-2 bg-muted/20 border-t border-border">
        <button onClick={() => navigate("/airfare")} className="text-[10px] text-primary font-semibold hover:underline">
          Search all flights & set alerts →
        </button>
      </div>
    </div>
  );
}
