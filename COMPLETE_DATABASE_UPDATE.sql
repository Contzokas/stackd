-- ============================================
-- COMPLETE DATABASE UPDATE FOR STACKD
-- This script adds ALL new features:
-- - Analytics tracking (status, completed_at, card_history)
-- - Due dates with overdue tracking
-- - Tags/Labels system
-- - Role-based permissions (admin role)
-- ============================================

-- ============================================
-- STEP 1: Add new columns to cards table
-- ============================================
ALTER TABLE cards ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'in_progress';
ALTER TABLE cards ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS tag VARCHAR(50);

-- ============================================
-- STEP 2: Create card_history table
-- ============================================
CREATE TABLE IF NOT EXISTS card_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  from_column_id UUID REFERENCES columns(id) ON DELETE SET NULL,
  to_column_id UUID REFERENCES columns(id) ON DELETE SET NULL,
  moved_by VARCHAR(255) NOT NULL,
  moved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 3: Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(status);
CREATE INDEX IF NOT EXISTS idx_cards_completed_at ON cards(completed_at);
CREATE INDEX IF NOT EXISTS idx_cards_due_date ON cards(due_date);
CREATE INDEX IF NOT EXISTS idx_cards_tag ON cards(tag);
CREATE INDEX IF NOT EXISTS idx_card_history_card ON card_history(card_id);
CREATE INDEX IF NOT EXISTS idx_card_history_moved_at ON card_history(moved_at);
CREATE INDEX IF NOT EXISTS idx_card_history_columns ON card_history(from_column_id, to_column_id);

-- ============================================
-- STEP 4: Enable RLS for card_history
-- ============================================
ALTER TABLE card_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view card history" ON card_history;
DROP POLICY IF EXISTS "Editors can insert card history" ON card_history;

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

-- Users with editor/admin access can insert card history
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
            AND role IN ('admin', 'editor')
          )
        )
      )
    )
  );

-- ============================================
-- STEP 5: Create/Update Analytics View
-- ============================================
DROP VIEW IF EXISTS cards_with_board;

CREATE VIEW cards_with_board AS
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
-- STEP 6: Create helper function
-- ============================================
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
-- STEP 7: Enable Realtime for card_history
-- ============================================
-- Add table to realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'card_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE card_history;
  END IF;
END $$;

-- ============================================
-- STEP 8: Update RLS Policies for Role Permissions
-- ============================================

-- Update board_members policies for admin role
DROP POLICY IF EXISTS "Owners and admins can add members" ON board_members;
DROP POLICY IF EXISTS "Owners and admins can update members" ON board_members;
DROP POLICY IF EXISTS "Owners and admins can remove members" ON board_members;

CREATE POLICY "Owners and admins can add members"
  ON board_members FOR INSERT
  WITH CHECK (
    board_id IN (
      SELECT id FROM boards 
      WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
      id IN (
        SELECT board_id FROM board_members 
        WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        AND role = 'admin'
      )
    )
  );

CREATE POLICY "Owners and admins can update members"
  ON board_members FOR UPDATE
  USING (
    board_id IN (
      SELECT id FROM boards 
      WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
      id IN (
        SELECT board_id FROM board_members 
        WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        AND role = 'admin'
      )
    )
  )
  WITH CHECK (
    board_id IN (
      SELECT id FROM boards 
      WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
      id IN (
        SELECT board_id FROM board_members 
        WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        AND role = 'admin'
      )
    )
  );

CREATE POLICY "Owners and admins can remove members"
  ON board_members FOR DELETE
  USING (
    board_id IN (
      SELECT id FROM boards 
      WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
      id IN (
        SELECT board_id FROM board_members 
        WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        AND role = 'admin'
      )
    )
  );

-- Update columns policies for admin/editor roles
DROP POLICY IF EXISTS "Editors and above can insert columns" ON columns;
DROP POLICY IF EXISTS "Editors and above can update columns" ON columns;
DROP POLICY IF EXISTS "Editors and above can delete columns" ON columns;

CREATE POLICY "Editors and above can insert columns"
  ON columns FOR INSERT
  WITH CHECK (
    board_id IN (
      SELECT id FROM boards 
      WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
      id IN (
        SELECT board_id FROM board_members 
        WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        AND role IN ('admin', 'editor')
      )
    )
  );

CREATE POLICY "Editors and above can update columns"
  ON columns FOR UPDATE
  USING (
    board_id IN (
      SELECT id FROM boards 
      WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
      id IN (
        SELECT board_id FROM board_members 
        WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        AND role IN ('admin', 'editor')
      )
    )
  )
  WITH CHECK (
    board_id IN (
      SELECT id FROM boards 
      WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
      id IN (
        SELECT board_id FROM board_members 
        WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        AND role IN ('admin', 'editor')
      )
    )
  );

CREATE POLICY "Editors and above can delete columns"
  ON columns FOR DELETE
  USING (
    board_id IN (
      SELECT id FROM boards 
      WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
      id IN (
        SELECT board_id FROM board_members 
        WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        AND role IN ('admin', 'editor')
      )
    )
  );

-- Update cards policies for admin/editor roles
DROP POLICY IF EXISTS "Editors and above can insert cards" ON cards;
DROP POLICY IF EXISTS "Editors and above can update cards" ON cards;
DROP POLICY IF EXISTS "Editors and above can delete cards" ON cards;

CREATE POLICY "Editors and above can insert cards"
  ON cards FOR INSERT
  WITH CHECK (
    column_id IN (
      SELECT id FROM columns 
      WHERE board_id IN (
        SELECT id FROM boards 
        WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
        id IN (
          SELECT board_id FROM board_members 
          WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
          AND role IN ('admin', 'editor')
        )
      )
    )
  );

CREATE POLICY "Editors and above can update cards"
  ON cards FOR UPDATE
  USING (
    column_id IN (
      SELECT id FROM columns 
      WHERE board_id IN (
        SELECT id FROM boards 
        WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
        id IN (
          SELECT board_id FROM board_members 
          WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
          AND role IN ('admin', 'editor')
        )
      )
    )
  )
  WITH CHECK (
    column_id IN (
      SELECT id FROM columns 
      WHERE board_id IN (
        SELECT id FROM boards 
        WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
        id IN (
          SELECT board_id FROM board_members 
          WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
          AND role IN ('admin', 'editor')
        )
      )
    )
  );

CREATE POLICY "Editors and above can delete cards"
  ON cards FOR DELETE
  USING (
    column_id IN (
      SELECT id FROM columns 
      WHERE board_id IN (
        SELECT id FROM boards 
        WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
        id IN (
          SELECT board_id FROM board_members 
          WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
          AND role IN ('admin', 'editor')
        )
      )
    )
  );

-- ============================================
-- STEP 9: Add comments for documentation
-- ============================================
COMMENT ON COLUMN cards.status IS 'Card status: backlog, todo, in_progress, review, completed, archived';
COMMENT ON COLUMN cards.completed_at IS 'Timestamp when card was marked as completed';
COMMENT ON COLUMN cards.due_date IS 'Due date for the card - used to calculate overdue analytics';
COMMENT ON COLUMN cards.tag IS 'Single tag for categorization: urgent, high-priority, bug, feature, etc. (only one tag allowed per card)';
COMMENT ON COLUMN board_members.role IS 'User role: owner (full control), admin (manage people + analytics), editor (create/edit content), viewer (read-only)';
COMMENT ON TABLE card_history IS 'Tracks all card movements between columns for analytics';

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
-- What was added:
-- ✅ Analytics tracking (status, completed_at, card_history table)
-- ✅ Due dates with overdue calculations
-- ✅ Tag/Label system (single tag per card)
-- ✅ Role permissions updated (admin role support)
-- ✅ Indexes for performance
-- ✅ RLS policies updated
-- ✅ Helper functions for analytics
-- ✅ Realtime enabled for card_history
--
-- Next steps:
-- 1. Refresh your Stackd app
-- 2. Start using due dates, tags, and analytics!
-- 3. Share boards with admin role for team management
-- ============================================
