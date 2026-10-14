-- Run once in the Supabase SQL Editor before opening registration.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  requested_role text not null default 'student' check (requested_role in ('student', 'management')),
  role text not null default 'student' check (role in ('student', 'management', 'admin')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists profiles_status_created_at_idx on public.profiles (status, created_at);
alter table public.profiles enable row level security;

-- Trigger data is untrusted. In particular, sign-up metadata can never create an admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, requested_role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(left(trim(new.raw_user_meta_data ->> 'full_name'), 100), ''), 'New member'),
    case when new.raw_user_meta_data ->> 'requested_role' = 'management'
      then 'management' else 'student' end
  );
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create schema if not exists private;
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and status = 'approved'
  );
$$;

revoke all on function private.is_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

drop policy if exists "Members read own profile" on public.profiles;
create policy "Members read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles" on public.profiles
  for select to authenticated using ((select private.is_admin()));

drop policy if exists "Admins review profiles" on public.profiles;
create policy "Admins review profiles" on public.profiles
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (role, status, reviewed_at) on public.profiles to authenticated;

-- No insert policy: profiles are created only by the trusted auth trigger.
-- No delete policy: members cannot remove profiles through the public API.
