import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// POST /api/cards - Create a new card
export async function POST(req) {
  const { userId } = await auth();
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { column_id, title, description = '' } = await req.json();

    if (!column_id || !title) {
      return new NextResponse("Column ID and title are required", { status: 400 });
    }

    // Create card
    const { data: card, error } = await supabase
      .from('cards')
      .insert([{
        column_id,
        title,
        description,
        created_by: userId
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(card);
  } catch (error) {
    console.error('Error creating card:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}

// PUT /api/cards?id=xxx - Update card
export async function PUT(req) {
  const { userId } = await auth();
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const cardId = searchParams.get('id');

  if (!cardId) {
    return new NextResponse("Card ID is required", { status: 400 });
  }

  try {
    const body = await req.json();
    
    // Update card
    const { data: card, error } = await supabase
      .from('cards')
      .update(body)
      .eq('id', cardId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(card);
  } catch (error) {
    console.error('Error updating card:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}

// DELETE /api/cards?id=xxx - Delete card
export async function DELETE(req) {
  const { userId } = await auth();
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const cardId = searchParams.get('id');

  if (!cardId) {
    return new NextResponse("Card ID is required", { status: 400 });
  }

  try {
    // Delete card
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', cardId);

    if (error) throw error;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting card:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}
