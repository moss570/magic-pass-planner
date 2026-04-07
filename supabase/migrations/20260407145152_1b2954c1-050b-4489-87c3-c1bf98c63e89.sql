
-- Profile D: Walk-up / no online booking / entertainment / recreation / festivals / attractions
-- These have no datepicker, no booking CTA, or are walk-up only

-- Entertainment pages (walk-up only)
UPDATE events SET scrapable = false WHERE id = '546a425d-9476-48fb-95d7-7d885b9918fe'; -- Chip 'n' Dale's Campfire Sing-A-Long

-- Discovery/nature (free, walk-up)
UPDATE events SET scrapable = false WHERE id = '2867945a-bb6b-4b57-9029-b5c13017e447'; -- Discovery Island Nature Walk

-- Recreation pages (phone/walk-up booking)
UPDATE events SET scrapable = false WHERE id = '17b7104e-f88d-4cf7-98d7-7e4c1d053cc6'; -- Contemporary Resort Watercraft Rental
UPDATE events SET scrapable = false WHERE id = '3abd209c-4199-46ab-bd5a-cc19449e117e'; -- Fantasia Gardens Miniature Golf
UPDATE events SET scrapable = false WHERE id = '4794cd0b-2203-4189-b859-1ab000d47eb5'; -- Fishing Excursions
UPDATE events SET scrapable = false WHERE id = '6d6081ae-96b9-4cb0-9e44-c9e54f4be895'; -- Horse-Drawn Carriage Rides
UPDATE events SET scrapable = false WHERE id = '9ce1ea05-c979-49a0-bd9e-1620f5227ff7'; -- Parasailing
UPDATE events SET scrapable = false WHERE id = '22a453a5-375c-4da1-a9c4-a563f3b162de'; -- Pony Rides at Fort Wilderness
UPDATE events SET scrapable = false WHERE id = '12d0fb4c-856a-4275-981d-555f8f8e54b3'; -- Topgolf
UPDATE events SET scrapable = false WHERE id = 'f0f7b199-4837-491b-8109-144b60cbfe75'; -- Winter Summerland Miniature Golf
UPDATE events SET scrapable = false WHERE id = '6db35706-b6dd-435e-85fc-6ffcff3bd8ff'; -- Surf's Up

-- Fireworks cruises/yacht (phone booking)
UPDATE events SET scrapable = false WHERE id = '23591efc-bf37-4657-9214-d56cb198b9c5'; -- Fireworks Cruise
UPDATE events SET scrapable = false WHERE id = 'e91e3092-a329-4a05-bbfd-57be6d2bbfe8'; -- Grand 1 Yacht Experience

-- Attractions (no reservation system)
UPDATE events SET scrapable = false WHERE id = '58a3337d-a7d0-4a0b-acb4-90886760eee1'; -- Tomorrowland Speedway
UPDATE events SET scrapable = false WHERE id = '07157eb9-8d64-408d-85e9-02c85b940bc9'; -- NBA Experience

-- Lounges/Restaurants (use dining system instead)
UPDATE events SET scrapable = false WHERE id = 'c6039678-eab7-4cd1-a263-9760a5cc346c'; -- Enchanted Rose Lounge
UPDATE events SET scrapable = false WHERE id = '6d99a036-072e-4edc-8a42-21ba28051734'; -- Splitsville Luxury Lanes

-- PhotoPass Studio (walk-in)
UPDATE events SET scrapable = false WHERE id = 'a4071504-d941-4fc0-9386-50c79737c516'; -- Disney PhotoPass Studio

-- EPCOT Festivals (no individual reservations - park admission events)
UPDATE events SET scrapable = false WHERE id = '4921dd1a-d1a0-414e-b385-2c9e0a293844'; -- Festival of the Arts
UPDATE events SET scrapable = false WHERE id = '69d96058-9d25-4131-be84-880f069ec405'; -- Festival of the Holidays
UPDATE events SET scrapable = false WHERE id = '02149c43-4084-4633-a1c4-e941687bb46e'; -- Flower & Garden
UPDATE events SET scrapable = false WHERE id = '3dcae859-a211-48a1-b48b-b2209ade5e7e'; -- Food & Wine

-- VIP Tours (phone only)
UPDATE events SET scrapable = false WHERE id = '6f8bfcd5-d990-4369-b1d3-5301b2921830'; -- Disney Private VIP Tours

-- DVC exclusive (not publicly bookable)
UPDATE events SET scrapable = false WHERE id = 'a908b51d-a050-4c9a-ba93-d0a661ededf3'; -- DVC Moonlight Magic

-- Archery / Pirate Cruise (recreation, phone booking)
UPDATE events SET scrapable = false WHERE id = '0002ec84-16de-4050-b281-4dad20234b28'; -- Archery Experience
UPDATE events SET scrapable = false WHERE id = 'e82837ba-f1cc-4c54-a195-f4c0312b1393'; -- Pirate Adventure Cruise

-- Disney Springs dining (use dining system)
UPDATE events SET scrapable = false WHERE id = '378640a2-0ab7-4788-bd9a-3da83841dbb4'; -- Flavors of Florida
