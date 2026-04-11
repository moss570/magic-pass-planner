import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { X, Navigation, RefreshCw, HelpCircle, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useDeviceHeading } from "@/hooks/useDeviceHeading";
import {
  loadParkGraph, findNearestNode, dijkstra, haversineM,
  pointToSegmentDistance, computeBearing,
  type PathGraph, type RouteResult, type RouteStep,
} from "@/lib/parkGraph";
import RouteStepList from "@/components/compass/RouteStepList";
import ShortcutBadge from "@/components/compass/ShortcutBadge";

interface CompassModalProps {
  open: boolean;
  onClose: () => void;
  destination: string;
  land: string;
  walkTime: string;
  distance: string;
  directions: string[];
  fineLocation?: string;
  /** Path-graph node ID of the destination */
  toNodeId?: string;
  /** Optional starting node (if omitted, derived from GPS) */
  fromNodeId?: string;
  /** Park identifier for loading the graph */
  parkId?: string;
  /** Walking speed in km/h — defaults to 2.5 */
  walkingSpeedKmh?: number;
  /** Fallback destination coords when no graph is available */
  toLat?: number;
  toLng?: number;
}

const OFF_ROUTE_THRESHOLD_M = 15;
const OFF_ROUTE_TIMEOUT_MS = 10_000;
const GPS_ACCURACY_PAUSE_M = 25;
const STEP_ADVANCE_M = 12;

function formatEta(distanceM: number, speedKmh: number): string {
  const mins = Math.max(1, Math.round(distanceM / ((speedKmh * 1000) / 60)));
  return mins === 1 ? "1 min" : `${mins} min`;
}

function formatDist(m: number): string {
  if (m < 300) return `${Math.round(m)} m`;
  return `${(m / 1609.34).toFixed(2)} mi`;
}

function getCardinalDirection(degrees: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(degrees / 45) % 8];
}

const CompassModal = ({
  open, onClose, destination, land, walkTime, distance, directions,
  fineLocation, toNodeId, fromNodeId, parkId,
  walkingSpeedKmh = 2.5, toLat, toLng,
}: CompassModalProps) => {
  const { position, permissionDenied: geoDenied } = useGeolocation(open);
  const { heading, permissionDenied: headingDenied } = useDeviceHeading(open);

  const [graph, setGraph] = useState<PathGraph | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [sweepAngle, setSweepAngle] = useState(0);
  const [lowAccuracy, setLowAccuracy] = useState(false);

  const offRouteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRoutePos = useRef<{ lat: number; lng: number } | null>(null);

  // Determine if we're in path-based mode vs heading-only fallback
  const hasPathMode = !!(parkId && toNodeId);
  const hasGps = !!position && !geoDenied;

  // Load graph on mount
  useEffect(() => {
    if (!open || !parkId) return;
    loadParkGraph(parkId).then(setGraph);
  }, [open, parkId]);

  // Compute route when graph + position available
  const computeRoute = useCallback(() => {
    if (!graph || !toNodeId) return;

    let startId = fromNodeId;
    if (!startId && position) {
      const nearest = findNearestNode(graph, position.lat, position.lng);
      startId = nearest?.id;
    }
    if (!startId) return;

    const result = dijkstra(graph, startId, toNodeId);
    setRoute(result);
    setCurrentStepIdx(0);
    lastRoutePos.current = position ? { lat: position.lat, lng: position.lng } : null;
  }, [graph, toNodeId, fromNodeId, position]);

  // Initial route computation
  useEffect(() => {
    if (graph && !route && (position || fromNodeId)) {
      computeRoute();
    }
  }, [graph, route, position, fromNodeId, computeRoute]);

  // Step advancement + off-route detection
  useEffect(() => {
    if (!route || !position || !graph) return;

    setLowAccuracy(position.accuracy > GPS_ACCURACY_PAUSE_M);
    if (position.accuracy > GPS_ACCURACY_PAUSE_M) return;

    const step = route.steps[currentStepIdx];
    if (!step) return;

    const toNode = graph.nodes.find(n => n.id === step.toNodeId);
    if (!toNode) return;

    const distToNext = haversineM(position.lat, position.lng, toNode.lat, toNode.lng);

    // Advance step if close to the next node
    if (distToNext < STEP_ADVANCE_M && currentStepIdx < route.steps.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
      if (offRouteTimer.current) {
        clearTimeout(offRouteTimer.current);
        offRouteTimer.current = null;
      }
      return;
    }

    // Off-route detection
    const fromNode = graph.nodes.find(n => n.id === step.fromNodeId);
    if (fromNode) {
      const perpDist = pointToSegmentDistance(
        position.lat, position.lng,
        fromNode.lat, fromNode.lng,
        toNode.lat, toNode.lng
      );

      if (perpDist > OFF_ROUTE_THRESHOLD_M) {
        if (!offRouteTimer.current) {
          offRouteTimer.current = setTimeout(() => {
            toast("Recalculating...", { description: "You appear to be off route" });
            computeRoute();
            offRouteTimer.current = null;
          }, OFF_ROUTE_TIMEOUT_MS);
        }
      } else if (offRouteTimer.current) {
        clearTimeout(offRouteTimer.current);
        offRouteTimer.current = null;
      }
    }

    // Re-route on significant movement (>10m from last route computation)
    if (lastRoutePos.current) {
      const moved = haversineM(position.lat, position.lng, lastRoutePos.current.lat, lastRoutePos.current.lng);
      if (moved > 10) {
        lastRoutePos.current = { lat: position.lat, lng: position.lng };
      }
    }
  }, [route, position, graph, currentStepIdx, computeRoute]);

  // Radar sweep
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setSweepAngle(a => (a + 2) % 360), 30);
    return () => clearInterval(id);
  }, [open]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (offRouteTimer.current) clearTimeout(offRouteTimer.current);
    };
  }, []);

  if (!open) return null;

  // Current step info
  const currentStep = route?.steps[currentStepIdx];
  const remainingDist = useMemo(() => {
    if (!route) return 0;
    return route.steps.slice(currentStepIdx).reduce((sum, s) => sum + s.distanceM, 0);
  }, [route, currentStepIdx]);

  // Arrow rotation
  let arrowRotation = 0;
  let targetBearing = 0;

  if (hasPathMode && currentStep && heading != null) {
    targetBearing = currentStep.bearing;
    arrowRotation = targetBearing - heading;
  } else if (hasGps && heading != null && toLat != null && toLng != null) {
    // Fallback: point toward destination coords
    targetBearing = computeBearing(position!.lat, position!.lng, toLat, toLng);
    arrowRotation = targetBearing - heading;
  } else if (heading != null) {
    // Legacy: no GPS, heading-only mode with static bearing
    arrowRotation = 0;
  }

  const diff = heading != null ? ((arrowRotation + 540) % 360) - 180 : 0;
  const absDiff = Math.abs(diff);

  let arrowColor = "hsl(var(--muted-foreground))";
  let glowColor = "transparent";
  let statusText = "Enable device orientation for compass guidance";
  let statusColor = "text-muted-foreground";

  if (heading != null && !headingDenied) {
    if (absDiff <= 20) {
      arrowColor = "hsl(var(--success))";
      glowColor = "hsl(var(--success) / 0.3)";
      statusText = "✅ You're heading the right way!";
      statusColor = "text-green-400";
    } else if (absDiff <= 60) {
      arrowColor = "hsl(var(--primary))";
      glowColor = "hsl(var(--primary) / 0.2)";
      statusText = diff > 0 ? "↻ Adjust slightly to your right" : "↺ Adjust slightly to your left";
      statusColor = "text-primary";
    } else {
      arrowColor = "hsl(var(--destructive))";
      glowColor = "hsl(var(--destructive) / 0.3)";
      statusText = "↩ Turn around — wrong direction";
      statusColor = "text-destructive";
    }
  }

  const displayHeading = heading != null ? `${Math.round(heading)}° (${getCardinalDirection(heading)})` : "---°";
  const compassSize = typeof window !== "undefined" && window.innerWidth < 768
    ? Math.min(280, window.innerWidth * 0.8)
    : 320;
  const r = compassSize / 2;

  const etaStr = route ? formatEta(remainingDist, walkingSpeedKmh) : walkTime;
  const distStr = route ? formatDist(remainingDist) : distance;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center overflow-y-auto" style={{ background: "hsl(var(--background) / 0.97)" }}>
      <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10">
        <X className="w-6 h-6" />
      </button>

      {/* Low accuracy overlay */}
      {lowAccuracy && hasGps && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center px-8">
            <MapPin className="w-10 h-10 text-primary mx-auto mb-3 animate-pulse" />
            <p className="text-sm font-semibold text-foreground">Waiting for a better signal...</p>
            <p className="text-xs text-muted-foreground mt-1">GPS accuracy: {position ? `${Math.round(position.accuracy)}m` : "---"}</p>
          </div>
        </div>
      )}

      {/* No GPS fallback banner */}
      {geoDenied && (
        <div className="w-full bg-destructive/10 border-b border-destructive/30 px-4 py-2 text-center">
          <p className="text-xs text-destructive font-medium">
            📍 Enable location for turn-by-turn directions
          </p>
        </div>
      )}

      <div className="flex flex-col items-center justify-center flex-1 py-6 px-4 w-full max-w-md mx-auto">
        {/* Destination Header */}
        <div className="text-center mb-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Navigating to</p>
          <h2 className="text-xl md:text-2xl font-bold text-primary">{destination}</h2>
          {land && <p className="text-xs text-muted-foreground mt-1">{land}</p>}
          <p className="text-primary/80 font-semibold text-sm mt-1">
            Approx. {etaStr} walk · ~{distStr}
          </p>
        </div>

        {/* Compass */}
        <div className="relative" style={{ width: compassSize, height: compassSize }}>
          <div className="absolute inset-0 rounded-full border-2" style={{
            borderColor: "hsl(var(--primary) / 0.3)",
            background: "hsl(var(--card))",
            boxShadow: `0 0 40px ${glowColor}`,
          }}>
            {/* Concentric rings */}
            {[0.75, 0.55, 0.35].map(scale => (
              <div key={scale} className="absolute rounded-full border" style={{
                borderColor: "hsl(var(--primary) / 0.06)",
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
                  width: 2, height: outer - inner,
                  background: "hsl(var(--primary) / 0.4)",
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
            ].map(d => {
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
                background: "linear-gradient(to bottom, hsl(var(--primary) / 0.2), transparent)",
                transformOrigin: "bottom center",
              }} />
            </div>

            {/* Arrow */}
            <div className="absolute inset-0 flex items-center justify-center" style={{
              transform: heading != null ? `rotate(${arrowRotation}deg)` : "rotate(0deg)",
              transition: "transform 0.3s ease-out",
            }}>
              <svg width={compassSize * 0.5} height={compassSize * 0.5} viewBox="0 0 100 100">
                <polygon points="50,10 42,65 50,55 58,65" fill={arrowColor} />
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
        <p className={`text-sm font-semibold mt-5 ${statusColor}`}>{statusText}</p>

        {/* Current step card (path mode) */}
        {hasPathMode && currentStep && (
          <div className="mt-4 w-full max-w-sm rounded-xl border border-primary/20 bg-card px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              Walk toward {currentStep.toLabel}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{formatDist(currentStep.distanceM)}</p>
            {currentStep.shortcut && (
              <div className="mt-2">
                <ShortcutBadge throughBuilding={currentStep.throughBuilding} />
              </div>
            )}
          </div>
        )}

        {/* Fallback: old-style direction list */}
        {!hasPathMode && directions.length > 0 && (
          <div className="mt-4 px-6 max-w-sm text-center">
            <p className="text-xs text-muted-foreground mb-3">Walk toward {land || destination} via suggested route:</p>
            <div className="space-y-1.5">
              {directions.map((step, i) => (
                <p key={i} className="text-xs text-foreground">{i + 1}. {step}</p>
              ))}
            </div>
          </div>
        )}

        {/* Route step list (path mode) */}
        {hasPathMode && route && (
          <div className="mt-3 w-full">
            <RouteStepList steps={route.steps} currentStepIndex={currentStepIdx} walkingSpeedKmh={walkingSpeedKmh} />
          </div>
        )}

        {/* Fine location note */}
        {fineLocation && (
          <div className="mt-4 w-full max-w-sm rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
            <p className="text-xs text-primary">📍 <span className="italic text-foreground">{fineLocation}</span></p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3 mt-5">
          {hasPathMode && hasGps && (
            <button
              onClick={() => {
                toast("Re-routing...");
                computeRoute();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Re-route
            </button>
          )}
          {hasPathMode && hasGps && (
            <button
              onClick={() => {
                toast("Finding a new route from your location...");
                computeRoute();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <HelpCircle className="w-4 h-4" /> I'm lost
            </button>
          )}
        </div>

        {/* Check-in button */}
        <button onClick={onClose} className="mt-5 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">
          I'm Here — Check Me In ✓
        </button>
        <p className="text-[11px] text-muted-foreground mt-2 mb-4">Tap when you arrive to mark as reached</p>
      </div>
    </div>
  );
};

export default CompassModal;
