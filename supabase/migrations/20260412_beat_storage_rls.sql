-- ============================================================
-- Beat Storage RLS: purchaser read + role-restricted upload
-- ============================================================

-- ============================================================
-- 1. beat-files: purchasers can download their purchased files
-- ============================================================
-- Path structure: {beatmaker_id}/{beat_id}/audio.{ext}
-- We match folder[2] (the beat_id) against beat_purchases.
CREATE POLICY "beat-files: purchaser select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'beat-files'
    AND (
      -- The buyer has a purchase record for this beat
      EXISTS (
        SELECT 1 FROM beat_purchases
        WHERE user_id = auth.uid()
          AND beat_id = ((storage.foldername(name))[2])::uuid
      )
      -- Or the beatmaker owns the file (their own folder)
      OR (storage.foldername(name))[1] = auth.uid()::text
      -- Or an admin can read everything
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- ============================================================
-- 2. Restrict uploads to admins / engineers / beatmakers only
-- ============================================================
-- Drop the permissive policies that allowed any authenticated user
DROP POLICY IF EXISTS "beat-previews: auth insert own" ON storage.objects;
DROP POLICY IF EXISTS "beat-files: auth insert own"    ON storage.objects;

-- Re-create with role check
CREATE POLICY "beat-previews: role insert own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'beat-previews'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'engineer', 'beatmaker')
    )
  );

CREATE POLICY "beat-files: role insert own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'beat-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'engineer', 'beatmaker')
    )
  );
