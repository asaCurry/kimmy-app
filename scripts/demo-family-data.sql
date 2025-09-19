-- Extended demo data for the demo household
-- Run with: npx wrangler d1 execute kimmy-app-db --local --file=scripts/demo-family-data.sql

-- First, let's add some family members (children)
INSERT OR REPLACE INTO users (name, email, hashed_password, household_id, role, admin, age, relationship_to_admin, created_at)
VALUES 
  ('Emma', 'emma.demo@family.local', NULL, 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 'member', 0, 8, 'child', datetime('now')),
  ('Liam', 'liam.demo@family.local', NULL, 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 'member', 0, 12, 'child', datetime('now')),
  ('Sarah (Spouse)', 'sarah.demo@family.local', 'demo_password_hash', 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 'admin', 0, NULL, 'spouse', datetime('now'));

-- Get the record type IDs we created earlier
-- We'll reference these in our records

-- Sample records for the past few weeks to show patterns and trends

-- Emma's records (8-year-old)
INSERT INTO records (title, content, record_type_id, household_id, member_id, created_by, is_private, datetime, created_at)
VALUES 
  -- Daily Journal entries
  ('Great day at school!', '{"mood":"Happy","activities":"Played with friends at recess, learned about butterflies in science class","reflection":"I love learning about animals!"}', 
   (SELECT id FROM record_types WHERE name = 'Daily Journal' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 
   'bcdc702e-ca8f-4656-a723-9dd533c6d812', 7, 6, 0, '2025-09-18T19:00:00Z', datetime('now')),
   
  ('Tired today', '{"mood":"Tired","activities":"Math homework, piano practice","reflection":"Math is getting harder but I like piano"}', 
   (SELECT id FROM record_types WHERE name = 'Daily Journal' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 
   'bcdc702e-ca8f-4656-a723-9dd533c6d812', 7, 6, 0, '2025-09-17T19:00:00Z', datetime('now')),

  -- Meal records
  ('Emma breakfast', '{"meal_type":"Breakfast","foods":"Oatmeal with berries, orange juice","calories":"250"}', 
   (SELECT id FROM record_types WHERE name = 'Meal Record' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 
   'bcdc702e-ca8f-4656-a723-9dd533c6d812', 7, 6, 0, '2025-09-18T08:00:00Z', datetime('now')),
   
  ('School lunch', '{"meal_type":"Lunch","foods":"Turkey sandwich, apple slices, milk","calories":"320"}', 
   (SELECT id FROM record_types WHERE name = 'Meal Record' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 
   'bcdc702e-ca8f-4656-a723-9dd533c6d812', 7, 6, 0, '2025-09-18T12:30:00Z', datetime('now')),

  -- Sleep records
  ('Good night sleep', '{"bedtime":"20:00","wake_time":"07:00","sleep_quality":"Good","notes":"Fell asleep easily after reading"}', 
   (SELECT id FROM record_types WHERE name = 'Sleep Record' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 
   'bcdc702e-ca8f-4656-a723-9dd533c6d812', 7, 6, 0, '2025-09-17T20:00:00Z', datetime('now')),

  -- Exercise/activities
  ('Soccer practice', '{"exercise_type":"Sports","duration":"60","intensity":"Medium","description":"Team practice, worked on passing and shooting"}', 
   (SELECT id FROM record_types WHERE name = 'Exercise Log' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 
   'bcdc702e-ca8f-4656-a723-9dd533c6d812', 7, 6, 0, '2025-09-18T16:00:00Z', datetime('now'));

-- Liam's records (12-year-old)
INSERT INTO records (title, content, record_type_id, household_id, member_id, created_by, is_private, datetime, created_at)
VALUES 
  -- Daily Journal entries
  ('Basketball tryouts today', '{"mood":"Excited","activities":"Basketball tryouts, finished science project","reflection":"Hope I make the team! Science project turned out really cool."}', 
   (SELECT id FROM record_types WHERE name = 'Daily Journal' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 
   'bcdc702e-ca8f-4656-a723-9dd533c6d812', 8, 6, 0, '2025-09-18T19:30:00Z', datetime('now')),
   
  ('Stressed about test', '{"mood":"Sad","activities":"Studied for history test, helped mom with dinner","reflection":"History is my hardest subject but I studied hard"}', 
   (SELECT id FROM record_types WHERE name = 'Daily Journal' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 
   'bcdc702e-ca8f-4656-a723-9dd533c6d812', 8, 6, 0, '2025-09-16T19:30:00Z', datetime('now')),

  -- Meals
  ('Quick breakfast', '{"meal_type":"Breakfast","foods":"Cereal with milk, banana","calories":"280"}', 
   (SELECT id FROM record_types WHERE name = 'Meal Record' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 
   'bcdc702e-ca8f-4656-a723-9dd533c6d812', 8, 6, 0, '2025-09-18T07:30:00Z', datetime('now')),

  -- Exercise
  ('Basketball practice', '{"exercise_type":"Sports","duration":"90","intensity":"High","description":"Full team practice - scrimmage and conditioning"}', 
   (SELECT id FROM record_types WHERE name = 'Exercise Log' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 
   'bcdc702e-ca8f-4656-a723-9dd533c6d812', 8, 6, 0, '2025-09-17T17:00:00Z', datetime('now')),

  -- Sleep (teen sleep patterns)
  ('Late night again', '{"bedtime":"23:00","wake_time":"06:30","sleep_quality":"Fair","notes":"Stayed up finishing homework, feeling tired"}', 
   (SELECT id FROM record_types WHERE name = 'Sleep Record' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 
   'bcdc702e-ca8f-4656-a723-9dd533c6d812', 8, 6, 0, '2025-09-17T23:00:00Z', datetime('now'));

-- Demo Admin (parent) records
INSERT INTO records (title, content, record_type_id, household_id, member_id, created_by, is_private, datetime, created_at)
VALUES 
  -- Mood check-ins
  ('Busy day juggling work and kids', '{"overall_mood":"Good","energy_level":"Moderate","stress_level":"Moderate","notes":"Kids are doing well, work deadline approaching"}', 
   (SELECT id FROM record_types WHERE name = 'Mood Check-in' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 
   'bcdc702e-ca8f-4656-a723-9dd533c6d812', 6, 6, 0, '2025-09-18T21:00:00Z', datetime('now')),
   
  ('Great family weekend', '{"overall_mood":"Very Good","energy_level":"High","stress_level":"Low","notes":"Family hiking trip was perfect, everyone had fun"}', 
   (SELECT id FROM record_types WHERE name = 'Mood Check-in' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 
   'bcdc702e-ca8f-4656-a723-9dd533c6d812', 6, 6, 0, '2025-09-15T20:00:00Z', datetime('now')),

  -- Exercise
  ('Morning run', '{"exercise_type":"Cardio","duration":"30","intensity":"Medium","description":"Nice 3-mile run around the neighborhood"}', 
   (SELECT id FROM record_types WHERE name = 'Exercise Log' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 
   'bcdc702e-ca8f-4656-a723-9dd533c6d812', 6, 6, 0, '2025-09-18T06:30:00Z', datetime('now'));

-- Add some tracker entries for more realistic data
INSERT INTO tracker_entries (tracker_id, member_id, household_id, value, notes, created_at)
VALUES 
  -- Reading Time entries
  ((SELECT id FROM trackers WHERE name = 'Reading Time' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 7, 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 45, 'Read "Charlotte''s Web" before bed', datetime('now')),
  ((SELECT id FROM trackers WHERE name = 'Reading Time' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 8, 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 30, 'History textbook and novel', datetime('now')),
  ((SELECT id FROM trackers WHERE name = 'Reading Time' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 7, 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 30, 'Picture books and comics', datetime('now')),

  -- Water Intake
  ((SELECT id FROM trackers WHERE name = 'Water Intake' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 7, 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 6, 'Good hydration today', datetime('now')),
  ((SELECT id FROM trackers WHERE name = 'Water Intake' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 8, 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 8, 'Basketball practice day', datetime('now')),

  -- Study Sessions
  ((SELECT id FROM trackers WHERE name = 'Study Sessions' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 8, 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 90, 'History test prep and math homework', datetime('now')),
  ((SELECT id FROM trackers WHERE name = 'Study Sessions' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 7, 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 30, 'Spelling practice', datetime('now')),

  -- Steps
  ((SELECT id FROM trackers WHERE name = 'Steps' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 7, 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 8500, 'Soccer practice + playground', datetime('now')),
  ((SELECT id FROM trackers WHERE name = 'Steps' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 8, 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 12000, 'Basketball practice day', datetime('now')),

  -- Screen Time
  ((SELECT id FROM trackers WHERE name = 'Screen Time' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 7, 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 90, 'Educational games and video call with grandma', datetime('now')),
  ((SELECT id FROM trackers WHERE name = 'Screen Time' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 8, 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 120, 'Online research for science project', datetime('now'));

-- Add some older entries for trend analysis (past week)
INSERT INTO tracker_entries (tracker_id, member_id, household_id, value, notes, created_at)
VALUES 
  -- Emma's past week reading
  ((SELECT id FROM trackers WHERE name = 'Reading Time' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 7, 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 40, 'Library books', datetime('now', '-1 day')),
  ((SELECT id FROM trackers WHERE name = 'Reading Time' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 7, 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 35, 'Chapter book', datetime('now', '-2 days')),
  ((SELECT id FROM trackers WHERE name = 'Reading Time' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 7, 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 25, 'Comics', datetime('now', '-3 days')),

  -- Liam's study patterns
  ((SELECT id FROM trackers WHERE name = 'Study Sessions' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 8, 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 120, 'Test preparation intensive', datetime('now', '-1 day')),
  ((SELECT id FROM trackers WHERE name = 'Study Sessions' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 8, 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 60, 'Regular homework', datetime('now', '-2 days')),
  ((SELECT id FROM trackers WHERE name = 'Study Sessions' AND household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'), 8, 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 45, 'Light study day', datetime('now', '-3 days'));

-- Verify the data was inserted
SELECT 'Demo Family Members:' as message, COUNT(*) as count FROM users WHERE household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'
UNION ALL
SELECT 'Demo Records Created:' as message, COUNT(*) as count FROM records WHERE household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'
UNION ALL  
SELECT 'Demo Tracker Entries:' as message, COUNT(*) as count FROM tracker_entries WHERE household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812';