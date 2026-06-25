-- ================================================================
-- DriveLicenceLab v2 — Full Schema Update
-- Run this in Supabase SQL Editor
-- ================================================================

-- ── TEST BOOKINGS ────────────────────────────────────────────────
create table if not exists test_bookings (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade,
  test_officer_id uuid references profiles(id),
  test_date date not null,
  test_time time,
  test_center text not null,
  category text default 'Code 8',
  status text check (status in ('scheduled','passed','failed','cancelled')) default 'scheduled',
  notes text,
  completed_at timestamptz,
  created_at timestamptz default now()
);
alter table test_bookings enable row level security;
create policy "Test officers manage bookings" on test_bookings for all using (auth.uid() = test_officer_id);
create policy "Students view own bookings" on test_bookings for select using (auth.uid() = student_id);
create policy "Admins view all bookings" on test_bookings for select using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin','system_admin'))
);

-- ── ISSUE TRACKER ────────────────────────────────────────────────
create table if not exists issue_tracker (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references profiles(id) on delete set null,
  title text not null,
  description text,
  status text check (status in ('open','in_progress','resolved')) default 'open',
  priority text check (priority in ('low','medium','high','critical')) default 'medium',
  created_at timestamptz default now(),
  resolved_at timestamptz
);
alter table issue_tracker enable row level security;
create policy "Anyone can report issues" on issue_tracker for insert with check (auth.uid() = reporter_id);
create policy "System admins manage issues" on issue_tracker for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'system_admin')
);
create policy "Reporters view own issues" on issue_tracker for select using (auth.uid() = reporter_id);

-- ── SCHOOLS — add verified column ────────────────────────────────
alter table schools add column if not exists verified boolean default false;
alter table schools add column if not exists region text;
alter table schools add column if not exists phone text;

-- ── NOTIFICATIONS ────────────────────────────────────────────────
create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  body text,
  read boolean default false,
  type text default 'info',
  created_at timestamptz default now()
);
alter table notifications enable row level security;
create policy "Users manage own notifications" on notifications for all using (auth.uid() = user_id);

-- ── SESSION RECORDS ──────────────────────────────────────────────
create table if not exists sessions (
  id uuid default uuid_generate_v4() primary key,
  slot_id uuid references time_slots(id),
  instructor_id uuid references profiles(id),
  session_date date not null,
  skills_taught text[],
  notes text,
  created_at timestamptz default now()
);
alter table sessions enable row level security;
create policy "Instructors manage own sessions" on sessions for all using (auth.uid() = instructor_id);
create policy "Admins view all sessions" on sessions for select using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin','system_admin'))
);

-- ── PARENT ACCESS ────────────────────────────────────────────────
create table if not exists parent_access (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade,
  parent_email text not null,
  access_code text unique default substr(md5(random()::text), 1, 8),
  active boolean default true,
  created_at timestamptz default now()
);
alter table parent_access enable row level security;
create policy "Students manage parent access" on parent_access for all using (auth.uid() = student_id);

-- ── UPDATE PROFILES — add missing columns ────────────────────────
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists bio text;
alter table profiles add column if not exists licence_category text default 'Code 8';

-- ── ENROLLMENTS — add readiness score ────────────────────────────
alter table enrollments add column if not exists readiness_score int default 0;
alter table enrollments add column if not exists payment_status text default 'pending';
alter table enrollments add column if not exists test_result text;

-- ── REFRESH TRIGGER (handles Google + email signup) ───────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name);

  insert into public.student_xp (student_id, xp_points, streak_days)
  values (new.id, 0, 0)
  on conflict do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Done!
select 'DriveLicenceLab v2 schema applied successfully!' as result;
