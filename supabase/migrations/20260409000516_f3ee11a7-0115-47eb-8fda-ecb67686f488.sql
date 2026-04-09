
CREATE TABLE public.haaaa_prompts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt text NOT NULL,
  real_answer text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  difficulty text NOT NULL DEFAULT 'medium',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.haaaa_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active prompts"
ON public.haaaa_prompts FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins manage prompts"
ON public.haaaa_prompts FOR ALL
USING ((auth.jwt() ->> 'email') = ANY (ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net']))
WITH CHECK ((auth.jwt() ->> 'email') = ANY (ARRAY['moss570@gmail.com','brandon@discountmikeblinds.net']));

INSERT INTO public.haaaa_prompts (prompt, real_answer, category, difficulty) VALUES
('What year did Disneyland open?', '1955', 'history', 'easy'),
('What was the original name for EPCOT''s Spaceship Earth?', 'It was always called Spaceship Earth', 'history', 'hard'),
('How many Audio-Animatronics are in "it''s a small world"?', 'Over 300', 'rides', 'medium'),
('What is the name of the dragon underneath Sleeping Beauty Castle at Disneyland Paris?', 'La Tanière du Dragon', 'parks', 'hard'),
('What Disney character has the most theme park appearances worldwide?', 'Mickey Mouse', 'characters', 'easy'),
('What is the tallest attraction at Walt Disney World?', 'Expedition Everest (199 feet)', 'rides', 'medium'),
('What flavor is the famous Dole Whip?', 'Pineapple', 'food', 'easy'),
('What year did Walt Disney World''s Magic Kingdom open?', '1971', 'history', 'easy'),
('What is the name of the sea serpent in the Storybook Land Canal Boats?', 'Monstro the Whale', 'rides', 'hard'),
('How fast does Rock ''n'' Roller Coaster go from 0 to 57 mph?', '2.8 seconds', 'rides', 'medium'),
('What is Baby Yoda''s real name in The Mandalorian?', 'Grogu', 'star_wars', 'easy'),
('What planet is the Millennium Falcon ride set on?', 'Batuu', 'star_wars', 'medium'),
('What color is the milk Luke Skywalker drinks in Star Wars: A New Hope?', 'Blue', 'star_wars', 'medium'),
('What was Toy Story the first feature film to be entirely made with?', 'Computer animation (CGI)', 'pixar', 'easy'),
('What is the name of the rat in Ratatouille?', 'Remy', 'pixar', 'easy'),
('In Up, how many balloons lifted Carl''s house according to Pixar?', '10,297', 'pixar', 'hard'),
('What is the name of the emotion voiced by Amy Poehler in Inside Out?', 'Joy', 'pixar', 'easy'),
('What is the maximum number of riders on the Haunted Mansion Doom Buggies at once?', 'About 131', 'rides', 'hard'),
('What real city is the setting for The Princess and the Frog?', 'New Orleans', 'movies', 'easy'),
('What is the name of Simba''s mother in The Lion King?', 'Sarabi', 'movies', 'medium'),
('What Disney movie features the song "A Whole New World"?', 'Aladdin', 'movies', 'easy'),
('What is the name of the pizza chain in Toy Story?', 'Pizza Planet', 'pixar', 'easy'),
('What animal is King Louie in The Jungle Book?', 'Orangutan', 'characters', 'medium'),
('What is the name of Captain Hook''s ship?', 'The Jolly Roger', 'characters', 'medium'),
('How many ghosts are said to inhabit the Haunted Mansion?', '999 happy haunts', 'rides', 'medium'),
('What Walt Disney World park opened in 1998?', 'Disney''s Animal Kingdom', 'history', 'medium'),
('What is the name of the turkey leg''s actual meat at Disney parks?', 'Turkey (they really are turkey legs)', 'food', 'medium'),
('What grey stuff is actually made of at Be Our Guest restaurant?', 'Cookies and cream mousse', 'food', 'medium'),
('What is the hidden Mickey count estimated to be across Walt Disney World?', 'Over 1,000', 'parks', 'hard'),
('What Disney park is the smallest by acreage?', 'Hong Kong Disneyland', 'parks', 'hard'),
('What was Space Mountain''s original working title?', 'Space Port', 'history', 'hard'),
('What is the speed of the Tower of Terror''s drop?', 'Faster than free fall (pulled down magnetically)', 'rides', 'hard'),
('What character does Johnny Depp voice in Pirates of the Caribbean films?', 'Captain Jack Sparrow', 'characters', 'easy'),
('What is Goofy''s original name when he first appeared?', 'Dippy Dawg', 'characters', 'hard'),
('What snack item does Disney sell over 10 million of annually at their parks?', 'Churros', 'food', 'medium'),
('What is the name of the land where Avatar Flight of Passage is located?', 'Pandora – The World of Avatar', 'parks', 'easy'),
('In what year was the first Pirates of the Caribbean ride opened?', '1967', 'history', 'medium'),
('What is WALL-E''s full name?', 'Waste Allocation Load Lifter Earth-class', 'pixar', 'hard'),
('What is the only Disney animated film with a title character who doesn''t speak?', 'Dumbo', 'movies', 'medium'),
('What lightsaber color can you NOT build at Savi''s Workshop?', 'Red (Sith crystals are not available)', 'star_wars', 'medium');
