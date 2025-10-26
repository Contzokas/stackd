import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { getServiceSupabase } from '@/lib/supabase';
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

    const supabase = getServiceSupabase();

    // Create card
    const { data: card, error } = await supabase
      .from('cards')
      .insert([{
        column_id,
        title,
        description,
        created_by: userId,
        status: 'in_progress' // Default status
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error creating card:', error);
      throw error;
    }
    
    // Log initial card creation to history for analytics
    const { error: historyError } = await supabase
      .from('card_history')
      .insert([{
        card_id: card.id,
        from_column_id: null,
        to_column_id: column_id,
        moved_by: userId
      }]);
    
    if (historyError) {
      console.warn('Failed to log card creation to history:', historyError);
      // Don't fail the request if history logging fails
    }

    // Fetch creator info from Clerk
    try {
      const client = await clerkClient();
      const creator = await client.users.getUser(card.created_by);
      const cardWithCreator = {
        ...card,
        createdByUsername: creator.username || creator.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Unknown',
        createdByFullName: `${creator.firstName || ''} ${creator.lastName || ''}`.trim() || null,
        createdByImageUrl: creator.imageUrl,
      };
      
      // Broadcast the new card to all subscribers (disabled - using polling instead)
      // The polling approach in CloudBoardManager will pick up changes automatically
      
      return NextResponse.json(cardWithCreator);
    } catch (clerkError) {
      console.error('Error fetching creator info:', clerkError);
      // Return card without creator info if Clerk fails
      return NextResponse.json(card);
    }
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
    
    console.log('PUT /api/cards - Received body:', body);
    console.log('PUT /api/cards - Card ID:', cardId);
    
    const supabase = getServiceSupabase();
    
    // Get the current card state before updating (for history tracking)
    const { data: oldCard } = await supabase
      .from('cards')
      .select('id, column_id, status')
      .eq('id', cardId)
      .single();
    
    // Filter out any fields that aren't in the cards table
    // NOTE: cards table does NOT have image_url column
    const allowedFields = ['title', 'description', 'column_id', 'status', 'completed_at', 'due_date', 'tag'];
    const updateData = {};
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        updateData[key] = value;
      } else {
        console.warn(`Ignoring unknown field: ${key}`);
      }
    }
    
    // Auto-set completed_at if status changes to 'completed'
    if (body.status === 'completed' && oldCard?.status !== 'completed') {
      updateData.completed_at = new Date().toISOString();
    }
    
    // Clear completed_at if status changes away from 'completed'
    if (body.status && body.status !== 'completed' && oldCard?.status === 'completed') {
      updateData.completed_at = null;
    }
    
    console.log('PUT /api/cards - Filtered update data:', updateData);
    
    if (Object.keys(updateData).length === 0) {
      console.log('PUT /api/cards - No valid fields to update');
      return new NextResponse('No valid fields to update', { status: 400 });
    }
    
    console.log('PUT /api/cards - About to update database...');
    
    // Update card and make sure we get all fields back
    const { data: card, error } = await supabase
      .from('cards')
      .update(updateData)
      .eq('id', cardId)
      .select()
      .single();
    
    // If column_id changed, log to card_history for analytics
    if (oldCard && updateData.column_id && oldCard.column_id !== updateData.column_id) {
      const { error: historyError } = await supabase
        .from('card_history')
        .insert([{
          card_id: cardId,
          from_column_id: oldCard.column_id,
          to_column_id: updateData.column_id,
          moved_by: userId
        }]);
      
      if (historyError) {
        console.warn('Failed to log card movement to history:', historyError);
        // Don't fail the request if history logging fails
      }
    }

    console.log('PUT /api/cards - Database response:', { card, error });

    if (error) {
      console.error('Database error updating card:', error);
      return new NextResponse(JSON.stringify({ error: error.message, details: error }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!card) {
      console.error('No card returned from database');
      return new NextResponse('Card not found', { status: 404 });
    }

    // Fetch creator info from Clerk
    try {
      console.log('PUT /api/cards - Fetching creator info for user:', card.created_by);
      const client = await clerkClient();
      const creator = await client.users.getUser(card.created_by);
      console.log('PUT /api/cards - Creator fetched successfully');
      
      const cardWithCreator = {
        ...card,
        createdByUsername: creator.username || creator.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Unknown',
        createdByFullName: `${creator.firstName || ''} ${creator.lastName || ''}`.trim() || null,
        createdByImageUrl: creator.imageUrl,
      };
      
      console.log('PUT /api/cards - Returning updated card with creator:', cardWithCreator);
      
      // Broadcast the updated card to all subscribers (disabled - using polling instead)
      // The polling approach in CloudBoardManager will pick up changes automatically
      
      return NextResponse.json(cardWithCreator);
    } catch (clerkError) {
      console.error('Error fetching creator info:', clerkError);
      // Return card without creator info if Clerk fails
      console.log('PUT /api/cards - Returning updated card (no creator info):', card);
      return NextResponse.json(card);
    }
  } catch (error) {
    console.error('Error updating card - Full error:', error);
    console.error('Error stack:', error.stack);
    return new NextResponse(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
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
    const supabase = getServiceSupabase();
    
    // Get card info before deleting (for board_id)
    const { data: cardToDelete } = await supabase
      .from('cards')
      .select('id, board_id')
      .eq('id', cardId)
      .single();
    
    // Delete card
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', cardId);

    if (error) {
      console.error('Database error deleting card:', error);
      throw error;
    }

    // Broadcast the deletion to all subscribers (disabled - using polling instead)
    // The polling approach in CloudBoardManager will pick up changes automatically

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting card:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}
