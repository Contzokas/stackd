import { auth } from '@clerk/nextjs/server';
import { getServiceSupabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// POST /api/columns - Create a new column
export async function POST(req) {
  const { userId } = await auth();
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { board_id, title, position_x, position_y } = await req.json();

    if (!board_id || !title) {
      return new NextResponse("Board ID and title are required", { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Create column
    const { data: column, error } = await supabase
      .from('columns')
      .insert([{
        board_id,
        title,
        position_x: position_x || 0,
        position_y: position_y || 0
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error creating column:', error);
      throw error;
    }

    return NextResponse.json(column);
  } catch (error) {
    console.error('Error creating column:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}

// PUT /api/columns?id=xxx - Update column
export async function PUT(req) {
  const { userId } = await auth();
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const columnId = searchParams.get('id');

  if (!columnId) {
    return new NextResponse("Column ID is required", { status: 400 });
  }

  try {
    const body = await req.json();
    
    const supabase = getServiceSupabase();
    
    // Update column
    const { data: column, error } = await supabase
      .from('columns')
      .update(body)
      .eq('id', columnId)
      .select()
      .single();

    if (error) {
      console.error('Database error updating column:', error);
      throw error;
    }

    return NextResponse.json(column);
  } catch (error) {
    console.error('Error updating column:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}

// DELETE /api/columns?id=xxx - Delete column
export async function DELETE(req) {
  const { userId } = await auth();
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const columnId = searchParams.get('id');

  if (!columnId) {
    return new NextResponse("Column ID is required", { status: 400 });
  }

  try {
    const supabase = getServiceSupabase();
    
    // Delete column (cascades to cards)
    const { error } = await supabase
      .from('columns')
      .delete()
      .eq('id', columnId);

    if (error) {
      console.error('Database error deleting column:', error);
      throw error;
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting column:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}
