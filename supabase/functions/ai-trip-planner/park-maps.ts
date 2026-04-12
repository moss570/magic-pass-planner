// ═══════════════════════════════════════════════════════════════════════════════
// MAGIC PASS PLUS — Complete Disney World Park Maps
// All 6 parks with X/Y coordinates, ride data, dining, walking distances
// Coordinates: 0-100 scale, origin = park entrance
// ═══════════════════════════════════════════════════════════════════════════════

export interface ParkLocation {
  x: number; y: number; land: string;
  rideTime?: number;
  category: "ride" | "dining" | "show" | "landmark";
  thrillLevel: 1 | 2 | 3 | 4 | 5;
  avgWait: { low: number; moderate: number; high: number };
  llAvailable: boolean;
  tips: string;
  diningType?: "snack" | "quick-service" | "table-service";
  servesMeals?: ("breakfast" | "lunch" | "dinner")[];
}

// ─── MAGIC KINGDOM ────────────────────────────────────────────────────────────
export const MAGIC_KINGDOM: Record<string, ParkLocation> = {
  "Main Gate / Town Square":         { x:50, y:0,  land:"Main Street U.S.A.", category:"landmark", thrillLevel:1, avgWait:{low:0,moderate:0,high:0}, llAvailable:false, tips:"Start of the day — rope drop strategy begins here" },
  "Cinderella Castle":               { x:50, y:50, land:"Hub", category:"landmark", thrillLevel:1, avgWait:{low:0,moderate:0,high:0}, llAvailable:false, tips:"Center of the park — great photo spot" },
  // Tomorrowland
  "TRON Lightcycle / Run":           { x:85, y:80, land:"Tomorrowland", rideTime:2, category:"ride", thrillLevel:5, avgWait:{low:40,moderate:75,high:120}, llAvailable:true, tips:"Book LL at park open. Fastest coaster on property." },
  "Space Mountain":                  { x:88, y:75, land:"Tomorrowland", rideTime:3, category:"ride", thrillLevel:4, avgWait:{low:25,moderate:55,high:90}, llAvailable:true, tips:"Dark indoor coaster, classic WDW." },
  "Buzz Lightyear's Space Ranger Spin":{ x:82, y:68, land:"Tomorrowland", rideTime:5, category:"ride", thrillLevel:2, avgWait:{low:15,moderate:30,high:50}, llAvailable:false, tips:"Interactive shooter, good for all ages" },
  "Tomorrowland Transit Authority PeopleMover":{ x:85,y:70,land:"Tomorrowland",rideTime:10,category:"ride",thrillLevel:1,avgWait:{low:5,moderate:10,high:15},llAvailable:false,tips:"Almost no wait, great overview of Tomorrowland" },
  "Tomorrowland Speedway":           { x:78, y:85, land:"Tomorrowland", rideTime:5, category:"ride", thrillLevel:1, avgWait:{low:15,moderate:30,high:45}, llAvailable:false, tips:"Cars on a track, popular with kids" },
  "Astro Orbiter":                   { x:83, y:65, land:"Tomorrowland", rideTime:3, category:"ride", thrillLevel:2, avgWait:{low:15,moderate:25,high:40}, llAvailable:false, tips:"Go in evening for great views" },
  "Walt Disney's Carousel of Progress":{ x:80,y:75,land:"Tomorrowland",rideTime:21,category:"show",thrillLevel:1,avgWait:{low:5,moderate:5,high:5},llAvailable:false,tips:"Great A/C break, classic show" },
  "Tomorrowland Terrace":            { x:70,y:60,land:"Tomorrowland",category:"dining",thrillLevel:1,avgWait:{low:5,moderate:10,high:15},llAvailable:false,tips:"Quick service, castle views", diningType:"quick-service", servesMeals:["lunch","dinner"] },
  // Fantasyland
  "Seven Dwarfs Mine Train":         { x:55, y:80, land:"Fantasyland", rideTime:3, category:"ride", thrillLevel:3, avgWait:{low:35,moderate:70,high:110}, llAvailable:true, tips:"Most popular family coaster. Book LL after TRON." },
  "Peter Pan's Flight":              { x:45, y:75, land:"Fantasyland", rideTime:3, category:"ride", thrillLevel:2, avgWait:{low:40,moderate:75,high:110}, llAvailable:true, tips:"Gentle ride but always long waits" },
  "\"it's a small world\"":          { x:40, y:82, land:"Fantasyland", rideTime:11, category:"ride", thrillLevel:1, avgWait:{low:5,moderate:15,high:25}, llAvailable:false, tips:"Classic, very low waits, great midday" },
  "Under the Sea - Journey of The Little Mermaid":{ x:42,y:85,land:"Fantasyland",rideTime:6,category:"ride",thrillLevel:1,avgWait:{low:10,moderate:20,high:35},llAvailable:false,tips:"Good for young kids" },
  "Dumbo the Flying Elephant":       { x:48, y:83, land:"Fantasyland", rideTime:2, category:"ride", thrillLevel:1, avgWait:{low:10,moderate:20,high:35}, llAvailable:false, tips:"Queue has indoor play area" },
  "The Barnstormer":                 { x:46, y:86, land:"Fantasyland", rideTime:2, category:"ride", thrillLevel:2, avgWait:{low:10,moderate:20,high:35}, llAvailable:false, tips:"Mini coaster for first-time riders" },
  "Mad Tea Party":                   { x:52, y:75, land:"Fantasyland", rideTime:2, category:"ride", thrillLevel:2, avgWait:{low:10,moderate:20,high:30}, llAvailable:false, tips:"Teacups" },
  "Mickey's PhilharMagic":           { x:47, y:73, land:"Fantasyland", rideTime:12, category:"show", thrillLevel:1, avgWait:{low:5,moderate:10,high:20}, llAvailable:false, tips:"4D movie, great A/C" },
  "Be Our Guest Restaurant":         { x:43, y:78, land:"Fantasyland", rideTime:45, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:5,high:5}, llAvailable:false, tips:"Reservation required — most iconic dining in MK", diningType:"table-service", servesMeals:["lunch","dinner"] },
  "Pinocchio Village Haus":          { x:42, y:80, land:"Fantasyland", rideTime:30, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:10,high:15}, llAvailable:false, tips:"QS, overlooks Small World", diningType:"quick-service", servesMeals:["lunch","dinner"] },
  // Liberty Square
  "Haunted Mansion":                 { x:32, y:70, land:"Liberty Square", rideTime:9, category:"ride", thrillLevel:2, avgWait:{low:15,moderate:30,high:55}, llAvailable:true, tips:"Best in evening for atmosphere" },
  "Columbia Harbour House":          { x:33, y:68, land:"Liberty Square", rideTime:20, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:12,high:20}, llAvailable:false, tips:"Best QS in MK. Second floor has castle views.", diningType:"quick-service", servesMeals:["lunch","dinner"] },
  "Liberty Tree Tavern":             { x:35, y:65, land:"Liberty Square", rideTime:45, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:5,high:5}, llAvailable:false, tips:"Reservation required. Colonial American.", diningType:"table-service", servesMeals:["lunch","dinner"] },
  // Frontierland
  "Big Thunder Mountain Railroad":   { x:22, y:70, land:"Frontierland", rideTime:4, category:"ride", thrillLevel:3, avgWait:{low:20,moderate:40,high:70}, llAvailable:true, tips:"Wildest ride in wilderness. Great fireworks views." },
  "Tiana's Bayou Adventure":         { x:20, y:65, land:"Frontierland", rideTime:11, category:"ride", thrillLevel:3, avgWait:{low:25,moderate:50,high:90}, llAvailable:true, tips:"New and popular. Book LL when available." },
  "Pecos Bill Tall Tale Inn & Cafe": { x:25, y:65, land:"Frontierland", rideTime:20, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:12,high:20}, llAvailable:false, tips:"Largest QS in MK, good for groups", diningType:"quick-service", servesMeals:["lunch","dinner"] },
  "Golden Oak Outpost":              { x:22, y:68, land:"Frontierland", rideTime:5, category:"dining", thrillLevel:1, avgWait:{low:3,moderate:8,high:12}, llAvailable:false, tips:"Waffle fries, fast", diningType:"snack", servesMeals:[] },
  // Adventureland
  "Pirates of the Caribbean":        { x:18, y:58, land:"Adventureland", rideTime:9, category:"ride", thrillLevel:2, avgWait:{low:10,moderate:20,high:40}, llAvailable:false, tips:"Classic ride. Go after 3 PM for short waits." },
  "Jungle Cruise":                   { x:15, y:55, land:"Adventureland", rideTime:10, category:"ride", thrillLevel:2, avgWait:{low:10,moderate:25,high:50}, llAvailable:true, tips:"Best jokes in WDW. Morning or evening." },
  "Walt Disney's Enchanted Tiki Room":{ x:13, y:52, land:"Adventureland", rideTime:12, category:"show", thrillLevel:1, avgWait:{low:5,moderate:10,high:15}, llAvailable:false, tips:"Classic show, great A/C" },
  "Aloha Isle":                      { x:17, y:57, land:"Adventureland", rideTime:5, category:"dining", thrillLevel:1, avgWait:{low:3,moderate:8,high:15}, llAvailable:false, tips:"Dole Whip! Only in MK.", diningType:"snack", servesMeals:[] },
  "The Skipper Canteen":             { x:14, y:53, land:"Adventureland", rideTime:45, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:5,high:5}, llAvailable:false, tips:"Reservation required. Creative pan-Asian.", diningType:"table-service", servesMeals:["lunch","dinner"] },
  "Storybook Treats":                { x:49, y:79, land:"Fantasyland", rideTime:5, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:10,high:15}, llAvailable:false, tips:"Ice cream and snacks", diningType:"snack", servesMeals:[] },
  // Landmarks
  "Main Street Hub":                 { x:50, y:48, land:"Main Street U.S.A.", category:"landmark", thrillLevel:1, avgWait:{low:0,moderate:0,high:0}, llAvailable:false, tips:"Best fireworks position. Arrive 8:45 PM." },
};

// ─── EPCOT ────────────────────────────────────────────────────────────────────
export const EPCOT: Record<string, ParkLocation> = {
  "EPCOT Main Entrance":             { x:50, y:0, land:"World Celebration", category:"landmark", thrillLevel:1, avgWait:{low:0,moderate:0,high:0}, llAvailable:false, tips:"Start here, rope drop strategy" },
  "Spaceship Earth":                 { x:50, y:15, land:"World Celebration", rideTime:15, category:"ride", thrillLevel:1, avgWait:{low:10,moderate:20,high:35}, llAvailable:false, tips:"Iconic EPCOT landmark. Low waits. Good midday filler." },
  // World Discovery
  "Guardians of the Galaxy: Cosmic Rewind":{ x:75, y:30, land:"World Discovery", rideTime:4, category:"ride", thrillLevel:5, avgWait:{low:45,moderate:90,high:150}, llAvailable:true, tips:"Book LL the instant you enter — sells out first. Indoor coaster." },
  "Test Track":                      { x:80, y:35, land:"World Discovery", rideTime:5, category:"ride", thrillLevel:4, avgWait:{low:20,moderate:50,high:90}, llAvailable:true, tips:"Design a car, then test it at 65 mph. Book LL morning." },
  "Mission: SPACE":                  { x:72, y:35, land:"World Discovery", rideTime:5, category:"ride", thrillLevel:4, avgWait:{low:15,moderate:30,high:55}, llAvailable:false, tips:"Intense centrifuge simulator. Orange mission is intense, Green is tamer." },
  "Space 220 Restaurant":            { x:70, y:28, land:"World Discovery", rideTime:90, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:5,high:5}, llAvailable:false, tips:"RESERVATION REQUIRED — hardest table in WDW. Book at exactly 60 days.", diningType:"table-service", servesMeals:["lunch","dinner"] },
  // World Nature
  "Soarin' Around the World":        { x:25, y:35, land:"World Nature", rideTime:5, category:"ride", thrillLevel:2, avgWait:{low:20,moderate:40,high:70}, llAvailable:true, tips:"Classic hang glider simulation. Book LL if Guardians isn't option." },
  "The Seas with Nemo & Friends":    { x:20, y:32, land:"World Nature", rideTime:6, category:"ride", thrillLevel:1, avgWait:{low:10,moderate:20,high:35}, llAvailable:false, tips:"Great for young kids. Usually walk-on morning." },
  "Turtle Talk with Crush":          { x:22, y:33, land:"World Nature", rideTime:15, category:"show", thrillLevel:1, avgWait:{low:5,moderate:10,high:15}, llAvailable:false, tips:"Interactive show with Crush. Kids love it." },
  "Garden Grill Restaurant":         { x:28, y:38, land:"World Nature", rideTime:60, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:5,high:5}, llAvailable:false, tips:"Reservation required. Rotating character dining.", diningType:"table-service", servesMeals:["breakfast","lunch","dinner"] },
  // World Celebration
  "Remy's Ratatouille Adventure":    { x:50, y:80, land:"World Showcase - France", rideTime:5, category:"ride", thrillLevel:2, avgWait:{low:30,moderate:60,high:95}, llAvailable:true, tips:"Charming ride, popular with families. Book LL early." },
  "Frozen Ever After":               { x:50, y:25, land:"World Showcase - Norway", rideTime:5, category:"ride", thrillLevel:2, avgWait:{low:25,moderate:55,high:90}, llAvailable:true, tips:"Boat ride through Arendelle. Book LL morning." },
  // World Showcase dining (key ones)
  "Akershus Royal Banquet Hall":     { x:50, y:25, land:"World Showcase - Norway", rideTime:60, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:5,high:5}, llAvailable:false, tips:"Reservation required. Princess character dining.", diningType:"table-service", servesMeals:["breakfast","lunch","dinner"] },
  "Le Cellier Steakhouse":           { x:50, y:45, land:"World Showcase - Canada", rideTime:60, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:5,high:5}, llAvailable:false, tips:"Reservation required. Best steak in WDW.", diningType:"table-service", servesMeals:["lunch","dinner"] },
  "Via Napoli Ristorante e Pizzeria":{ x:50, y:60, land:"World Showcase - Italy", rideTime:60, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:5,high:5}, llAvailable:false, tips:"Reservation required. Authentic Neapolitan pizza.", diningType:"table-service", servesMeals:["lunch","dinner"] },
  "Teppan Edo":                      { x:50, y:55, land:"World Showcase - Japan", rideTime:60, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:5,high:5}, llAvailable:false, tips:"Reservation required. Teppanyaki style.", diningType:"table-service", servesMeals:["lunch","dinner"] },
  "Refreshment Port":                { x:50, y:43, land:"World Showcase - Canada", rideTime:5, category:"dining", thrillLevel:1, avgWait:{low:3,moderate:8,high:12}, llAvailable:false, tips:"QS, poutine!", diningType:"snack", servesMeals:[] },
  "Sunshine Seasons":                { x:28, y:36, land:"World Nature", rideTime:20, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:12,high:20}, llAvailable:false, tips:"Best QS in EPCOT. Huge variety, Food & Wine vibes.", diningType:"quick-service", servesMeals:["breakfast","lunch","dinner"] },
  "Topolino's Terrace":              { x:70, y:38, land:"World Discovery area", rideTime:60, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:5,high:5}, llAvailable:false, tips:"Reservation required. Rooftop character breakfast.", diningType:"table-service", servesMeals:["breakfast","dinner"] },
  // Fireworks
  "World Showcase Lagoon":           { x:50, y:50, land:"World Showcase", category:"landmark", thrillLevel:1, avgWait:{low:0,moderate:0,high:0}, llAvailable:false, tips:"Best EPCOT fireworks view. France pavilion side is less crowded." },
};

// ─── HOLLYWOOD STUDIOS ────────────────────────────────────────────────────────
export const HOLLYWOOD_STUDIOS: Record<string, ParkLocation> = {
  "Hollywood Studios Entrance":      { x:50, y:0, land:"Hollywood Boulevard", category:"landmark", thrillLevel:1, avgWait:{low:0,moderate:0,high:0}, llAvailable:false, tips:"Rope drop here" },
  // Galaxy's Edge
  "Star Wars: Rise of the Resistance":{ x:20, y:85, land:"Galaxy's Edge", rideTime:20, category:"ride", thrillLevel:4, avgWait:{low:50,moderate:90,high:150}, llAvailable:true, tips:"Book LL immediately at park open. Most immersive ride in WDW." },
  "Millennium Falcon: Smugglers Run":{ x:25, y:80, land:"Galaxy's Edge", rideTime:5, category:"ride", thrillLevel:3, avgWait:{low:25,moderate:55,high:90}, llAvailable:true, tips:"Pilot the Falcon. Pilot role gets the best experience." },
  "Docking Bay 7 Food and Cargo":    { x:22, y:82, land:"Galaxy's Edge", rideTime:20, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:12,high:20}, llAvailable:false, tips:"QS in Galaxy's Edge. Themed menu items." },
  "Oga's Cantina":                   { x:23, y:84, land:"Galaxy's Edge", rideTime:45, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:5,high:5}, llAvailable:false, tips:"RESERVATION REQUIRED. 45 min limit. Galaxy cocktail bar." },
  // Toy Story Land
  "Slinky Dog Dash":                 { x:75, y:75, land:"Toy Story Land", rideTime:3, category:"ride", thrillLevel:3, avgWait:{low:30,moderate:65,high:110}, llAvailable:true, tips:"Best family coaster in HS. Book LL early." },
  "Alien Swirling Saucers":          { x:80, y:78, land:"Toy Story Land", rideTime:2, category:"ride", thrillLevel:1, avgWait:{low:15,moderate:30,high:50}, llAvailable:false, tips:"Good for little kids" },
  "Toy Story Mania!":                { x:78, y:72, land:"Toy Story Land", rideTime:7, category:"ride", thrillLevel:2, avgWait:{low:20,moderate:45,high:75}, llAvailable:true, tips:"Interactive 4D shooter. Families love this." },
  "Woody's Lunch Box":               { x:76, y:76, land:"Toy Story Land", rideTime:10, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:12,high:20}, llAvailable:false, tips:"QS. Pop Tart French Toast is a fan favorite." },
  // Sunset Boulevard
  "Tower of Terror":                 { x:85, y:55, land:"Sunset Boulevard", rideTime:5, category:"ride", thrillLevel:5, avgWait:{low:25,moderate:55,high:90}, llAvailable:true, tips:"Haunted elevator drops. Best thrill in HS. Morning." },
  // Rock 'n' Roller Coaster — CLOSED (removed)
  "Beauty and the Beast - Live on Stage":{ x:82,y:52,land:"Sunset Boulevard",rideTime:30,category:"show",thrillLevel:1,avgWait:{low:15,moderate:20,high:25},llAvailable:false,tips:"Great stage show. Good afternoon break." },
  "Hollywood Brown Derby":           { x:50, y:20, land:"Hollywood Boulevard", rideTime:60, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:5,high:5}, llAvailable:false, tips:"Reservation required. Fine dining, Cobb salad." },
  "Sci-Fi Dine-In Theater Restaurant":{ x:55, y:30, land:"Echo Lake", rideTime:60, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:5,high:5}, llAvailable:false, tips:"Reservation required. Drive-in movie atmosphere." },
  "50's Prime Time Café":            { x:52, y:35, land:"Echo Lake", rideTime:60, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:5,high:5}, llAvailable:false, tips:"Reservation required. Interactive servers, comfort food." },
  // Echo Lake / Misc
  "Mickey & Minnie's Runaway Railway":{ x:50, y:25, land:"Hollywood Boulevard", rideTime:7, category:"ride", thrillLevel:2, avgWait:{low:25,moderate:55,high:85}, llAvailable:true, tips:"The biggest ride upgrade in years. Book LL." },
  "Indiana Jones Epic Stunt Spectacular":{ x:55, y:45, land:"Echo Lake", rideTime:30, category:"show", thrillLevel:2, avgWait:{low:15,moderate:20,high:30}, llAvailable:false, tips:"Great live stunt show. Arrive 15 min early for front rows." },
  "Fantasmic! Amphitheater":         { x:85, y:65, land:"Sunset Boulevard", rideTime:30, category:"show", thrillLevel:1, avgWait:{low:20,moderate:30,high:45}, llAvailable:false, tips:"Evening show. Arrive 45 min early. Dine-in package available." },
  "Backlot Express":                 { x:60, y:40, land:"Echo Lake", rideTime:20, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:10,high:15}, llAvailable:false, tips:"Best QS in HS area. Near Galaxy's Edge." },
};

// ─── ANIMAL KINGDOM ────────────────────────────────────────────────────────────
export const ANIMAL_KINGDOM: Record<string, ParkLocation> = {
  "Animal Kingdom Entrance":         { x:50, y:0, land:"The Oasis", category:"landmark", thrillLevel:1, avgWait:{low:0,moderate:0,high:0}, llAvailable:false, tips:"Rope drop here. AK opens early — safaris are best at open." },
  "Tree of Life":                    { x:50, y:35, land:"Discovery Island", category:"landmark", thrillLevel:1, avgWait:{low:0,moderate:0,high:0}, llAvailable:false, tips:"Iconic. Walk around it, spot 300+ animal carvings." },
  // Pandora
  "Avatar Flight of Passage":        { x:25, y:70, land:"Pandora", rideTime:5, category:"ride", thrillLevel:5, avgWait:{low:50,moderate:100,high:165}, llAvailable:true, tips:"Book LL immediately. Best ride in WDW. Fly on a banshee." },
  "Na'vi River Journey":             { x:22, y:75, land:"Pandora", rideTime:5, category:"ride", thrillLevel:1, avgWait:{low:25,moderate:55,high:90}, llAvailable:true, tips:"Gentle boat ride through Pandora at night. Stunning visuals." },
  "Satu'li Canteen":                 { x:23, y:72, land:"Pandora", rideTime:20, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:12,high:20}, llAvailable:false, tips:"Best QS in AK. Customizable bowls, alien-themed." },
  // Africa
  "Kilimanjaro Safaris":             { x:20, y:40, land:"Africa", rideTime:18, category:"ride", thrillLevel:2, avgWait:{low:15,moderate:35,high:65}, llAvailable:true, tips:"Best safari in AK. Go first thing at rope drop — animals most active." },
  "Gorilla Falls Exploration Trail": { x:18, y:45, land:"Africa", rideTime:30, category:"show", thrillLevel:1, avgWait:{low:0,moderate:0,high:0}, llAvailable:false, tips:"Walking trail with gorillas, hippos. Great 20-30 min break." },
  "Tusker House Restaurant":         { x:22, y:42, land:"Africa", rideTime:60, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:5,high:5}, llAvailable:false, tips:"Reservation required. Character dining with Donald Duck." },
  "Harambe Market":                  { x:24, y:43, land:"Africa", rideTime:10, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:10,high:15}, llAvailable:false, tips:"QS. African street food — ribs, corn, chicken." },
  // Asia
  "Expedition Everest":              { x:80, y:55, land:"Asia", rideTime:4, category:"ride", thrillLevel:5, avgWait:{low:20,moderate:45,high:80}, llAvailable:true, tips:"Best rollercoaster in AK. Goes backwards! Morning for lowest waits." },
  "Kali River Rapids":               { x:75, y:60, land:"Asia", rideTime:5, category:"ride", thrillLevel:3, avgWait:{low:20,moderate:45,high:75}, llAvailable:false, tips:"You WILL get wet. Great on hot days. Afternoon = shortest wait." },
  "Maharajah Jungle Trek":           { x:78, y:58, land:"Asia", rideTime:20, category:"show", thrillLevel:1, avgWait:{low:0,moderate:0,high:0}, llAvailable:false, tips:"Walking trail with tigers, gibbons. Peaceful break." },
  "Yak & Yeti Restaurant":           { x:76, y:56, land:"Asia", rideTime:60, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:5,high:5}, llAvailable:false, tips:"Reservation recommended. Pan-Asian, good quality." },
  "Mr. Kamal's":                     { x:80, y:52, land:"Asia", rideTime:5, category:"dining", thrillLevel:1, avgWait:{low:3,moderate:8,high:12}, llAvailable:false, tips:"QS, seasoned fries and more" },
  // Discovery Island
  "It's Tough to be a Bug!":         { x:50, y:33, land:"Discovery Island", rideTime:9, category:"show", thrillLevel:2, avgWait:{low:10,moderate:15,high:25}, llAvailable:false, tips:"4D show inside Tree of Life. Great for families." },
  "Flame Tree Barbecue":             { x:52, y:38, land:"Discovery Island", rideTime:20, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:12,high:18}, llAvailable:false, tips:"Best BBQ in WDW. Outdoor seating with great views." },
  "Tiffins Restaurant":              { x:55, y:40, land:"Discovery Island", rideTime:60, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:5,high:5}, llAvailable:false, tips:"Reservation required. Best food in AK, globally inspired." },
  // DinoLand
  "DINOSAUR":                        { x:75, y:30, land:"DinoLand U.S.A.", rideTime:4, category:"ride", thrillLevel:3, avgWait:{low:20,moderate:40,high:65}, llAvailable:false, tips:"Dark, intense ride. Short waits usually." },
  "Primeval Whirl":                  { x:78, y:28, land:"DinoLand U.S.A.", rideTime:2, category:"ride", thrillLevel:2, avgWait:{low:15,moderate:30,high:50}, llAvailable:false, tips:"Wild spinning coaster, often seasonal" },
  // Rivers of Light / Nighttime
  "Rivers of Light: We Are One":     { x:50, y:50, land:"Discovery Island", rideTime:25, category:"show", thrillLevel:1, avgWait:{low:20,moderate:25,high:35}, llAvailable:false, tips:"Evening show. Beautiful floating lanterns. Arrive 30 min early." },
};

// ─── TYPHOON LAGOON ────────────────────────────────────────────────────────────
export const TYPHOON_LAGOON: Record<string, ParkLocation> = {
  "Typhoon Lagoon Entrance":         { x:50, y:0, land:"Typhoon Lagoon", category:"landmark", thrillLevel:1, avgWait:{low:0,moderate:0,high:0}, llAvailable:false, tips:"Rope drop: head to Crush n' Gusher first" },
  "Crush 'n' Gusher":               { x:75, y:60, land:"Typhoon Lagoon", rideTime:2, category:"ride", thrillLevel:4, avgWait:{low:20,moderate:40,high:70}, llAvailable:false, tips:"Best water coaster in WDW. Go at rope drop." },
  "Miss Adventure Falls":            { x:25, y:55, land:"Typhoon Lagoon", rideTime:5, category:"ride", thrillLevel:2, avgWait:{low:20,moderate:35,high:60}, llAvailable:false, tips:"Family raft ride, water treasure hunt theme" },
  "Humunga Kowabunga":               { x:60, y:70, land:"Typhoon Lagoon", rideTime:1, category:"ride", thrillLevel:5, avgWait:{low:15,moderate:30,high:50}, llAvailable:false, tips:"Near-vertical speed slide. Thrillseekers only." },
  "Mayday Falls":                    { x:40, y:65, land:"Typhoon Lagoon", rideTime:3, category:"ride", thrillLevel:3, avgWait:{low:10,moderate:20,high:35}, llAvailable:false, tips:"Single-rider tube slide through caves" },
  "Bay Slides":                      { x:50, y:55, land:"Typhoon Lagoon", rideTime:1, category:"ride", thrillLevel:2, avgWait:{low:5,moderate:10,high:20}, llAvailable:false, tips:"Body slides, great for kids and first-timers" },
  "Typhoon Lagoon Surf Pool":        { x:50, y:30, land:"Typhoon Lagoon", rideTime:0, category:"landmark", thrillLevel:1, avgWait:{low:0,moderate:0,high:0}, llAvailable:false, tips:"Huge wave pool. Waves every 90 seconds." },
  "Shark Reef Snorkeling":           { x:35, y:35, land:"Typhoon Lagoon", rideTime:15, category:"show", thrillLevel:1, avgWait:{low:5,moderate:15,high:25}, llAvailable:false, tips:"Snorkel with real sharks and rays. Gear included." },
  "Leaning Palms":                   { x:50, y:25, land:"Typhoon Lagoon", rideTime:15, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:12,high:20}, llAvailable:false, tips:"Main QS. Burgers, chicken, wraps." },
  "Typhoon Tilly's":                 { x:70, y:30, land:"Typhoon Lagoon", rideTime:10, category:"dining", thrillLevel:1, avgWait:{low:3,moderate:8,high:15}, llAvailable:false, tips:"Lighter snacks and sandwiches" },
};

// ─── BLIZZARD BEACH ────────────────────────────────────────────────────────────
export const BLIZZARD_BEACH: Record<string, ParkLocation> = {
  "Blizzard Beach Entrance":         { x:50, y:0, land:"Blizzard Beach", category:"landmark", thrillLevel:1, avgWait:{low:0,moderate:0,high:0}, llAvailable:false, tips:"Rope drop: head to Summit Plummet first" },
  "Summit Plummet":                  { x:50, y:90, land:"Blizzard Beach", rideTime:1, category:"ride", thrillLevel:5, avgWait:{low:20,moderate:45,high:75}, llAvailable:false, tips:"Tallest, fastest slide in WDW (120 ft, 60 mph). First thing in morning." },
  "Slush Gusher":                    { x:55, y:85, land:"Blizzard Beach", rideTime:1, category:"ride", thrillLevel:4, avgWait:{low:15,moderate:30,high:55}, llAvailable:false, tips:"Slalom speed slide, less intense than Summit" },
  "Teamboat Springs":                { x:30, y:75, land:"Blizzard Beach", rideTime:3, category:"ride", thrillLevel:2, avgWait:{low:15,moderate:30,high:55}, llAvailable:false, tips:"Longest family raft ride in WDW. Best for groups." },
  "Toboggan Racers":                 { x:65, y:75, land:"Blizzard Beach", rideTime:1, category:"ride", thrillLevel:3, avgWait:{low:10,moderate:20,high:40}, llAvailable:false, tips:"Race your group on 8 side-by-side lanes" },
  "Downhill Double Dipper":          { x:45, y:80, land:"Blizzard Beach", rideTime:1, category:"ride", thrillLevel:3, avgWait:{low:15,moderate:30,high:50}, llAvailable:false, tips:"Head-to-head race slides" },
  "Cross Country Creek":             { x:50, y:50, land:"Blizzard Beach", rideTime:20, category:"ride", thrillLevel:1, avgWait:{low:5,moderate:10,high:15}, llAvailable:false, tips:"Lazy river around the whole park. Always low wait." },
  "Melt-Away Bay":                   { x:50, y:30, land:"Blizzard Beach", rideTime:0, category:"landmark", thrillLevel:1, avgWait:{low:0,moderate:0,high:0}, llAvailable:false, tips:"Wave pool, calmer than Typhoon Lagoon." },
  "Lottawatta Lodge":                { x:50, y:20, land:"Blizzard Beach", rideTime:15, category:"dining", thrillLevel:1, avgWait:{low:5,moderate:12,high:20}, llAvailable:false, tips:"Main QS. Burgers, hot dogs, sandwiches." },
  "Arctic Expeditions":              { x:55, y:25, land:"Blizzard Beach", rideTime:10, category:"dining", thrillLevel:1, avgWait:{low:3,moderate:8,high:12}, llAvailable:false, tips:"Lighter snacks and drinks" },
};

// ─── PARK SCALE (meters across) ───────────────────────────────────────────────
export const PARK_SCALE: Record<string, number> = {
  "Magic Kingdom": 500,
  "EPCOT": 600,
  "Hollywood Studios": 400,
  "Animal Kingdom": 550,
  "Typhoon Lagoon": 300,
  "Blizzard Beach": 280,
};

export const ALL_PARKS: Record<string, Record<string, ParkLocation>> = {
  "Magic Kingdom": MAGIC_KINGDOM,
  "EPCOT": EPCOT,
  "Hollywood Studios": HOLLYWOOD_STUDIOS,
  "Animal Kingdom": ANIMAL_KINGDOM,
  "Typhoon Lagoon": TYPHOON_LAGOON,
  "Blizzard Beach": BLIZZARD_BEACH,
};
