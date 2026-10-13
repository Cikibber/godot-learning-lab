-- Invariant triggers. These run for every write path (server actions, direct
-- REST calls, SQL), so the rules hold even if the app layer is bypassed.

-- ---------------------------------------------------------------------------
-- Authorization helpers (SECURITY DEFINER to avoid RLS recursion; they only
-- answer questions about the *calling* user, never about arbitrary actors).
-- ---------------------------------------------------------------------------
create function private.is_teacher() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p
                 where p.id = (select auth.uid()) and p.role = 'teacher');
$$;

create function private.owns_class(p_class_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.classes c
                 where c.id = p_class_id and c.teacher_id = (select auth.uid()));
$$;

create function private.is_approved_student(p_class_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.enrollments e
                 where e.class_id = p_class_id and e.student_id = (select auth.uid())
                   and e.status = 'approved');
$$;

create function private.has_enrollment(p_class_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.enrollments e
                 where e.class_id = p_class_id and e.student_id = (select auth.uid())
                   and e.status in ('pending', 'approved'));
$$;

create function private.teacher_sees_student(p_student_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.enrollments e
                 join public.classes c on c.id = e.class_id
                 where e.student_id = p_student_id and c.teacher_id = (select auth.uid()));
$$;

create function private.class_of_assignment(p_assignment_id uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select a.class_id from public.assignments a where a.id = p_assignment_id;
$$;

create function private.class_of_team(p_team_id uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select t.class_id from public.teams t where t.id = p_team_id;
$$;

create function private.is_active_member(p_team_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.team_members m
                 where m.team_id = p_team_id and m.student_id = (select auth.uid())
                   and m.left_at is null);
$$;

-- Student can view a published assignment of an approved class.
create function private.can_view_assignment(p_assignment_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.assignments a
    join public.enrollments e on e.class_id = a.class_id
    where a.id = p_assignment_id and e.student_id = (select auth.uid())
      and e.status = 'approved' and a.published_at is not null and a.published_at <= now());
$$;

-- Student can still create or change work: published, open, class active.
create function private.can_work_on(p_assignment_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.assignments a
    join public.classes c on c.id = a.class_id
    join public.enrollments e on e.class_id = a.class_id
    where a.id = p_assignment_id and e.student_id = (select auth.uid())
      and e.status = 'approved' and a.published_at is not null and a.published_at <= now()
      and (a.closed_at is null or a.closed_at > now()) and c.archived_at is null);
$$;

create function private.content_visible(p_lesson uuid, p_survey uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.assignments a
    join public.enrollments e on e.class_id = a.class_id
    where (a.lesson_version_id = p_lesson or a.survey_version_id = p_survey)
      and e.student_id = (select auth.uid()) and e.status = 'approved'
      and a.published_at is not null and a.published_at <= now());
$$;

-- No end-user identity: operator tooling (service role) or a migration/seed.
-- The anon role has no table grants, so it never reaches these triggers.
create function private.is_service() returns boolean
language sql stable as $$
  select (select auth.uid()) is null;
$$;

-- ---------------------------------------------------------------------------
-- Audit helper
-- ---------------------------------------------------------------------------
create function private.audit(p_class uuid, p_action text, p_target uuid) returns void
language sql security definer set search_path = '' as $$
  insert into public.audit_events (actor_id, class_id, action, target_id)
  values ((select auth.uid()), p_class, p_action, p_target);
$$;

-- ---------------------------------------------------------------------------
-- Classes: teacher_id must be a teacher and cannot be reassigned.
-- ---------------------------------------------------------------------------
create function private.classes_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.teacher_id <> old.teacher_id then
    raise exception 'class owner cannot change' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = new.teacher_id and role = 'teacher') then
    raise exception 'class owner must be a teacher' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger classes_guard before insert or update on public.classes
  for each row execute function private.classes_guard();

-- ---------------------------------------------------------------------------
-- Enrollment decisions
-- ---------------------------------------------------------------------------
create function private.enrollments_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.class_id <> old.class_id or new.student_id <> old.student_id then
    raise exception 'enrollment identity is immutable' using errcode = '42501';
  end if;
  if new.status is distinct from old.status then
    new.decided_at := now();
    perform private.audit(new.class_id, 'enrollment.' || new.status::text, new.id);
    -- Leaving the class ends any active team membership.
    if new.status <> 'approved' then
      update public.team_members set left_at = now()
       where class_id = new.class_id and student_id = new.student_id and left_at is null;
    end if;
  end if;
  return new;
end $$;
create trigger enrollments_guard before update on public.enrollments
  for each row execute function private.enrollments_guard();

-- ---------------------------------------------------------------------------
-- Content versions are immutable once written.
-- ---------------------------------------------------------------------------
create function private.immutable_row() returns trigger
language plpgsql as $$
begin
  raise exception '% rows are immutable', tg_table_name using errcode = '42501';
end $$;
create trigger lesson_versions_immutable before update on public.lesson_versions
  for each row execute function private.immutable_row();
create trigger survey_versions_immutable before update on public.survey_versions
  for each row execute function private.immutable_row();
create trigger attempt_reviews_immutable before update on public.attempt_reviews
  for each row execute function private.immutable_row();
create trigger proposal_reviews_immutable before update on public.proposal_reviews
  for each row execute function private.immutable_row();
create trigger milestone_reviews_immutable before update on public.milestone_reviews
  for each row execute function private.immutable_row();

-- Assignment content reference cannot be swapped after creation.
create function private.assignments_guard() returns trigger
language plpgsql as $$
begin
  if new.class_id <> old.class_id or new.kind <> old.kind
     or new.lesson_version_id is distinct from old.lesson_version_id
     or new.survey_version_id is distinct from old.survey_version_id then
    raise exception 'assignment content is immutable' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger assignments_guard before update on public.assignments
  for each row execute function private.assignments_guard();

-- ---------------------------------------------------------------------------
-- Generic versioned-draft discipline (attempts, surveys, proposals, milestones)
-- ---------------------------------------------------------------------------
-- Validates submitted lesson evidence against the lesson's registered checks.
create function private.validate_evidence(p_assignment uuid, p_evidence jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_content jsonb;
  v_version int;
  v_bad int;
begin
  select lv.content, lv.version into v_content, v_version
    from public.assignments a join public.lesson_versions lv on lv.id = a.lesson_version_id
   where a.id = p_assignment;
  if v_content is null then
    raise exception 'assignment is not a lesson' using errcode = '22023';
  end if;
  if jsonb_typeof(p_evidence -> 'checkResults') <> 'array'
     or jsonb_array_length(p_evidence -> 'checkResults') > 20
     or (p_evidence ->> 'contentVersion')::int is distinct from v_version
     or jsonb_typeof(p_evidence -> 'summary') <> 'object' then
    raise exception 'invalid evidence structure' using errcode = '22023';
  end if;
  select count(*) into v_bad
    from jsonb_array_elements(p_evidence -> 'checkResults') r
   where jsonb_typeof(r -> 'passed') <> 'boolean'
      or not (v_content -> 'checks') ? (r ->> 'id');
  if v_bad > 0 then
    raise exception 'unregistered check id' using errcode = '22023';
  end if;
end $$;

create function private.attempts_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_prev record;
begin
  if tg_op = 'INSERT' then
    if not private.is_service() then
      new.student_id := (select auth.uid());
    end if;
    new.status := 'draft';
    new.revision := 0;
    new.submitted_at := null;
    select coalesce(max(attempt_no), 0) + 1 into new.attempt_no
      from public.exercise_attempts
     where assignment_id = new.assignment_id and student_id = new.student_id;
    if new.previous_attempt_id is not null then
      select * into v_prev from public.exercise_attempts where id = new.previous_attempt_id;
      if v_prev.student_id is distinct from new.student_id
         or v_prev.assignment_id is distinct from new.assignment_id
         or v_prev.status <> 'submitted' then
        raise exception 'invalid previous attempt' using errcode = '42501';
      end if;
    end if;
    return new;
  end if;
  -- UPDATE
  if old.status = 'submitted' then
    raise exception 'submitted attempts are immutable' using errcode = '42501';
  end if;
  if new.student_id <> old.student_id or new.assignment_id <> old.assignment_id
     or new.attempt_no <> old.attempt_no
     or new.previous_attempt_id is distinct from old.previous_attempt_id then
    raise exception 'attempt identity is immutable' using errcode = '42501';
  end if;
  if new.status = 'submitted' then
    perform private.validate_evidence(new.assignment_id, new.evidence);
    new.submitted_at := now();
  end if;
  new.revision := old.revision + 1;
  new.updated_at := now();
  return new;
end $$;
create trigger attempts_guard before insert or update on public.exercise_attempts
  for each row execute function private.attempts_guard();

create function private.attempt_reviews_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_attempt record; v_class uuid;
begin
  if not private.is_service() then new.teacher_id := (select auth.uid()); end if;
  select * into v_attempt from public.exercise_attempts where id = new.attempt_id;
  if v_attempt.status is distinct from 'submitted' then
    raise exception 'only submitted attempts can be reviewed' using errcode = '22023';
  end if;
  v_class := private.class_of_assignment(v_attempt.assignment_id);
  perform private.audit(v_class, 'attempt.review.' || new.result::text, new.attempt_id);
  return new;
end $$;
create trigger attempt_reviews_guard before insert on public.attempt_reviews
  for each row execute function private.attempt_reviews_guard();

create function private.survey_responses_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if not private.is_service() then new.student_id := (select auth.uid()); end if;
    new.status := 'draft';
    new.revision := 0;
    new.submitted_at := null;
    select coalesce(max(version), 0) + 1 into new.version
      from public.survey_responses
     where assignment_id = new.assignment_id and student_id = new.student_id;
    return new;
  end if;
  if old.status = 'submitted' then
    raise exception 'submitted responses are immutable' using errcode = '42501';
  end if;
  if new.student_id <> old.student_id or new.assignment_id <> old.assignment_id
     or new.version <> old.version then
    raise exception 'response identity is immutable' using errcode = '42501';
  end if;
  if new.status = 'submitted' then new.submitted_at := now(); end if;
  new.revision := old.revision + 1;
  new.updated_at := now();
  return new;
end $$;
create trigger survey_responses_guard before insert or update on public.survey_responses
  for each row execute function private.survey_responses_guard();

-- ---------------------------------------------------------------------------
-- Team membership: capacity and class rules hold under concurrency because the
-- parent team row is locked inside the inserting transaction.
-- ---------------------------------------------------------------------------
create function private.team_members_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_class uuid; v_count int;
begin
  if tg_op = 'UPDATE' then
    if new.team_id <> old.team_id or new.class_id <> old.class_id
       or new.student_id <> old.student_id or new.joined_at <> old.joined_at then
      raise exception 'membership identity is immutable' using errcode = '42501';
    end if;
    if old.left_at is not null then
      raise exception 'historical membership is immutable' using errcode = '42501';
    end if;
    if new.left_at is not null then
      perform private.audit(new.class_id, 'team.member.remove', new.team_id);
    end if;
    return new;
  end if;

  select class_id into v_class from public.teams where id = new.team_id for update;
  if v_class is null or v_class <> new.class_id then
    raise exception 'team/class mismatch' using errcode = '22023';
  end if;
  if not exists (select 1 from public.enrollments
                  where class_id = new.class_id and student_id = new.student_id
                    and status = 'approved') then
    raise exception 'student is not approved in this class' using errcode = '22023';
  end if;
  select count(*) into v_count from public.team_members
   where team_id = new.team_id and left_at is null;
  if v_count >= 4 then
    raise exception 'team is full (maximum four members)' using errcode = '23514';
  end if;
  new.joined_at := now();
  new.left_at := null;
  perform private.audit(new.class_id, 'team.member.add', new.team_id);
  return new;
end $$;
create trigger team_members_guard before insert or update on public.team_members
  for each row execute function private.team_members_guard();

create function private.teams_guard() returns trigger
language plpgsql as $$
begin
  if new.class_id <> old.class_id then
    raise exception 'team class is immutable' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger teams_guard before update on public.teams
  for each row execute function private.teams_guard();

-- ---------------------------------------------------------------------------
-- Proposals: versioned; submit requires 3-4 active members or a recorded
-- teacher exception; a new draft is only allowed after changes are requested.
-- ---------------------------------------------------------------------------
create function private.proposals_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_latest record; v_review public.proposal_result; v_count int; v_exception text;
begin
  if tg_op = 'INSERT' then
    select * into v_latest from public.project_proposals
     where team_id = new.team_id order by version desc limit 1;
    if found then
      if v_latest.status = 'draft' then
        raise exception 'a draft already exists' using errcode = '23505';
      end if;
      select result into v_review from public.proposal_reviews where proposal_id = v_latest.id;
      if v_review is distinct from 'changes_requested' then
        raise exception 'previous version is awaiting review or approved' using errcode = '22023';
      end if;
    end if;
    new.version := coalesce(v_latest.version, 0) + 1;
    new.status := 'draft';
    new.revision := 0;
    new.submitted_at := null;
    new.submitted_by := null;
    return new;
  end if;
  if old.status = 'submitted' then
    raise exception 'submitted proposals are immutable' using errcode = '42501';
  end if;
  if new.team_id <> old.team_id or new.version <> old.version then
    raise exception 'proposal identity is immutable' using errcode = '42501';
  end if;
  if new.status = 'submitted' then
    select count(*) into v_count from public.team_members
     where team_id = new.team_id and left_at is null;
    select size_exception_reason into v_exception from public.teams where id = new.team_id;
    if v_count not between 3 and 4 and v_exception is null then
      raise exception 'team must have three or four members to submit' using errcode = '23514';
    end if;
    new.submitted_at := now();
    new.submitted_by := (select auth.uid());
  end if;
  new.revision := old.revision + 1;
  new.updated_at := now();
  return new;
end $$;
create trigger proposals_guard before insert or update on public.project_proposals
  for each row execute function private.proposals_guard();

create function private.proposal_reviews_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_p record; v_max int;
begin
  if not private.is_service() then new.teacher_id := (select auth.uid()); end if;
  select * into v_p from public.project_proposals where id = new.proposal_id;
  select max(version) into v_max from public.project_proposals where team_id = v_p.team_id;
  if v_p.status <> 'submitted' or v_p.version <> v_max then
    raise exception 'only the latest submitted version can be reviewed' using errcode = '22023';
  end if;
  perform private.audit(private.class_of_team(v_p.team_id), 'proposal.' || new.result::text, new.proposal_id);
  return new;
end $$;
create trigger proposal_reviews_guard before insert on public.proposal_reviews
  for each row execute function private.proposal_reviews_guard();

create function private.milestones_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_latest record; v_review public.review_result;
begin
  if tg_op = 'INSERT' then
    if not exists (select 1 from public.project_proposals p
                   join public.proposal_reviews r on r.proposal_id = p.id
                   where p.team_id = new.team_id and r.result = 'approved') then
      raise exception 'proposal must be approved before milestones' using errcode = '22023';
    end if;
    select * into v_latest from public.project_milestones
     where team_id = new.team_id and kind = new.kind order by version desc limit 1;
    if found then
      if v_latest.status = 'draft' then
        raise exception 'a draft already exists' using errcode = '23505';
      end if;
      select result into v_review from public.milestone_reviews where milestone_id = v_latest.id;
      if v_review is distinct from 'needs_revision' then
        raise exception 'previous version is awaiting review or accepted' using errcode = '22023';
      end if;
    end if;
    new.version := coalesce(v_latest.version, 0) + 1;
    new.status := 'draft';
    new.revision := 0;
    new.submitted_at := null;
    new.submitted_by := null;
    return new;
  end if;
  if old.status = 'submitted' then
    raise exception 'submitted milestones are immutable' using errcode = '42501';
  end if;
  if new.team_id <> old.team_id or new.kind <> old.kind or new.version <> old.version then
    raise exception 'milestone identity is immutable' using errcode = '42501';
  end if;
  if new.status = 'submitted' then
    new.submitted_at := now();
    new.submitted_by := (select auth.uid());
  end if;
  new.revision := old.revision + 1;
  new.updated_at := now();
  return new;
end $$;
create trigger milestones_guard before insert or update on public.project_milestones
  for each row execute function private.milestones_guard();

create function private.milestone_reviews_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_m record; v_max int;
begin
  if not private.is_service() then new.teacher_id := (select auth.uid()); end if;
  select * into v_m from public.project_milestones where id = new.milestone_id;
  select max(version) into v_max from public.project_milestones
   where team_id = v_m.team_id and kind = v_m.kind;
  if v_m.status <> 'submitted' or v_m.version <> v_max then
    raise exception 'only the latest submitted version can be reviewed' using errcode = '22023';
  end if;
  perform private.audit(private.class_of_team(v_m.team_id), 'milestone.' || new.result::text, new.milestone_id);
  return new;
end $$;
create trigger milestone_reviews_guard before insert on public.milestone_reviews
  for each row execute function private.milestone_reviews_guard();

create function private.contributions_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_service() then new.student_id := (select auth.uid()); end if;
  if tg_op = 'UPDATE' and (new.team_id <> old.team_id or new.student_id <> old.student_id
     or new.milestone_kind <> old.milestone_kind) then
    raise exception 'contribution identity is immutable' using errcode = '42501';
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger contributions_guard before insert or update on public.contribution_statements
  for each row execute function private.contributions_guard();

-- Individual scores must belong to someone who was (or is) on that team.
create function private.rubric_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_service() then new.teacher_id := (select auth.uid()); end if;
  if new.student_id is not null and not exists (
      select 1 from public.team_members
       where team_id = new.team_id and student_id = new.student_id) then
    raise exception 'student was never on this team' using errcode = '22023';
  end if;
  new.updated_at := now();
  perform private.audit(new.class_id, 'rubric.score', new.team_id);
  return new;
end $$;
create trigger rubric_guard before insert or update on public.rubric_scores
  for each row execute function private.rubric_guard();
