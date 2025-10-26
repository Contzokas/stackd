import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { getServiceSupabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// POST /api/boards/[boardId]/share - Share board with another user
export async function POST(req, { params }) {
  const { userId } = await auth();
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const resolvedParams = await params;
  const { boardId } = resolvedParams;
  
  console.log('POST /api/boards/[boardId]/share - boardId:', boardId);

  try {
    const { userId: targetUserId, role = 'editor' } = await req.json();

    if (!targetUserId) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    if (!['viewer', 'editor'].includes(role)) {
      return new NextResponse("Invalid role. Must be 'viewer' or 'editor'", { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Check if current user is board owner
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('*')
      .eq('id', boardId)
      .eq('owner_id', userId)
      .single();

    if (boardError || !board) {
      return new NextResponse("Board not found or you don't have permission", { status: 404 });
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('board_members')
      .select('*')
      .eq('board_id', boardId)
      .eq('user_id', targetUserId)
      .single();

    if (existingMember) {
      // Update existing member role
      const { data, error } = await supabase
        .from('board_members')
        .update({ role })
        .eq('board_id', boardId)
        .eq('user_id', targetUserId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    // Add new board member
    const { data, error } = await supabase
      .from('board_members')
      .insert([{ board_id: boardId, user_id: targetUserId, role }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error sharing board:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}

// GET /api/boards/[boardId]/share - Get board members
export async function GET(req, { params }) {
  const { userId } = await auth();
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const resolvedParams = await params;
  const { boardId } = resolvedParams;
  
  console.log('GET /api/boards/[boardId]/share - boardId:', boardId);

  try {
    const supabase = getServiceSupabase();
    
    // Check if user has access to this board
    const { data: board } = await supabase
      .from('boards')
      .select('*')
      .eq('id', boardId)
      .single();

    if (!board) {
      return new NextResponse("Board not found", { status: 404 });
    }

    const hasAccess = board.owner_id === userId;
    
    if (!hasAccess) {
      const { data: memberData } = await supabase
        .from('board_members')
        .select('*')
        .eq('board_id', boardId)
        .eq('user_id', userId)
        .single();

      if (!memberData) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    // Get all board members
    const { data: members, error } = await supabase
      .from('board_members')
      .select('*')
      .eq('board_id', boardId);

    if (error) throw error;

    // Fetch user details from Clerk for each member
    const membersWithDetails = await Promise.all(
      (members || []).map(async (member) => {
        try {
          const client = await clerkClient();
          const user = await client.users.getUser(member.user_id);
          return {
            ...member,
            username: user.username || user.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Unknown',
            fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
            imageUrl: user.imageUrl,
          };
        } catch (error) {
          console.error(`Error fetching user ${member.user_id}:`, error);
          return {
            ...member,
            username: 'Unknown User',
            fullName: null,
            imageUrl: null,
          };
        }
      })
    );

    return NextResponse.json(membersWithDetails);
  } catch (error) {
    console.error('Error fetching board members:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}

// DELETE /api/boards/[boardId]/share?userId=xxx - Remove user from board
export async function DELETE(req, { params }) {
  const { userId } = await auth();
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const resolvedParams = await params;
  const { boardId } = resolvedParams;
  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get('userId');

  console.log('DELETE /api/boards/[boardId]/share - boardId:', boardId, 'targetUserId:', targetUserId);

  if (!targetUserId) {
    return new NextResponse("User ID is required", { status: 400 });
  }

  try {
    const supabase = getServiceSupabase();
    
    // Check if current user is board owner
    const { data: board } = await supabase
      .from('boards')
      .select('*')
      .eq('id', boardId)
      .eq('owner_id', userId)
      .single();

    if (!board) {
      return new NextResponse("Board not found or you don't have permission", { status: 404 });
    }

    // Remove board member
    const { error } = await supabase
      .from('board_members')
      .delete()
      .eq('board_id', boardId)
      .eq('user_id', targetUserId);

    if (error) throw error;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error removing board member:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}
