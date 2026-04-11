import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Footprints, RotateCcw, X, Loader2, MapPin } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Phase = "idle" | "countdown" | "walking" | "result" | "error";

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface WalkingSpeedCalibratorProps {
  userId: string;
  currentSpeed: number | null;
}

export default function WalkingSpeedCalibrator({ userId, currentSpeed }: WalkingSpeedCalibratorProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [speed, setSpeed] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const watchIdRef = useRef<number | null>(null);
  const pointsRef = useRef<{ lat: number; lng: number; ts: number; acc: number }[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const DURATION_S = 60;

  const cleanup = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const startCountdown = () => {
    setPhase("countdown");
    setCountdown(3);
    setTotalDistance(0);
    setElapsed(0);
    setSpeed(null);
    pointsRef.current = [];

    let c = 3;
    const iv = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(iv);
        startWalking();
      }
    }, 1000);
  };

  const startWalking = () => {
    if (!navigator.geolocation) {
      setPhase("error");
      setErrorMsg("Geolocation not supported on this device.");
      return;
    }

    setPhase("walking");
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const e = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(e);
      if (e >= DURATION_S) finishWalking();
    }, 500);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (accuracy > 20) return; // Filter poor accuracy
        const now = Date.now();
        const pts = pointsRef.current;

        if (pts.length > 0) {
          const last = pts[pts.length - 1];
          const dt = (now - last.ts) / 1000;
          const dist = haversine(last.lat, last.lng, latitude, longitude);
          // Filter jitter: ignore < 1m within 1s
          if (dist < 1 && dt < 1) return;
          setTotalDistance(prev => prev + dist);
        }

        pts.push({ lat: latitude, lng: longitude, ts: now, acc: accuracy });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          cleanup();
          setPhase("error");
          setErrorMsg("Location permission denied. Please enable it in your device settings.");
        }
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
  };

  const finishWalking = () => {
    cleanup();
    const pts = pointsRef.current;

    if (pts.length < 5) {
      setPhase("error");
      setErrorMsg("Couldn't get a good GPS fix. Try again outside with a clear view of the sky.");
      return;
    }

    // Recalculate distance from stored points for accuracy
    let dist = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = haversine(pts[i - 1].lat, pts[i - 1].lng, pts[i].lat, pts[i].lng);
      if (d >= 1) dist += d; // ignore sub-meter jitter
    }

    const durationS = (pts[pts.length - 1].ts - pts[0].ts) / 1000;
    if (durationS < 30 || dist < 10) {
      setPhase("error");
      setErrorMsg("Not enough movement detected. Walk at a steady pace for the full 60 seconds.");
      return;
    }

    const mps = dist / durationS;
    const kmh = Math.round(mps * 3.6 * 10) / 10;
    setSpeed(kmh);
    setTotalDistance(dist);
    setPhase("result");
  };

  const handleSave = async () => {
    if (!speed) return;
    setSaving(true);
    const { error } = await supabase.from("users_profile").update({
      walking_speed_kmh: speed,
    } as any).eq("id", userId);
    setSaving(false);
    if (error) {
      toast.error("Failed to save walking speed");
    } else {
      toast.success(`Walking speed saved: ${speed} km/h`);
    }
  };

  const cancel = () => {
    cleanup();
    setPhase("idle");
  };

  return (
    <Card className="border-primary/20 bg-card/80 overflow-hidden">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-base md:text-lg flex items-center gap-2">
          <Footprints className="w-5 h-5" /> Walking Speed Calibration
        </CardTitle>
        <CardDescription>
          Measure your walking pace for more accurate park itinerary timings
          {currentSpeed && <span className="text-primary font-medium ml-1">· Current: {currentSpeed} km/h</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-4">
        {phase === "idle" && (
          <>
            <p className="text-xs text-muted-foreground">
              Walk normally for 60 seconds while we measure your pace via GPS. Works best outdoors.
            </p>
            <Button onClick={startCountdown} className="text-xs">
              <MapPin className="w-3.5 h-3.5 mr-1" /> Start Calibration
            </Button>
          </>
        )}

        {phase === "countdown" && (
          <div className="text-center py-6">
            <p className="text-5xl font-black text-primary animate-pulse">{countdown}</p>
            <p className="text-sm text-muted-foreground mt-2">Get ready to walk…</p>
            <Button variant="ghost" size="sm" className="mt-4 text-xs" onClick={cancel}>
              <X className="w-3 h-3 mr-1" /> Cancel
            </Button>
          </div>
        )}

        {phase === "walking" && (
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">🚶 Walk normally…</p>
              <p className="text-3xl font-black text-primary mt-1">{DURATION_S - elapsed}s</p>
              <p className="text-[10px] text-muted-foreground mt-1">Distance: {totalDistance.toFixed(1)}m</p>
            </div>
            <Progress value={(elapsed / DURATION_S) * 100} className="h-2" />
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={cancel}>
              <X className="w-3 h-3 mr-1" /> Cancel
            </Button>
          </div>
        )}

        {phase === "result" && speed != null && (
          <div className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">You walked at</p>
            <p className="text-4xl font-black text-primary">{speed} km/h</p>
            <p className="text-xs text-muted-foreground">{totalDistance.toFixed(0)}m in ~60 seconds</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleSave} disabled={saving} className="text-xs">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                Save as my walking speed
              </Button>
              <Button variant="outline" onClick={startCountdown} className="text-xs">
                <RotateCcw className="w-3 h-3 mr-1" /> Retry
              </Button>
            </div>
          </div>
        )}

        {phase === "error" && (
          <div className="space-y-3 text-center">
            <p className="text-sm text-destructive font-medium">⚠️ {errorMsg}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={startCountdown} className="text-xs">
                <RotateCcw className="w-3 h-3 mr-1" /> Try Again
              </Button>
              <Button variant="ghost" onClick={cancel} className="text-xs">Cancel</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
