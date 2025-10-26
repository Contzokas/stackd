import { auth } from '@clerk/nextjs/server';
import { getServiceSupabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// Health check endpoint to verify setup
export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: {},
    clerk: {},
    supabase: {},
  };

  // Check environment variables
  checks.environment = {
    hasClerkPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    hasClerkSecretKey: !!process.env.CLERK_SECRET_KEY,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  };

  // Check Clerk authentication
  try {
    const { userId } = await auth();
    checks.clerk = {
      authenticated: !!userId,
      userId: userId || 'Not authenticated',
    };
  } catch (error) {
    checks.clerk = {
      authenticated: false,
      error: error.message,
    };
  }

  // Check Supabase connection and tables
  try {
    const supabase = getServiceSupabase();
    
    // Try to query each table
    const tables = ['boards', 'board_members', 'columns', 'cards'];
    checks.supabase.tables = {};
    
    for (const table of tables) {
      try {
        const { error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        checks.supabase.tables[table] = {
          exists: !error,
          count: count,
          error: error?.message || null,
          errorCode: error?.code || null,
        };
      } catch (err) {
        checks.supabase.tables[table] = {
          exists: false,
          error: err.message,
        };
      }
    }
  } catch (error) {
    checks.supabase = {
      error: error.message,
    };
  }

  // Determine overall status
  const allEnvVarsPresent = Object.values(checks.environment).every(v => v === true || typeof v === 'string');
  const allTablesExist = checks.supabase.tables 
    ? Object.values(checks.supabase.tables).every(t => t.exists)
    : false;

  checks.status = {
    ready: allEnvVarsPresent && checks.clerk.authenticated && allTablesExist,
    environment: allEnvVarsPresent,
    authentication: checks.clerk.authenticated,
    database: allTablesExist,
  };

  return NextResponse.json(checks, { status: 200 });
}
