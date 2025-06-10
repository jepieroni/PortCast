
-- Check if RLS is enabled on shipments table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'shipments' AND schemaname = 'public';

-- Check existing RLS policies on shipments table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'shipments' AND schemaname = 'public';
