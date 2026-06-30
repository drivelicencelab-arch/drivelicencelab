-- ================================================================
-- DriveLicenceLab v5 — Admin Visibility Fix
-- Run in Supabase SQL Editor
-- ================================================================

-- ── Allow admins & system_admins to view ALL profiles ────────────
-- (needed so admin can see every signed-up student/instructor for enrollment & slot allocation)
drop policy if exists "Admins can view all profiles" on profiles;
drop policy if exists "Authenticated can read profiles" on profiles;

create policy "Admins view all profiles"
  on profiles for select
  using (
    auth.uid() = id
    or exists (
      select 1 from profiles me
      where me.id = auth.uid()
      and me.role in ('admin', 'system_admin', 'instructor')
    )
  );

-- ── Allow admins to view all enrollments (already exists, ensure correct) ─
drop policy if exists "Admins view all enrollments" on enrollments;
create policy "Admins view all enrollments"
  on enrollments for select
  using (
    auth.uid() = student_id
    or auth.uid() = instructor_id
    or exists (
      select 1 from profiles where id = auth.uid() and role in ('admin','system_admin')
    )
  );

-- ── Allow admins to insert/update enrollments for any student ────
drop policy if exists "Admins can manage enrollments" on enrollments;
create policy "Admins can manage enrollments"
  on enrollments for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','system_admin'))
  );

-- ── Allow admins to view & manage time_slots for their school ────
drop policy if exists "Admins can manage slots" on time_slots;
create policy "Admins can manage slots"
  on time_slots for all
  using (
    exists (
      select 1 from schools
      where schools.id = time_slots.school_id
      and schools.admin_id = auth.uid()
    )
    or exists (select 1 from profiles where id = auth.uid() and role = 'system_admin')
  );

-- Done
select 'DriveLicenceLab v5 — admin visibility fixed!' as result;
