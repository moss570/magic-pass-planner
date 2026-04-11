// ═══════════════════════════════════════════════════════════════════════════════
// Shared types for park scheduler system
// ═══════════════════════════════════════════════════════════════════════════════

export interface PathNode {
  id: string;
  type: 'entrance' | 'attraction' | 'show' | 'restaurant' | 'restroom' | 'snack' | 'merch' | 'photopass' | 'landmark' | 'waypoint';
  lat: number;
  lng: number;
  land: string;
  label: string;
  attractionId?: string;
}

export interface PathEdge {
  from: string;
  to: string;
  distance_m: number;
  shortcut: boolean;
  throughBuilding?: string;
}

export interface PathGraph {
  nodes: PathNode[];
  edges: PathEdge[];
}

export interface Attraction {
  id: string;
  parkId: string;
  name: string;
  land: string;
  nodeId: string;
  hasLightningLane: boolean;
  llType: 'multi' | 'individual' | null;
  avgDurationMin: number;
  rideType: string;
  thrillLevel: number;
  heightReqIn: number | null;
  tips: string;
  avgWait: { low: number; moderate: number; high: number };
}

export interface Show {
  id: string;
  parkId: string;
  name: string;
  nodeId: string;
  land: string;
  durationMin: number;
  tips: string;
  schedule?: string[];
}

export interface LandCrowdWindow {
  parkId: string;
  land: string;
  dayOfWeek: number;
  hour: number;
  crowdLevel: number;
}

export interface TransitHop {
  durationMin: number;
  method: string;
}

export interface TransitMatrix {
  [fromPark: string]: { [toPark: string]: TransitHop };
}

export interface PassingPoint {
  type: string;
  label: string;
  nodeId: string;
  detourSeconds: number;
}

export interface SchedulerItem {
  startTime: number;
  duration: number;
  walkMinutes: number;
  waitMinutes: number;
  rideMinutes?: number;
  activity: string;
  type: string;
  badge?: string;
  tip: string;
  location?: string;
  land?: string;
  priority: string;
  alternativeDining?: string[];
  passingPoints: PassingPoint[];
  isDuplicate?: boolean;
  firstScheduledDay?: number;
  requiresReservation?: boolean;
}

export interface ParkData {
  parkId: string;
  graph: PathGraph;
  attractions: Attraction[];
  shows: Show[];
  crowdWindows: LandCrowdWindow[];
  parkMeta: { emoji: string; bestFor: string; llPriority: string[]; entranceNodeId: string; fireworksNodeId?: string; fireworksName?: string };
  diningNodes: DiningNode[];
}

export interface DiningNode {
  nodeId: string;
  name: string;
  land: string;
  diningType: 'quick-service' | 'table-service' | 'character-dining' | 'snack' | 'bar';
  durationMin: number;
  requiresReservation: boolean;
  tips: string;
}

export interface MustDoPreference {
  [attractionId: string]: 'must' | 'want' | 'skip';
}

export interface SchedulerInput {
  parks: string[];
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  ages: string;
  ridePreference: string;
  budget: number;
  llOption: string;
  specialNotes: string;
  parkHopper: boolean;
  resortStay: boolean;
  nonParkDays: number;
  mustDoAttractions?: { [parkId: string]: MustDoPreference };
  walkingSpeedKmh?: number;
}

export interface SchedulerWarning {
  message: string;
  attractionId?: string;
}

export interface ParkProvider {
  getPathGraph(parkId: string): PathGraph;
  getAttractions(parkId: string): Attraction[];
  getShows(parkId: string): Show[];
  getLandCrowdWindows(parkId: string): LandCrowdWindow[];
  getTransitMatrix(): TransitMatrix;
  getDiningNodes(parkId: string): DiningNode[];
  getParkMeta(parkId: string): ParkData['parkMeta'] | null;
}
