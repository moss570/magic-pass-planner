import { useState, useEffect, useRef } from "react";

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

export interface UseGeolocationResult {
  position: GeoPosition | null;
  error: string | null;
  permissionDenied: boolean;
}

/**
 * Wraps navigator.geolocation.watchPosition with a 5m accuracy filter.
 * Returns live GPS coords, accuracy, and error state.
 */
export function useGeolocation(enabled: boolean = true): UseGeolocationResult {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        // Only update if accuracy is reasonable (< 100m) to avoid wild jumps
        if (accuracy < 100) {
          setPosition((prev) => {
            // 5m movement filter — skip tiny jitter
            if (prev) {
              const dLat = (latitude - prev.lat) * 111000;
              const dLng = (longitude - prev.lng) * 111000 * Math.cos(prev.lat * Math.PI / 180);
              const dist = Math.sqrt(dLat * dLat + dLng * dLng);
              if (dist < 5 && Math.abs(accuracy - prev.accuracy) < 5) return prev;
            }
            return { lat: latitude, lng: longitude, accuracy };
          });
          setError(null);
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionDenied(true);
          setError("Location permission denied");
        } else {
          setError(err.message);
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [enabled]);

  return { position, error, permissionDenied };
}
