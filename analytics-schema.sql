-- ============================================
-- Analytics Schema Extension for Stackd
-- Run this AFTER the main supabase-schema.sql
-- ============================================

-- Add analytics fields to cards table
ALTER TABLE cards ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'in_progress';
ALTER TABLE cards ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS tag VARCHAR(50);

-- Create card_history table to track movements
CREATE TABLE IF NOT EXISTS card_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  from_column_id UUID REFERENCES columns(id) ON DELETE SET NULL,
  to_column_id UUID REFERENCES columns(id) ON DELETE SET NULL,
  moved_by VARCHAR(255) NOT NULL,
  moved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(status);
CREATE INDEX IF NOT EXISTS idx_cards_completed_at ON cards(completed_at);
CREATE INDEX IF NOT EXISTS idx_cards_due_date ON cards(due_date);
CREATE INDEX IF NOT EXISTS idx_cards_tag ON cards(tag);
CREATE INDEX IF NOT EXISTS idx_card_history_card ON card_history(card_id);
CREATE INDEX IF NOT EXISTS idx_card_history_moved_at ON card_history(moved_at);
CREATE INDEX IF NOT EXISTS idx_card_history_columns ON card_history(from_column_id, to_column_id);

-- ============================================
-- ROW LEVEL SECURITY for card_history
-- ============================================

ALTER TABLE card_history ENABLE ROW LEVEL SECURITY;

-- Users can view card history for cards they have access to
CREATE POLICY "Users can view card history"
  ON card_history FOR SELECT
  USING (
    card_id IN (
      SELECT id FROM cards
      WHERE column_id IN (
        SELECT id FROM columns 
        WHERE board_id IN (
          SELECT id FROM boards 
          WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
          id IN (
            SELECT board_id FROM board_members 
            WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
          )
        )
      )
    )
  );

-- Users with editor access can insert card history
CREATE POLICY "Editors can insert card history"
  ON card_history FOR INSERT
  WITH CHECK (
    card_id IN (
      SELECT id FROM cards
      WHERE column_id IN (
        SELECT id FROM columns 
        WHERE board_id IN (
          SELECT id FROM boards 
          WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
          id IN (
            SELECT board_id FROM board_members 
            WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
            AND role IN ('owner', 'editor')
          )
        )
      )
    )
  );

-- ============================================
-- ANALYTICS VIEWS
-- ============================================

-- View for cards with their current column and board info
CREATE OR REPLACE VIEW cards_with_board AS
SELECT 
  c.id,
  c.title,
  c.description,
  c.status,
  c.created_at,
  c.completed_at,
  c.due_date,
  c.tag,
  c.column_id,
  col.title as column_title,
  col.board_id,
  b.name as board_name,
  CASE 
    WHEN c.due_date IS NOT NULL AND c.status != 'completed' AND NOW() > c.due_date 
    THEN EXTRACT(DAY FROM NOW() - c.due_date)::INTEGER
    ELSE 0
  END as days_overdue
FROM cards c
JOIN columns col ON c.column_id = col.id
JOIN boards b ON col.board_id = b.id;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate time spent in a column
CREATE OR REPLACE FUNCTION get_time_in_column(p_card_id UUID, p_column_id UUID)
RETURNS INTERVAL AS $$
DECLARE
  v_total_time INTERVAL := INTERVAL '0';
  v_entry_time TIMESTAMP;
  v_exit_time TIMESTAMP;
  v_history RECORD;
BEGIN
  -- Get all movements for this card to this column
  FOR v_history IN 
    SELECT moved_at, to_column_id, from_column_id
    FROM card_history
    WHERE card_id = p_card_id
    ORDER BY moved_at
  LOOP
    -- Card entered this column
    IF v_history.to_column_id = p_column_id THEN
      v_entry_time := v_history.moved_at;
    END IF;
    
    -- Card left this column
    IF v_history.from_column_id = p_column_id AND v_entry_time IS NOT NULL THEN
      v_exit_time := v_history.moved_at;
      v_total_time := v_total_time + (v_exit_time - v_entry_time);
      v_entry_time := NULL;
    END IF;
  END LOOP;
  
  -- If card is still in this column, add time until now
  IF v_entry_time IS NOT NULL THEN
    v_total_time := v_total_time + (NOW() - v_entry_time);
  END IF;
  
  RETURN v_total_time;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- REALTIME
-- ============================================

-- Enable realtime for card_history
ALTER PUBLICATION supabase_realtime ADD TABLE card_history;

-- ============================================
-- Sample card statuses (adjust as needed)
-- ============================================
-- Possible status values:
-- 'backlog', 'todo', 'in_progress', 'review', 'completed', 'archived'

COMMENT ON COLUMN cards.status IS 'Card status: backlog, todo, in_progress, review, completed, archived';
COMMENT ON COLUMN cards.completed_at IS 'Timestamp when card was marked as completed';
COMMENT ON COLUMN cards.due_date IS 'Due date for the card - used to calculate overdue analytics';
COMMENT ON COLUMN cards.tag IS 'Single tag for categorization: urgent, high-priority, bug, feature, etc. (only one tag allowed per card)';
COMMENT ON TABLE card_history IS 'Tracks all card movements between columns for analytics';

-- ============================================
-- PREDEFINED TAGS (for reference)
-- ============================================
-- Suggested tags for your cards:
-- Priority: 'urgent', 'high-priority', 'low-priority'
-- Type: 'bug', 'feature', 'enhancement', 'task'
-- Status: 'blocked', 'waiting', 'review-needed'
-- Category: 'frontend', 'backend', 'design', 'documentation'
-- Custom: Add any tags that fit your workflow!
