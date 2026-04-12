-- Add sort_order to beats for manual admin ordering
ALTER TABLE beats ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0 NOT NULL;

-- Initialize sort_order based on created_at (oldest first = lowest order)
UPDATE beats
SET sort_order = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM beats
) sub
WHERE beats.id = sub.id;
