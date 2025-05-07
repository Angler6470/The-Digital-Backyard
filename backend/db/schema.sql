-- Database schema for Virtual Backyard Bird Sanctuary
-- Users, yards, birds, accessories, and economy

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  location TEXT,
  pup_coins INTEGER DEFAULT 0
);

CREATE TABLE yards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  name TEXT,
  background TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS bird_species (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  scientific_name TEXT,
  description TEXT,
  image TEXT,
  region TEXT,
  active_seasons TEXT[],
  preferred_food TEXT[],
  preferred_accessories TEXT[],
  rarity TEXT
);

CREATE TABLE IF NOT EXISTS accessories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  image TEXT,
  effectiveness JSONB -- {bird_id: effectiveness_score}
);

CREATE TABLE IF NOT EXISTS food (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  image TEXT,
  effectiveness JSONB -- {bird_id: effectiveness_score}
);

CREATE TABLE IF NOT EXISTS user_yards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  location TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_yard_accessories (
  id SERIAL PRIMARY KEY,
  yard_id INTEGER REFERENCES user_yards(id),
  accessory_id INTEGER REFERENCES accessories(id),
  placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_yard_food (
  id SERIAL PRIMARY KEY,
  yard_id INTEGER REFERENCES user_yards(id),
  food_id INTEGER REFERENCES food(id),
  placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_yard_birds (
  id SERIAL PRIMARY KEY,
  yard_id INTEGER REFERENCES user_yards(id),
  bird_id INTEGER REFERENCES bird_species(id),
  attracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE birds (
  id SERIAL PRIMARY KEY,
  name TEXT,
  food TEXT,
  climate TEXT,
  accessories TEXT,
  image TEXT
);

CREATE TABLE user_birds (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  bird_id INTEGER,
  seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(bird_id) REFERENCES birds(id)
);

-- BIRD SPECIES (10 common CT birds)
INSERT INTO bird_species (name, scientific_name, description, image, region, active_seasons, preferred_food, preferred_accessories, rarity) VALUES
('Northern Cardinal', 'Cardinalis cardinalis', 'A bright red bird common in CT backyards.', 'cardinal.png', 'Connecticut', ARRAY['spring','summer','fall','winter'], ARRAY['seed','fruit'], ARRAY['feeder','birdhouse'], 'common'),
('Blue Jay', 'Cyanocitta cristata', 'A vibrant blue bird with a loud call.', 'bluejay.png', 'Connecticut', ARRAY['spring','summer','fall','winter'], ARRAY['peanuts','seed'], ARRAY['feeder','birdbath'], 'common'),
('American Robin', 'Turdus migratorius', 'Familiar orange-breasted bird.', 'robin.png', 'Connecticut', ARRAY['spring','summer','fall'], ARRAY['fruit','worm'], ARRAY['birdbath','nesting material'], 'common'),
('Mourning Dove', 'Zenaida macroura', 'Soft gray dove, gentle cooing.', 'mourningdove.png', 'Connecticut', ARRAY['spring','summer','fall','winter'], ARRAY['seed'], ARRAY['ground tray'], 'common'),
('House Sparrow', 'Passer domesticus', 'Small brown bird, very adaptable.', 'housesparrow.png', 'Connecticut', ARRAY['spring','summer','fall','winter'], ARRAY['seed','crumbs'], ARRAY['birdhouse'], 'common'),
('Song Sparrow', 'Melospiza melodia', 'Streaky brown sparrow with a sweet song.', 'songsparrow.png', 'Connecticut', ARRAY['spring','summer','fall'], ARRAY['seed'], ARRAY['shrub','feeder'], 'common'),
('Downy Woodpecker', 'Picoides pubescens', 'Small black-and-white woodpecker.', 'downywoodpecker.png', 'Connecticut', ARRAY['spring','summer','fall','winter'], ARRAY['suet','seed'], ARRAY['feeder','tree'], 'common'),
('Black-capped Chickadee', 'Poecile atricapillus', 'Tiny, bold, black-capped bird.', 'chickadee.png', 'Connecticut', ARRAY['spring','summer','fall','winter'], ARRAY['seed','suet'], ARRAY['feeder','birdhouse'], 'common'),
('American Goldfinch', 'Spinus tristis', 'Bright yellow finch, loves thistle.', 'goldfinch.png', 'Connecticut', ARRAY['spring','summer'], ARRAY['thistle','sunflower'], ARRAY['feeder'], 'common'),
('House Finch', 'Haemorhous mexicanus', 'Red-headed finch, common at feeders.', 'housefinch.png', 'Connecticut', ARRAY['spring','summer','fall','winter'], ARRAY['seed'], ARRAY['feeder'], 'common');

-- ACCESSORIES
INSERT INTO accessories (name, type, image, effectiveness) VALUES
('Classic Birdhouse', 'birdhouse', 'birdhouse1.png', '{"1":0.7,"5":0.8,"8":0.6}'),
('Tube Feeder', 'feeder', 'feeder1.png', '{"1":0.8,"2":0.9,"6":0.7,"7":0.7,"8":0.8,"9":0.9,"10":0.8}'),
('Bird Bath', 'birdbath', 'bath1.png', '{"2":0.7,"3":0.9}'),
('Ground Tray', 'ground tray', 'tray1.png', '{"4":0.9}'),
('Nesting Material', 'nesting material', 'nest1.png', '{"3":0.8}'),
('Shrub', 'shrub', 'shrub1.png', '{"6":0.7}'),
('Tree', 'tree', 'tree1.png', '{"7":0.8}');

-- FOOD
INSERT INTO food (name, type, image, effectiveness) VALUES
('Sunflower Seed', 'seed', 'seed1.png', '{"1":0.8,"2":0.7,"4":0.7,"5":0.7,"6":0.7,"7":0.7,"8":0.8,"9":0.8,"10":0.8}'),
('Peanuts', 'peanuts', 'peanuts1.png', '{"2":0.9}'),
('Fruit', 'fruit', 'fruit1.png', '{"1":0.7,"3":0.8}'),
('Suet', 'suet', 'suet1.png', '{"7":0.9,"8":0.7}'),
('Thistle', 'thistle', 'thistle1.png', '{"9":0.9}'),
('Worm', 'worm', 'worm1.png', '{"3":0.7}'),
('Crumbs', 'crumbs', 'crumbs1.png', '{"5":0.6}');
