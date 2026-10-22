-- Run manually in the Supabase SQL editor after creating the user in Authentication.
-- Replace the UUID below with that user's ID. This script refuses to grant access unchanged.
do $$
declare team_user_id uuid := '00000000-0000-0000-0000-000000000000';
        team_role text := 'editor'; -- viewer, editor, or admin
begin
 if team_user_id='00000000-0000-0000-0000-000000000000'::uuid then
  raise exception 'Replace team_user_id with the intended Authentication user ID first';
 end if;
 if not exists(select 1 from auth.users where id=team_user_id) then
  raise exception 'Create this account in Supabase Authentication first';
 end if;
 insert into public.members(user_id,role) values(team_user_id,team_role)
 on conflict(user_id) do update set role=excluded.role;
end $$;
