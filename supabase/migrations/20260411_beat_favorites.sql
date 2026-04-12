-- ============================================================
-- Beat Favorites (cart / wishlist)
-- ============================================================
-- Allows authenticated users to save beats to their favorites
-- list without purchasing them (no Stripe required).
-- ============================================================

CREATE TABLE beat_favorites (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  beat_id    UUID        NOT NULL REFERENCES beats(id)    ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, beat_id)
);

ALTER TABLE beat_favorites ENABLE ROW LEVEL SECURITY;

-- Users can fully manage their own favorites
CREATE POLICY "Users can manage own favorites"
  ON beat_favorites FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Storage bucket: allow MP3 uploads
-- ============================================================
-- Add audio/mpeg (MP3) to the allowed MIME types for both
-- beat storage buckets so WAV / MP3 / AIFF / FLAC all work.
-- ============================================================

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'audio/mpeg', 'audio/mp3',
  'audio/wav',  'audio/x-wav',
  'audio/aiff', 'audio/x-aiff',
  'audio/flac',
  'image/jpeg', 'image/png', 'image/webp'
]
WHERE id = 'beat-previews';

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'audio/mpeg', 'audio/mp3',
  'audio/wav',  'audio/x-wav',
  'audio/aiff', 'audio/x-aiff',
  'audio/flac'
]
WHERE id = 'beat-files';
