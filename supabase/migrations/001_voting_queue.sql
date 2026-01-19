-- Voting Queue Schema for JamFactory Social Feature
-- Time-decay weighted voting algorithm: Score = V / (T + 2)^G

-- Create voting_queue table
CREATE TABLE IF NOT EXISTS voting_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_metadata JSONB NOT NULL,
  votes INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('queued', 'playing', 'history')) DEFAULT 'queued',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Computed score with time-decay
  score NUMERIC GENERATED ALWAYS AS (
    CASE
      WHEN votes = 0 THEN 0
      ELSE votes / POWER(EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 + 2, 1.8)
    END
  ) STORED
);

-- Create index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_voting_queue_score ON voting_queue(score DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_voting_queue_status ON voting_queue(status);

-- Create votes table for tracking individual votes
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID REFERENCES voting_queue(id) ON DELETE CASCADE,
  user_id TEXT, -- Can be anonymous or authenticated
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(queue_id, user_id) -- Prevent duplicate votes
);

-- Function to recalculate score on vote insert
CREATE OR REPLACE FUNCTION update_queue_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Update vote count
  UPDATE voting_queue
  SET votes = (
    SELECT COUNT(*) FROM votes WHERE queue_id = NEW.queue_id
  )
  WHERE id = NEW.queue_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update score when vote is inserted
CREATE TRIGGER trigger_update_score
AFTER INSERT ON votes
FOR EACH ROW
EXECUTE FUNCTION update_queue_score();

-- Row Level Security (RLS) Policies
ALTER TABLE voting_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Allow public read access to voting_queue
CREATE POLICY "Public read access" ON voting_queue
  FOR SELECT
  USING (true);

-- Allow public insert (proposals)
CREATE POLICY "Public insert proposals" ON voting_queue
  FOR INSERT
  WITH CHECK (true);

-- Allow public insert votes (rate-limited by application logic)
CREATE POLICY "Public insert votes" ON votes
  FOR INSERT
  WITH CHECK (true);

-- Allow public read votes
CREATE POLICY "Public read votes" ON votes
  FOR SELECT
  USING (true);
