-- Check ownership of storage.objects table
SELECT
    n.nspname AS schema,
    c.relname AS table,
    r.rolname AS owner,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_roles r ON r.oid = c.relowner
WHERE c.relkind = 'r'          -- only ordinary tables
  AND n.nspname = 'storage'    -- storage schema
  AND c.relname = 'objects';   -- objects table

-- Also check what role you're currently using
SELECT current_user, current_role;

-- Check if storage.objects table exists and its current RLS status
SELECT schemaname, tablename, rowsecurity, policyname, cmd, qual
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
UNION ALL
SELECT 'storage', 'objects', 
       CASE WHEN relrowsecurity THEN 'ENABLED' ELSE 'DISABLED' END,
       'RLS Status', '', ''
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'storage' AND c.relname = 'objects';