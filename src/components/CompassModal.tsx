import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";

interface CompassModalProps {
  open: boolean;
  onClose: () => void;
  destination: string;
  land: string;
  walkTime: string;
  distance: string;
  directions: string[];
}

const TARGET_HEADING = 247;

const CompassModal = ({ open, onClose, destination, land, walkTime, distance, directions }: CompassModalProps) => {
  const [heading, setHeading] = useState<number | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [sweepAngle, setSweepAngle] = useState(0);

  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    const alpha = (e as any).webkitCompassHeading ?? e.alpha;
    if (alpha != null) setHeading(alpha);
  }, []);

  useEffect(() => {
    if (!open) return;
    const requestPermission = async () => {
      try {
        if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
          const perm = await (DeviceOrientationEvent as any).requestPermission();
          if (perm !== "granted") { setPermissionDenied(true); return; }
        }
        window.addEventListener("deviceorientation", handleOrientation, true);
      } catch {
        setPermissionDenied(true);
      }
    };
    requestPermission();
    return () => window.removeEventListener("deviceorientation", handleOrientation, true);
  }, [open, handleOrientation]);

  // Radar sweep animation
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setSweepAngle((a) => (a + 2) % 360), 30);
    return () => clearInterval(id);
  }, [open]);

  if (!open) return null;

  const diff = heading != null ? ((TARGET_HEADING - heading + 540) % 360) - 180 : 0;
  const absDiff = Math.abs(diff);
  const arrowRotation = heading != null ? TARGET_HEADING - heading : 0;

  let arrowColor = "#6B7280";
  let glowColor = "transparent";
  let statusText = "Enable device orientation in your browser settings to use live compass guidance";
  let statusColor = "text-muted-foreground";

  if (heading != null && !permissionDenied) {
    if (absDiff <= 20) {
      arrowColor = "#10B981";
      glowColor = "rgba(16,185,129,0.3)";
      statusText = "✅ You're heading the right way!";
      statusColor = "text-green-400";
    } else if (absDiff <= 60) {
      arrowColor = "#F5C842";
      glowColor = "rgba(245,200,66,0.2)";
      statusText = diff > 0 ? "↻ Adjust slightly to your right" : "↺ Adjust slightly to your left";
      statusColor = "text-primary";
    } else {
      arrowColor = "#F43F5E";
      glowColor = "rgba(244,63,94,0.3)";
      statusText = "↩ Turn around — wrong direction";
      statusColor = "text-red-400";
    }
  }

  const displayHeading = heading != null ? `${Math.round(heading)}°` : "---°";
  const vw80 = typeof window !== "undefined" ? window.innerWidth * 0.8 : 320;
  const compassSize = typeof window !== "undefined" && window.innerWidth < 768 ? Math.min(280, vw80) : 320;
  const r = compassSize / 2;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center" style={{ background: "rgba(8,14,30,0.97)" }}>
      <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10">
        <X className="w-6 h-6" />
      </button>

      {/* Top Info */}
      <div className="text-center mb-6 px-4">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">{destination}</h2>
        <p className="text-primary font-semibold text-sm mt-1">Approx. {walkTime} walk · ~{distance}</p>
        <p className="text-muted-foreground text-xs mt-0.5">{land}</p>
      </div>

      {/* Compass */}
      <div className="relative" style={{ width: compassSize, height: compassSize }}>
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: "rgba(245,200,66,0.3)", background: "#111827", boxShadow: `0 0 40px ${glowColor}` }}>
          {/* Concentric circles */}
          {[0.75, 0.55, 0.35].map((scale) => (
            <div key={scale} className="absolute rounded-full border" style={{
              borderColor: "rgba(245,200,66,0.06)",
              width: `${scale * 100}%`, height: `${scale * 100}%`,
              top: `${(1 - scale) * 50}%`, left: `${(1 - scale) * 50}%`,
            }} />
          ))}

          {/* Tick marks */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = i * 45;
            const rad = (angle * Math.PI) / 180;
            const inner = r - 16;
            const outer = r - 6;
            return (
              <div key={i} className="absolute" style={{
                width: 2, height: outer - inner, background: "rgba(245,200,66,0.4)",
                left: r + Math.sin(rad) * ((inner + outer) / 2) - 1,
                top: r - Math.cos(rad) * ((inner + outer) / 2) - (outer - inner) / 2,
                transform: `rotate(${angle}deg)`,
              }} />
            );
          })}

          {/* Cardinal directions */}
          {[
            { label: "N", angle: 0 },
            { label: "E", angle: 90 },
            { label: "S", angle: 180 },
            { label: "W", angle: 270 },
          ].map((d) => {
            const rad = (d.angle * Math.PI) / 180;
            const dist = r - 28;
            return (
              <span key={d.label} className="absolute text-xs font-bold text-muted-foreground" style={{
                left: r + Math.sin(rad) * dist - 5,
                top: r - Math.cos(rad) * dist - 7,
              }}>
                {d.label}
              </span>
            );
          })}

          {/* Radar sweep */}
          <div className="absolute inset-0 rounded-full overflow-hidden" style={{ transform: `rotate(${sweepAngle}deg)` }}>
            <div style={{
              position: "absolute", top: 0, left: "50%", width: 2, height: "50%",
              background: "linear-gradient(to bottom, rgba(245,200,66,0.2), transparent)",
              transformOrigin: "bottom center",
            }} />
          </div>

          {/* Arrow */}
          <div className="absolute inset-0 flex items-center justify-center" style={{
            transform: heading != null && !permissionDenied ? `rotate(${arrowRotation}deg)` : "rotate(0deg)",
            transition: "transform 0.3s ease-out",
          }}>
            <svg width={compassSize * 0.5} height={compassSize * 0.5} viewBox="0 0 100 100">
              <polygon points="50,10 42,65 50,55 58,65" fill={arrowColor} />
              {/* Glowing tip */}
              <circle cx="50" cy="14" r="4" fill={arrowColor} opacity={0.6}>
                <animate attributeName="opacity" values="0.4;0.9;0.4" dur="1.5s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
        </div>

        {/* Degree reading */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2">
          <span className="text-primary font-mono text-lg font-bold">{displayHeading}</span>
        </div>
      </div>

      {/* Status text */}
      <p className={`text-sm font-semibold mt-6 ${statusColor}`}>{statusText}</p>

      {/* Directions */}
      <div className="mt-6 px-6 max-w-sm text-center">
        <p className="text-xs text-muted-foreground mb-3">Walk toward {land} via suggested route:</p>
        <div className="space-y-1.5">
          {directions.map((step, i) => (
            <p key={i} className="text-xs text-foreground">{i + 1}. {step}</p>
          ))}
        </div>
      </div>

      {/* Check-in button */}
      <button onClick={onClose} className="mt-8 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">
        I'm Here — Check Me In ✓
      </button>
      <p className="text-[11px] text-muted-foreground mt-2">Tap when you arrive to mark as reached</p>
    </div>
  );
};

export default CompassModal;
