-- ============================================
-- Role-Based Permissions Update for Stackd
-- Run this to add admin role and update permissions
-- ============================================

-- First, update existing 'owner' entries in board_members to 'admin' if you want
-- (Optional - keeps board owners as owners, but shared boards get admin access)
-- UPDATE board_members SET role = 'admin' WHERE role = 'owner';

-- Add a comment to clarify the role system
COMMENT ON COLUMN board_members.role IS 'User role: owner (full control), admin (manage people + analytics), editor (create/edit content), viewer (read-only)';

-- ============================================
-- Update RLS Policies for Boards
-- ============================================

-- Drop existing policies to recreate them with new role logic
DROP POLICY IF EXISTS "Users can view their boards" ON boards;
DROP POLICY IF EXISTS "Users can insert their own boards" ON boards;
DROP POLICY IF EXISTS "Users can update their own boards" ON boards;
DROP POLICY IF EXISTS "Users can delete their own boards" ON boards;

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

-- Users can insert their own boards
CREATE POLICY "Users can insert their own boards"
  ON boards FOR INSERT
  WITH CHECK (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Only owners can update boards
CREATE POLICY "Users can update their own boards"
  ON boards FOR UPDATE
  USING (owner_id = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Only owners can delete boards
CREATE POLICY "Users can delete their own boards"
  ON boards FOR DELETE
  USING (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================
-- Update RLS Policies for Board Members
-- ============================================

DROP POLICY IF EXISTS "Users can view board members" ON board_members;
DROP POLICY IF EXISTS "Board owners can manage members" ON board_members;

-- Users can view members of boards they have access to
CREATE POLICY "Users can view board members"
  ON board_members FOR SELECT
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

-- Only owners and admins can add members
CREATE POLICY "Owners and admins can add members"
  ON board_members FOR INSERT
  WITH CHECK (
    board_id IN (
      SELECT id FROM boards 
      WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
      id IN (
        SELECT board_id FROM board_members 
        WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        AND role IN ('admin')
      )
    )
  );

-- Only owners and admins can update member roles
CREATE POLICY "Owners and admins can update members"
  ON board_members FOR UPDATE
  USING (
    board_id IN (
      SELECT id FROM boards 
      WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
      id IN (
        SELECT board_id FROM board_members 
        WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        AND role IN ('admin')
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
        AND role IN ('admin')
      )
    )
  );

-- Only owners and admins can remove members
CREATE POLICY "Owners and admins can remove members"
  ON board_members FOR DELETE
  USING (
    board_id IN (
      SELECT id FROM boards 
      WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
      id IN (
        SELECT board_id FROM board_members 
        WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        AND role IN ('admin')
      )
    )
  );

-- ============================================
-- Update RLS Policies for Columns
-- ============================================

DROP POLICY IF EXISTS "Users can view columns" ON columns;
DROP POLICY IF EXISTS "Users with editor access can insert columns" ON columns;
DROP POLICY IF EXISTS "Users with editor access can update columns" ON columns;
DROP POLICY IF EXISTS "Users with editor access can delete columns" ON columns;

-- All users can view columns they have access to
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

-- Only owner, admin, and editor can create columns (viewers cannot)
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

-- Only owner, admin, and editor can update columns
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

-- Only owner, admin, and editor can delete columns
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

-- ============================================
-- Update RLS Policies for Cards
-- ============================================

DROP POLICY IF EXISTS "Users can view cards" ON cards;
DROP POLICY IF EXISTS "Users with editor access can insert cards" ON cards;
DROP POLICY IF EXISTS "Users with editor access can update cards" ON cards;
DROP POLICY IF EXISTS "Users with editor access can delete cards" ON cards;

-- All users can view cards they have access to
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

-- Only owner, admin, and editor can create cards (viewers cannot)
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

-- Only owner, admin, and editor can update cards
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

-- Only owner, admin, and editor can delete cards
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
-- Summary of Permissions
-- ============================================
-- 
-- OWNER (board creator):
--   ✅ Full control over board (rename, delete)
--   ✅ View analytics
--   ✅ Add/remove/change roles of all members
--   ✅ Create/edit/delete columns and cards
-- 
-- ADMIN (board administrator):
--   ❌ Cannot rename or delete board
--   ✅ View analytics
--   ✅ Add/remove/change roles of members
--   ✅ Create/edit/delete columns and cards
-- 
-- EDITOR (content creator):
--   ❌ Cannot rename or delete board
--   ❌ Cannot view analytics
--   ❌ Cannot manage members
--   ✅ Create/edit/delete columns and cards
-- 
-- VIEWER (read-only):
--   ❌ Cannot rename or delete board
--   ❌ Cannot view analytics
--   ❌ Cannot manage members
--   ❌ Cannot create/edit/delete columns or cards
--   ✅ View board content only
