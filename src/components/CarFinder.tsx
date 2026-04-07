import { useState, useEffect, useRef } from "react";
import { Car, MapPin, Navigation, Clock, RotateCcw, Save, X, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Disney World parking areas by park
const PARKING_AREAS: Record<string, Array<{ name: string; sections: string[] }>> = {
  "Magic Kingdom / Transportation Center": [
    { name: "Pluto", sections: ["1-99", "100-199", "200-299", "300+"] },
    { name: "Donald", sections: ["1-99", "100-199", "200-299", "300+"] },
    { name: "Goofy", sections: ["1-99", "100-199", "200-299", "300+"] },
    { name: "Daisy", sections: ["1-99", "100-199", "200-299", "300+"] },
    { name: "Minnie", sections: ["1-99", "100-199", "200-299", "300+"] },
    { name: "Mickey (Preferred)", sections: ["1-50", "51-99", "100+"] },
  ],
  "EPCOT": [
    { name: "Eeyore", sections: ["1-99", "100-199", "200+"] },
    { name: "Piglet", sections: ["1-99", "100-199", "200+"] },
    { name: "Pooh", sections: ["1-99", "100-199", "200+"] },
    { name: "Simba (Preferred)", sections: ["1-50", "51-99"] },
    { name: "Pumbaa (Preferred)", sections: ["1-50", "51-99"] },
    { name: "Timon (Preferred)", sections: ["1-50", "51-99"] },
  ],
  "Hollywood Studios": [
    { name: "Toy Story", sections: ["1-99", "100-199", "200-299", "300+"] },
    { name: "Lightyear (Preferred)", sections: ["1-50", "51-99"] },
    { name: "Woody (Preferred)", sections: ["1-50", "51-99"] },
  ],
  "Animal Kingdom": [
    { name: "Unicorn", sections: ["1-99", "100-199", "200+"] },
    { name: "Peacock", sections: ["1-99", "100-199", "200+"] },
    { name: "Panda", sections: ["1-99", "100-199", "200+"] },
    { name: "Butterfly (Preferred)", sections: ["1-50", "51-99"] },
    { name: "Giraffe (Preferred)", sections: ["1-50", "51-99"] },
  ],
  "Disney Springs": [
    { name: "Orange Garage", sections: ["Level 1", "Level 2", "Level 3", "Level 4"] },
    { name: "Lime Garage", sections: ["Level 1", "Level 2", "Level 3", "Level 4"] },
    { name: "Strawberry Surface Lot", sections: ["North", "South", "East"] },
  ],
};

interface SavedCar {
  lat: number;
  lng: number;
  park: string;
  lotName: string;
  rowNumber: string;
  areaNote: string;
  savedAt: string;
  sessionId: string;
}

function degreesToRad(d: number) { return d * Math.PI / 180; }
function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = degreesToRad(lat2 - lat1);
  const dLng = degreesToRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(degreesToRad(lat1)) * Math.cos(degreesToRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function bearingDegrees(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLng = degreesToRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(degreesToRad(lat2));
  const x = Math.cos(degreesToRad(lat1)) * Math.sin(degreesToRad(lat2)) - Math.sin(degreesToRad(lat1)) * Math.cos(degreesToRad(lat2)) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

export default function CarFinder() {
  const { toast } = useToast();
  const [mode, setMode] = useState<"idle" | "save" | "finding" | "saved">("idle");
  const [savedCar, setSavedCar] = useState<SavedCar | null>(null);
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLng, setCurrentLng] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [selectedPark, setSelectedPark] = useState("Magic Kingdom / Transportation Center");
  const [selectedLot, setSelectedLot] = useState("");
  const [rowNumber, setRowNumber] = useState("");
  const [areaNote, setAreaNote] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [bearingTocar, setBearingTocar] = useState<number | null>(null);
  const orientRef = useRef<any>(null);

  // Load saved car on mount
  useEffect(() => {
    const saved = localStorage.getItem("magic-pass:car-location");
    if (saved) {
      try {
        const car = JSON.parse(saved) as SavedCar;
        setSavedCar(car);
        setMode("saved");
      } catch (_) {}
    }
  }, []);

  // GPS tracking when finding
  useEffect(() => {
    if (mode !== "finding") {
      if (orientRef.current) window.removeEventListener("deviceorientation", orientRef.current, true);
      return;
    }

    const handler = (e: DeviceOrientationEvent) => {
      const h = (e as any).webkitCompassHeading ?? (e.alpha !== null ? (360 - e.alpha) % 360 : null);
      if (h !== null) setHeading(Math.round(h));
    };
    orientRef.current = handler;
    window.addEventListener("deviceorientation", handler, true);

    const watchId = navigator.geolocation.watchPosition(
      pos => {
        setCurrentLat(pos.coords.latitude);
        setCurrentLng(pos.coords.longitude);
        if (savedCar) {
          const dist = distanceMeters(pos.coords.latitude, pos.coords.longitude, savedCar.lat, savedCar.lng);
          const bear = bearingDegrees(pos.coords.latitude, pos.coords.longitude, savedCar.lat, savedCar.lng);
          setDistance(Math.round(dist));
          setBearingTocar(Math.round(bear));
        }
      },
      err => console.error(err),
      { enableHighAccuracy: true, maximumAge: 3000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.removeEventListener("deviceorientation", handler, true);
    };
  }, [mode, savedCar]);

  const saveCar = async () => {
    setGpsLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
      );
      const car: SavedCar = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        park: selectedPark,
        lotName: selectedLot,
        rowNumber,
        areaNote,
        savedAt: new Date().toISOString(),
        sessionId: crypto.randomUUID().substring(0, 8),
      };
      localStorage.setItem("magic-pass:car-location", JSON.stringify(car));
      setSavedCar(car);
      setMode("saved");
      toast({ title: "🚗 Car location saved!", description: `${selectedLot} · Row ${rowNumber}` });
    } catch (err) {
      toast({ title: "GPS error", description: "Could not get your location. Make sure GPS is enabled.", variant: "destructive" });
    } finally {
      setGpsLoading(false);
    }
  };

  const clearCar = () => {
    localStorage.removeItem("magic-pass:car-location");
    setSavedCar(null);
    setMode("idle");
    setDistance(null);
    setBearingTocar(null);
    toast({ title: "Car location cleared" });
  };

  // Compass arrow direction (how much to rotate the arrow to point at car)
  const arrowRotation = heading !== null && bearingTocar !== null ? bearingTocar - heading : 0;
  const distanceFt = distance !== null ? Math.round(distance * 3.281) : null;
  const isClose = distance !== null && distance < 30;

  // Arrow color based on accuracy
  const arrowColor = isClose ? "#10B981" : distance !== null && distance < 100 ? "#F5C842" : "#F43F5E";

  const lots = PARKING_AREAS[selectedPark] || [];

  return (
    <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "#111827" }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-primary" />
          <p className="text-sm font-bold text-foreground">🚗 Car Finder</p>
          {savedCar && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-semibold">Saved</span>
          )}
        </div>
        {savedCar && (
          <button onClick={clearCar} className="text-xs text-muted-foreground hover:text-red-400 transition-colors">
            Clear
          </button>
        )}
      </div>

      <div className="p-4">
        {/* IDLE — no car saved */}
        {mode === "idle" && (
          <div className="text-center py-4">
            <Car className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">No car location saved</p>
            <p className="text-xs text-muted-foreground mb-4">Save your parking spot when you arrive so you can find your way back</p>
            <button onClick={() => setMode("save")}
              className="px-6 py-2.5 rounded-xl font-bold text-sm text-[#080E1E]" style={{ background: "#F5C842" }}>
              📍 Save My Car Location
            </button>
          </div>
        )}

        {/* SAVE — enter details */}
        {mode === "save" && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Which park?</label>
              <select value={selectedPark} onChange={e => { setSelectedPark(e.target.value); setSelectedLot(""); }}
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 text-sm text-foreground focus:outline-none"
                style={{ background: "#0D1230", minHeight: 44 }}>
                {Object.keys(PARKING_AREAS).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Parking lot / area</label>
              <div className="grid grid-cols-2 gap-1.5">
                {lots.map(lot => (
                  <button key={lot.name} onClick={() => setSelectedLot(lot.name)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border text-left transition-all ${selectedLot === lot.name ? "bg-primary text-[#080E1E] border-primary" : "border-white/10 text-muted-foreground hover:border-primary/40"}`}>
                    {lot.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Row number</label>
              <input value={rowNumber} onChange={e => setRowNumber(e.target.value)} placeholder="e.g. 15, A15, Row 15"
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40"
                style={{ background: "#0D1230", minHeight: 44 }} />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Additional notes (optional)</label>
              <input value={areaNote} onChange={e => setAreaNote(e.target.value)} placeholder="e.g. Near the lamp post, blue pickup truck"
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/40"
                style={{ background: "#0D1230", minHeight: 44 }} />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setMode("idle")} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground border border-white/10">
                Cancel
              </button>
              <button onClick={saveCar} disabled={gpsLoading || !selectedLot}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-[#080E1E] disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "#F5C842" }}>
                {gpsLoading ? <><span className="w-4 h-4 rounded-full border-2 border-[#080E1E] border-t-transparent animate-spin" /> Getting GPS...</> : <><MapPin className="w-4 h-4" /> Save Location</>}
              </button>
            </div>
          </div>
        )}

        {/* SAVED — show saved info + find car button */}
        {mode === "saved" && savedCar && (
          <div className="space-y-3">
            <div className="rounded-xl p-3 border border-green-500/30 bg-green-500/10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-green-400 mb-1">🚗 Car Saved</p>
                  <p className="text-sm font-bold text-foreground">{savedCar.lotName}</p>
                  {savedCar.rowNumber && <p className="text-xs text-muted-foreground">Row {savedCar.rowNumber}</p>}
                  {savedCar.areaNote && <p className="text-xs text-muted-foreground italic">"{savedCar.areaNote}"</p>}
                  <p className="text-xs text-muted-foreground mt-1">{savedCar.park}</p>
                  <p className="text-xs text-muted-foreground">Saved at {new Date(savedCar.savedAt).toLocaleTimeString()}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
              </div>
            </div>
            <button onClick={() => setMode("finding")}
              className="w-full py-3 rounded-xl font-bold text-sm text-[#080E1E] flex items-center justify-center gap-2"
              style={{ background: "#F5C842" }}>
              <Navigation className="w-4 h-4" /> Find My Car
            </button>
          </div>
        )}

        {/* FINDING — live compass + distance */}
        {mode === "finding" && savedCar && (
          <div className="space-y-4">
            {/* Car info */}
            <div className="rounded-lg p-3 border border-white/8 bg-white/4">
              <p className="text-xs font-bold text-foreground">{savedCar.lotName} · {savedCar.rowNumber && `Row ${savedCar.rowNumber}`}</p>
              {savedCar.areaNote && <p className="text-xs text-muted-foreground italic">"{savedCar.areaNote}"</p>}
            </div>

            {/* Distance */}
            <div className="text-center">
              {isClose ? (
                <div>
                  <p className="text-4xl mb-1">🚗</p>
                  <p className="text-xl font-black text-green-400">You're here!</p>
                  <p className="text-xs text-muted-foreground">Within {distanceFt} feet of your car</p>
                </div>
              ) : distance !== null ? (
                <div>
                  <p className="text-4xl font-black text-primary">{distanceFt}</p>
                  <p className="text-sm text-muted-foreground">feet away ({distance}m)</p>
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
              )}
            </div>

            {/* Compass arrow */}
            {!isClose && (
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full border-2 border-primary/30 flex items-center justify-center relative"
                  style={{ background: "#0D1230" }}>
                  {/* Cardinal labels */}
                  <span className="absolute top-2 text-xs text-muted-foreground font-bold">N</span>
                  <span className="absolute bottom-2 text-xs text-muted-foreground font-bold">S</span>
                  <span className="absolute left-2 text-xs text-muted-foreground font-bold">W</span>
                  <span className="absolute right-2 text-xs text-muted-foreground font-bold">E</span>

                  {/* Arrow */}
                  <div style={{ transform: `rotate(${arrowRotation}deg)`, transition: "transform 0.3s ease" }}>
                    <svg width="60" height="60" viewBox="0 0 60 60">
                      <polygon points="30,8 24,45 30,38 36,45" fill={arrowColor} />
                      <circle cx="30" cy="10" r="4" fill={arrowColor} opacity={0.7} />
                    </svg>
                  </div>
                </div>
                {heading !== null && <p className="text-xs text-muted-foreground mt-2">Facing {heading}°</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  {distance !== null && distance < 50 ? "🟢 Almost there!" : distance !== null && distance < 150 ? "🟡 Getting close" : "🔴 Keep walking"}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setMode("saved")}
                className="flex-1 py-2 rounded-xl border border-white/10 text-xs font-semibold text-muted-foreground hover:border-white/20">
                ← Back
              </button>
              <button onClick={clearCar}
                className="flex-1 py-2 rounded-xl border border-red-500/30 text-xs font-semibold text-red-400 hover:bg-red-500/10">
                Clear Saved Car
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
