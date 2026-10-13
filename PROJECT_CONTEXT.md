# Godot Learning Lab — Project Context

**Status:** implementation-ready product baseline, subject to classroom pilot validation  
**Prepared:** 13 October 2026  
**Language:** this specification is English; the product defaults to Bahasa Indonesia, with English available  
**Chosen direction:** Option A — lightweight browser lessons and practical exercises; final games made in the real Godot 4 editor on capable or shared school computers

## 1. Vision and educational promise

Godot Learning Lab helps high school beginners learn game development even when their personal laptops struggle to run the Godot editor. Students learn authentic Godot vocabulary and development habits through short explanations, playable browser activities, structured practice, reflection, and teacher feedback. They then transfer those skills to Godot 4 and create a small 2D game in teams of three or four.

The browser is a teaching environment, not a replacement game engine. A successful semester ends with students explaining their design decisions and demonstrating a working game created in real Godot. A successful MVP makes one teacher's class run reliably, makes progress visible, and produces useful project proposals without overwhelming the teacher with authoring tools.

**Product promise:** “Practice game development on your laptop. Build your final game together in Godot.”

### Outcomes and evidence

| Outcome | Evidence | Pilot target, not an existing result |
|---|---|---|
| More students can participate | Completion and failure logs on representative school laptops | At least 90% complete a core exercise without a crash or forced reload |
| Concepts transfer to Godot | Individual editor task and explanation | At least 80% correctly connect a browser concept to its Godot node/API |
| Teachers can intervene early | Dashboard and student reflections | Teacher identifies stalled students during one lesson |
| Teams finish realistic projects | Scope approval, milestone records, final demonstration | Each approved team delivers a playable Godot prototype with one complete game loop |
| Participation is equitable | Individual evidence and device access plan | Every student completes a hands-on Godot task and records a contribution |

These are pilot hypotheses. Report denominators and missing data; do not imply causation from completion rates alone.

## 2. Problem, context, and constraints

The teacher currently teaches introductory game development with Godot. Low-end student laptops crash or become slow during practical editor work. Lost time makes it harder to teach fundamentals, evaluate understanding, and organize a semester project. Students also need help selecting achievable ideas and collaborating in groups of three or four.

Constraints:

- Browser activities must work on modest laptops without installing Godot, downloading a large engine, or depending on WebGL.
- Capable or shared school computers must be available for actual Godot work. Their availability is a prerequisite for the promised final outcome.
- The school may have unreliable internet. The initial product tolerates short interruptions; full offline operation is outside MVP.
- Lessons teach Godot 4 concepts, not generic web programming disguised as Godot.
- Students are minors. Collect only educationally necessary data, control access, and agree on school handling and retention before production.
- Bahasa Indonesia is the default interface. Godot node names, API identifiers, and GDScript keywords remain unchanged in both languages.
- The initial operator is a teacher or a small school program; operations must be affordable and understandable.
- The MVP is for 2D beginner games. Keep input, visuals, physics, and project scope deliberately simple.
- A 12-week teaching plan is a configurable template, not a fixed semester requirement.

### Planning assumptions to validate

One school pilot; one to three classes; roughly 30–40 students per class; one concurrent classroom of 40 learners; one main teacher; lessons of 60–90 minutes. Hardware test starting point: dual-core laptop, 4 GB RAM, integrated graphics, 1366×768 screen, and a currently supported Chrome, Edge, or Firefox. These are test assumptions, not minimum specifications certified by testing.

The school approves account identities and can provide school-issued email or school-controlled aliases for student authentication. Public self-registration is disabled. If the school cannot support that model, settle an alternative managed authentication design before live rollout; do not silently issue fake addresses, expose credentials, or remove authorization.

## 3. Stakeholders and personas

| Persona | Needs | Product implications |
|---|---|---|
| Beginner student with a slow laptop | Quick success, clear instructions, recoverable mistakes | Lightweight activities, presets, hints, visible controls, retry without penalty |
| Student who enjoys playing games but has never built one | Understand realistic scope and development roles | Short examples, genre survey, one-loop project template |
| Student with accessibility or connectivity needs | Equivalent ways to learn and submit evidence | Semantic controls, text alternatives, reduced motion, connection status |
| Teacher | Assign lessons, identify misunderstandings, approve groups and scope | Classroom dashboard, first-party surveys, structured feedback and exports |
| School operator | Safe access and manageable hosting | Provision teachers, approve identity policy, rotate secrets, restore backups |
| Parent/guardian or school safeguarding contact | Appropriate data use and supervision | Plain privacy notice, school-defined contact and consent process where applicable |

MVP application roles are **teacher** and **student**. Operator administration happens through documented restricted operational procedures, not a third in-app role with a large admin portal.

## 4. Scope and non-goals

### MVP commitments

1. Invite-only authentication, teacher/student roles, class roster, teacher-issued enrollment codes, and enrollment approval.
2. Localized responsive student home, lesson reader, progress overview, and teacher dashboard.
3. Eight seeded modules with eight real Canvas activities, configurable class assignment and due dates, text/pseudocode questions, and short reflections.
4. Draft/save/submit attempts, deterministic activity checks, transparent hints, and teacher review of conceptual responses.
5. Two structured surveys with editable student drafts, explicit submission, teacher-readable responses, and practical aggregates.
6. Teacher-approved teams of three or four, team preference collection, capacity checks, and one final project proposal per team.
7. Three project milestones, teacher feedback, final demonstration record, individual contribution statements, and manual rubric scores.
8. Pseudonymous class exports, privacy notice, accessibility support, error states, deployment guide, migrations, and sample data.

Teacher controls schedule, visibility, due dates, feedback, team membership, and project approval. Seeded lesson content is edited in reviewed repository files. MVP does not include a rich lesson authoring CMS or arbitrary exercise creation.

### Post-MVP, in priority order

- Additional content packs, configurable survey templates, and validated alternative school authentication.
- Teacher content editor with versioning and review, improved bulk roster onboarding, and reusable term templates.
- Optional read-only offline lesson cache and offline draft synchronization after a conflict/recovery design is tested.
- School SSO, more sophisticated accessibility accommodations, and cross-class reporting with explicit permissions.
- Verified Godot project uploads or sandboxed artifact handling if storage, malware review, retention, and moderation needs justify them.
- Optional embedded previews of small actual Godot web exports on devices that can support them; clearly label these as a separate mode.

### Non-goals

No full Godot editor clone, browser engine installation, real GDScript execution, arbitrary code evaluation, Godot binary compilation service, AI-generated grading, multiplayer game networking, 3D curriculum, public gallery, social feed, direct messages, public student profiles, payment system, gradebook/SIS integration, or production-scale multi-school administration. Do not promise that the final game can be built entirely in this browser lab.

## 5. Experience and information architecture

### Student experience

1. Read the school privacy notice and sign in through an approved invite.
2. Enter a teacher-issued class code; see pending approval until a teacher accepts enrollment.
3. Complete the readiness survey. Skipped optional questions do not block learning.
4. Open “Continue learning” and see the next assigned module, expected duration, learning objective, and why it matters in Godot.
5. Read a short explanation and accessible worked example. Start the Canvas practice with visible instructions and controls.
6. Change parameters or compose structured actions, observe behavior, run the checks, use hints, and reset safely.
7. Save an attempt, answer a transfer question, and submit. A successful game simulation is distinguished from a reviewed conceptual answer.
8. View teacher feedback, revise, and keep prior submitted evidence.
9. Submit the project survey and team preferences. See the teacher-approved team and proposal status.
10. Work on real Godot computers, record milestones and contribution evidence, and present the game.

Student home shows assigned lessons, reviewed/needs-revision states, upcoming milestones, team membership, language preference, and a clear connection indicator. It has no competitive leaderboard.

### Teacher experience

1. Operator provisions the teacher; teacher creates a class and configures dates, schedule, invite code, and school-computer sessions.
2. Teacher distributes invitations privately, reviews enrollment requests, and publishes modules in manageable batches.
3. Dashboard shows completion distribution, submitted work awaiting review, incomplete surveys, pending proposals, and students needing attention.
4. Teacher opens a student's saved configuration, check results, explanation, and feedback history. Review is based on evidence, not time spent on a page.
5. Teacher examines survey aggregates and private responses, creates teams, approves scope, and records scheduled Godot access.
6. Teacher reviews milestones, gives targeted feedback, and enters team and individual scores.
7. Teacher exports class data, closes enrollment, and requests retention cleanup according to school policy.

### Suggested routes

`/`, `/sign-in`, `/privacy`, `/student`, `/student/classes/[id]`, `/student/lessons/[assignmentId]`, `/student/surveys/[assignmentId]`, `/student/team`, `/student/project`; `/teacher`, `/teacher/classes/[id]`, `/teacher/classes/[id]/assignments`, `/teacher/classes/[id]/reviews`, `/teacher/classes/[id]/surveys`, `/teacher/classes/[id]/teams`, `/teacher/classes/[id]/projects`.

Routes are presentation boundaries; every server operation and database policy must independently authorize access.

## 6. Curriculum and progression

Each module includes a 5–10 minute explanation, a 10–20 minute playable practice, a short check, a reflection, and a “Try in Godot” transfer card. A class can slow down, repeat, or override prerequisites. Students may revisit unlocked lessons. Recommended progression is advisory for practice; teachers control assignment publication. Do not build a complex prerequisite engine.

| Module / activity | Actual Godot concepts | Browser task and evidence | Transfer to the Godot editor |
|---|---|---|---|
| 1. Scenes and nodes / Scene Composer | `Node`, `Node2D`, `Sprite2D`, parent-child hierarchy, scene instancing | Use buttons to organize a small tree; move a parent and observe child local/global positions; verify required hierarchy | Build and instance a Player scene; inspect Scene dock and Inspector |
| 2. Coordinates and movement / Movement Lab | `Vector2`, `position`, `Input` actions, `_process(delta)`, speed in units/second | Move a rectangle with arrow/WASD keys or on-screen buttons; tune speed; compare 30/60 FPS time-based motion | Create Input Map actions and move a `Node2D`; explain delta |
| 3. Collisions / Collision Lab | `CharacterBody2D`, `CollisionShape2D`, velocity, `move_and_slide()`, physics updates | Move through simple axis-aligned walls; toggle collision categories; demonstrate blocked and allowed interactions | Build a top-down controller; use `_physics_process`; inspect layers/masks |
| 4. Input and player feel / Control Lab | Action names, pressed versus just-pressed, diagonal normalization | Configure movement and one action; fix faster diagonal motion; compare a held action with a single activation | Use `Input.get_vector` and `Input.is_action_just_pressed`; test mappings |
| 5. Signals and interactions / Signal Lab | `Area2D`, `body_entered`, connected signals, event-driven reactions | Collect tokens; connect predefined event/action blocks to score and door state; trace event order | Connect an area signal to update score; distinguish entering from continuous overlap |
| 6. Game state and UI / State Lab | Variables, `Control`, `Label`, `CanvasLayer`, playing/won/lost states | Set lives and win condition; fix state transitions; restart without stale score | Build a simple HUD, reset state, and display end screens |
| 7. Time and feedback / Timer Lab | `Timer`, `timeout`, one-shot/repeating, simple `AnimationPlayer` concept | Set a countdown/spawn timer and visual feedback; prevent runaway spawning; explain one-shot behavior | Configure a Timer node and use timeout; add a short animation |
| 8. Complete loop and debugging / Mini-game Lab | Reusable scenes, deterministic testing, integration of prior concepts | Assemble a collect-and-exit game from fixed blocks; identify two seeded bugs; complete win, lose, and restart checks | Recreate a tiny loop in Godot with scene instances and explain two fixes |

Activities use fixed components and bounded parameters, not unrestricted visual programming. Module 1 uses a small teaching tree, not a simulated editor with every Godot property. Module 3 covers top-down collision to avoid introducing platformer gravity and jump mechanics too early. A platformer extension belongs after the initial pilot.

### GDScript literacy

Teach reading and explaining brief Godot 4 GDScript examples: variables, functions, conditional checks, vectors, signals, and state. Present real, tested snippets as text with highlighted identifiers. Questions may ask students to order predefined lines, select a missing expression, or explain behavior. Answers are evaluated against a bounded answer model or manually reviewed; never execute pasted code.

Use an actual Godot 4 example alongside browser activities, such as a top-down `CharacterBody2D` controller:

```gdscript
extends CharacterBody2D

@export var speed: float = 160.0

func _physics_process(_delta: float) -> void:
    var direction := Input.get_vector("move_left", "move_right", "move_up", "move_down")
    velocity = direction * speed
    move_and_slide()
```

The Input Map must define those action names. `velocity` here is units per second; do not multiply it by delta before `move_and_slide()`. A separate `Node2D` direct-position example can use `position += direction * speed * delta`. These are different movement models. Confirm all seeded snippets in the school-selected Godot 4 version before release.

## 7. Browser exercise architecture and accuracy boundaries

### Runtime

Use TypeScript and the browser Canvas 2D API. React provides the lesson layout, semantic controls, status, and forms; the simulation keeps mutable state outside React's per-frame render cycle. Draw geometric shapes and small local sprites. Lazy-load one activity runtime at a time.

Core interfaces:

```ts
type ExerciseDefinition = {
  id: string;
  version: number;
  kind: "scene" | "movement" | "collision" | "input" | "signals" | "state" | "timer" | "loop";
  initialConfig: unknown; // validated by the kind-specific schema
  limits: { maxEntities: number; maxSeconds: number };
  checks: string[]; // IDs for predefined, versioned check functions
};
type Evidence = {
  contentVersion: number;
  config: unknown;
  checkResults: { id: string; passed: boolean; explanation: string }[];
  summary: Record<string, number | string | boolean>;
};
```

Implement kind-specific discriminated schemas rather than keeping `unknown` inside the actual runtime. Content references registered check IDs; it cannot supply executable function bodies. Saved evidence contains configuration and compact summaries, not huge frame-by-frame telemetry.

Use a fixed simulation step (for example 1/60 second), a bounded accumulator, and a rendering loop via `requestAnimationFrame`. Clamp long elapsed intervals and pause when the tab is hidden. Separate the movement lesson's explicit delta comparison from the core fixed-step simulation. Seed randomness for reproducible checks. Reset must restore timer, input, score, collision, and event state. Cap entities and lifetime, clean up listeners on unmount, and provide start/pause/reset controls.

### Honest mappings

| Representation | Teaches correctly | Must explicitly disclaim |
|---|---|---|
| Teaching scene tree | Parent-child relationships, local versus global position, reuse | Partial model; it does not implement Godot's full SceneTree, lifecycle, transforms, or editor |
| Rectangle movement | Vectors, input actions, elapsed-time movement | JavaScript runtime; coordinate scale is illustrative |
| AABB wall solver | Collision response, blocked motion, layers/masks | Not Godot's physics engine; no exact `move_and_slide` behavior, slopes, or collision fidelity |
| Event dispatcher | Signals, connecting reactions, event sequencing | Not Godot object lifecycle, signal API implementation, or all signal semantics |
| Timers and state machine | Timeouts, one-shot/repeating, reset and transitions | Browser scheduling and pause policy may differ from engine time behavior |
| Structured code questions | GDScript reading and reasoning | Code is displayed and assessed, never run in the browser |

Every activity prominently says: **“Browser simulation of a Godot concept. GDScript does not run here.”** It includes an accessible text explanation of differences and an editor transfer task. Translate the notice accurately into Bahasa Indonesia.

Check feedback is formative. The server validates ownership, evidence structure, limits, content version, and registered check IDs and recomputes cheap deterministic checks where feasible. Client gameplay results remain student-supplied educational evidence, not tamper-proof examination proof. Teacher review and real-editor demonstrations establish understanding.

### Saved work semantics

An attempt progresses `draft → submitted → reviewed`, with teacher result `accepted` or `needs_revision`. Submitted evidence is immutable; revision creates a new attempt linked to the previous attempt. Passing gameplay checks can mark “practice passed”; module completion requires the specified check and conceptual evidence, accepted automatically only where the answer model is unambiguous. Otherwise it waits for teacher review.

Use debounced saves, explicit “Save now,” visible pending/saved/failed indicators, and bounded retry. Do not display “saved” until acknowledged. A short-disconnection draft can remain in memory or a per-user session-scoped local draft; clear it on logout and never keep authentication tokens in that draft. Persisted offline drafts, if used, need an opt-in shared-device policy and expiry. Server revision numbers prevent silent overwrite when two tabs save the same draft. A failed submission remains editable and can be retried idempotently.

## 8. Survey 1 — Readiness, interests, and access

**Purpose:** adapt teaching and computer access; no grading. 5–7 minutes, Bahasa Indonesia by default. Explain that individual responses are visible to the teacher; classmates cannot see them. Do not call an identified survey anonymous. Require only questions essential to planning. Every sensitive or optional question offers “Prefer not to answer.”

| ID | Question in English | Response and requirement | Teacher use |
|---|---|---|---|
| R1 | How much experience do you have making games? | Required: none / followed a tutorial / made a small game / other short description | Lesson pacing |
| R2 | Have you used Godot before? | Required: never / opened it / completed a tutorial / built something | Editor induction |
| R3 | How comfortable are you reading simple code? | Required 1–5 with labeled endpoints, plus not sure | Scaffold code literacy |
| R4 | Which kinds of games interest you? Choose up to three. | Optional: puzzle, platformer, top-down adventure, arcade, simulation, story, other | Examples and proposals |
| R5 | Name one game you enjoy and one mechanic you like. | Optional short text, 200 characters; no account handles | Discuss mechanics rather than imitation |
| R6 | What device can you usually use for school practice? | Required: personal laptop / shared laptop / school computer only / other / unsure | Access planning |
| R7 | What happens when you try running Godot? | Required: haven't tried / works well / slow / crashes / cannot install / unsure | Shared-computer scheduling |
| R8 | Can you usually access the internet for practice outside class? | Optional: reliably / sometimes / only at school / prefer not to answer | Homework feasibility |
| R9 | Which activities sound most interesting? Choose up to two. | Optional: programming, game design, art, audio, testing, organizing | Team balance |
| R10 | How confident are you about working in a small team? | Optional 1–5 plus prefer not to answer | Collaboration coaching |
| R11 | Is there a classroom support that would help you participate? | Optional short text, 300 characters; instruct not to disclose medical details | Private follow-up through school channels |
| R12 | What would you like to learn or make this semester? | Optional short text, 300 characters | Expectations |

Do not ask for exact device serial numbers, home address, family income, medical diagnoses, personal social accounts, or parents' contact details. Hardware specifications may be recorded by the teacher during testing, not demanded from children.

**Workflow:** published survey assignment → student draft → validation → submit → teacher response view. Student may revise through a versioned resubmission until teacher closes it. Completion is separate from particular answers; honest uncertainty is acceptable.

**Teacher summary:** counts and percentages for experience, Godot reliability, access, interests, and role interests, with missing-answer counts. Never expose private support answers in an aggregate or peer view. In a small class, avoid demographic slicing or charts that reveal individual sensitive answers. Export raw answers only to authorized teachers, with a warning about school data handling.

## 9. Survey 2 — Project interests and team preparation

**Purpose:** move from enthusiasm to achievable project scope. Individual survey first; teacher then creates teams and each team submits one proposal. 8–10 minutes. Responses are private to the teacher until students intentionally put an agreed answer into their team proposal.

| ID | Question in English | Response and requirement | Decision supported |
|---|---|---|---|
| P1 | Give your game idea a working title. | Required, 80 characters | Identify concept |
| P2 | In one sentence, what does the player do repeatedly? | Required, 250 characters | Core loop |
| P3 | Which beginner 2D format fits best? | Required: collect-and-exit / dodge-survive / simple puzzle / top-down exploration / other requiring teacher approval | Scope |
| P4 | What is the win condition? What is the lose condition, or why is no lose condition appropriate? | Required two short fields | Completion criteria |
| P5 | List up to three essential features. | Required 1–3 short entries | MVP for the game |
| P6 | List up to two optional stretch features. | Optional | Separate ambition from commitment |
| P7 | What Godot concepts will you use? | Required multi-select: scenes/nodes, input, collision, signals, UI, timers, other | Curriculum transfer |
| P8 | Which roles would you like to try? Choose two and explain one. | Required choices plus optional explanation | Rotate roles; avoid permanent specialization |
| P9 | Which classmates would you prefer to work with? | Optional up to three enrolled student display names; teacher-only | Advisory preferences, never guaranteed |
| P10 | Are you open to a teacher-assigned group? | Required: yes / would like to discuss privately | Resolve team placement |
| P11 | When can you use a capable school computer during approved school sessions? | Required available school session selections, including unsure | Scheduling; no home availability demands |
| P12 | What art/audio will you use, and where will it come from? | Required: original / teacher asset pack / appropriately licensed source + optional source | Asset feasibility and attribution |
| P13 | What might prevent completion, and what simpler version would still work? | Required, 400 characters | Risk and fallback |
| P14 | What help do you need before starting? | Optional, 300 characters | Teacher intervention |

**Teacher summary:** proposed formats, common mechanics, role interests, school session availability, and scope risks. Show preferences only in a private teacher panel; do not generate a public popularity graph. MVP supports teacher judgment, not algorithmic friendship matching.

**Team proposal template:** title; member names; one-sentence pitch; core loop; controls; win/lose rules; three must-have features; optional features; Godot nodes/concepts; minimal asset plan and sources; role rotation; available school sessions; three milestones; biggest risk and fallback; acceptance checklist. Teacher status is `draft`, `submitted`, `changes_requested`, or `approved`. Store proposal versions and feedback; approval applies to a specific version.

## 10. Team and real Godot project process

### Team formation

- Target three or four approved class members. Teacher creates and changes teams using survey information, student discussion, access needs, and balanced opportunities.
- A student has at most one active team per class. No cross-class team memberships. A team may temporarily contain fewer than three while forming; submitting a proposal requires three or four.
- Team preferences are suggestions. Teacher may create a documented exception where class size or access requires it; a three/four-person rule remains the default and the exception is visible.
- One team member can edit the shared proposal at a time through optimistic version checks. All team members can see the proposal and milestones. Teacher alone approves scope and grades.
- Changing membership after approval requires teacher action and preserves prior contribution history. Students cannot remove peers or give themselves teacher rights.

### Final game boundaries

One small 2D game, one short playable level or equivalent contained challenge, one core mechanic, clear controls, a start state, a meaningful success state, failure or challenge feedback where appropriate, restart, and a simple HUD. Use a teacher-provided asset pack or small original assets. Exclude online multiplayer, procedural worlds, complex inventory, elaborate combat systems, and large story campaigns from the default scope.

### School computer access

Before week 1, inventory capable machines, test the school-selected Godot 4 stable release, and reserve supervised sessions. Prefer the Compatibility renderer for the lightweight 2D school projects where supported and verify the actual machines. Keep project settings and teaching snippets aligned with the pinned version. Browser completion does not imply a device can run Godot.

Each student must perform at least one individual editor task: create/instance a scene, configure an input action, connect a signal, or debug a small issue. Rotate driver, navigator, tester, and design/documentation responsibilities. Do not leave all engine work to the student who owns a better computer. When machines are shared, distribute short stations and pair practice before team production sessions.

Estimate access explicitly: available supervised machine-hours = machines × reserved hours; demand = teams × planned team editor hours plus individual practice. If demand exceeds availability, extend the calendar or simplify project scope and arrange additional sessions. The app cannot compensate for no Godot access.

### Milestones and submission

1. **Prototype:** movement/input and one core interaction work; teacher observes an editor task.
2. **Playable loop:** goal, feedback, restart, and minimum UI work; test checklist and asset sources recorded.
3. **Final:** game is demonstrated, issues documented, individual contributions and reflection completed.

MVP stores progress text, approved school Drive/repository links, source/export locations, teacher observations, and rubric scores. Binary `.zip`, executable, and Godot project uploads are not accepted by the lab. The school stores source and exports in its approved repository/storage. Link schemes are validated; the server does not fetch arbitrary URLs. Teacher checks access before assessment. Avoid public hosting of student-identifying projects by default.

## 11. Configurable 12-week teaching plan

Assume one main class meeting each week with supervised computer time added or integrated. Adjust based on readiness and hardware capacity. Teacher records start date, school holidays, available meeting slots, and due dates; there is no automatic calendar integration in MVP. Store actual due instants and display them in the class timezone, default `Asia/Jakarta`.

| Week | Browser work and classroom focus | Godot/shared computer work | Deliverable |
|---|---|---|---|
| 1 | Orientation, privacy notice, readiness survey, Module 1 | Teacher tour and short rotating editor access | Survey + scene-tree explanation |
| 2 | Module 2, vector and delta experiments | Create simple movement scene | Movement evidence + transfer question |
| 3 | Modules 3 and 4; collision and control feel | Set input actions, body and shape, test walls | Collision/input submissions |
| 4 | Module 5, event trace and interaction | Connect area signal and update score | Signal activity + observed editor task |
| 5 | Modules 6 and 7, state and timers | HUD and timer practice in pairs | State/timer evidence |
| 6 | Module 8, debugging, scope examples, project survey | Recreate a small complete loop | Integrated practice + project survey |
| 7 | Teacher forms teams; proposal workshop | Project folder/scene skeleton | Approved proposal and access schedule |
| 8 | Team planning and individual contribution check | Build core mechanic | Prototype milestone |
| 9 | Peer testing with a teacher-provided checklist | Build goal, lose/challenge feedback, restart | Playable-loop milestone |
| 10 | Debugging clinic, asset credits, accessibility check | Fix usability and reliability | Revised loop and test evidence |
| 11 | Presentation practice and final checklist | Freeze essential scope, verify school demonstration setup | Final candidate + source/export links |
| 12 | Presentations, individual reflection, teacher rubric | Live Godot/source demonstration | Final game, contribution record, feedback |

Extra modules, absences, and school events may require 14–16 weeks. Preserve learning outcomes and editor access; do not compress away individual practice. Browser exercises can be used as in-class work when home connectivity is unavailable.

## 12. Assessment rubric

Total 100 points: **team artifact 60**, **individual learning/contribution 40**. Survey opinions and hardware ownership do not earn or lose marks. Use the school grading policy if it differs; teacher records a reason for overrides.

| Criterion | Weight | Excellent | Meets expectations | Developing | Beginning |
|---|---:|---|---|---|---|
| Playable core loop | 20 team | Complete, reliable goal/challenge/restart; clear controls | Full loop works with minor defects | Partial loop or significant defects | No stable playable loop |
| Godot concept implementation | 15 team | Appropriate scenes, input, collision/signals/state; team can explain choices | Required concepts work | Some concepts work or choices are unclear | Mostly incomplete or unexplained |
| Scope, testing, and iteration | 15 team | Achievable scope, meaningful tests, documented fixes | Scope followed and main paths tested | Scope drift or weak tests | Little planning or verification |
| Usability and asset practice | 10 team | Clear feedback, readable UI, suitable controls, complete credits | Usable with small issues and basic credits | Confusing UI or incomplete credits | Hard to operate or sources unrecorded |
| Individual conceptual understanding | 15 individual | Accurately explains and transfers concepts in a live task | Completes task with small prompts | Needs substantial help | Cannot yet demonstrate transfer |
| Contribution and collaboration | 15 individual | Specific evidence, rotating roles, dependable participation | Credible contribution and collaboration | Inconsistent contribution or limited evidence | Little verifiable participation |
| Browser practice and reflection | 10 individual | Required practices plus thoughtful explanations and revisions | Core practices and reflections complete | Several gaps or shallow reasoning | Minimal submitted evidence |

Suggested scoring anchors: excellent = 100% of criterion weight; meets = 75%; developing = 50%; beginning = 25%; no evidence = 0%. Teachers may use intermediate scores with a short note. Assess learning and reliability rather than visual polish that rewards access to better devices. Share the rubric before proposals.

## 13. Functional requirements

| ID | Requirement |
|---|---|
| FR-01 | Invite-only sessions; validated server identity; operator-provisioned teacher role; student profile cannot change role |
| FR-02 | Teacher creates/archives own class, rotates enrollment code, approves/rejects requests, and manages roster |
| FR-03 | Teacher publishes versioned lesson/survey assignments, due dates, and closes submission; students see only published assignments in approved classes |
| FR-04 | Eight activities run, respond to controls, pause/reset, check goals, and provide text feedback without arbitrary code execution |
| FR-05 | Save/submit attempts with schema validation, bounded evidence, content version, revision history, and conflict handling |
| FR-06 | Teacher reviews owned-class submissions and records feedback/result; student sees only own attempts |
| FR-07 | Both surveys validate answer types/counts/lengths, allow drafts and versioned submission, and enforce private responses |
| FR-08 | Teacher forms teams transactionally; same-class membership and size checks hold under concurrent requests |
| FR-09 | Team members collaborate on versioned proposal/milestones; teacher approval and membership changes are authorized |
| FR-10 | Teacher dashboard summarizes progress and review queues with filters; exports include only authorized class data |
| FR-11 | Teacher records milestone feedback, final links/observations, team rubric and individual scores |
| FR-12 | Bahasa Indonesia and English cover UI, seeded content, validation messages, controls, and privacy copy; preferences persist |
| FR-13 | Loading, empty, unauthorized, expired-session, offline/save-failure, and submission-conflict states are explicit |
| FR-14 | Retention/export/deletion operations are documented and enforce ownership; there is no public data directory |

## 14. Nonfunctional requirements and low-spec strategy

### Performance budgets

Budgets are acceptance targets measured in the pilot, not claims about an untested build.

- Core lesson page initial transfer target ≤500 KB compressed, excluding a lazy-loaded activity; each activity incremental transfer ≤200 KB compressed excluding a tightly capped optional sprite pack.
- No engine/WASM payload, autoplay video, continuous real-time subscriptions, large sprite atlases, or per-frame network writes.
- Warm navigation ≤1 second; first lesson usable ≤5 seconds on a controlled 5 Mbps link with 150 ms latency. Test cold-load separately and document results.
- Active simple scene target ≥30 FPS on the agreed representative laptop; pause background tabs, cap device pixel ratio (default ≤1.5), reduce visual effects, and offer 30 FPS rendering without changing simulation correctness.
- Typical scene ≤50 entities, hard limit ≤100; cap particles or omit them. Keep canvas dimensions independent of CSS layout and reuse drawing resources.
- Save API payload ≤64 KB; no image/base64 recording or keystroke telemetry. Review pagination and dashboard query plans with 40 students × eight lessons × several attempts.
- No accumulating event listeners or unbounded memory growth during a 15-minute play/reset cycle. Record memory diagnostics and browser/device details rather than claiming a universal memory ceiling.

### Accessibility

Target WCAG 2.2 AA for the complete web experience, with Canvas-specific equivalent learning evidence. This is an engineering target requiring audit, not a compliance certification.

- Semantic headings, labeled controls, visible focus, skip link, keyboard navigation, sufficient contrast, errors linked to fields, and language attributes.
- Canvas activities expose instructions, current score/state, and check results in HTML. Announce meaningful state changes via restrained live regions, not every frame.
- Provide on-screen controls and keyboard controls; capture movement keys only while activity focus is active; Escape releases focus. Prevent stuck input on blur.
- Do not rely on drag-and-drop: scene hierarchy editing has buttons and selects. Use color plus shape/text. Honor reduced-motion preferences and disable decorative animation.
- At 200% zoom, controls and text remain usable; no horizontal scrolling for main reading/forms. On small screens, place controls below the canvas and preserve touch targets.
- For activities that still require spatial navigation, provide a structured text/step mode that teaches the same concept and generates an equivalent submission. It can receive teacher review; do not present a static transcript as equivalent interaction.
- Godot editor accessibility and final-task accommodations require teacher planning beyond the website. Discuss equivalent demonstrations through school support processes.

### Reliability and operations

Use transactional updates for team placement and review transitions, idempotency for submission, database constraints for invariants, migrations for every schema change, structured redacted logs, and a tested backup/restore process appropriate to the selected Supabase plan. Display current save status. Errors must retain the student's unsent work where possible. Timezone-aware schedules and bilingual text are requirements from the first vertical slice.

## 15. Technical stack and boundaries

| Layer | MVP choice | Rationale and boundary |
|---|---|---|
| Web app | Next.js App Router, React, TypeScript | Server-render lesson content, client-only Canvas runtime; reuse repository choices if sound |
| UI | Tailwind CSS with a small accessible component set | Consistent lightweight layout; no mandatory large UI framework |
| Localization | `next-intl` or existing equivalent | Explicit `id`/`en` messages and content, default `id` |
| Activity engine | Canvas 2D + TypeScript, no general game engine | Small bundles and clear simulation limits |
| Validation | Zod or existing equivalent | Shared discriminated schemas; enforce again on server |
| Data/auth | Supabase PostgreSQL, Auth, RLS | Managed sessions and relational constraints; RLS plus server authorization |
| Testing | Vitest, Testing Library, Playwright | Deterministic logic, forms, full workflows, authorization and browser checks |
| Hosting | Vercel or school-approved Node host plus Supabase | Deployable standard app; confirm current quotas, regions, school approval, and cost |

Choose mutually compatible supported stable package versions at implementation time and commit a lockfile. This document does not assert a particular latest Godot, Next.js, or model release. “Claude Opus 5.5” is the user's requested prompt recipient, not a verified product-availability claim.

Use Supabase's supported SSR session approach for the selected Next.js version. Separate browser and server clients. Authorize each server action/route with verified identity; route middleware alone is insufficient. Keep privileged keys in server-only operator tooling. Ordinary requests should run through the user's authenticated database context, preserving RLS.

No Supabase Storage dependency in MVP. School-managed artifact links are sufficient. No server-side arbitrary URL fetching. Do not add Redis, queues, WebSockets, microservices, a bespoke auth provider, or an LLM API without an actual requirement.

## 16. Supabase relational schema proposal

UUID primary keys, `timestamptz` timestamps, bounded text, foreign keys, explicit enums/check constraints, and indexes on RLS join/filter columns. Treat this as a design to implement and test, not production-ready SQL.

| Table | Core fields | Invariants / indexes |
|---|---|---|
| `profiles` | `id` → `auth.users`, `display_name`, `role`, `locale`, timestamps | `role` teacher/student; role set only by provisioning; do not duplicate email |
| `classes` | `id`, `teacher_id`, `name`, `term`, `timezone`, `archived_at` | Teacher-owned; archive blocks new enrollment/submission |
| `class_invites` | `id`, `class_id`, `code_hash`, `expires_at`, `revoked_at`, usage limits | No student direct SELECT; code only returned to teacher at creation/rotation |
| `enrollments` | `id`, `class_id`, `student_id`, `status`, timestamps | Unique `(class_id, student_id)`; pending/approved/rejected/withdrawn |
| `lesson_versions` | `id`, `lesson_key`, `version`, localized validated content/config, `published` | Unique key/version; seeded through migrations/operator tooling; immutable when assigned |
| `survey_versions` | `id`, `survey_key`, `version`, localized questions/schema | Same version discipline as lessons |
| `assignments` | `id`, `class_id`, `kind`, `lesson_version_id` or `survey_version_id`, `published_at`, `due_at`, `closed_at` | Exactly one content FK matches kind; approved student read only if published |
| `exercise_attempts` | `id`, `assignment_id`, `student_id`, `previous_attempt_id`, `revision`, `status`, `config`, `evidence`, `answers`, `submitted_at` | One active draft per student/assignment via partial unique index; content limits; ownership/class checked |
| `attempt_reviews` | `id`, `attempt_id`, `teacher_id`, `result`, `feedback`, timestamps | Teacher-owned class only; immutable history, current result derived |
| `survey_responses` | `id`, `assignment_id`, `student_id`, `version`, `status`, `answers`, timestamps | Unique student/assignment/version; one draft; submitted rows immutable |
| `teams` | `id`, `class_id`, `name`, `size_exception_reason`, timestamps | Same-class parent for all children; private outside class |
| `team_members` | `team_id`, `class_id`, `student_id`, `joined_at`, `left_at` | Composite FK to team/class; approved enrollment; partial unique active `(class_id, student_id)` |
| `project_proposals` | `id`, `team_id`, `version`, `status`, `body`, `revision`, `submitted_at` | One current draft; submitted versions immutable; proposal submit checks team size |
| `proposal_reviews` | `id`, `proposal_id`, `teacher_id`, `result`, `feedback`, timestamps | Approval belongs to explicit version; only owner teacher writes |
| `project_milestones` | `id`, `team_id`, `kind`, `revision`, `body`, `status`, `submitted_at` | Prototype/loop/final; versioned submission/evidence and teacher review |
| `milestone_reviews` | `id`, `milestone_id`, `teacher_id`, `feedback`, `result`, timestamps | Restrict to own class; retained feedback history |
| `contribution_statements` | `id`, `team_id`, `student_id`, `milestone_kind`, `body`, timestamps | Student writes own; teacher reads; membership history retained |
| `rubric_scores` | `id`, `class_id`, `team_id`, optional `student_id`, criterion, `points`, `feedback`, `teacher_id` | Criterion maximums enforced; unique criterion per assessment subject; student/team consistency |
| `audit_events` | `id`, `actor_id`, `class_id`, `action`, `target_id`, `created_at` | Server/DB append only; no sensitive survey bodies or credentials |

Avoid creating an extra progress table until needed. A scoped view/query can derive per-student assignment state from attempts/reviews. If caching later, make the cache non-authoritative and update it transactionally.

### RLS and write policy matrix

Enable RLS on every application table and revoke broad default grants. Deny anonymous access except public static content served outside protected tables. Views must preserve caller access (for example security-invoker views where supported); do not accidentally bypass RLS through aggregates.

| Resource | Student | Teacher |
|---|---|---|
| Profile | Read/update own safe display/locale fields; minimal peer display names only through approved class/team projection | Read necessary roster display data for owned classes; no global profile directory |
| Class/enrollment | Read enrolled class and own enrollment; request enrollment through constrained endpoint | CRUD owned classes; approve own-class enrollments |
| Content/assignment | Read published assigned version when enrollment approved | Read seeded content and manage assignments for owned classes |
| Attempt/response | Own rows only; create/update draft; submit through authorized transition | Read own-class rows; write review records, never impersonate student evidence |
| Team/members | Read own team and minimal class roster for preferences; no membership writes | Manage own-class teams through transactional procedure |
| Proposal/milestone | Own active team only; update draft; submit through transition | Review own-class versions and write decisions |
| Contribution | Own statement read/write; classmates do not read private statements | Read owned-class statements |
| Scores | Own individual scores and own team's team score | Read/write owned-class scores |
| Invites/audit | No direct invite read; no audit writes | Restricted invite operations; read appropriate owned-class audit metadata |

Use SQL policies based on `auth.uid()`, approved enrollment, team membership, and actual class ownership. Do not trust request `teacher_id`, `student_id`, `class_id`, role metadata, or hidden UI controls. Derive actor IDs on the server. Role changes use a restricted provisioning path; student profile UPDATE policy alone is insufficient unless protected columns are also excluded by grants or trigger logic.

Class-code redemption requires authenticated identity, expiry/revocation checks, a rate limit, and a pending enrollment insert. Store a hash of high-entropy codes; codes invite a request, never grant teacher status or automatic access to student data. The teacher approval step is mandatory. Reveal only a generic failure message for invalid codes.

Enforce team limits with a locked parent-team row and a transaction/procedure to prevent concurrent inserts exceeding four. RLS cannot substitute for a concurrency-safe capacity constraint. Keep membership and proposal transition procedures narrowly scoped. If a `SECURITY DEFINER` function is necessary, fix its `search_path`, fully qualify objects, revoke public execution, verify identity and ownership inside it, and prevent callers from selecting arbitrary actor IDs. Prefer invoker functions when sufficient. Test helper functions for recursion and leakage.

Submitted-row immutability, ownership fields, status transitions, and review permissions require explicit database protections in addition to form validation. Index class/assignment/student/team join columns and check query plans. Do not expose privileged service credentials in client bundles, logs, or seed files.

## 17. Security and privacy for minors

The school is responsible for deciding the applicable lawful basis/consent process, authorized staff, hosting region, retention, and parent/guardian communication. Deployment location and student ages affect obligations. This product specification supplies controls and review questions; it does not determine legal compliance.

Baseline controls:

- Invite-only access, authenticated teacher approval, least privilege, and strict class boundaries.
- Pseudonymous display names where practical; authentication email stays with the auth provider and is absent from peer views and normal exports.
- No ads, behavioral trackers, public profiles, child-to-child messaging, or third-party analytics scripts by default.
- Collect only survey answers, progress, project evidence, and educational feedback. Optional support text remains private and is not a medical intake form.
- Plain bilingual privacy notice: what is collected, purpose, authorized readers, school contact, retention, deletion process, and limits of identified surveys.
- Proposed default retention: term end plus 90 days, configurable only after school approval. Include auth records, exported copies, backups, and school-held game artifacts in the retention inventory; backup deletion follows provider constraints and must be disclosed accurately.
- Validate payloads and links; escape all text; sanitize any Markdown and disable raw HTML. Avoid arbitrary embedding and resource fetching.
- CSRF/origin protections for mutations as required by the framework/auth design, secure cookies, HTTPS, CSP compatible with the chosen stack, rate limits for auth/code redemption/exports, and redacted error logs.
- Clear logout and account switching on shared machines. Avoid persistent private local data and clear user-scoped caches on logout. Do not send grades or responses to third-party error tools without approved configuration.
- CSV exports neutralize spreadsheet formula injection for cells starting with `=`, `+`, `-`, `@`, tab, or carriage return while preserving readable text. Exports are teacher-only, downloaded intentionally, and never publicly cached.
- Document account recovery through the school. Never show classmates' passwords, generate guessable credentials, or let teachers browse global auth users.
- Write a short incident process: restrict affected access, preserve redacted evidence, rotate compromised credentials, notify school contact, assess required notifications, and verify the fix.

Before live data: complete school review, confirm provider settings, test authorization with multiple accounts/classes, verify restore/export/deletion, and replace demonstration privacy placeholders with the real school contact.

## 18. Test strategy and quality evidence

| Layer | Required meaningful tests |
|---|---|
| Simulation unit tests | Fixed-step movement independence; diagonal normalization; AABB collision; category filtering; single-entry signal; timer one-shot/repeat; state reset; seeded loop win/lose/restart |
| Content tests | Every seeded module references a registered activity/check; both locales complete; schemas valid; transfer cards and accuracy notices present |
| Form/component tests | Survey length/choice bounds, required/optional fields, validation focus, draft/save/error/conflict states, accessible exercise controls |
| Database integration | Clean migration/reset/seed; RLS allow/deny matrix; protected role/ownership fields; immutable submissions; team concurrency; proposal approval version |
| End-to-end | Teacher invites/approves student; student completes and submits activity; teacher reviews; both surveys; team creation; proposal revision/approval; milestones; scores and export |
| Adversarial authorization | Anonymous request, student acting as teacher, other student ID, cross-class teacher, forged team/class/assignment ID, direct REST query, expired enrollment, closed assignment |
| Accessibility | Automated checks plus keyboard-only and screen-reader walkthrough, focus/zoom/reduced-motion, equivalent activity submission |
| Performance | Production-build load/bundle measurements, 15-minute runtime soak, real representative laptop, classroom load with synthetic accounts |
| Operations | Missing env fails clearly; production build starts; invite redirect configuration; backup/restore drill and retention deletion dry run |

Use synthetic students only for development/test. Seed fictional displays, no real emails or survey data. Authentication seed credentials belong in local instructions/environment only; do not ship fixed demo passwords to production. A no-backend preview can be read-only and explicitly labeled; production must not silently fall back to mocks.

Godot snippets and editor transfer tasks need teacher verification in the pinned real editor. Browser tests cannot certify engine behavior. Record tests actually run, environment, results, and remaining manual checks; do not claim unperformed audits passed.

## 19. Acceptance criteria

The MVP is accepted only when all of the following are evidenced:

1. A clean checkout can install locked dependencies, migrate/seed a local Supabase environment, build, and launch using the documented setup without undocumented secrets.
2. Teacher/student authentication and class approval work; cross-role and cross-class database/API access tests deny unauthorized operations.
3. All eight Canvas exercises are playable, bounded, deterministic where specified, keyboard usable, reset correctly, and emit meaningful evidence. Each has explicit simulation boundaries and a real Godot transfer task.
4. A student can save, reload, submit, receive review, and revise work. Network failures and conflicting drafts are visible without falsely reporting success.
5. Both surveys support private drafts/submissions and teacher summaries, with correct missing-answer handling and protected sensitive fields.
6. Teachers form three/four-member same-class teams; concurrent operations cannot violate capacity or unique membership. Exceptions require explicit teacher records.
7. A team submits a versioned proposal, receives changes, gets approval, and records three milestones and final school artifact links. Individual contribution and assessment remain attributable.
8. Teacher dashboard and exports match underlying scoped records and do not reveal unrelated students, emails, private support data in peer views, or spreadsheet-executable text.
9. Bahasa Indonesia is the default throughout seeded content and UI. English toggle preserves work and identifiers; no critical untranslated paths remain.
10. Automated quality gates pass; manual accessibility, representative-device performance, and actual Godot transfer checks are documented. Unresolved failures block a classroom production release.
11. Hosting/auth redirect settings, environment handling, privacy notice, retention procedure, backups, and school-computer access are ready and approved by the school operator.
12. A teacher can conduct the complete classroom scenario with seeded synthetic data and a pilot class before expanding rollout.

## 20. Risks and mitigations

| Risk | Consequence | Mitigation / trigger |
|---|---|---|
| Browser exercises are mistaken for Godot | Poor transfer and misleading product claims | Accuracy notices, engine-specific cards, live editor checkpoints |
| Insufficient shared computer time | Final objective cannot be achieved | Capacity calculation before launch, reserve sessions, extend semester if needed |
| Scope grows into an editor clone | Slow build and poor low-end performance | Fixed activities/configuration, no arbitrary scripting or CMS in MVP |
| Client evidence is treated as secure grading | Inflated results | Formative use, validated evidence, individual observed tasks and review |
| Team work hides individual gaps | Unequal learning | Role rotation, personal editor task and contribution rubric |
| Internet disruptions lose work | Frustration | Visible save state, retry/idempotency, preserved unsent draft, in-class contingency |
| RLS recursion or permission leakage | Exposure of minors' data | Simple scoped helpers, deny tests against direct REST, least privilege |
| Public artifact links reveal students | Privacy problems | School-restricted links, no public gallery, teacher verification |
| Low-end laptop still struggles | Participation barrier remains | Canvas budgets, reduced rendering, representative pilot testing |
| Authentication requires unavailable accounts | Enrollment fails | Validate school identity path before production, implement alternative later with review |
| Costs/quotas or hosting features change | Unexpected outage or expense | Check current provider plans before choosing, track storage/request use, document migration path |
| Over-polished asset expectations | Unfair assessment | Reward working loops and explanations; provide shared assets |

## 21. Roadmap and release gates

**Phase 0 — Discovery and repository audit:** inspect existing implementation, verify package/tool versions, test target hardware and Godot version, settle school identity/access/retention assumptions. Deliver repo assessment, architectural choices, and measurable plan.

**Phase 1 — Secure vertical slice:** auth, profiles, class/approval, one bilingual movement lesson, one actual Canvas activity, save/submit/review, RLS tests, and deployable staging. Prove a real student-to-teacher workflow before breadth.

**Phase 2 — Curriculum:** extend shared runtime to all eight activities, add accessible equivalent modes, versioned content, survey 1, assignment scheduling, and progress dashboard.

**Phase 3 — Project workflow:** survey 2, private preferences, transactional teams, proposal reviews, milestones, contributions, rubric, exports, and retention tooling.

**Phase 4 — Classroom release:** production measurements, accessibility walkthrough, real Godot transfer verification, school/privacy readiness, restore drill, pilot class, and release notes. Resolve pilot blockers before adding post-MVP features.

Implementation phases are not the student calendar. Avoid promising a fixed development duration without inspecting the repository and testing the first slice.

## 22. Decision log

| ID | Decision | Reason / reconsideration trigger |
|---|---|---|
| D01 | Option A chosen | Browser practice solves editor access friction; real Godot remains final destination |
| D02 | 2D, top-down-first exercises | Small runtime and beginner-friendly concepts; extend only after pilot |
| D03 | Eight fixed activities | Enough curriculum breadth without a general editor or authoring platform |
| D04 | Canvas 2D instead of Godot web export for core practice | Avoid engine/WebGL dependency; keep clear fidelity limits |
| D05 | GDScript is read and discussed, not executed | Truthful scope, simpler safety/performance model |
| D06 | Teacher-managed teams and scope | Educational judgment and privacy outweigh automated matching |
| D07 | Bahasa Indonesia default, English complete | Classroom accessibility; preserve real API vocabulary |
| D08 | Supabase with RLS and server checks | Relational integrity and scoped access; test actual policies |
| D09 | Invite-only approved school identities | Minors and class control; revisit if school cannot provide identities |
| D10 | Repository-authored content in MVP | Reduces CMS/security workload; teachers still control assignments |
| D11 | School-managed final artifacts via links | Avoid upload scanning, binary hosting, and public exposure |
| D12 | No telemetry-based or AI grading | Evidence-based teacher assessment, minimal personal data |
| D13 | Full offline sync deferred | Conflicts/shared-device privacy need a separate validated design |
| D14 | Scores split 60 team / 40 individual | Finish a shared game while preserving individual accountability |

## 23. Relationship to the build prompt

Use `MASTER_BUILD_PROMPT.md` alongside this file. This context defines scope, educational honesty, and acceptance conditions. The master prompt defines how an engineering agent should inspect, implement, verify, and hand off the product. Resolve contradictions by honoring explicit human requirements, preserving security and concept accuracy, and recording any approved scope adjustment.

## 24. Authoritative references and verification notes

Official documentation checked on **13 October 2026**. These references establish platform facts; performance budgets, curriculum, survey questions, and schema above are product proposals. Stable documentation URLs can change. Package versions, provider limits, pricing, and school-specific legal decisions must be checked again at implementation/deployment time.

- **Godot web export:** real Godot web exports require WebAssembly and WebGL 2.0 and use Compatibility. Single-threaded exports, available since Godot 4.3, avoid the isolation requirements associated with multithreaded exports; do not claim every web export requires SharedArrayBuffer or isolation headers. This does not make the Godot editor or GDScript a browser-native teaching runtime. [Official web export documentation](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html).
- **Low-spec renderer choice:** Compatibility is intended for broad hardware support, including older devices. Its suitability must still be tested on school computers. [Official renderer overview](https://docs.godotengine.org/en/stable/tutorials/rendering/renderers.html).
- **Core teaching vocabulary:** nodes, scenes, the scene tree, and signals are fundamental concepts. [Godot key concepts](https://docs.godotengine.org/en/stable/getting_started/introduction/key_concepts_overview.html).
- **Movement accuracy:** physics processing differs from per-frame processing; `CharacterBody2D.velocity` is pixels per second and `move_and_slide()` uses the physics timestep. [Node reference](https://docs.godotengine.org/en/stable/classes/class_node.html), [CharacterBody2D reference](https://docs.godotengine.org/en/stable/classes/class_characterbody2d.html), [2D movement examples](https://docs.godotengine.org/en/stable/tutorials/2d/2d_movement.html).
- **Supabase SSR:** separate cookie-based browser/server clients and verified identity checks are required; current guidance uses `getClaims()` and a Next.js Proxy integration. Adapt refresh integration to the installed framework version, and avoid caching personalized responses or auth-cookie responses. [Supabase SSR client guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs).
- **Database authorization:** RLS protects exposed tables; user-editable metadata must not determine roles; views and privileged helper functions need explicit safeguards. [Supabase RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security).
- **Keys:** publishable keys are suitable for client use with RLS. Elevated secret keys and legacy `service_role` credentials bypass RLS and must remain server-only. [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys).
- **Canvas semantics and performance:** drawn Canvas objects do not supply an accessible semantic interface; provide equivalent HTML interaction and status. Rendering should use elapsed time and account for hidden-tab behavior. [MDN Canvas element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/canvas), [Canvas optimization](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas), [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame).
- **Accessibility target:** audit against the normative accessibility requirements and include manual testing. [WCAG 2.2](https://www.w3.org/TR/WCAG22/).
- **School data safeguards:** school data protection guidance supports minimizing collection and establishing accountable handling. This is guidance, not a determination of applicable law. [UNICEF — Data protection in schools](https://www.unicef.org/eca/reports/data-protection-schools).
