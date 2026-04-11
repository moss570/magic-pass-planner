import { useState } from "react";
import CompassModal from "./CompassModal";

interface CompassButtonProps {
  destination: string;
  context?: string;
  fineLocation?: string;
  size?: "inline" | "card";
  walkTime?: string;
  distance?: string;
  directions?: string[];
  /** Path-graph destination node ID */
  toNodeId?: string;
  /** Optional starting node ID */
  fromNodeId?: string;
  /** Park ID for loading graph */
  parkId?: string;
  /** Walking speed in km/h */
  walkingSpeedKmh?: number;
  /** Fallback destination latitude */
  toLat?: number;
  /** Fallback destination longitude */
  toLng?: number;
}

const CompassButton = ({
  destination,
  context = "",
  fineLocation,
  size = "inline",
  walkTime = "5 min",
  distance = "0.2 miles",
  directions = ["Head toward the destination using park signage"],
  toNodeId,
  fromNodeId,
  parkId,
  walkingSpeedKmh = 2.5,
  toLat,
  toLng,
}: CompassButtonProps) => {
  const [open, setOpen] = useState(false);

  const isCard = size === "card";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 font-semibold rounded-full border border-primary/40 bg-card text-primary hover:bg-primary/10 transition-colors ${
          isCard ? "h-9 px-3.5 text-xs" : "h-7 px-2.5 text-[11px]"
        }`}
      >
        🧭 Navigate
      </button>
      <CompassModal
        open={open}
        onClose={() => setOpen(false)}
        destination={destination}
        land={context}
        walkTime={walkTime}
        distance={distance}
        directions={directions}
        fineLocation={fineLocation}
        toNodeId={toNodeId}
        fromNodeId={fromNodeId}
        parkId={parkId}
        walkingSpeedKmh={walkingSpeedKmh}
        toLat={toLat}
        toLng={toLng}
      />
    </>
  );
};

export default CompassButton;
