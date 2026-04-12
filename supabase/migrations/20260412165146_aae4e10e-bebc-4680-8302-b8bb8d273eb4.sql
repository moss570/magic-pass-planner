
-- ============================================================
-- MAGIC KINGDOM ATTRACTIONS
-- ============================================================
INSERT INTO public.attractions (park_id, name, land, has_lightning_lane, ll_type, avg_duration_min, ride_type, thrill_level, height_req_in) VALUES
-- Main Street U.S.A.
('magic-kingdom', 'Walt Disney World Railroad - Main Street', 'Main Street U.S.A.', false, null, 20, 'ride', 1, null),
-- Adventureland
('magic-kingdom', 'Jungle Cruise', 'Adventureland', true, 'multi_pass', 10, 'ride', 2, null),
('magic-kingdom', 'Pirates of the Caribbean', 'Adventureland', true, 'multi_pass', 12, 'ride', 2, null),
('magic-kingdom', 'The Magic Carpets of Aladdin', 'Adventureland', false, null, 2, 'ride', 1, null),
('magic-kingdom', 'Swiss Family Treehouse', 'Adventureland', false, null, 15, 'walk-through', 1, null),
('magic-kingdom', 'A Pirates Adventure', 'Adventureland', false, null, 20, 'walk-through', 1, null),
-- Frontierland
('magic-kingdom', 'Big Thunder Mountain Railroad', 'Frontierland', true, 'multi_pass', 4, 'ride', 4, 40),
('magic-kingdom', 'Splash Mountain', 'Frontierland', true, 'multi_pass', 11, 'ride', 4, 40),
('magic-kingdom', 'Tom Sawyer Island', 'Frontierland', false, null, 30, 'walk-through', 1, null),
('magic-kingdom', 'Country Bear Jamboree', 'Frontierland', false, null, 16, 'show', 1, null),
-- Liberty Square
('magic-kingdom', 'Haunted Mansion', 'Liberty Square', true, 'multi_pass', 9, 'ride', 2, null),
('magic-kingdom', 'Hall of Presidents', 'Liberty Square', false, null, 23, 'show', 1, null),
('magic-kingdom', 'Liberty Square Riverboat', 'Liberty Square', false, null, 14, 'ride', 1, null),
-- Fantasyland
('magic-kingdom', 'Seven Dwarfs Mine Train', 'Fantasyland', true, 'individual', 3, 'ride', 3, 38),
('magic-kingdom', 'Peter Pan''s Flight', 'Fantasyland', true, 'multi_pass', 3, 'ride', 1, null),
('magic-kingdom', 'it''s a small world', 'Fantasyland', true, 'multi_pass', 11, 'ride', 1, null),
('magic-kingdom', 'The Many Adventures of Winnie the Pooh', 'Fantasyland', true, 'multi_pass', 4, 'ride', 1, null),
('magic-kingdom', 'Under the Sea - Journey of The Little Mermaid', 'Fantasyland', true, 'multi_pass', 7, 'ride', 1, null),
('magic-kingdom', 'Mad Tea Party', 'Fantasyland', false, null, 2, 'ride', 2, null),
('magic-kingdom', 'Dumbo the Flying Elephant', 'Fantasyland', false, null, 2, 'ride', 1, null),
('magic-kingdom', 'The Barnstormer', 'Fantasyland', false, null, 1, 'ride', 2, 35),
('magic-kingdom', 'Prince Charming Regal Carrousel', 'Fantasyland', false, null, 2, 'ride', 1, null),
('magic-kingdom', 'Mickey''s PhilharMagic', 'Fantasyland', false, null, 12, 'show', 1, null),
('magic-kingdom', 'Buzz Lightyear''s Space Ranger Spin', 'Fantasyland', true, 'multi_pass', 5, 'ride', 1, null),
-- Tomorrowland
('magic-kingdom', 'TRON Lightcycle / Run', 'Tomorrowland', true, 'individual', 2, 'ride', 5, 48),
('magic-kingdom', 'Space Mountain', 'Tomorrowland', true, 'multi_pass', 3, 'ride', 5, 44),
('magic-kingdom', 'Tomorrowland Speedway', 'Tomorrowland', false, null, 5, 'ride', 2, 32),
('magic-kingdom', 'Astro Orbiter', 'Tomorrowland', false, null, 2, 'ride', 2, null),
('magic-kingdom', 'Tomorrowland Transit Authority PeopleMover', 'Tomorrowland', false, null, 10, 'ride', 1, null),
('magic-kingdom', 'Carousel of Progress', 'Tomorrowland', false, null, 21, 'show', 1, null),
('magic-kingdom', 'Monsters Inc. Laugh Floor', 'Tomorrowland', false, null, 15, 'show', 1, null),

-- ============================================================
-- EPCOT ATTRACTIONS
-- ============================================================
('epcot', 'Guardians of the Galaxy: Cosmic Rewind', 'World Discovery', true, 'individual', 3, 'ride', 5, 42),
('epcot', 'Test Track', 'World Discovery', true, 'individual', 5, 'ride', 4, 40),
('epcot', 'Mission: SPACE', 'World Discovery', true, 'multi_pass', 5, 'ride', 5, 44),
('epcot', 'Spaceship Earth', 'World Celebration', true, 'multi_pass', 15, 'ride', 1, null),
('epcot', 'Journey of Water - Inspired by Moana', 'World Nature', false, null, 30, 'walk-through', 1, null),
('epcot', 'The Seas with Nemo & Friends', 'World Nature', true, 'multi_pass', 6, 'ride', 1, null),
('epcot', 'Turtle Talk with Crush', 'World Nature', false, null, 17, 'show', 1, null),
('epcot', 'Living with the Land', 'World Nature', true, 'multi_pass', 14, 'ride', 1, null),
('epcot', 'Soarin'' Around the World', 'World Nature', true, 'multi_pass', 5, 'ride', 3, 40),
('epcot', 'Frozen Ever After', 'World Showcase', true, 'multi_pass', 5, 'ride', 2, null),
('epcot', 'Remy''s Ratatouille Adventure', 'World Showcase', true, 'multi_pass', 4, 'ride', 2, null),
('epcot', 'Gran Fiesta Tour Starring The Three Caballeros', 'World Showcase', false, null, 7, 'ride', 1, null),
('epcot', 'Canada Far and Wide', 'World Showcase', false, null, 14, 'show', 1, null),
('epcot', 'Reflections of China', 'World Showcase', false, null, 14, 'show', 1, null),
('epcot', 'American Adventure', 'World Showcase', false, null, 29, 'show', 1, null),
('epcot', 'Impressions de France / Beauty and the Beast Sing-Along', 'World Showcase', false, null, 18, 'show', 1, null),

-- ============================================================
-- HOLLYWOOD STUDIOS ATTRACTIONS
-- ============================================================
('hollywood-studios', 'Star Wars: Rise of the Resistance', 'Star Wars: Galaxy''s Edge', true, 'individual', 18, 'ride', 4, 40),
('hollywood-studios', 'Millennium Falcon: Smugglers Run', 'Star Wars: Galaxy''s Edge', true, 'multi_pass', 5, 'ride', 3, 38),
('hollywood-studios', 'Slinky Dog Dash', 'Toy Story Land', true, 'individual', 2, 'ride', 3, 38),
('hollywood-studios', 'Toy Story Mania!', 'Toy Story Land', true, 'multi_pass', 8, 'ride', 1, null),
('hollywood-studios', 'Alien Swirling Saucers', 'Toy Story Land', false, null, 2, 'ride', 2, 32),
('hollywood-studios', 'Tower of Terror', 'Sunset Boulevard', true, 'multi_pass', 10, 'ride', 5, 40),
('hollywood-studios', 'Rock ''n'' Roller Coaster', 'Sunset Boulevard', true, 'multi_pass', 2, 'ride', 5, 48),
('hollywood-studios', 'Mickey & Minnie''s Runaway Railway', 'Hollywood Boulevard', true, 'multi_pass', 5, 'ride', 2, null),
('hollywood-studios', 'Star Tours - The Adventures Continue', 'Echo Lake', true, 'multi_pass', 5, 'ride', 3, 40),
('hollywood-studios', 'Indiana Jones Epic Stunt Spectacular', 'Echo Lake', false, null, 30, 'show', 2, null),
('hollywood-studios', 'MuppetVision 3D', 'Grand Avenue', false, null, 15, 'show', 1, null),
('hollywood-studios', 'Lightning McQueen''s Racing Academy', 'Sunset Boulevard', false, null, 10, 'show', 1, null),
('hollywood-studios', 'Beauty and the Beast - Live on Stage', 'Sunset Boulevard', false, null, 25, 'show', 1, null),
('hollywood-studios', 'Fantasmic!', 'Sunset Boulevard', false, null, 30, 'show', 2, null),

-- ============================================================
-- ANIMAL KINGDOM ATTRACTIONS
-- ============================================================
('animal-kingdom', 'Avatar Flight of Passage', 'Pandora - The World of Avatar', true, 'individual', 5, 'ride', 4, 44),
('animal-kingdom', 'Na''vi River Journey', 'Pandora - The World of Avatar', true, 'multi_pass', 5, 'ride', 1, null),
('animal-kingdom', 'Kilimanjaro Safaris', 'Africa', true, 'multi_pass', 22, 'ride', 1, null),
('animal-kingdom', 'Gorilla Falls Exploration Trail', 'Africa', false, null, 25, 'walk-through', 1, null),
('animal-kingdom', 'Festival of the Lion King', 'Africa', false, null, 30, 'show', 1, null),
('animal-kingdom', 'Expedition Everest', 'Asia', true, 'multi_pass', 3, 'ride', 5, 44),
('animal-kingdom', 'Kali River Rapids', 'Asia', true, 'multi_pass', 5, 'ride', 3, 38),
('animal-kingdom', 'Maharajah Jungle Trek', 'Asia', false, null, 20, 'walk-through', 1, null),
('animal-kingdom', 'DINOSAUR', 'DinoLand U.S.A.', true, 'multi_pass', 4, 'ride', 4, 40),
('animal-kingdom', 'TriceraTop Spin', 'DinoLand U.S.A.', false, null, 2, 'ride', 1, null),
('animal-kingdom', 'Finding Nemo: The Big Blue... and Beyond!', 'DinoLand U.S.A.', false, null, 25, 'show', 1, null),
('animal-kingdom', 'It''s Tough to be a Bug!', 'Discovery Island', false, null, 9, 'show', 2, null),
('animal-kingdom', 'The Tree of Life', 'Discovery Island', false, null, 15, 'walk-through', 1, null),
('animal-kingdom', 'Wildlife Express Train', 'Africa', false, null, 7, 'ride', 1, null),
('animal-kingdom', 'Feathered Friends in Flight!', 'Asia', false, null, 25, 'show', 1, null),

-- ============================================================
-- TYPHOON LAGOON
-- ============================================================
('typhoon-lagoon', 'Crush ''n'' Gusher', 'Typhoon Lagoon', false, null, 3, 'ride', 4, 48),
('typhoon-lagoon', 'Humunga Kowabunga', 'Typhoon Lagoon', false, null, 1, 'ride', 5, 48),
('typhoon-lagoon', 'Miss Adventure Falls', 'Typhoon Lagoon', false, null, 3, 'ride', 2, null),
('typhoon-lagoon', 'Typhoon Lagoon Surf Pool', 'Typhoon Lagoon', false, null, 60, 'ride', 2, null),
('typhoon-lagoon', 'Castaway Creek', 'Typhoon Lagoon', false, null, 20, 'ride', 1, null),
('typhoon-lagoon', 'Ketchakiddee Creek', 'Typhoon Lagoon', false, null, 30, 'ride', 1, null),

-- ============================================================
-- BLIZZARD BEACH
-- ============================================================
('blizzard-beach', 'Summit Plummet', 'Blizzard Beach', false, null, 1, 'ride', 5, 48),
('blizzard-beach', 'Teamboat Springs', 'Blizzard Beach', false, null, 3, 'ride', 3, null),
('blizzard-beach', 'Slush Gusher', 'Blizzard Beach', false, null, 1, 'ride', 4, 48),
('blizzard-beach', 'Cross Country Creek', 'Blizzard Beach', false, null, 25, 'ride', 1, null),
('blizzard-beach', 'Tike''s Peak', 'Blizzard Beach', false, null, 30, 'ride', 1, null),
('blizzard-beach', 'Melt-Away Bay', 'Blizzard Beach', false, null, 60, 'ride', 1, null);

-- ============================================================
-- SHOWS TABLE SEED
-- ============================================================
INSERT INTO public.shows (park_id, name, land, duration_min, location) VALUES
('magic-kingdom', 'Festival of Fantasy Parade', 'Main Street U.S.A.', 15, 'Parade Route'),
('magic-kingdom', 'Happily Ever After', 'Main Street U.S.A.', 18, 'Cinderella Castle'),
('magic-kingdom', 'Let the Magic Begin', 'Main Street U.S.A.', 5, 'Cinderella Castle Forecourt'),
('magic-kingdom', 'Disney Adventure Friends Cavalcade', 'Main Street U.S.A.', 8, 'Parade Route'),
('epcot', 'EPCOT Forever / Luminous', 'World Showcase', 15, 'World Showcase Lagoon'),
('epcot', 'Disney Harmonious', 'World Showcase', 20, 'World Showcase Lagoon'),
('hollywood-studios', 'Wonderful World of Animation', 'Hollywood Boulevard', 12, 'Chinese Theatre'),
('hollywood-studios', 'Disney Movie Magic', 'Hollywood Boulevard', 10, 'Chinese Theatre'),
('animal-kingdom', 'Tree of Life Awakenings', 'Discovery Island', 10, 'Tree of Life'),
('animal-kingdom', 'KiteTails', 'Discovery Island', 10, 'Discovery River Amphitheater');
