-- READ ONLY: run in Supabase SQL editor as the project administrator.
-- Missing results indicate missing setup. Review policy expressions for unexpected permissive policies.
select expected.table_name, c.oid is not null as exists, coalesce(c.relrowsecurity,false) as rls_enabled
from (values ('entries'),('resources'),('members')) as expected(table_name)
left join pg_catalog.pg_namespace n on n.nspname='public'
left join pg_catalog.pg_class c on c.relnamespace=n.oid and c.relname=expected.table_name and c.relkind='r';

select schemaname,tablename,policyname,roles,cmd,qual,with_check
from pg_catalog.pg_policies
where (schemaname='public' and tablename in ('entries','resources','members'))
 or (schemaname='storage' and tablename='objects') order by schemaname,tablename,policyname;

select id,public,file_size_limit,allowed_mime_types from storage.buckets where id='research-files';

-- After tables exist, membership counts can be checked separately:
-- select role,count(*) as authorized_users from public.members group by role;

select routine_name,security_type from information_schema.routines
where routine_schema='public' and routine_name in ('can_edit','is_member','research_backend_status');
