import { useState, useEffect, useCallback } from "react";

/**
 * Reusable device heading hook.
 * Returns compass bearing 0-360 (0 = North, clockwise) or null if unavailable.
 * Handles iOS webkitCompassHeading + Android alpha + screen orientation.
 */
export function useDeviceHeading(enabled: boolean = true): {
  heading: number | null;
  permissionDenied: boolean;
} {
  const [heading, setHeading] = useState<number | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    const webkitHeading = (e as any).webkitCompassHeading;
    if (webkitHeading != null) {
      setHeading(webkitHeading);
    } else if (e.alpha != null) {
      const screenOrientation = window.screen?.orientation?.angle ?? 0;
      const corrected = (360 - e.alpha + screenOrientation) % 360;
      setHeading(corrected);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const requestPermission = async () => {
      try {
        if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
          const perm = await (DeviceOrientationEvent as any).requestPermission();
          if (perm !== "granted") {
            setPermissionDenied(true);
            return;
          }
        }
        window.addEventListener("deviceorientation", handleOrientation, true);
      } catch {
        setPermissionDenied(true);
      }
    };

    requestPermission();
    return () => window.removeEventListener("deviceorientation", handleOrientation, true);
  }, [enabled, handleOrientation]);

  return { heading, permissionDenied };
}
