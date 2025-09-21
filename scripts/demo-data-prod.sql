-- Demo data for production database
-- Household ID: bcdc702e-ca8f-4656-a723-9dd533c6d812

-- Record Types
INSERT OR IGNORE INTO record_types (
  name, description, category, icon, color, allow_private, fields, 
  household_id, created_by, created_at
) VALUES 
(
  'Daily Journal',
  'Track daily thoughts, activities, and reflections',
  'Personal',
  '📝',
  'blue',
  1,
  '[{"id":"mood","name":"mood","type":"select","label":"Mood","required":false,"options":["😊 Happy","😐 Neutral","😔 Sad","😠 Angry","😴 Tired","🤗 Excited"]},{"id":"activities","name":"activities","type":"textarea","label":"Activities","required":false,"placeholder":"What did you do today?"},{"id":"reflection","name":"reflection","type":"textarea","label":"Reflection","required":false,"placeholder":"Any thoughts or reflections on the day?"}]',
  'bcdc702e-ca8f-4656-a723-9dd533c6d812',
  1,
  datetime('now')
),
(
  'Meal Record',
  'Track meals, ingredients, and dietary information',
  'Health',
  '🍽️',
  'green',
  0,
  '[{"id":"meal_type","name":"meal_type","type":"select","label":"Meal Type","required":true,"options":["Breakfast","Lunch","Dinner","Snack"]},{"id":"foods","name":"foods","type":"textarea","label":"Foods","required":true,"placeholder":"What did you eat?"},{"id":"calories","name":"calories","type":"number","label":"Estimated Calories","required":false},{"id":"notes","name":"notes","type":"textarea","label":"Notes","required":false,"placeholder":"Any additional notes about the meal"}]',
  'bcdc702e-ca8f-4656-a723-9dd533c6d812',
  1,
  datetime('now')
),
(
  'Exercise Log',
  'Record workouts, activities, and physical exercise',
  'Fitness',
  '🏃',
  'orange',
  0,
  '[{"id":"exercise_type","name":"exercise_type","type":"select","label":"Exercise Type","required":true,"options":["Cardio","Strength Training","Yoga","Sports","Walking","Other"]},{"id":"duration","name":"duration","type":"number","label":"Duration (minutes)","required":true},{"id":"intensity","name":"intensity","type":"select","label":"Intensity","required":false,"options":["Low","Medium","High"]},{"id":"description","name":"description","type":"textarea","label":"Description","required":false,"placeholder":"Describe the exercise or workout"}]',
  'bcdc702e-ca8f-4656-a723-9dd533c6d812',
  1,
  datetime('now')
),
(
  'Sleep Record',
  'Track sleep patterns, quality, and duration',
  'Health',
  '😴',
  'purple',
  1,
  '[{"id":"bedtime","name":"bedtime","type":"time","label":"Bedtime","required":false},{"id":"wake_time","name":"wake_time","type":"time","label":"Wake Time","required":false},{"id":"sleep_quality","name":"sleep_quality","type":"select","label":"Sleep Quality","required":false,"options":["Poor","Fair","Good","Excellent"]},{"id":"notes","name":"notes","type":"textarea","label":"Sleep Notes","required":false,"placeholder":"Any notes about your sleep"}]',
  'bcdc702e-ca8f-4656-a723-9dd533c6d812',
  1,
  datetime('now')
),
(
  'Medication Log',
  'Track medication doses, times, and effects',
  'Health',
  '💊',
  'red',
  1,
  '[{"id":"medication_name","name":"medication_name","type":"text","label":"Medication Name","required":true},{"id":"dosage","name":"dosage","type":"text","label":"Dosage","required":true,"placeholder":"e.g., 10mg"},{"id":"time_taken","name":"time_taken","type":"time","label":"Time Taken","required":false},{"id":"notes","name":"notes","type":"textarea","label":"Notes","required":false,"placeholder":"Any side effects or notes"}]',
  'bcdc702e-ca8f-4656-a723-9dd533c6d812',
  1,
  datetime('now')
);

-- Trackers
INSERT OR IGNORE INTO trackers (
  name, description, type, unit, color, icon, 
  household_id, created_by, visible_to_members, created_at, updated_at
) VALUES 
(
  'Reading Time',
  'Track daily reading sessions',
  'time',
  'minutes',
  'blue',
  '📚',
  'bcdc702e-ca8f-4656-a723-9dd533c6d812',
  1,
  '[1]',
  datetime('now'),
  datetime('now')
),
(
  'Water Intake',
  'Track daily water consumption', 
  'cumulative',
  'glasses',
  'cyan',
  '💧',
  'bcdc702e-ca8f-4656-a723-9dd533c6d812',
  1,
  '[1]',
  datetime('now'),
  datetime('now')
),
(
  'Study Sessions',
  'Track study or work sessions',
  'time',
  'minutes',
  'green',
  '📖',
  'bcdc702e-ca8f-4656-a723-9dd533c6d812',
  1,
  '[1]',
  datetime('now'),
  datetime('now')
);