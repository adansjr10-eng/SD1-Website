-- Execute once in the Supabase SQL editor. No credentials belong in this file.
begin;
create extension if not exists pgcrypto;
create table public.members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check (role in ('viewer','editor','admin')) default 'viewer'
);
create function public.is_member() returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.members where user_id=(select auth.uid())) $$;
create function public.can_edit() returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.members where user_id=(select auth.uid()) and role in ('editor','admin')) $$;
revoke all on function public.is_member() from public;
revoke all on function public.can_edit() from public;
grant execute on function public.is_member(), public.can_edit() to anon, authenticated;
create table public.entries (
 id uuid primary key default gen_random_uuid(),
 kind text not null check (kind in ('tester','bearing','suspension','project','research','update')),
 title text not null check (length(trim(title)) between 1 and 180),
 organization text not null default '', category text not null default '',
 summary text not null default '' check(length(summary)<=1000), body text not null default '',
 specs jsonb not null default '{}' check(jsonb_typeof(specs)='object'),
 tags text[] not null default '{}', sources jsonb not null default '[]' check(jsonb_typeof(sources)='array'),
 status text not null default 'draft' check(status in ('draft','published')),
 visibility text not null default 'team' check(visibility in ('public','team')),
 demo boolean not null default false, updated_at timestamptz not null default now()
);
create function public.validate_entry() returns trigger language plpgsql set search_path='' as $$
declare k text; s jsonb;
begin
 foreach k in array array['rpm','speed','load'] loop
  if new.specs ? k and (jsonb_typeof(new.specs->k) <> 'number' or (new.specs->>k)::numeric < 0) then raise exception 'Numeric specifications must be nonnegative numbers'; end if;
 end loop;
 for s in select value from jsonb_array_elements(new.sources) loop
  if jsonb_typeof(s) <> 'object' or coalesce(s->>'url','') !~* '^https?://' or length(coalesce(s->>'label',''))=0 then raise exception 'Sources require a label and an HTTP(S) URL'; end if;
 end loop;
 new.updated_at=now(); return new;
end $$;
create trigger validate_entry before insert or update on public.entries for each row execute function public.validate_entry();
create table public.resources (
 id uuid primary key default gen_random_uuid(), entry_id uuid references public.entries(id) on delete restrict,
 name text not null, caption text not null default '', category text not null default '', tags text[] not null default '{}',
 path text not null unique check(path ~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]+$' and path ~* '\.(jpg|jpeg|png|webp|pdf|step|stp|iges|igs|stl|dwg|dxf|sldprt|sldasm|xlsx|xls|csv|docx|txt|md)$'),
 mime text not null, size bigint not null check(size>0 and size<=26214400),
 visibility text not null default 'team' check(visibility in ('public','team')),
 status text not null default 'draft' check(status in ('draft','published')),
 created_at timestamptz not null default now()
);
create index entries_kind_idx on public.entries(kind);
create index resources_entry_idx on public.resources(entry_id);
alter table public.members enable row level security;
alter table public.entries enable row level security;
alter table public.resources enable row level security;
-- Membership is granted by a trusted database administrator, never by the browser.
create policy own_membership on public.members for select to authenticated using(user_id=(select auth.uid()));
create policy read_entries on public.entries for select to anon,authenticated using ((status='published' and visibility='public') or (status='published' and public.is_member()) or public.can_edit());
create policy insert_entries on public.entries for insert to authenticated with check(public.can_edit());
create policy update_entries on public.entries for update to authenticated using(public.can_edit()) with check(public.can_edit());
create policy delete_entries on public.entries for delete to authenticated using(public.can_edit());
create policy read_resources on public.resources for select to anon,authenticated using (
 public.can_edit() or (status='published' and (visibility='public' or public.is_member()) and
 (entry_id is null or exists(select 1 from public.entries e where e.id=resources.entry_id and e.status='published' and (e.visibility='public' or public.is_member()))))
);
create policy insert_resources on public.resources for insert to authenticated with check(public.can_edit());
create policy update_resources on public.resources for update to authenticated using(public.can_edit()) with check(public.can_edit());
create policy delete_resources on public.resources for delete to authenticated using(public.can_edit());
revoke all on public.members,public.entries,public.resources from anon,authenticated;
grant select on public.members,public.entries,public.resources to anon,authenticated;
grant insert,update,delete on public.entries,public.resources to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('research-files','research-files',false,26214400,array['image/jpeg','image/png','image/webp','application/pdf','application/octet-stream','application/step','model/step','model/stl','model/iges','application/acad','image/vnd.dwg','image/vnd.dxf','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/csv','text/plain','text/markdown']);
create policy read_research_files on storage.objects for select to anon,authenticated using(bucket_id='research-files' and (public.can_edit() or exists(select 1 from public.resources r where r.path=storage.objects.name)));
create policy upload_research_files on storage.objects for insert to authenticated with check(bucket_id='research-files' and public.can_edit() and name ~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]+$' and name ~* '\.(jpg|jpeg|png|webp|pdf|step|stp|iges|igs|stl|dwg|dxf|sldprt|sldasm|xlsx|xls|csv|docx|txt|md)$');
create policy delete_research_files on storage.objects for delete to authenticated using(bucket_id='research-files' and public.can_edit());
commit;
