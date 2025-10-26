import { auth } from '@clerk/nextjs/server';
import { getServiceSupabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// GET /api/boards/[boardId] - Get board with columns and cards
export async function GET(req, { params }) {
  const { userId } = await auth();
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const resolvedParams = await params;
  const { boardId } = resolvedParams;
  
  console.log('GET /api/boards/[boardId] - boardId:', boardId, 'userId:', userId);

  try {
    const supabase = getServiceSupabase();
    
    // Get board
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('*')
      .eq('id', boardId)
      .single();

    if (boardError || !board) {
      return new NextResponse("Board not found", { status: 404 });
    }

    // Check if user has access
    const hasAccess = board.owner_id === userId;
    let isMember = false;

    if (!hasAccess) {
      const { data: memberData } = await supabase
        .from('board_members')
        .select('*')
        .eq('board_id', boardId)
        .eq('user_id', userId)
        .single();

      isMember = !!memberData;
    }

    if (!hasAccess && !isMember) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Get columns
    const { data: columns, error: columnsError } = await supabase
      .from('columns')
      .select('*')
      .eq('board_id', boardId)
      .order('created_at');

    if (columnsError) throw columnsError;

    // Transform columns to match frontend format (position_x/y -> position: {x, y})
    const transformedColumns = (columns || []).map(col => ({
      ...col,
      position: {
        x: col.position_x,
        y: col.position_y
      }
    }));

    // Get cards for all columns in this board
    const columnIds = columns?.map(c => c.id) || [];
    let cards = [];
    
    if (columnIds.length > 0) {
      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .in('column_id', columnIds)
        .order('created_at');

      if (cardsError) {
        console.error('Error fetching cards:', cardsError);
        throw cardsError;
      }
      
      cards = cardsData || [];
    }
    
    console.log('Fetched cards:', cards.length, 'cards for', columnIds.length, 'columns');

    return NextResponse.json({
      ...board,
      columns: transformedColumns,
      cards: cards
    });
  } catch (error) {
    console.error('Error fetching board:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}

// PUT /api/boards/[boardId] - Update board name
export async function PUT(req, { params }) {
  const { userId } = await auth();
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const resolvedParams = await params;
  const { boardId } = resolvedParams;

  try {
    const supabase = getServiceSupabase();
    
    const { name } = await req.json();

    if (!name || name.trim() === '') {
      return new NextResponse("Board name is required", { status: 400 });
    }

    // Update board
    const { data: board, error } = await supabase
      .from('boards')
      .update({ name: name.trim() })
      .eq('id', boardId)
      .eq('owner_id', userId) // Only owner can rename
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return new NextResponse("Board not found or you don't have permission", { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(board);
  } catch (error) {
    console.error('Error updating board:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}

// DELETE /api/boards/[boardId] - Delete board
export async function DELETE(req, { params }) {
  const { userId } = await auth();
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const resolvedParams = await params;
  const { boardId } = resolvedParams;

  try {
    const supabase = getServiceSupabase();
    
    // Delete board (cascades to columns and cards)
    const { error } = await supabase
      .from('boards')
      .delete()
      .eq('id', boardId)
      .eq('owner_id', userId); // Only owner can delete

    if (error) throw error;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting board:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}
