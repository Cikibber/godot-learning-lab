-- Godot Learning Lab: core relational schema.
-- Every application table gets RLS in the next migration; this file defines
-- structure, bounds, and invariants that hold regardless of the caller.

create extension if not exists pgcrypto with schema extensions;

-- Helpers that RLS policies call live outside the PostgREST-exposed schema.
create schema if not exists private;

create type public.app_role as enum ('teacher', 'student');
create type public.locale_code as enum ('id', 'en');
create type public.enrollment_status as enum ('pending', 'approved', 'rejected', 'withdrawn');
create type public.assignment_kind as enum ('lesson', 'survey');
create type public.work_status as enum ('draft', 'submitted');
create type public.review_result as enum ('accepted', 'needs_revision');
create type public.proposal_result as enum ('approved', 'changes_requested');
create type public.milestone_kind as enum ('prototype', 'playable_loop', 'final');

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 60),
  role public.app_role not null default 'student',
  locale public.locale_code not null default 'id',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Role and display name come from app_metadata, which only the service role
-- (operator provisioning) can write. user_metadata is user-editable and is
-- deliberately ignored.
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_app_meta_data ->> 'display_name'), ''), 'Pengguna'),
    case when new.raw_app_meta_data ->> 'role' = 'teacher'
      then 'teacher'::public.app_role else 'student'::public.app_role end
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- The auth server may write app_metadata after the initial insert, and the
-- operator may later change a role. Only the service role can write
-- app_metadata, so syncing from it does not open a self-promotion path.
create function private.sync_user_meta() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set
    role = case when new.raw_app_meta_data ->> 'role' = 'teacher'
      then 'teacher'::public.app_role else 'student'::public.app_role end,
    display_name = coalesce(nullif(btrim(new.raw_app_meta_data ->> 'display_name'), ''), display_name),
    updated_at = now()
  where id = new.id;
  return new;
end $$;

create trigger on_auth_user_meta_changed after update of raw_app_meta_data on auth.users
  for each row when (old.raw_app_meta_data is distinct from new.raw_app_meta_data)
  execute function private.sync_user_meta();

-- ---------------------------------------------------------------------------
-- Classes and enrollment
-- ---------------------------------------------------------------------------
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null default auth.uid() references public.profiles (id),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  term text not null default '' check (char_length(term) <= 40),
  timezone text not null default 'Asia/Jakarta' check (char_length(timezone) between 1 and 64),
  archived_at timestamptz,
  created_at timestamptz not null default now()
);
create index classes_teacher_idx on public.classes (teacher_id);

-- Supervised school-computer sessions used for project scheduling (P11).
create table public.class_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  label text not null check (char_length(btrim(label)) between 1 and 80),
  notes text not null default '' check (char_length(notes) <= 300),
  created_at timestamptz not null default now()
);
create index class_sessions_class_idx on public.class_sessions (class_id);

create table public.class_invites (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  code_hash text not null unique check (char_length(code_hash) = 64),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  max_uses int not null default 60 check (max_uses between 1 and 200),
  uses int not null default 0 check (uses >= 0),
  created_at timestamptz not null default now()
);
create index class_invites_class_idx on public.class_invites (class_id);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  status public.enrollment_status not null default 'pending',
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (class_id, student_id)
);
create index enrollments_student_idx on public.enrollments (student_id);

create table private.code_redemption_attempts (
  user_id uuid not null,
  attempted_at timestamptz not null default now()
);
create index code_redemption_attempts_idx on private.code_redemption_attempts (user_id, attempted_at);

-- ---------------------------------------------------------------------------
-- Immutable content versions (seeded by migrations generated from content/)
-- ---------------------------------------------------------------------------
create table public.lesson_versions (
  id uuid primary key default gen_random_uuid(),
  lesson_key text not null check (lesson_key ~ '^[a-z0-9-]{1,40}$'),
  version int not null check (version > 0),
  module_no int not null check (module_no between 1 and 20),
  activity_kind text not null check (activity_kind in
    ('scene', 'movement', 'collision', 'input', 'signals', 'state', 'timer', 'loop')),
  content jsonb not null check (pg_column_size(content) <= 200000),
  created_at timestamptz not null default now(),
  unique (lesson_key, version)
);

create table public.survey_versions (
  id uuid primary key default gen_random_uuid(),
  survey_key text not null check (survey_key in ('readiness', 'project')),
  version int not null check (version > 0),
  content jsonb not null check (pg_column_size(content) <= 200000),
  created_at timestamptz not null default now(),
  unique (survey_key, version)
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  kind public.assignment_kind not null,
  lesson_version_id uuid references public.lesson_versions (id),
  survey_version_id uuid references public.survey_versions (id),
  position int not null default 0 check (position between 0 and 1000),
  published_at timestamptz,
  due_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    (kind = 'lesson' and lesson_version_id is not null and survey_version_id is null)
    or (kind = 'survey' and survey_version_id is not null and lesson_version_id is null)
  )
);
create index assignments_class_idx on public.assignments (class_id, position);

-- ---------------------------------------------------------------------------
-- Exercise attempts and reviews
-- ---------------------------------------------------------------------------
create table public.exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  previous_attempt_id uuid references public.exercise_attempts (id),
  attempt_no int not null default 1 check (attempt_no between 1 and 100),
  revision int not null default 0,
  status public.work_status not null default 'draft',
  mode text not null default 'canvas' check (mode in ('canvas', 'step')),
  evidence jsonb not null default '{}' check (pg_column_size(evidence) <= 65536),
  answers jsonb not null default '{}' check (pg_column_size(answers) <= 16384),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, student_id, attempt_no)
);
create unique index exercise_attempts_one_draft
  on public.exercise_attempts (assignment_id, student_id) where status = 'draft';
create index exercise_attempts_student_idx on public.exercise_attempts (student_id);

create table public.attempt_reviews (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.exercise_attempts (id) on delete cascade,
  teacher_id uuid not null default auth.uid() references public.profiles (id),
  result public.review_result not null,
  feedback text not null check (char_length(btrim(feedback)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index attempt_reviews_attempt_idx on public.attempt_reviews (attempt_id, created_at);

-- ---------------------------------------------------------------------------
-- Surveys
-- ---------------------------------------------------------------------------
create table public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  version int not null default 1 check (version between 1 and 50),
  revision int not null default 0,
  status public.work_status not null default 'draft',
  answers jsonb not null default '{}' check (pg_column_size(answers) <= 32768),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, student_id, version)
);
create unique index survey_responses_one_draft
  on public.survey_responses (assignment_id, student_id) where status = 'draft';
create index survey_responses_student_idx on public.survey_responses (student_id);

-- ---------------------------------------------------------------------------
-- Teams and project workflow
-- ---------------------------------------------------------------------------
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  size_exception_reason text check (size_exception_reason is null
    or char_length(btrim(size_exception_reason)) between 1 and 300),
  created_at timestamptz not null default now(),
  unique (id, class_id)
);
create index teams_class_idx on public.teams (class_id);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null,
  class_id uuid not null,
  student_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  foreign key (team_id, class_id) references public.teams (id, class_id) on delete cascade,
  check (left_at is null or left_at >= joined_at)
);
-- One active team per student per class.
create unique index team_members_one_active
  on public.team_members (class_id, student_id) where left_at is null;
create index team_members_team_idx on public.team_members (team_id) where left_at is null;
create index team_members_student_idx on public.team_members (student_id);

create table public.project_proposals (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  version int not null default 1 check (version between 1 and 50),
  revision int not null default 0,
  status public.work_status not null default 'draft',
  body jsonb not null default '{}' check (pg_column_size(body) <= 32768),
  submitted_at timestamptz,
  submitted_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, version)
);
create unique index project_proposals_one_draft
  on public.project_proposals (team_id) where status = 'draft';

create table public.proposal_reviews (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.project_proposals (id) on delete cascade,
  teacher_id uuid not null default auth.uid() references public.profiles (id),
  result public.proposal_result not null,
  feedback text not null check (char_length(btrim(feedback)) between 1 and 2000),
  created_at timestamptz not null default now(),
  unique (proposal_id)
);

create table public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  kind public.milestone_kind not null,
  version int not null default 1 check (version between 1 and 50),
  revision int not null default 0,
  status public.work_status not null default 'draft',
  body jsonb not null default '{}' check (pg_column_size(body) <= 16384),
  submitted_at timestamptz,
  submitted_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, kind, version)
);
create unique index project_milestones_one_draft
  on public.project_milestones (team_id, kind) where status = 'draft';

create table public.milestone_reviews (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references public.project_milestones (id) on delete cascade,
  teacher_id uuid not null default auth.uid() references public.profiles (id),
  result public.review_result not null,
  feedback text not null check (char_length(btrim(feedback)) between 1 and 2000),
  observation text not null default '' check (char_length(observation) <= 1000),
  created_at timestamptz not null default now(),
  unique (milestone_id)
);

create table public.contribution_statements (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  student_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  milestone_kind public.milestone_kind not null,
  body text not null check (char_length(btrim(body)) between 1 and 1500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, student_id, milestone_kind)
);

-- Rubric: 60 team points over four criteria, 40 individual points over three.
create table public.rubric_scores (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null,
  team_id uuid not null,
  student_id uuid references public.profiles (id) on delete cascade,
  criterion text not null,
  points numeric(5, 2) not null check (points >= 0),
  feedback text not null default '' check (char_length(feedback) <= 1000),
  teacher_id uuid not null default auth.uid() references public.profiles (id),
  updated_at timestamptz not null default now(),
  foreign key (team_id, class_id) references public.teams (id, class_id) on delete cascade,
  check (
    case criterion
      when 'core_loop' then student_id is null and points <= 20
      when 'godot_concepts' then student_id is null and points <= 15
      when 'scope_testing' then student_id is null and points <= 15
      when 'usability_assets' then student_id is null and points <= 10
      when 'individual_understanding' then student_id is not null and points <= 15
      when 'contribution' then student_id is not null and points <= 15
      when 'browser_practice' then student_id is not null and points <= 10
      else false
    end
  )
);
create unique index rubric_scores_subject
  on public.rubric_scores (team_id, coalesce(student_id, '00000000-0000-0000-0000-000000000000'::uuid), criterion);

-- ---------------------------------------------------------------------------
-- Minimal audit metadata (no bodies, no credentials)
-- ---------------------------------------------------------------------------
create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid,
  class_id uuid references public.classes (id) on delete cascade,
  action text not null check (char_length(action) <= 60),
  target_id uuid,
  created_at timestamptz not null default now()
);
create index audit_events_class_idx on public.audit_events (class_id, created_at desc);
