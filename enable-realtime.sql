-- Enable Realtime for all tables
-- Run this in Supabase SQL Editor if Realtime is not working

-- First, check if the publication exists
-- SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE boards;
ALTER PUBLICATION supabase_realtime ADD TABLE columns;
ALTER PUBLICATION supabase_realtime ADD TABLE cards;
ALTER PUBLICATION supabase_realtime ADD TABLE board_members;
ALTER PUBLICATION supabase_realtime ADD TABLE card_comments;

-- Verify tables are in the publication
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- Expected result: You should see all 5 tables listed above
