-- Additive migration: run after schema.sql, including on an existing installation.
-- Editors can inspect non-sensitive configuration; this never grants write privileges.
begin;
create or replace function public.research_backend_status()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare bucket storage.buckets%rowtype; tables_ok boolean; policies_ok boolean;
begin
 if not public.can_edit() then raise exception 'Editor or admin membership required' using errcode='42501'; end if;
 select count(*)=3 and bool_and(c.relrowsecurity) into tables_ok
 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relname in ('entries','resources','members') and c.relkind='r';
 select count(*)=12 into policies_ok from pg_catalog.pg_policies
 where (schemaname='public' and tablename='members' and policyname='own_membership')
 or (schemaname='public' and tablename='entries' and policyname in ('read_entries','insert_entries','update_entries','delete_entries'))
 or (schemaname='public' and tablename='resources' and policyname in ('read_resources','insert_resources','update_resources','delete_resources'))
 or (schemaname='storage' and tablename='objects' and policyname in ('read_research_files','upload_research_files','delete_research_files'));
 select * into bucket from storage.buckets where id='research-files';
 return jsonb_build_object('tables_ready',coalesce(tables_ok,false),'policies_present',coalesce(policies_ok,false),
 'bucket_exists',bucket.id is not null,'bucket_private',coalesce(not bucket.public,false),
 'upload_limit_ok',coalesce(bucket.file_size_limit=26214400,false),
 'images_allowed',coalesce(bucket.allowed_mime_types @> array['image/jpeg','image/png','image/webp'],false),
 'pdf_allowed',coalesce(bucket.allowed_mime_types @> array['application/pdf'],false));
end $$;
revoke all on function public.research_backend_status() from public, anon;
grant execute on function public.research_backend_status() to authenticated;
commit;
