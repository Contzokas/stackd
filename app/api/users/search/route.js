import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    await auth.protect();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    // Search for users by username
    const users = await clerkClient.users.getUserList({
      limit: 10,
    });

    // Filter users by username that matches the query
    const filteredUsers = users.data
      .filter(user => {
        const username = user.username || user.emailAddresses?.[0]?.emailAddress?.split('@')[0];
        return username?.toLowerCase().includes(query.toLowerCase());
      })
      .map(user => ({
        id: user.id,
        username: user.username || user.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Unknown',
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
        imageUrl: user.imageUrl,
      }));

    return NextResponse.json(filteredUsers);
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}
