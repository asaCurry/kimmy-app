-- Demo data for the demo household
-- Run with: npx wrangler d1 execute kimmy-app-db --local --file=scripts/demo-data.sql

-- Demo record types
INSERT OR REPLACE INTO record_types (name, description, category, icon, color, allow_private, fields, household_id, created_by, created_at) 
VALUES 
  ('Daily Journal', 'Track daily thoughts, activities, and reflections', 'Personal', '📝', 'blue', 1, '[{"id":"mood","name":"mood","type":"select","label":"Mood","required":false,"options":["Happy","Neutral","Sad","Tired","Excited"]},{"id":"activities","name":"activities","type":"textarea","label":"Activities","required":false,"placeholder":"What did you do today?"},{"id":"reflection","name":"reflection","type":"textarea","label":"Reflection","required":false,"placeholder":"Any thoughts or reflections?"}]', 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 1, datetime('now')),
  
  ('Meal Record', 'Track meals, ingredients, and dietary information', 'Health', '🍽️', 'green', 0, '[{"id":"meal_type","name":"meal_type","type":"select","label":"Meal Type","required":true,"options":["Breakfast","Lunch","Dinner","Snack"]},{"id":"foods","name":"foods","type":"textarea","label":"Foods","required":true,"placeholder":"What did you eat?"},{"id":"calories","name":"calories","type":"number","label":"Estimated Calories","required":false}]', 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 1, datetime('now')),
  
  ('Exercise Log', 'Record workouts, activities, and physical exercise', 'Fitness', '🏃', 'orange', 0, '[{"id":"exercise_type","name":"exercise_type","type":"select","label":"Exercise Type","required":true,"options":["Cardio","Strength Training","Yoga","Sports","Walking","Other"]},{"id":"duration","name":"duration","type":"number","label":"Duration (minutes)","required":true},{"id":"intensity","name":"intensity","type":"select","label":"Intensity","required":false,"options":["Low","Medium","High"]}]', 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 1, datetime('now')),
  
  ('Sleep Record', 'Track sleep patterns, quality, and duration', 'Health', '😴', 'purple', 1, '[{"id":"bedtime","name":"bedtime","type":"time","label":"Bedtime","required":false},{"id":"wake_time","name":"wake_time","type":"time","label":"Wake Time","required":false},{"id":"sleep_quality","name":"sleep_quality","type":"select","label":"Sleep Quality","required":false,"options":["Poor","Fair","Good","Excellent"]},{"id":"notes","name":"notes","type":"textarea","label":"Sleep Notes","required":false,"placeholder":"Any notes about your sleep"}]', 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 1, datetime('now')),
  
  ('Mood Check-in', 'Quick daily mood and energy tracking', 'Wellness', '😊', 'yellow', 1, '[{"id":"overall_mood","name":"overall_mood","type":"select","label":"Overall Mood","required":true,"options":["Very Low","Low","Neutral","Good","Very Good"]},{"id":"energy_level","name":"energy_level","type":"select","label":"Energy Level","required":false,"options":["Exhausted","Low","Moderate","High","Very High"]},{"id":"stress_level","name":"stress_level","type":"select","label":"Stress Level","required":false,"options":["None","Low","Moderate","High","Very High"]}]', 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 1, datetime('now'));

-- Demo trackers
INSERT OR REPLACE INTO trackers (name, description, type, unit, color, icon, visible_to_members, household_id, created_by, created_at)
VALUES 
  ('Reading Time', 'Track daily reading sessions', 'time', 'minutes', 'blue', '📚', '[1]', 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 1, datetime('now')),
  ('Water Intake', 'Track daily water consumption', 'cumulative', 'glasses', 'cyan', '💧', '[1]', 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 1, datetime('now')),
  ('Study Sessions', 'Track study or work sessions', 'time', 'minutes', 'green', '📖', '[1]', 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 1, datetime('now')),
  ('Steps', 'Daily step count tracking', 'cumulative', 'steps', 'orange', '👟', '[1]', 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 1, datetime('now')),
  ('Screen Time', 'Track daily screen time usage', 'time', 'minutes', 'red', '📱', '[1]', 'bcdc702e-ca8f-4656-a723-9dd533c6d812', 1, datetime('now'));

-- Verify the setup
SELECT 'Record Types Created:' as message, COUNT(*) as count FROM record_types WHERE household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812'
UNION ALL
SELECT 'Trackers Created:' as message, COUNT(*) as count FROM trackers WHERE household_id = 'bcdc702e-ca8f-4656-a723-9dd533c6d812';