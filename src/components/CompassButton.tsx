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
}

const CompassButton = ({
  destination,
  context = "",
  fineLocation,
  size = "inline",
  walkTime = "5 min",
  distance = "0.2 miles",
  directions = ["Head toward the destination using park signage"],
}: CompassButtonProps) => {
  const [open, setOpen] = useState(false);

  const isCard = size === "card";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 font-semibold rounded-full border border-primary/40 bg-[#1a2235] text-primary hover:bg-primary/10 transition-colors ${
          isCard ? "h-9 px-3.5 text-xs" : "h-7 px-2.5 text-[11px]"
        }`}
      >
        🧭 {isCard ? "Navigate" : "Navigate"}
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
      />
    </>
  );
};

export default CompassButton;
