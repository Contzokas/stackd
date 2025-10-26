-- ============================================
-- Stackd Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Boards table
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  owner_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Board members (for sharing and collaboration)
CREATE TABLE IF NOT EXISTS board_members (
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'editor', -- 'owner', 'editor', 'viewer'
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (board_id, user_id)
);

-- Columns table
CREATE TABLE IF NOT EXISTS columns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  position_x INTEGER NOT NULL,
  position_y INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cards table
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  column_id UUID REFERENCES columns(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES for better performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_boards_owner ON boards(owner_id);
CREATE INDEX IF NOT EXISTS idx_board_members_user ON board_members(user_id);
CREATE INDEX IF NOT EXISTS idx_board_members_board ON board_members(board_id);
CREATE INDEX IF NOT EXISTS idx_columns_board ON columns(board_id);
CREATE INDEX IF NOT EXISTS idx_cards_column ON cards(column_id);
CREATE INDEX IF NOT EXISTS idx_cards_created_by ON cards(created_by);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- ============================================
-- BOARDS POLICIES
-- ============================================

-- Users can view boards they own or are members of
CREATE POLICY "Users can view their boards"
  ON boards FOR SELECT
  USING (
    owner_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
    id IN (
      SELECT board_id FROM board_members 
      WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Users can create their own boards
CREATE POLICY "Users can create boards"
  ON boards FOR INSERT
  WITH CHECK (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can update boards they own or have editor access
CREATE POLICY "Users can update their boards"
  ON boards FOR UPDATE
  USING (
    owner_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
    id IN (
      SELECT board_id FROM board_members 
      WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
      AND role IN ('owner', 'editor')
    )
  );

-- Only owners can delete boards
CREATE POLICY "Only owners can delete boards"
  ON boards FOR DELETE
  USING (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================
-- BOARD MEMBERS POLICIES
-- ============================================

-- Users can view members of boards they have access to
CREATE POLICY "Users can view board members"
  ON board_members FOR SELECT
  USING (
    board_id IN (
      SELECT id FROM boards 
      WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'sub'
    ) OR
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Only board owners can add members
CREATE POLICY "Owners can add board members"
  ON board_members FOR INSERT
  WITH CHECK (
    board_id IN (
      SELECT id FROM boards 
      WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Only board owners can remove members
CREATE POLICY "Owners can remove board members"
  ON board_members FOR DELETE
  USING (
    board_id IN (
      SELECT id FROM boards 
      WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- ============================================
-- COLUMNS POLICIES
-- ============================================

-- Users can view columns in boards they have access to
CREATE POLICY "Users can view columns"
  ON columns FOR SELECT
  USING (
    board_id IN (
      SELECT id FROM boards 
      WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
      id IN (
        SELECT board_id FROM board_members 
        WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Users with editor access can create columns
CREATE POLICY "Editors can create columns"
  ON columns FOR INSERT
  WITH CHECK (
    board_id IN (
      SELECT id FROM boards 
      WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
      id IN (
        SELECT board_id FROM board_members 
        WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        AND role IN ('owner', 'editor')
      )
    )
  );

-- Users with editor access can update columns
CREATE POLICY "Editors can update columns"
  ON columns FOR UPDATE
  USING (
    board_id IN (
      SELECT id FROM boards 
      WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
      id IN (
        SELECT board_id FROM board_members 
        WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        AND role IN ('owner', 'editor')
      )
    )
  );

-- Users with editor access can delete columns
CREATE POLICY "Editors can delete columns"
  ON columns FOR DELETE
  USING (
    board_id IN (
      SELECT id FROM boards 
      WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
      id IN (
        SELECT board_id FROM board_members 
        WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        AND role IN ('owner', 'editor')
      )
    )
  );

-- ============================================
-- CARDS POLICIES
-- ============================================

-- Users can view cards in boards they have access to
CREATE POLICY "Users can view cards"
  ON cards FOR SELECT
  USING (
    column_id IN (
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
  );

-- Users with editor access can create cards
CREATE POLICY "Editors can create cards"
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
          AND role IN ('owner', 'editor')
        )
      )
    )
  );

-- Users with editor access can update cards
CREATE POLICY "Editors can update cards"
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
          AND role IN ('owner', 'editor')
        )
      )
    )
  );

-- Users with editor access can delete cards
CREATE POLICY "Editors can delete cards"
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
          AND role IN ('owner', 'editor')
        )
      )
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON boards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- REALTIME
-- ============================================

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE boards;
ALTER PUBLICATION supabase_realtime ADD TABLE columns;
ALTER PUBLICATION supabase_realtime ADD TABLE cards;
ALTER PUBLICATION supabase_realtime ADD TABLE board_members;
