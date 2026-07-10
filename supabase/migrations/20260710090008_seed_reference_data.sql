-- LIFTwod initial schema 8/8: reference seeds. Fixed UUIDs + ON CONFLICT DO
-- NOTHING so this migration is idempotent and reaches production through the
-- same pipeline as everything else.
--
-- NOTE: exercise name_th values are best-effort transliterations as used in
-- Thai boxes — have a Thai-speaking coach review before member launch (M7).

insert into public.locations (id, name, timezone)
values ('c0000000-0000-4000-8000-000000000001', 'Project Fit Chiang Rai', 'Asia/Bangkok')
on conflict (id) do nothing;

insert into public.app_settings (id, cancellation_cutoff_minutes, booking_window_days, session_horizon_days)
values (1, 120, 14, 21)
on conflict (id) do nothing;

-- The five confirmed plans (Joel, 2026-07-10). Volunteer is just an unlimited
-- row at a different price — plan_type does the work, no special cases.
insert into public.membership_plans
  (id, name_en, name_th, plan_type, price_thb, duration_months, weekly_visit_limit, visit_count, sort_order)
values
  ('b0000000-0000-4000-8000-000000000001', 'Unlimited',  'ไม่จำกัดครั้ง',        'unlimited',      1900, 1,    null, null, 1),
  ('b0000000-0000-4000-8000-000000000002', 'Limited (3x/week)', 'จำกัด 3 ครั้ง/สัปดาห์', 'weekly_limited', 1600, 1,    3,    null, 2),
  ('b0000000-0000-4000-8000-000000000003', 'Punch card (10 visits)', 'บัตร 10 ครั้ง', 'visit_pack',     2000, null, null, 10,   3),
  ('b0000000-0000-4000-8000-000000000004', 'Drop-in',    'รายครั้ง',             'drop_in',        400,  null, null, 1,    4),
  ('b0000000-0000-4000-8000-000000000005', 'Volunteer',  'อาสาสมัคร',            'unlimited',      600,  1,    null, null, 5)
on conflict (id) do nothing;

insert into public.benchmarks (name, description) values
  ('Fran',  '21-15-9: thrusters (43/30 kg), pull-ups. For time.'),
  ('Cindy', 'AMRAP 20 min: 5 pull-ups, 10 push-ups, 15 air squats.'),
  ('Helen', '3 rounds for time: 400 m run, 21 KB swings (24/16 kg), 12 pull-ups.'),
  ('Grace', '30 clean & jerks for time (61/43 kg).'),
  ('Karen', '150 wall balls for time (9/6 kg).'),
  ('Annie', '50-40-30-20-10: double-unders, sit-ups. For time.'),
  ('DT',    '5 rounds for time: 12 deadlifts, 9 hang power cleans, 6 push jerks (70/47 kg).'),
  ('Murph', 'For time: 1 mile run, 100 pull-ups, 200 push-ups, 300 air squats, 1 mile run.')
on conflict (name) do nothing;

insert into public.exercises (name_en, name_th, category, is_tracked_lift) values
  -- Squat
  ('Air Squat',            'แอร์สควอท',            'squat', false),
  ('Back Squat',           'แบ็คสควอท',            'squat', true),
  ('Front Squat',          'ฟรอนท์สควอท',          'squat', true),
  ('Overhead Squat',       'โอเวอร์เฮดสควอท',      'squat', true),
  ('Goblet Squat',         'กอบเล็ตสควอท',         'squat', false),
  ('Pistol Squat',         'พิสตอลสควอท',          'squat', false),
  -- Hinge
  ('Deadlift',             'เดดลิฟท์',             'hinge', true),
  ('Sumo Deadlift',        'ซูโม่เดดลิฟท์',         'hinge', false),
  ('Romanian Deadlift',    'โรมาเนียนเดดลิฟท์',     'hinge', false),
  ('Kettlebell Swing',     'เคตเทิลเบลสวิง',        'hinge', false),
  ('Good Morning',         'กู้ดมอร์นิ่ง',           'hinge', false),
  -- Press
  ('Strict Press',         'สตริคเพรส',            'press', true),
  ('Push Press',           'พุชเพรส',              'press', true),
  ('Push Jerk',            'พุชเจิร์ก',             'press', false),
  ('Split Jerk',           'สปลิทเจิร์ก',           'press', false),
  ('Bench Press',          'เบนช์เพรส',            'press', true),
  ('Push-up',              'วิดพื้น',               'press', false),
  ('Handstand Push-up',    'แฮนด์สแตนด์พุชอัพ',     'press', false),
  ('Dumbbell Shoulder Press', 'ดัมเบลโชลเดอร์เพรส', 'press', false),
  -- Pull
  ('Pull-up',              'ดึงข้อ',               'pull', false),
  ('Chin-up',              'ชินอัพ',               'pull', false),
  ('Chest-to-Bar Pull-up', 'เชสต์ทูบาร์พูลอัพ',     'pull', false),
  ('Ring Row',             'ริงโรว์',               'pull', false),
  ('Bent-over Row',        'เบนท์โอเวอร์โรว์',      'pull', false),
  ('Rope Climb',           'ปีนเชือก',             'pull', false),
  -- Olympic lifts
  ('Clean',                'คลีน',                 'olympic_lift', true),
  ('Power Clean',          'พาวเวอร์คลีน',          'olympic_lift', true),
  ('Hang Clean',           'แฮงคลีน',              'olympic_lift', false),
  ('Snatch',               'สแนตช์',               'olympic_lift', true),
  ('Power Snatch',         'พาวเวอร์สแนตช์',        'olympic_lift', true),
  ('Clean & Jerk',         'คลีนแอนด์เจิร์ก',       'olympic_lift', true),
  -- Gymnastics
  ('Toes-to-Bar',          'โทส์ทูบาร์',            'gymnastics', false),
  ('Knees-to-Elbows',      'นีส์ทูเอลโบว์',         'gymnastics', false),
  ('Muscle-up',            'มัสเซิลอัพ',            'gymnastics', false),
  ('Ring Dip',             'ริงดิพ',                'gymnastics', false),
  ('Burpee',               'เบอร์พี',               'gymnastics', false),
  ('Box Jump',             'กระโดดกล่อง',           'gymnastics', false),
  ('Wall Walk',            'วอลล์วอล์ค',            'gymnastics', false),
  ('Handstand Walk',       'เดินด้วยมือ',           'gymnastics', false),
  ('Sit-up',               'ซิทอัพ',                'gymnastics', false),
  -- Monostructural
  ('Row (Erg)',            'พายเครื่อง',            'monostructural', false),
  ('Assault Bike',         'จักรยานลม',             'monostructural', false),
  ('Ski Erg',              'สกีเอิร์ก',              'monostructural', false),
  ('Run',                  'วิ่ง',                  'monostructural', false),
  ('Double-Unders',        'กระโดดเชือกสองรอบ',     'monostructural', false),
  ('Single-Unders',        'กระโดดเชือก',           'monostructural', false),
  -- Core
  ('Plank',                'แพลงก์',                'core', false),
  ('Hollow Hold',          'ฮอลโลว์โฮลด์',          'core', false),
  ('GHD Sit-up',           'จีเอชดีซิทอัพ',          'core', false),
  ('V-up',                 'วีอัพ',                 'core', false),
  -- Other
  ('Wall Ball',            'วอลล์บอล',             'other', false),
  ('Thruster',             'ทรัสเตอร์',             'other', false),
  ('Lunge',                'ลันจ์',                 'other', false),
  ('Walking Lunge',        'วอล์คกิ้งลันจ์',         'other', false),
  ('Farmer Carry',         'ฟาร์เมอร์แครี่',         'other', false),
  ('Turkish Get-up',       'เตอร์กิชเก็ทอัพ',        'other', false),
  ('Devil Press',          'เดวิลเพรส',             'other', false),
  ('Bear Crawl',           'คลานหมี',               'other', false),
  ('Sled Push',            'ดันเลื่อน',             'other', false)
on conflict ((lower(name_en))) do nothing;
