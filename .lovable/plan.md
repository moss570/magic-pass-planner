

## Plan: Build Complete Disney Restaurant Database (408 Restaurants)

### Current State
- Database has **73 restaurants** across 17 locations
- Disney's website lists **408 dining options** across all parks, resorts, Disney Springs, water parks, and BoardWalk

### Approach

**Step 1: Write a parsing script to extract all 408 restaurants from Disney's dining page**

The scraped markdown contains structured data for every restaurant:
- Name, service type (Table Service / Quick Service), location, price range, cuisine tags, and Disney URL

The script will parse each restaurant entry and produce a structured JSON with fields matching our `restaurants` table schema.

**Step 2: Map Disney locations to our `location` and `location_type` columns**

Categorize each into:
- **Park**: Magic Kingdom, EPCOT, Hollywood Studios, Animal Kingdom, Typhoon Lagoon, Blizzard Beach
- **Resort**: All resort hotels (Contemporary, Grand Floridian, Polynesian, etc.)
- **Disney Springs**: Disney Springs restaurants
- **Other**: ESPN Wide World of Sports, Four Seasons, BoardWalk (non-resort)

**Step 3: Determine `requires_reservation` and service attributes**

- Restaurants with "Check Availability Calendar" links = `requires_reservation: true`
- Quick Service only = `requires_reservation: false, accepts_walk_ins: true`
- Table Service = `requires_reservation: true`

**Step 4: Deduplicate against existing 73 restaurants**

Match by `disney_url` slug to avoid duplicates. For existing restaurants, skip insertion. For new ones (~335), insert with all parsed fields.

**Step 5: Insert into database**

Use the Supabase insert tool to add all new restaurants in batches.

### Technical Details

**Data extraction from the scraped markdown:**
Each restaurant block follows this pattern:
```
[cuisine tags\\\name\\\service type\\\location\\\price range](disney_url)
```

**Column mapping:**
| Scraped Field | DB Column |
|---|---|
| Restaurant name | `name` |
| Disney URL path | `disney_url` (converted to .com) |
| Location text | `location` |
| Park/Resort/Springs | `location_type` |
| Price range text | `price_range` |
| Cuisine tags | `cuisine` |
| Table/Quick Service | `requires_reservation`, `accepts_walk_ins` |
| Has "Check Availability" link | `requires_reservation: true` |

**URL conversion:** Scraped URLs use `.co.uk` domain (geo-redirect). Convert to `disneyworld.disney.go.com` for the US version.

**Files modified:**
1. No codebase changes needed -- this is a data-only operation
2. Database: ~335 new rows inserted into `restaurants` table via insert tool

### What You'll Get
A complete database of all 408 Disney World dining locations with accurate URLs, locations, cuisine types, and price ranges -- ready for the dining alerts feature to reference.

