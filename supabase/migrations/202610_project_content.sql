-- ADDITIVE, repeatable migration. Does not import/publish content or change memberships/RLS on existing tables.
begin;
alter table public.entries add column if not exists section text not null default '';
alter table public.entries add column if not exists review_state text not null default 'preliminary';
alter table public.entries add column if not exists provenance jsonb not null default '[]';
alter table public.entries add column if not exists details jsonb not null default '{}';
alter table public.resources add column if not exists citation text not null default '';
alter table public.resources add column if not exists rights text not null default 'review-required';
do $$ begin
 if not exists(select 1 from pg_constraint where conname='entries_review_state_check' and conrelid='public.entries'::regclass) then alter table public.entries add constraint entries_review_state_check check(review_state in ('confirmed','preliminary','pending','completed','planned')); end if;
 if not exists(select 1 from pg_constraint where conname='entries_structured_content_check' and conrelid='public.entries'::regclass) then alter table public.entries add constraint entries_structured_content_check check(jsonb_typeof(provenance)='array' and jsonb_typeof(details)='object'); end if;
 if not exists(select 1 from pg_constraint where conname='resources_rights_check' and conrelid='public.resources'::regclass) then alter table public.resources add constraint resources_rights_check check(rights in ('review-required','team-owned','permission-granted','link-only')); end if;
end $$;
create index if not exists entries_section_idx on public.entries(section);
create table if not exists public.content_import_items (
 import_key text primary key check(import_key ~ '^pbt:[a-z0-9:_-]{1,150}$'),
 entry_id uuid references public.entries(id) on delete set null,
 imported_at timestamptz not null default now()
);
alter table public.content_import_items enable row level security;
revoke all on public.content_import_items from anon,authenticated;
grant select on public.content_import_items to authenticated;
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='content_import_items' and policyname='editor_import_history') then
 create policy editor_import_history on public.content_import_items for select to authenticated using(public.can_edit());
 end if;
end $$;
create or replace function public.import_project_drafts(items jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare item jsonb; claimed text; new_id uuid; added integer:=0; skipped integer:=0; seen text[]:='{}'; key_value text;
begin
 if not public.can_edit() then raise exception 'Editor or admin membership required' using errcode='42501'; end if;
 if jsonb_typeof(items) is distinct from 'array' or jsonb_array_length(items)<1 or jsonb_array_length(items)>150 then raise exception 'Provide 1 to 150 import items'; end if;
 for item in select value from jsonb_array_elements(items) loop
  key_value:=item->>'import_key';
  if coalesce(key_value,'') !~ '^pbt:[a-z0-9:_-]{1,150}$' or key_value=any(seen) then raise exception 'Invalid or duplicate import key'; end if;
  seen:=array_append(seen,key_value);
  if coalesce(item->>'title','')='' or coalesce(item->>'kind','') not in ('tester','bearing','suspension','project','research','update') then raise exception 'Title and content kind required'; end if;
  if jsonb_typeof(item->'provenance') is distinct from 'array' or jsonb_array_length(item->'provenance')=0 then raise exception 'Provenance required'; end if;
  if exists(select 1 from jsonb_array_elements(item->'provenance') c where jsonb_typeof(c) <> 'object' or coalesce(c->>'document','')='' or coalesce(c->>'locator','')='' or (coalesce(c->>'url','')<>'' and c->>'url' !~* '^https?://')) then raise exception 'Each citation needs a document, location, and valid optional URL'; end if;
  claimed:=null;
  insert into public.content_import_items(import_key) values(key_value) on conflict do nothing returning import_key into claimed;
  if claimed is null then skipped:=skipped+1; continue; end if;
  insert into public.entries(kind,title,organization,category,summary,body,specs,tags,sources,status,visibility,demo,section,review_state,provenance,details)
  values(item->>'kind',item->>'title',coalesce(item->>'organization',''),coalesce(item->>'category',''),coalesce(item->>'summary',''),coalesce(item->>'body',''),coalesce(item->'specs','{}'),array(select jsonb_array_elements_text(coalesce(item->'tags','[]'))),coalesce(item->'sources','[]'),'draft','team',false,coalesce(item->>'section',''),coalesce(item->>'review_state','preliminary'),item->'provenance',coalesce(item->'details','{}')) returning id into new_id;
  update public.content_import_items set entry_id=new_id where import_key=key_value;
  added:=added+1;
 end loop;
 return jsonb_build_object('inserted',added,'skipped',skipped,'publication','team-only drafts');
end $$;
revoke all on function public.import_project_drafts(jsonb) from public,anon;
grant execute on function public.import_project_drafts(jsonb) to authenticated;
-- Accept source presentations without changing bucket privacy, size limits, or existing MIME entries.
update storage.buckets set allowed_mime_types = array(select distinct x from unnest(allowed_mime_types || array['application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation']) x)
where id='research-files' and allowed_mime_types is not null;
-- Preserve extension restrictions and add PPT/PPTX for privately stored project source presentations.
alter table public.resources drop constraint if exists resources_path_check;
alter table public.resources add constraint resources_path_check check(path ~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]+$' and path ~* '\.(jpg|jpeg|png|webp|pdf|ppt|pptx|step|stp|iges|igs|stl|dwg|dxf|sldprt|sldasm|xlsx|xls|csv|docx|txt|md)$');
-- Existing upload policy remains in place; a second guarded policy admits only presentations.
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='upload_research_presentations') then
 create policy upload_research_presentations on storage.objects for insert to authenticated with check(bucket_id='research-files' and public.can_edit() and name ~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]+$' and name ~* '\.(ppt|pptx)$');
 end if;
end $$;
notify pgrst, 'reload schema';
commit;
