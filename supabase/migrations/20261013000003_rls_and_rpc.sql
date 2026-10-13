-- Row level security, least-privilege grants, and narrow RPCs.

-- ---------------------------------------------------------------------------
-- Grants: start from nothing, then add exactly what each role needs.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from public, anon, authenticated;
alter default privileges for role postgres in schema private revoke all on functions from public, anon, authenticated;

grant usage on schema private to authenticated;
grant execute on all functions in schema private to authenticated;

grant select on public.profiles to authenticated;
grant update (display_name, locale) on public.profiles to authenticated;

grant select, insert on public.classes to authenticated;
grant update (name, term, timezone, archived_at) on public.classes to authenticated;
grant select, insert, delete on public.class_sessions to authenticated;
grant update (label, notes) on public.class_sessions to authenticated;
grant select on public.class_invites to authenticated;
grant update (revoked_at) on public.class_invites to authenticated;
grant select on public.enrollments to authenticated;
grant update (status) on public.enrollments to authenticated;

grant select on public.lesson_versions, public.survey_versions to authenticated;
grant select, insert on public.assignments to authenticated;
grant update (position, published_at, due_at, closed_at) on public.assignments to authenticated;

grant select on public.exercise_attempts to authenticated;
grant insert (assignment_id, previous_attempt_id, mode, evidence, answers) on public.exercise_attempts to authenticated;
grant update (mode, evidence, answers, status) on public.exercise_attempts to authenticated;
grant select on public.attempt_reviews to authenticated;
grant insert (attempt_id, result, feedback) on public.attempt_reviews to authenticated;

grant select on public.survey_responses to authenticated;
grant insert (assignment_id, answers) on public.survey_responses to authenticated;
grant update (answers, status) on public.survey_responses to authenticated;

grant select on public.teams to authenticated; -- no delete: membership history must survive
grant insert (class_id, name, size_exception_reason) on public.teams to authenticated;
grant update (name, size_exception_reason) on public.teams to authenticated;
grant select on public.team_members to authenticated;
grant insert (team_id, class_id, student_id) on public.team_members to authenticated;
grant update (left_at) on public.team_members to authenticated;

grant select on public.project_proposals to authenticated;
grant insert (team_id, body) on public.project_proposals to authenticated;
grant update (body, status) on public.project_proposals to authenticated;
grant select on public.proposal_reviews to authenticated;
grant insert (proposal_id, result, feedback) on public.proposal_reviews to authenticated;

grant select on public.project_milestones to authenticated;
grant insert (team_id, kind, body) on public.project_milestones to authenticated;
grant update (body, status) on public.project_milestones to authenticated;
grant select on public.milestone_reviews to authenticated;
grant insert (milestone_id, result, feedback, observation) on public.milestone_reviews to authenticated;

grant select on public.contribution_statements to authenticated;
grant insert (team_id, milestone_kind, body) on public.contribution_statements to authenticated;
grant update (body) on public.contribution_statements to authenticated;

grant select on public.rubric_scores to authenticated;
grant insert (class_id, team_id, student_id, criterion, points, feedback) on public.rubric_scores to authenticated;
grant update (points, feedback) on public.rubric_scores to authenticated;

grant select on public.audit_events to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_sessions enable row level security;
alter table public.class_invites enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_versions enable row level security;
alter table public.survey_versions enable row level security;
alter table public.assignments enable row level security;
alter table public.exercise_attempts enable row level security;
alter table public.attempt_reviews enable row level security;
alter table public.survey_responses enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.project_proposals enable row level security;
alter table public.proposal_reviews enable row level security;
alter table public.project_milestones enable row level security;
alter table public.milestone_reviews enable row level security;
alter table public.contribution_statements enable row level security;
alter table public.rubric_scores enable row level security;
alter table public.audit_events enable row level security;
alter table private.code_redemption_attempts enable row level security;

-- Profiles ------------------------------------------------------------------
create policy profiles_self_read on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy profiles_teacher_read on public.profiles for select to authenticated
  using (private.teacher_sees_student(id));
create policy profiles_self_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Classes -------------------------------------------------------------------
create policy classes_teacher_all on public.classes for select to authenticated
  using (teacher_id = (select auth.uid()));
create policy classes_teacher_insert on public.classes for insert to authenticated
  with check (teacher_id = (select auth.uid()) and private.is_teacher());
create policy classes_teacher_update on public.classes for update to authenticated
  using (teacher_id = (select auth.uid())) with check (teacher_id = (select auth.uid()));
create policy classes_student_read on public.classes for select to authenticated
  using (private.has_enrollment(id));

create policy sessions_teacher on public.class_sessions for all to authenticated
  using (private.owns_class(class_id)) with check (private.owns_class(class_id));
create policy sessions_student_read on public.class_sessions for select to authenticated
  using (private.is_approved_student(class_id));

-- Invites: teacher metadata only; students never read invites.
create policy invites_teacher_read on public.class_invites for select to authenticated
  using (private.owns_class(class_id));
create policy invites_teacher_revoke on public.class_invites for update to authenticated
  using (private.owns_class(class_id)) with check (private.owns_class(class_id));

-- Enrollments: students read own; creation only through redeem_class_code().
create policy enrollments_student_read on public.enrollments for select to authenticated
  using (student_id = (select auth.uid()));
create policy enrollments_teacher_read on public.enrollments for select to authenticated
  using (private.owns_class(class_id));
create policy enrollments_teacher_decide on public.enrollments for update to authenticated
  using (private.owns_class(class_id)) with check (private.owns_class(class_id));

-- Content -------------------------------------------------------------------
create policy lesson_versions_teacher on public.lesson_versions for select to authenticated
  using (private.is_teacher());
create policy lesson_versions_student on public.lesson_versions for select to authenticated
  using (private.content_visible(id, null));
create policy survey_versions_teacher on public.survey_versions for select to authenticated
  using (private.is_teacher());
create policy survey_versions_student on public.survey_versions for select to authenticated
  using (private.content_visible(null, id));

create policy assignments_teacher_read on public.assignments for select to authenticated
  using (private.owns_class(class_id));
create policy assignments_teacher_insert on public.assignments for insert to authenticated
  with check (private.owns_class(class_id));
create policy assignments_teacher_update on public.assignments for update to authenticated
  using (private.owns_class(class_id)) with check (private.owns_class(class_id));
create policy assignments_student_read on public.assignments for select to authenticated
  using (private.can_view_assignment(id));

-- Attempts ------------------------------------------------------------------
create policy attempts_student_read on public.exercise_attempts for select to authenticated
  using (student_id = (select auth.uid()));
create policy attempts_student_insert on public.exercise_attempts for insert to authenticated
  with check (student_id = (select auth.uid()) and private.can_work_on(assignment_id));
create policy attempts_student_update on public.exercise_attempts for update to authenticated
  using (student_id = (select auth.uid()) and status = 'draft')
  with check (student_id = (select auth.uid()) and private.can_work_on(assignment_id));
create policy attempts_teacher_read on public.exercise_attempts for select to authenticated
  using (private.owns_class(private.class_of_assignment(assignment_id)));

create policy attempt_reviews_teacher_read on public.attempt_reviews for select to authenticated
  using (exists (select 1 from public.exercise_attempts a
                 where a.id = attempt_id
                   and private.owns_class(private.class_of_assignment(a.assignment_id))));
create policy attempt_reviews_teacher_insert on public.attempt_reviews for insert to authenticated
  with check (exists (select 1 from public.exercise_attempts a
                      where a.id = attempt_id
                        and private.owns_class(private.class_of_assignment(a.assignment_id))));
create policy attempt_reviews_student_read on public.attempt_reviews for select to authenticated
  using (exists (select 1 from public.exercise_attempts a
                 where a.id = attempt_id and a.student_id = (select auth.uid())));

-- Surveys -------------------------------------------------------------------
create policy responses_student_read on public.survey_responses for select to authenticated
  using (student_id = (select auth.uid()));
create policy responses_student_insert on public.survey_responses for insert to authenticated
  with check (student_id = (select auth.uid()) and private.can_work_on(assignment_id));
create policy responses_student_update on public.survey_responses for update to authenticated
  using (student_id = (select auth.uid()) and status = 'draft')
  with check (student_id = (select auth.uid()) and private.can_work_on(assignment_id));
create policy responses_teacher_read on public.survey_responses for select to authenticated
  using (private.owns_class(private.class_of_assignment(assignment_id)));

-- Teams ---------------------------------------------------------------------
create policy teams_teacher on public.teams for all to authenticated
  using (private.owns_class(class_id)) with check (private.owns_class(class_id));
create policy teams_member_read on public.teams for select to authenticated
  using (private.is_active_member(id));

create policy team_members_teacher_read on public.team_members for select to authenticated
  using (private.owns_class(class_id));
create policy team_members_teacher_insert on public.team_members for insert to authenticated
  with check (private.owns_class(class_id));
create policy team_members_teacher_update on public.team_members for update to authenticated
  using (private.owns_class(class_id)) with check (private.owns_class(class_id));
create policy team_members_member_read on public.team_members for select to authenticated
  using (left_at is null and private.is_active_member(team_id));

-- Proposals / milestones: active members collaborate, owning teacher reviews.
create policy proposals_teacher_read on public.project_proposals for select to authenticated
  using (private.owns_class(private.class_of_team(team_id)));
create policy proposals_member_read on public.project_proposals for select to authenticated
  using (private.is_active_member(team_id));
create policy proposals_member_insert on public.project_proposals for insert to authenticated
  with check (private.is_active_member(team_id));
create policy proposals_member_update on public.project_proposals for update to authenticated
  using (private.is_active_member(team_id) and status = 'draft')
  with check (private.is_active_member(team_id));

create policy proposal_reviews_teacher_read on public.proposal_reviews for select to authenticated
  using (exists (select 1 from public.project_proposals p where p.id = proposal_id
                 and private.owns_class(private.class_of_team(p.team_id))));
create policy proposal_reviews_teacher_insert on public.proposal_reviews for insert to authenticated
  with check (exists (select 1 from public.project_proposals p where p.id = proposal_id
                      and private.owns_class(private.class_of_team(p.team_id))));
create policy proposal_reviews_member_read on public.proposal_reviews for select to authenticated
  using (exists (select 1 from public.project_proposals p where p.id = proposal_id
                 and private.is_active_member(p.team_id)));

create policy milestones_teacher_read on public.project_milestones for select to authenticated
  using (private.owns_class(private.class_of_team(team_id)));
create policy milestones_member_read on public.project_milestones for select to authenticated
  using (private.is_active_member(team_id));
create policy milestones_member_insert on public.project_milestones for insert to authenticated
  with check (private.is_active_member(team_id));
create policy milestones_member_update on public.project_milestones for update to authenticated
  using (private.is_active_member(team_id) and status = 'draft')
  with check (private.is_active_member(team_id));

create policy milestone_reviews_teacher_read on public.milestone_reviews for select to authenticated
  using (exists (select 1 from public.project_milestones m where m.id = milestone_id
                 and private.owns_class(private.class_of_team(m.team_id))));
create policy milestone_reviews_teacher_insert on public.milestone_reviews for insert to authenticated
  with check (exists (select 1 from public.project_milestones m where m.id = milestone_id
                      and private.owns_class(private.class_of_team(m.team_id))));
create policy milestone_reviews_member_read on public.milestone_reviews for select to authenticated
  using (exists (select 1 from public.project_milestones m where m.id = milestone_id
                 and private.is_active_member(m.team_id)));

-- Contributions: private to the author and the owning teacher.
create policy contributions_self on public.contribution_statements for select to authenticated
  using (student_id = (select auth.uid()));
create policy contributions_self_insert on public.contribution_statements for insert to authenticated
  with check (student_id = (select auth.uid()) and private.is_active_member(team_id));
create policy contributions_self_update on public.contribution_statements for update to authenticated
  using (student_id = (select auth.uid()) and private.is_active_member(team_id))
  with check (student_id = (select auth.uid()) and private.is_active_member(team_id));
create policy contributions_teacher_read on public.contribution_statements for select to authenticated
  using (private.owns_class(private.class_of_team(team_id)));

-- Rubric: students see their own individual scores and their team's team scores.
create policy rubric_teacher on public.rubric_scores for all to authenticated
  using (private.owns_class(class_id)) with check (private.owns_class(class_id));
create policy rubric_student_individual on public.rubric_scores for select to authenticated
  using (student_id = (select auth.uid()));
create policy rubric_student_team on public.rubric_scores for select to authenticated
  using (student_id is null and private.is_active_member(team_id));

create policy audit_teacher_read on public.audit_events for select to authenticated
  using (private.owns_class(class_id));

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------
-- Class code: high-entropy, unambiguous alphabet, stored only as SHA-256.
create function private.hash_code(p_code text) returns text
language sql immutable set search_path = '' as $$
  select encode(extensions.digest(upper(regexp_replace(p_code, '[^A-Za-z0-9]', '', 'g')), 'sha256'), 'hex');
$$;

create function public.rotate_class_code(p_class_id uuid, p_days int default 14, p_max_uses int default 60)
returns text
language plpgsql security invoker set search_path = '' as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_bytes bytea := extensions.gen_random_bytes(10);
  v_code text := '';
begin
  if not private.owns_class(p_class_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_days not between 1 and 90 or p_max_uses not between 1 and 200 then
    raise exception 'invalid invite limits' using errcode = '22023';
  end if;
  for i in 0..9 loop
    v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, i) % 32) + 1, 1);
  end loop;
  update public.class_invites set revoked_at = now()
   where class_id = p_class_id and revoked_at is null;
  -- Inserting requires bypassing the (absent) teacher insert grant: done via
  -- a definer helper that re-checks ownership.
  perform private.insert_invite(p_class_id, private.hash_code(v_code), now() + make_interval(days => p_days), p_max_uses);
  perform private.audit(p_class_id, 'invite.rotate', p_class_id);
  return substr(v_code, 1, 5) || '-' || substr(v_code, 6, 5);
end $$;

create function private.insert_invite(p_class uuid, p_hash text, p_expires timestamptz, p_max int)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.owns_class(p_class) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  insert into public.class_invites (class_id, code_hash, expires_at, max_uses)
  values (p_class, p_hash, p_expires, p_max);
end $$;

-- Redemption: authenticated students only; rate-limited; generic result; it
-- only ever creates a *pending* request that the teacher must approve.
create function public.redeem_class_code(p_code text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_invite record;
  v_recent int;
begin
  if v_uid is null or not exists (select 1 from public.profiles where id = v_uid and role = 'student') then
    return false;
  end if;
  select count(*) into v_recent from private.code_redemption_attempts
   where user_id = v_uid and attempted_at > now() - interval '15 minutes';
  if v_recent >= 10 then
    return false;
  end if;
  insert into private.code_redemption_attempts (user_id) values (v_uid);
  if p_code is null or char_length(p_code) > 20 then
    return false;
  end if;

  select i.* into v_invite from public.class_invites i
    join public.classes c on c.id = i.class_id
   where i.code_hash = private.hash_code(p_code)
     and i.revoked_at is null and i.expires_at > now() and i.uses < i.max_uses
     and c.archived_at is null
   for update of i;
  if not found then
    return false;
  end if;

  insert into public.enrollments (class_id, student_id, status)
  values (v_invite.class_id, v_uid, 'pending')
  on conflict (class_id, student_id) do nothing;
  if found then
    update public.class_invites set uses = uses + 1 where id = v_invite.id;
    perform private.audit(v_invite.class_id, 'enrollment.request', v_uid);
  end if;
  return true;
end $$;

-- Minimal display names of approved classmates (for team preferences and
-- team rosters). Never returns emails or private data.
create function public.class_roster_names(p_class_id uuid)
returns table (student_id uuid, display_name text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.display_name
    from public.enrollments e join public.profiles p on p.id = e.student_id
   where e.class_id = p_class_id and e.status = 'approved'
     and (private.owns_class(p_class_id) or private.is_approved_student(p_class_id))
   order by p.display_name;
$$;

create function public.team_roster(p_team_id uuid)
returns table (student_id uuid, display_name text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.display_name
    from public.team_members m join public.profiles p on p.id = m.student_id
   where m.team_id = p_team_id and m.left_at is null
     and (private.owns_class(m.class_id) or private.is_active_member(p_team_id))
   order by p.display_name;
$$;

-- Export metadata log with a simple rate limit; bodies are never stored.
create function public.log_export(p_class_id uuid, p_kind text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_recent int;
begin
  if not private.owns_class(p_class_id) or p_kind !~ '^[a-z_]{1,30}$' then
    return false;
  end if;
  select count(*) into v_recent from public.audit_events
   where actor_id = (select auth.uid()) and action like 'export.%'
     and created_at > now() - interval '1 hour';
  if v_recent >= 30 then
    return false;
  end if;
  perform private.audit(p_class_id, 'export.' || p_kind, p_class_id);
  return true;
end $$;

revoke all on function public.rotate_class_code(uuid, int, int) from public, anon;
revoke all on function public.redeem_class_code(text) from public, anon;
revoke all on function public.class_roster_names(uuid) from public, anon;
revoke all on function public.team_roster(uuid) from public, anon;
revoke all on function public.log_export(uuid, text) from public, anon;
grant execute on function public.rotate_class_code(uuid, int, int) to authenticated;
grant execute on function public.redeem_class_code(text) to authenticated;
grant execute on function public.class_roster_names(uuid) to authenticated;
grant execute on function public.team_roster(uuid) to authenticated;
grant execute on function public.log_export(uuid, text) to authenticated;
-- Private helpers are callable by policies but the schema is not exposed by
-- the Data API; re-assert execute after creating the new ones above.
grant execute on all functions in schema private to authenticated;
