/**
 * GPS Tracker for Mystery Game
 * Detects when player is near ride lines, restaurants, or merchandise zones
 * Triggers bonus clues at real-world locations
 */

export interface ParkZone {
  id: string;
  name: string;
  type: "ride_line" | "restaurant" | "merchandise";
  lat: number;
  lng: number;
  radiusMeters: number;
  clueBonus: string; // Description of bonus content
}

// Generic Adventure World zones (NO Disney IP)
// Using approximate Central Florida theme park coordinates
export const PARK_ZONES: ParkZone[] = [
  // Ride Lines
  { id: "zone_coaster_1", name: "Thunder Valley Queue", type: "ride_line", lat: 28.4177, lng: -81.5812, radiusMeters: 50, clueBonus: "A ride operator overheard something suspicious..." },
  { id: "zone_coaster_2", name: "Starlight Spinner Queue", type: "ride_line", lat: 28.4185, lng: -81.5800, radiusMeters: 50, clueBonus: "Graffiti on the queue wall matches a suspect's handwriting..." },
  { id: "zone_coaster_3", name: "Splash Rapids Queue", type: "ride_line", lat: 28.4192, lng: -81.5825, radiusMeters: 50, clueBonus: "A discarded receipt was found near the queue entrance..." },
  { id: "zone_coaster_4", name: "Haunted Passage Queue", type: "ride_line", lat: 28.4168, lng: -81.5808, radiusMeters: 50, clueBonus: "The maintenance door here was left unlocked last night..." },
  { id: "zone_coaster_5", name: "Galaxy Explorer Queue", type: "ride_line", lat: 28.4175, lng: -81.5795, radiusMeters: 50, clueBonus: "A security guard remembers seeing someone unusual..." },
  { id: "zone_coaster_6", name: "Enchanted Garden Queue", type: "ride_line", lat: 28.4188, lng: -81.5835, radiusMeters: 50, clueBonus: "Footprints in the garden soil match maintenance boots..." },
  { id: "zone_coaster_7", name: "Sky Tower Queue", type: "ride_line", lat: 28.4180, lng: -81.5818, radiusMeters: 50, clueBonus: "From up here, you can see the escape route clearly..." },
  { id: "zone_coaster_8", name: "Pirate's Cove Queue", type: "ride_line", lat: 28.4170, lng: -81.5790, radiusMeters: 50, clueBonus: "A child says they saw 'a lady with a suitcase' last night..." },

  // Restaurants
  { id: "zone_food_1", name: "Main Street Grill", type: "restaurant", lat: 28.4183, lng: -81.5805, radiusMeters: 40, clueBonus: "The waiter remembers a late-night visitor ordering coffee to go..." },
  { id: "zone_food_2", name: "Sunset Café", type: "restaurant", lat: 28.4190, lng: -81.5815, radiusMeters: 40, clueBonus: "Security footage from the café shows someone carrying a large bag..." },
  { id: "zone_food_3", name: "Frontier BBQ Pit", type: "restaurant", lat: 28.4172, lng: -81.5830, radiusMeters: 40, clueBonus: "A cook found a suspicious tool hidden behind the dumpster..." },
  { id: "zone_food_4", name: "Starlite Diner", type: "restaurant", lat: 28.4178, lng: -81.5798, radiusMeters: 40, clueBonus: "The diner's night camera caught someone running past at midnight..." },

  // Merchandise
  { id: "zone_shop_1", name: "Park Treasures Gift Shop", type: "merchandise", lat: 28.4186, lng: -81.5810, radiusMeters: 35, clueBonus: "A gift shop employee noticed inventory discrepancies..." },
  { id: "zone_shop_2", name: "Adventure Outfitters", type: "merchandise", lat: 28.4174, lng: -81.5820, radiusMeters: 35, clueBonus: "Packaging materials matching the stolen item were found here..." },
  { id: "zone_shop_3", name: "Souvenir Corner", type: "merchandise", lat: 28.4182, lng: -81.5803, radiusMeters: 35, clueBonus: "The register shows a suspicious after-hours transaction..." },
];

/**
 * Calculate distance between two GPS coordinates (Haversine formula)
 * Returns distance in meters
 */
export const getDistanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371e3; // Earth radius in meters
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Find the nearest park zone to a given GPS position
 */
export const findNearestZone = (lat: number, lng: number): { zone: ParkZone; distance: number } | null => {
  let nearest: { zone: ParkZone; distance: number } | null = null;

  for (const zone of PARK_ZONES) {
    const dist = getDistanceMeters(lat, lng, zone.lat, zone.lng);
    if (dist <= zone.radiusMeters && (!nearest || dist < nearest.distance)) {
      nearest = { zone, distance: dist };
    }
  }

  return nearest;
};

/**
 * Check if user is in a ride queue (any ride_line zone)
 */
export const isInRideQueue = (lat: number, lng: number): ParkZone | null => {
  for (const zone of PARK_ZONES.filter(z => z.type === "ride_line")) {
    if (getDistanceMeters(lat, lng, zone.lat, zone.lng) <= zone.radiusMeters) {
      return zone;
    }
  }
  return null;
};

/**
 * GPS Position watcher with callbacks
 */
export class GPSWatcher {
  private watchId: number | null = null;
  private onZoneEnter: (zone: ParkZone) => void;
  private onZoneExit: () => void;
  private onError: (msg: string) => void;
  private currentZone: ParkZone | null = null;
  private visitedZones: Set<string> = new Set();

  constructor(
    onZoneEnter: (zone: ParkZone) => void,
    onZoneExit: () => void,
    onError: (msg: string) => void
  ) {
    this.onZoneEnter = onZoneEnter;
    this.onZoneExit = onZoneExit;
    this.onError = onError;
  }

  start() {
    if (!navigator.geolocation) {
      this.onError("GPS not available on this device");
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const nearest = findNearestZone(latitude, longitude);

        if (nearest) {
          if (!this.currentZone || this.currentZone.id !== nearest.zone.id) {
            this.currentZone = nearest.zone;
            if (!this.visitedZones.has(nearest.zone.id)) {
              this.visitedZones.add(nearest.zone.id);
              this.onZoneEnter(nearest.zone);
            }
          }
        } else {
          if (this.currentZone) {
            this.currentZone = null;
            this.onZoneExit();
          }
        }
      },
      (err) => {
        this.onError(`GPS error: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000, // 10 second cache
        timeout: 15000,
      }
    );
  }

  stop() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  getVisitedZones(): Set<string> {
    return this.visitedZones;
  }

  isTracking(): boolean {
    return this.watchId !== null;
  }
}
