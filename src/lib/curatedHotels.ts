export interface CuratedHotel {
  name: string;
  priceRange: string;
  distanceMiles: number;
  amenities: string[];
  bestFor: string;
  category: string;
  defaultTargetPrice: number;
}

export const CURATED_HOTELS: CuratedHotel[] = [
  { name: "Rosen Inn at Pointe Orlando", priceRange: "$80-110", distanceMiles: 8, amenities: ["Pool", "Shuttle", "Free Parking"], bestFor: "Families on a budget", category: "Budget-Friendly", defaultTargetPrice: 80 },
  { name: "Holiday Inn Resort Orlando Suites", priceRange: "$95-130", distanceMiles: 7, amenities: ["Water Park", "Kids Eat Free", "Shuttle"], bestFor: "Families with young kids", category: "Budget-Friendly", defaultTargetPrice: 95 },
  { name: "Avanti International Resort", priceRange: "$75-100", distanceMiles: 9, amenities: ["Pool", "Kitchenette", "Free Parking"], bestFor: "Extended stays", category: "Budget-Friendly", defaultTargetPrice: 75 },
  { name: "Floridays Resort Orlando", priceRange: "$140-200", distanceMiles: 5, amenities: ["Full Kitchen", "2BR Suites", "Pool", "Free Parking"], bestFor: "Cooking meals to save money", category: "Family Suites", defaultTargetPrice: 140 },
  { name: "Marriott's Harbour Lake", priceRange: "$160-250", distanceMiles: 4, amenities: ["Full Kitchen", "Water Park", "Mini Golf"], bestFor: "Resort feel without Disney prices", category: "Family Suites", defaultTargetPrice: 160 },
  { name: "Drury Plaza Hotel Orlando", priceRange: "$130-180", distanceMiles: 6, amenities: ["Free Breakfast", "Evening Reception", "Pool"], bestFor: "Free meals included", category: "Family Suites", defaultTargetPrice: 130 },
  { name: "Wyndham Garden Lake Buena Vista", priceRange: "$100-150", distanceMiles: 1.5, amenities: ["Shuttle", "Pool", "Walk to Disney Springs"], bestFor: "Closest off-site option", category: "Close to Parks", defaultTargetPrice: 100 },
  { name: "Hilton Orlando Buena Vista Palace", priceRange: "$150-220", distanceMiles: 1, amenities: ["Shuttle", "Spa", "Character Breakfast"], bestFor: "Extra Magic Hours eligible", category: "Close to Parks", defaultTargetPrice: 150 },
  { name: "B Resort & Spa (Disney Springs)", priceRange: "$130-190", distanceMiles: 0.5, amenities: ["Walk to Disney Springs", "Pool", "Spa"], bestFor: "Walk to Disney Springs dining", category: "Close to Parks", defaultTargetPrice: 130 },
];
