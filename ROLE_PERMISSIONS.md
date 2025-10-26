# Role-Based Permissions System

Stackd now includes a comprehensive role-based access control system with four distinct permission levels.

## 📋 Permission Levels

### 🏆 Owner (Board Creator)
**Full control over the board**
- ✅ Rename and delete the board
- ✅ View analytics dashboard
- ✅ Add, remove, and change roles of all members
- ✅ Create, edit, move, and delete columns
- ✅ Create, edit, move, and delete cards
- ✅ All admin and editor permissions

### 👑 Admin (Board Administrator)
**Manages people and can view analytics**
- ❌ Cannot rename or delete the board
- ✅ View analytics dashboard
- ✅ Add, remove, and change roles of members
- ✅ Create, edit, move, and delete columns
- ✅ Create, edit, move, and delete cards
- ✅ All editor permissions

### ✏️ Editor (Content Creator)
**Can create and modify content**
- ❌ Cannot rename or delete the board
- ❌ Cannot view analytics
- ❌ Cannot manage members or change roles
- ✅ Create, edit, move, and delete columns
- ✅ Create, edit, move, and delete cards

### 👁️ Viewer (Read-Only)
**Can only view board content**
- ❌ Cannot rename or delete the board
- ❌ Cannot view analytics
- ❌ Cannot manage members or change roles
- ❌ Cannot create, edit, or delete anything
- ✅ View board, columns, and cards (read-only)

## 🚀 Quick Start

### 1. Run Database Migration
Execute the role permissions update in your Supabase SQL Editor:

```sql
-- Open: Supabase Dashboard → SQL Editor → New query
-- Paste the contents of: role-permissions-update.sql
-- Click: Run
```

### 2. Share a Board
1. Open the board you want to share
2. Click the board name dropdown
3. Click the **👥 Share** button next to any board
4. Search for a user by typing `@username`
5. Select a role:
   - **👁️ Viewer** - Read-only access
   - **✏️ Editor** - Can create/edit content
   - **👑 Admin** - Can manage people + analytics
6. Click "Share Board"

### 3. Manage Existing Members
1. Open the share modal for your board
2. View all current members at the bottom
3. **Change Role**: Use the dropdown next to each member
4. **Remove Member**: Click the "✕" button

## 🔒 Security Features

### Row Level Security (RLS)
All database tables have RLS policies that enforce role permissions:
- **Boards**: Only owners can modify board details
- **Board Members**: Owners and admins can manage members
- **Columns**: Editors and above can create/modify columns
- **Cards**: Editors and above can create/modify cards
- **Card History**: Automatically logged for editors and above
- **Analytics**: Only owners and admins can view

### API Route Protection
All API endpoints check user roles before allowing actions:
- `POST /api/boards` - Anyone can create their own boards
- `GET /api/analytics/[boardId]` - Owner/Admin only
- `POST /api/boards/[boardId]/share` - Owner/Admin only
- `PUT /api/boards/[boardId]/share` - Owner/Admin only (role changes)
- `DELETE /api/boards/[boardId]/share` - Owner/Admin only (remove members)
- `POST /api/cards` - Editor/Admin/Owner only
- `PUT /api/cards` - Editor/Admin/Owner only
- `POST /api/columns` - Editor/Admin/Owner only

### UI Restrictions
The interface automatically adapts based on user role:
- **Analytics Button**: Hidden for viewers and editors
- **Share Button**: Only visible to owners and admins
- **Edit Controls**: Disabled for viewers
- **Delete Actions**: Restricted by role

## 📊 Analytics Access

### Who Can View Analytics?
- ✅ Board Owners
- ✅ Admins
- ❌ Editors
- ❌ Viewers

### What Analytics Show
Analytics are available only to owners and admins and display:
- Tasks completed per week
- Cards by column (with bottleneck detection)
- Average time per column
- Overall statistics
- **User productivity** (for all members, regardless of role)

**Note**: Even though editors and viewers cannot *view* the analytics dashboard, their activity is still tracked and visible to owners/admins in the user productivity section.

## 🎯 Common Use Cases

### Small Team Collaboration
```
Owner: You (full control)
Admin: Team Lead (manage people, view analytics)
Editors: Team members (create/edit content)
```

### Client Projects
```
Owner: You (full control)
Admin: Project Manager (oversee team)
Editors: Developers (work on tasks)
Viewer: Client (monitor progress)
```

### Personal + Assistants
```
Owner: You (full control)
Editors: Assistants (help with tasks)
Viewers: Stakeholders (watch progress)
```

## 🔄 Role Changes

### Upgrading a Role
Owners and admins can upgrade any member:
```
Viewer → Editor → Admin
```

### Downgrading a Role
Owners and admins can downgrade any member:
```
Admin → Editor → Viewer
```

### Cannot Change Owner
The board owner role cannot be transferred or changed. To transfer ownership:
1. Share the board with the new owner as Admin
2. Have them duplicate the board (creates new ownership)
3. Delete the original board

## ⚠️ Important Notes

### Permission Cascade
When you remove a user or downgrade their role:
- They immediately lose access to restricted features
- They remain in user productivity analytics (historical data)
- Their created cards/columns remain on the board

### Admin Limitations
Admins have powerful permissions but **cannot**:
- Rename the board
- Delete the board
- Remove or downgrade the board owner

### Viewer Restrictions
Viewers can:
- See all cards, columns, and board layout
- View card details (titles, descriptions)
- Track board activity

Viewers **cannot**:
- Drag and drop cards
- Create, edit, or delete anything
- View analytics
- Share the board with others

## 🛠️ Technical Details

### Database Schema
```sql
-- board_members table
CREATE TABLE board_members (
  id UUID PRIMARY KEY,
  board_id UUID REFERENCES boards(id),
  user_id VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'viewer',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Allowed roles: 'owner', 'admin', 'editor', 'viewer'
```

### Role Hierarchy
```
Owner > Admin > Editor > Viewer
```

### RLS Policy Example
```sql
-- Only editors and above can insert cards
CREATE POLICY "Editors and above can insert cards"
  ON cards FOR INSERT
  WITH CHECK (
    column_id IN (
      SELECT id FROM columns 
      WHERE board_id IN (
        SELECT id FROM boards 
        WHERE owner_id = current_user_id OR
        id IN (
          SELECT board_id FROM board_members 
          WHERE user_id = current_user_id
          AND role IN ('admin', 'editor')
        )
      )
    )
  );
```

## 📚 Related Documentation

- [Analytics Setup](ANALYTICS_SETUP.md) - How to set up analytics
- [Quick Start Guide](QUICK_START.md) - Getting started with Stackd
- [Supabase Schema](supabase-schema.sql) - Main database schema
- [Role Permissions SQL](role-permissions-update.sql) - Permission updates

## 🐛 Troubleshooting

### "Access Denied" Errors
1. Check your role on the board
2. Verify the database migration ran successfully
3. Refresh the page to reload permissions
4. Ask the board owner to upgrade your role

### Cannot See Analytics Button
This is expected behavior:
- Only **owners** and **admins** can view analytics
- If you need access, ask the owner to upgrade you to admin

### Cannot Change Member Roles
- Only owners and admins can change roles
- You cannot change the owner's role
- Refresh the page and try again

### Role Changes Not Taking Effect
1. Refresh the browser page
2. Check the Supabase logs for RLS policy errors
3. Verify the RLS policies are enabled
4. Ensure the role value is exactly: 'owner', 'admin', 'editor', or 'viewer'

---

**Last Updated**: October 26, 2025  
**Version**: 1.0.0
