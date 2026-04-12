-- ============================================================================
-- Studio Platform - Seed Data
-- ============================================================================

-- Studios
INSERT INTO studios (name, slug, description, image_url, capacity, equipment_highlights) VALUES
  ('Studio A', 'studio-a', 'Main recording room with high-end equipment for vocal and instrumental sessions.', null, 4, ARRAY['Microphone X', 'Interface Y', 'Monitors Z', 'Acoustic treatment']),
  ('Studio B', 'studio-b', 'Versatile studio for production and recording sessions.', null, 3, ARRAY['Microphone X', 'Console Y', 'Monitors Z', 'Acoustic isolation']),
  ('Studio C', 'studio-c', 'Intimate space perfect for vocal and recording sessions.', null, 2, ARRAY['Microphone X', 'Interface Y', 'Monitors Z', 'Cozy ambiance']);

-- Studio Pricing (Studio A)
INSERT INTO studio_pricing (studio_id, day_category, time_category, hourly_rate)
SELECT id, 'weekday'::day_category, 'peak'::time_category,     45.00 FROM studios WHERE slug = 'studio-a'
UNION ALL
SELECT id, 'weekday'::day_category, 'off_peak'::time_category, 35.00 FROM studios WHERE slug = 'studio-a'
UNION ALL
SELECT id, 'weekend'::day_category, 'peak'::time_category,     55.00 FROM studios WHERE slug = 'studio-a'
UNION ALL
SELECT id, 'weekend'::day_category, 'off_peak'::time_category, 45.00 FROM studios WHERE slug = 'studio-a';

-- Studio Pricing (Studio B)
INSERT INTO studio_pricing (studio_id, day_category, time_category, hourly_rate)
SELECT id, 'weekday'::day_category, 'peak'::time_category,     40.00 FROM studios WHERE slug = 'studio-b'
UNION ALL
SELECT id, 'weekday'::day_category, 'off_peak'::time_category, 30.00 FROM studios WHERE slug = 'studio-b'
UNION ALL
SELECT id, 'weekend'::day_category, 'peak'::time_category,     50.00 FROM studios WHERE slug = 'studio-b'
UNION ALL
SELECT id, 'weekend'::day_category, 'off_peak'::time_category, 40.00 FROM studios WHERE slug = 'studio-b';

-- Studio Pricing (Studio C)
INSERT INTO studio_pricing (studio_id, day_category, time_category, hourly_rate)
SELECT id, 'weekday'::day_category, 'peak'::time_category,     35.00 FROM studios WHERE slug = 'studio-c'
UNION ALL
SELECT id, 'weekday'::day_category, 'off_peak'::time_category, 25.00 FROM studios WHERE slug = 'studio-c'
UNION ALL
SELECT id, 'weekend'::day_category, 'peak'::time_category,     45.00 FROM studios WHERE slug = 'studio-c'
UNION ALL
SELECT id, 'weekend'::day_category, 'off_peak'::time_category, 35.00 FROM studios WHERE slug = 'studio-c';

-- Platform Settings
INSERT INTO platform_settings (key, value, description) VALUES
  ('booking_min_hours',          '2',                                        'Minimum booking duration in hours'),
  ('booking_deposit_percent',    '20',                                       'Booking deposit percentage'),
  ('off_peak_hours',             '{"start": "10:00", "end": "14:00"}',       'Off-peak hours range'),
  ('mixing_price_standard',      '150',                                      'Standard mix price (EUR)'),
  ('mixing_price_premium',       '300',                                      'Premium mix price (EUR)'),
  ('mixing_max_revisions',       '2',                                        'Maximum revisions per mixing order'),
  ('mixing_delivery_days',       '{"standard": 5, "premium": 5}',            'Mixing delivery time (business days)'),
  ('accepted_audio_formats',     '["wav", "mp3", "flac", "aiff"]',           'Accepted audio formats for stems'),
  ('max_stem_file_size_mb',      '500',                                      'Max stem file size (MB)'),
  ('beat_preview_duration_seconds', '30',                                    'Beat preview duration (seconds)');

-- Default CMS Content Pages
INSERT INTO content_pages (slug, title, content) VALUES
  ('home',     'Home',          '{"hero_title": "Studio Platform", "hero_subtitle": "Recording studio platform", "hero_cta": "Book a session"}'),
  ('about',    'About',         '{"intro": "Sample about content.", "team": []}'),
  ('services', 'Services',      '{"sections": []}'),
  ('contact',  'Contact',       '{"intro": "Sample contact intro."}'),
  ('legal',    'Legal notices', '{"content": ""}'),
  ('terms',    'Terms',         '{"content": ""}'),
  ('privacy',  'Privacy policy','{"content": ""}');
