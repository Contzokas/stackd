import { auth } from '@clerk/nextjs/server';
import { getServiceSupabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// GET /api/boards - Get all boards for the current user
export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const supabase = getServiceSupabase();
    
    // Get boards owned by user
    const { data: ownedBoards, error: ownedError } = await supabase
      .from('boards')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (ownedError) throw ownedError;

    // Get boards shared with user (include role information)
    const { data: sharedBoardData, error: sharedError } = await supabase
      .from('board_members')
      .select('board_id, role')
      .eq('user_id', userId);

    if (sharedError) throw sharedError;

    let sharedBoards = [];
    if (sharedBoardData && sharedBoardData.length > 0) {
      const boardIds = sharedBoardData.map(b => b.board_id);
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .in('id', boardIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Add role information to shared boards
      sharedBoards = (data || []).map(board => {
        const memberData = sharedBoardData.find(m => m.board_id === board.id);
        return {
          ...board,
          userRole: memberData?.role || 'viewer'
        };
      });
    }

    // Add userRole to owned boards (owner role)
    const allBoards = [
      ...(ownedBoards || []).map(board => ({ ...board, userRole: 'owner' })), 
      ...sharedBoards
    ];
    
    return NextResponse.json(allBoards);
  } catch (error) {
    console.error('Error fetching boards:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}

// POST /api/boards - Create a new board
export async function POST(req) {
  try {
    console.log('POST /api/boards - Starting');
    console.log('Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    });
    
    const { userId } = await auth();
    console.log('User ID:', userId);
    
    if (!userId) {
      console.log('No user ID - Unauthorized');
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { name } = await req.json();
    console.log('Board name:', name);

    if (!name || name.trim() === '') {
      console.log('Invalid board name');
      return new NextResponse("Board name is required", { status: 400 });
    }

    console.log('Getting Supabase service client...');
    const supabase = getServiceSupabase();
    console.log('Creating board in Supabase...');
    
    // Create the board
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .insert([{ name: name.trim(), owner_id: userId }])
      .select()
      .single();

    if (boardError) {
      console.error('Board creation error:', boardError);
      throw boardError;
    }
    console.log('Board created:', board);

    // Create default columns for the new board
    const defaultColumns = [
      { board_id: board.id, title: 'To Do', position_x: 50, position_y: 50 },
      { board_id: board.id, title: 'In Progress', position_x: 400, position_y: 50 },
      { board_id: board.id, title: 'Done', position_x: 750, position_y: 50 },
    ];

    console.log('Creating default columns...');
    const { error: columnsError } = await supabase
      .from('columns')
      .insert(defaultColumns);

    if (columnsError) {
      console.error('Columns creation error:', columnsError);
      throw columnsError;
    }
    console.log('Default columns created');

    return NextResponse.json(board);
  } catch (error) {
    console.error('=== ERROR DETAILS ===');
    console.error('Error creating board:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', error.details);
    console.error('Error hint:', error.hint);
    console.error('Error stack:', error.stack);
    console.error('=====================');
    
    // Check for specific error types
    let errorMessage = error.message || 'Unknown error occurred';
    let errorDetails = error.details || 'No additional details';
    let errorHint = error.hint || 'No hint available';
    
    // Check if it's a database table error
    if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
      errorMessage = 'Database tables not found';
      errorDetails = 'Please run the SQL schema in Supabase SQL Editor';
      errorHint = 'Go to: https://supabase.com/dashboard/project/fmnvwttrntaxpgpindnco/sql and run supabase-schema.sql';
    }
    
    return new NextResponse(JSON.stringify({ 
      error: errorMessage, 
      details: errorDetails,
      hint: errorHint,
      code: error.code
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
