-- Video generation history + async job tracking.
-- One row per video job; status drives client polling/resume, and
-- credits_charged enables the idempotent refund when a job fails after
-- the submit-time debit.
--
-- Apply with: node scripts/run-sql.cjs scripts/011_video_history.sql

CREATE TABLE IF NOT EXISTS public.video_history (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  model TEXT NOT NULL,
  fal_endpoint TEXT NOT NULL,
  fal_request_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  start_image_url TEXT,
  end_image_url TEXT,
  video_url TEXT,
  duration_seconds INTEGER,
  resolution TEXT,
  aspect_ratio TEXT,
  has_audio BOOLEAN NOT NULL DEFAULT FALSE,
  credits_charged INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_video_history_user
  ON public.video_history (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_video_history_pending
  ON public.video_history (status)
  WHERE status = 'pending';
