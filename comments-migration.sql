-- ============================================
-- Stackd Comments Feature Migration
-- Run this in your Supabase SQL Editor
-- This adds comments functionality to cards
-- ============================================

-- Card comments table
CREATE TABLE IF NOT EXISTS card_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_card_comments_card ON card_comments(card_id);
CREATE INDEX IF NOT EXISTS idx_card_comments_user ON card_comments(user_id);

-- Enable RLS
ALTER TABLE card_comments ENABLE ROW LEVEL SECURITY;

-- Users can view comments on cards they have access to
CREATE POLICY "Users can view card comments"
  ON card_comments FOR SELECT
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

-- Users with editor access can create comments
CREATE POLICY "Editors can create comments"
  ON card_comments FOR INSERT
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

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON card_comments FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can delete their own comments or editors can delete any comment
CREATE POLICY "Users can delete own comments"
  ON card_comments FOR DELETE
  USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
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

-- Trigger to auto-update updated_at
CREATE TRIGGER update_card_comments_updated_at BEFORE UPDATE ON card_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE card_comments;
