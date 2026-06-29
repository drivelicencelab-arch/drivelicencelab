-- ================================================================
-- DriveLicenceLab v4 Schema — AI Feature Layer
-- Run in Supabase SQL Editor
-- ================================================================

-- ── Student Goals (Goal Date Engine) ─────────────────────────────
create table if not exists student_goals (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade unique,
  goal_date date not null,
  goal_label text default 'My Goal',
  plan jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table student_goals enable row level security;
create policy "Students manage own goals" on student_goals
  for all using (auth.uid() = student_id);

-- ── Sim Sessions ─────────────────────────────────────────────────
create table if not exists sim_sessions (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  scores jsonb not null default '{}',
  avg_score int default 0,
  debrief_text text,
  sim_hours_earned numeric(4,1) default 0,
  completed_at timestamptz default now()
);
alter table sim_sessions enable row level security;
create policy "Students view own sim sessions" on sim_sessions
  for select using (auth.uid() = student_id);
create policy "Students insert own sim sessions" on sim_sessions
  for insert with check (auth.uid() = student_id);
create policy "Instructors view student sim sessions" on sim_sessions
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role in ('instructor','admin','system_admin'))
  );

-- ── Distraction Strikes ───────────────────────────────────────────
create table if not exists distraction_strikes (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  strike_number int not null,
  detected_at timestamptz default now()
);
alter table distraction_strikes enable row level security;
create policy "Students view own strikes" on distraction_strikes
  for select using (auth.uid() = student_id);
create policy "Students insert own strikes" on distraction_strikes
  for insert with check (auth.uid() = student_id);
create policy "Instructors view student strikes" on distraction_strikes
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role in ('instructor','admin'))
  );

-- ── Sessions — add distraction fields ────────────────────────────
alter table sessions add column if not exists distraction_strikes int default 0;
alter table sessions add column if not exists clean_session boolean default false;
alter table sessions add column if not exists duration_minutes int default 0;

-- ── DriveCoin Transactions ────────────────────────────────────────
create table if not exists drivecoin_transactions (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade,
  coins int not null,
  label text not null,
  icon text default '🪙',
  type text check (type in ('earn','redeem')) default 'earn',
  created_at timestamptz default now()
);
alter table drivecoin_transactions enable row level security;
create policy "Students manage own coin transactions" on drivecoin_transactions
  for all using (auth.uid() = student_id);
create policy "Admins view all transactions" on drivecoin_transactions
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','system_admin'))
  );

-- ── DriveCoin balance on XP table ────────────────────────────────
alter table student_xp add column if not exists drivecoin_balance int default 0;
alter table student_xp add column if not exists sim_hours numeric(6,1) default 0;

-- ── Lesson Match Requests (Uber-style matching) ───────────────────
create table if not exists lesson_match_requests (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade,
  student_name text,
  instructor_id uuid references profiles(id) on delete set null,
  requested_time timestamptz,
  expires_at timestamptz,
  status text check (status in ('pending','matched','confirmed','cancelled','expired')) default 'pending',
  created_at timestamptz default now()
);
alter table lesson_match_requests enable row level security;
create policy "Students manage own requests" on lesson_match_requests
  for all using (auth.uid() = student_id);
create policy "Instructors view pending requests" on lesson_match_requests
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'instructor')
  );
create policy "Instructors update requests" on lesson_match_requests
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'instructor')
  );

-- ── Instructor Surge Availability ────────────────────────────────
create table if not exists instructor_surge_availability (
  id uuid default uuid_generate_v4() primary key,
  instructor_id uuid references profiles(id) on delete cascade unique,
  active boolean default true,
  available_until timestamptz,
  created_at timestamptz default now()
);
alter table instructor_surge_availability enable row level security;
create policy "Instructors manage own availability" on instructor_surge_availability
  for all using (auth.uid() = instructor_id);
create policy "Students view instructor availability" on instructor_surge_availability
  for select using (auth.role() = 'authenticated');

-- ── Milestone Share Cards ─────────────────────────────────────────
create table if not exists milestone_cards (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade,
  milestone_type text not null,
  shared_at timestamptz,
  platform text,
  created_at timestamptz default now()
);
alter table milestone_cards enable row level security;
create policy "Students manage own milestones" on milestone_cards
  for all using (auth.uid() = student_id);

-- ── Friend connections ────────────────────────────────────────────
create table if not exists friend_connections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  friend_id uuid references profiles(id) on delete cascade,
  status text check (status in ('pending','accepted')) default 'pending',
  created_at timestamptz default now(),
  unique(user_id, friend_id)
);
alter table friend_connections enable row level security;
create policy "Users manage own connections" on friend_connections
  for all using (auth.uid() = user_id or auth.uid() = friend_id);

-- ── Duel records ─────────────────────────────────────────────────
create table if not exists friend_duels (
  id uuid default uuid_generate_v4() primary key,
  challenger_id uuid references profiles(id),
  opponent_id uuid references profiles(id),
  challenger_score int default 0,
  opponent_score int default 0,
  winner_id uuid references profiles(id),
  status text check (status in ('pending','active','completed')) default 'completed',
  played_at timestamptz default now()
);
alter table friend_duels enable row level security;
create policy "Users view own duels" on friend_duels
  for select using (auth.uid() = challenger_id or auth.uid() = opponent_id);
create policy "Users insert duels" on friend_duels
  for insert with check (auth.uid() = challenger_id);

-- ── Auto-expire lesson requests ───────────────────────────────────
create or replace function expire_lesson_requests()
returns void as $$
  update lesson_match_requests
  set status = 'expired'
  where status = 'pending'
  and expires_at < now();
$$ language sql security definer;

-- ── Update XP trigger for DriveCoins ─────────────────────────────
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

  insert into public.student_xp (student_id, xp_points, streak_days, drivecoin_balance, sim_hours)
  values (new.id, 0, 0, 0, 0)
  on conflict do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Done
select 'DriveLicenceLab v4 AI feature schema applied!' as result;
