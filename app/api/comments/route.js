import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// GET /api/comments?cardId=xxx - Get all comments for a card
export async function GET(request) {
  try {
    await auth.protect();
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('cardId');

    if (!cardId) {
      return new NextResponse("Card ID is required", { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Get comments for the card
    const { data: comments, error } = await supabase
      .from('card_comments')
      .select('*')
      .eq('card_id', cardId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error fetching comments:', error);
      throw error;
    }

    // Fetch user details from Clerk for each comment
    const commentsWithUserInfo = await Promise.all(
      (comments || []).map(async (comment) => {
        try {
          const client = await clerkClient();
          const user = await client.users.getUser(comment.user_id);
          return {
            ...comment,
            username: user.username || user.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Unknown',
            fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
            imageUrl: user.imageUrl,
          };
        } catch (error) {
          console.error(`Error fetching user ${comment.user_id}:`, error);
          return {
            ...comment,
            username: 'Unknown User',
            fullName: null,
            imageUrl: null,
          };
        }
      })
    );

    return NextResponse.json(commentsWithUserInfo);
  } catch (error) {
    console.error('Error fetching comments:', error);
    console.error('Error details:', error.message, error.code, error.details);
    return new NextResponse(error.message || 'Internal server error', { status: 500 });
  }
}

// POST /api/comments - Create a new comment
export async function POST(request) {
  try {
    await auth.protect();
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { card_id, comment } = await request.json();

    if (!card_id || !comment) {
      return new NextResponse("Card ID and comment text are required", { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('card_comments')
      .insert([{
        card_id,
        user_id: userId,
        comment: comment.trim(),
      }])
      .select()
      .single();

    if (error) throw error;

    // Fetch user details for the new comment
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const commentWithUserInfo = {
        ...data,
        username: user.username || user.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Unknown',
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
        imageUrl: user.imageUrl,
      };
      return NextResponse.json(commentWithUserInfo);
    } catch (error) {
      console.error('Error fetching user info:', error);
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error creating comment:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}

// PUT /api/comments?id=xxx - Update a comment
export async function PUT(request) {
  try {
    await auth.protect();
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');
    const { comment } = await request.json();

    if (!commentId || !comment) {
      return new NextResponse("Comment ID and text are required", { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Update comment (RLS will ensure only owner can update)
    const { data, error } = await supabase
      .from('card_comments')
      .update({ comment: comment.trim() })
      .eq('id', commentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    // Fetch user details for the updated comment
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const commentWithUserInfo = {
        ...data,
        username: user.username || user.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Unknown',
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
        imageUrl: user.imageUrl,
      };
      return NextResponse.json(commentWithUserInfo);
    } catch (error) {
      console.error('Error fetching user info for update:', error);
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error updating comment:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}

// DELETE /api/comments?id=xxx - Delete a comment
export async function DELETE(request) {
  try {
    await auth.protect();
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');

    if (!commentId) {
      return new NextResponse("Comment ID is required", { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Delete comment (RLS handles permissions)
    const { error } = await supabase
      .from('card_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}
