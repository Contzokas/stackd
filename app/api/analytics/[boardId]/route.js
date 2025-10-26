import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET(request, { params }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params in Next.js 15+
    const { boardId } = await params;
    console.log('Analytics request for board:', boardId, 'by user:', userId);
    
    if (!boardId || boardId === 'undefined') {
      console.error('Invalid boardId received:', boardId);
      return NextResponse.json({ error: 'Invalid board ID' }, { status: 400 });
    }
    
    const supabase = getServiceSupabase();

    // Verify user has access to this board AND has owner/admin role
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select(`
        id, 
        owner_id, 
        board_members(user_id, role)
      `)
      .eq('id', boardId)
      .single();

    if (boardError) {
      console.error('Board fetch error:', boardError);
      return NextResponse.json({ error: `Board fetch failed: ${boardError.message}` }, { status: 500 });
    }

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Check if user is owner or admin
    const isOwner = board.owner_id === userId;
    const memberRole = board.board_members?.find(m => m.user_id === userId)?.role;
    const isAdmin = memberRole === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ 
        error: 'Access denied. Analytics are only available to board owners and administrators.' 
      }, { status: 403 });
    }
    
    console.log('User has analytics access (role:', isOwner ? 'owner' : 'admin', '). Fetching data...');

    // ============================================
    // 1. TASKS COMPLETED PER WEEK
    // ============================================
    console.log('Fetching completed cards...');
    
    // First, get column IDs for this board
    const { data: boardColumns, error: colError } = await supabase
      .from('columns')
      .select('id')
      .eq('board_id', boardId);
    
    if (colError) {
      console.error('Error fetching columns:', colError);
      throw new Error(`Failed to fetch columns: ${colError.message}`);
    }
    
    const columnIds = boardColumns?.map(c => c.id) || [];
    console.log('Found column IDs:', columnIds.length);
    
    // Check if completed_at column exists by trying to select it
    const { data: completedCards, error: completedError } = await supabase
      .from('cards')
      .select('id, title, completed_at, column_id')
      .not('completed_at', 'is', null)
      .in('column_id', columnIds);
    
    if (completedError) {
      console.error('Error fetching completed cards:', completedError);
      
      // Check if error is due to missing column
      if (completedError.message?.includes('completed_at') || completedError.code === 'PGRST204') {
        return NextResponse.json({ 
          error: 'Analytics schema not initialized. Please run analytics-schema.sql in Supabase SQL Editor.',
          details: 'Missing completed_at column or card_history table'
        }, { status: 500 });
      }
      
      throw completedError;
    }
    
    console.log('Found completed cards:', completedCards?.length || 0);

    // Group by week
    const completedByWeek = {};
    completedCards?.forEach(card => {
      const date = new Date(card.completed_at);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!completedByWeek[weekKey]) {
        completedByWeek[weekKey] = 0;
      }
      completedByWeek[weekKey]++;
    });

    const completedPerWeek = Object.entries(completedByWeek)
      .map(([week, count]) => ({
        week,
        count,
        weekLabel: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }))
      .sort((a, b) => new Date(a.week) - new Date(b.week))
      .slice(-12); // Last 12 weeks

    // ============================================
    // 2. CARDS BY COLUMN (for bottleneck detection)
    // ============================================
    const { data: columns } = await supabase
      .from('columns')
      .select(`
        id,
        title,
        cards(
          id,
          title,
          created_at,
          status
        )
      `)
      .eq('board_id', boardId);

    const cardsByColumn = columns?.map(col => {
      const cards = col.cards || [];
      const now = new Date();
      
      // Calculate average age of cards in this column
      const avgAge = cards.length > 0
        ? cards.reduce((sum, card) => {
            const age = (now - new Date(card.created_at)) / (1000 * 60 * 60 * 24); // days
            return sum + age;
          }, 0) / cards.length
        : 0;

      return {
        columnId: col.id,
        columnTitle: col.title,
        cardCount: cards.length,
        avgAgeDays: Math.round(avgAge * 10) / 10,
        isBottleneck: cards.length > 5 && avgAge > 7 // More than 5 cards and avg age > 7 days
      };
    }) || [];

    // ============================================
    // 3. AVERAGE TIME IN PROGRESS
    // ============================================
    console.log('Fetching card history...');
    
    // Get all card IDs for this board
    const { data: boardCards, error: cardsError } = await supabase
      .from('cards')
      .select('id')
      .in('column_id', columnIds);
    
    if (cardsError) {
      console.error('Error fetching cards for history:', cardsError);
    }
    
    const cardIds = boardCards?.map(c => c.id) || [];
    console.log('Found card IDs for history:', cardIds.length);
    
    // Fetch card history for these cards
    const { data: cardHistory, error: historyError } = await supabase
      .from('card_history')
      .select(`
        id,
        card_id,
        from_column_id,
        to_column_id,
        moved_at
      `)
      .in('card_id', cardIds)
      .order('moved_at', { ascending: true });
    
    if (historyError) {
      console.warn('Error fetching card history (table may not exist yet):', historyError);
    }
    
    console.log('Found card history entries:', cardHistory?.length || 0);

    // Calculate time spent in each column
    const timeInColumns = {};
    const cardTimelines = {};

    cardHistory?.forEach(entry => {
      const cardId = entry.card_id;
      if (!cardTimelines[cardId]) {
        cardTimelines[cardId] = [];
      }
      cardTimelines[cardId].push(entry);
    });

    // Calculate average time per column
    Object.values(cardTimelines).forEach(timeline => {
      timeline.forEach((entry, index) => {
        if (entry.to_column_id && index < timeline.length - 1) {
          const nextEntry = timeline[index + 1];
          if (nextEntry.from_column_id === entry.to_column_id) {
            const timeSpent = new Date(nextEntry.moved_at) - new Date(entry.moved_at);
            const hours = timeSpent / (1000 * 60 * 60);
            
            if (!timeInColumns[entry.to_column_id]) {
              timeInColumns[entry.to_column_id] = {
                totalTime: 0,
                count: 0,
                columnTitle: ''
              };
            }
            
            timeInColumns[entry.to_column_id].totalTime += hours;
            timeInColumns[entry.to_column_id].count++;
          }
        }
      });
    });

    // Get column titles and calculate averages
    const avgTimePerColumn = await Promise.all(
      Object.entries(timeInColumns).map(async ([columnId, data]) => {
        const { data: column } = await supabase
          .from('columns')
          .select('title')
          .eq('id', columnId)
          .single();

        return {
          columnId,
          columnTitle: column?.title || 'Unknown',
          avgHours: Math.round((data.totalTime / data.count) * 10) / 10,
          avgDays: Math.round((data.totalTime / data.count / 24) * 10) / 10,
          cardCount: data.count
        };
      })
    );

    // ============================================
    // 4. OVERALL STATS
    // ============================================
    console.log('Calculating overall stats...');
    
    const { data: allCards, error: allCardsError } = await supabase
      .from('cards')
      .select('id, created_at, completed_at, status, due_date')
      .in('column_id', columnIds);
    
    if (allCardsError) {
      console.error('Error fetching all cards:', allCardsError);
      throw new Error(`Failed to fetch cards: ${allCardsError.message}`);
    }
    
    console.log('Found total cards:', allCards?.length || 0);

    const totalCards = allCards?.length || 0;
    const completedCount = allCards?.filter(c => c.completed_at).length || 0;
    const inProgressCount = allCards?.filter(c => c.status === 'in_progress').length || 0;
    
    // Calculate overdue cards
    const now = new Date();
    const overdueCards = allCards?.filter(c => 
      c.due_date && 
      c.status !== 'completed' && 
      new Date(c.due_date) < now
    ) || [];
    const overdueCount = overdueCards.length;
    
    // Calculate average days overdue for overdue cards
    const avgDaysOverdue = overdueCount > 0
      ? overdueCards.reduce((sum, card) => {
          const daysOver = (now - new Date(card.due_date)) / (1000 * 60 * 60 * 24);
          return sum + daysOver;
        }, 0) / overdueCount
      : 0;
    
    // Calculate average completion time
    const completedWithTime = allCards?.filter(c => c.completed_at && c.created_at) || [];
    const avgCompletionTime = completedWithTime.length > 0
      ? completedWithTime.reduce((sum, card) => {
          const time = new Date(card.completed_at) - new Date(card.created_at);
          return sum + time;
        }, 0) / completedWithTime.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;
    
    // Calculate how many completed cards were late (completed after due date)
    const completedLateCards = completedWithTime.filter(c => 
      c.due_date && 
      new Date(c.completed_at) > new Date(c.due_date)
    );
    const completedLateCount = completedLateCards.length;
    
    // Calculate average days late for cards completed late
    const avgDaysLate = completedLateCount > 0
      ? completedLateCards.reduce((sum, card) => {
          const daysLate = (new Date(card.completed_at) - new Date(card.due_date)) / (1000 * 60 * 60 * 24);
          return sum + daysLate;
        }, 0) / completedLateCount
      : 0;

    const overallStats = {
      totalCards,
      completedCount,
      inProgressCount,
      overdueCount,
      completionRate: totalCards > 0 ? Math.round((completedCount / totalCards) * 100) : 0,
      avgCompletionDays: Math.round(avgCompletionTime * 10) / 10,
      avgDaysOverdue: Math.round(avgDaysOverdue * 10) / 10,
      completedLateCount,
      avgDaysLate: Math.round(avgDaysLate * 10) / 10,
      onTimeRate: completedCount > 0 ? Math.round(((completedCount - completedLateCount) / completedCount) * 100) : 0
    };

    // ============================================
    // 5. USER PRODUCTIVITY (for shared boards)
    // ============================================
    console.log('Calculating user productivity...');
    
    // Get all unique user IDs from cards
    const userIds = [...new Set(allCards?.map(c => c.created_by).filter(Boolean))];
    console.log('Found users:', userIds.length);
    
    // Fetch user info from Clerk for each user
    const userProductivity = await Promise.all(
      userIds.map(async (userId) => {
        try {
          const client = await clerkClient();
          const user = await client.users.getUser(userId);
          
          const userCards = allCards?.filter(c => c.created_by === userId) || [];
          const userCompletedCards = userCards.filter(c => c.completed_at);
          const userInProgressCards = userCards.filter(c => c.status === 'in_progress');
          
          // Get card movements by this user
          const userMovements = cardHistory?.filter(h => h.moved_by === userId).length || 0;
          
          return {
            userId,
            userName: user.username || user.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Unknown',
            userFullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
            userImageUrl: user.imageUrl,
            cardsCreated: userCards.length,
            cardsCompleted: userCompletedCards.length,
            cardsInProgress: userInProgressCards.length,
            cardMovements: userMovements,
            completionRate: userCards.length > 0 
              ? Math.round((userCompletedCards.length / userCards.length) * 100) 
              : 0
          };
        } catch (err) {
          console.warn('Failed to fetch user info for:', userId, err);
          return {
            userId,
            userName: 'Unknown User',
            userFullName: null,
            userImageUrl: null,
            cardsCreated: allCards?.filter(c => c.created_by === userId).length || 0,
            cardsCompleted: allCards?.filter(c => c.created_by === userId && c.completed_at).length || 0,
            cardsInProgress: allCards?.filter(c => c.created_by === userId && c.status === 'in_progress').length || 0,
            cardMovements: cardHistory?.filter(h => h.moved_by === userId).length || 0,
            completionRate: 0
          };
        }
      })
    );
    
    // Sort by cards created (most active first)
    userProductivity.sort((a, b) => b.cardsCreated - a.cardsCreated);
    
    console.log('User productivity calculated for', userProductivity.length, 'users');

    // ============================================
    // RETURN ALL ANALYTICS DATA
    // ============================================
    return NextResponse.json({
      boardId,
      completedPerWeek,
      cardsByColumn,
      avgTimePerColumn,
      overallStats,
      userProductivity,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch analytics', 
        details: error.message,
        code: error.code || 'UNKNOWN'
      },
      { status: 500 }
    );
  }
}
