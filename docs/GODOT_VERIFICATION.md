# Godot snippet verification

**Pinned editor:** Godot **4.6.1 stable** (`v4.6.1.stable.official.14d19694e`), found on the build machine. Content files declare `godotVersion: "4.6"`. Change the pin only after re-running these checks on the school's chosen version.

## Automated parse check (done, 13 Oct 2026)

```bash
npm run godot:check                         # writes .local-logs/godot-check/*.gd + project.godot
cd .local-logs/godot-check
"<Godot console exe>" --headless --path . --import
for f in *.gd; do "<Godot console exe>" --headless --path . --check-only --script "$f"; done
```

Result: all 7 seeded scripts (Modules 2–8 worked examples / transfer snippets) parsed with **no errors**. Control: an intentionally broken script produced `Parse Error: Identifier "undefined_thing" not declared`, confirming the check detects errors.

## Runtime check of the velocity rule (done)

`scripts/godot/velocity_check.gd` (headless SceneTree script): a `CharacterBody2D` with `velocity = Vector2.RIGHT * 160` and `move_and_slide()` for 60 physics ticks moved **157.3 px** (≈160 px/s; first tick integrates before the first call). Confirms the lesson claim: velocity is pixels/second and must not be multiplied by delta.

## Manual checks still pending (teacher, in the real editor)

- [ ] Module 1: build/instance Player scene; Scene dock and Inspector steps match 4.6 UI labels.
- [ ] Module 2: Input Map actions `move_left/right/up/down`; `Node2D` script moves at `speed`.
- [ ] Module 3: top-down controller with `StaticBody2D` walls; layer/mask behaviour as described.
- [ ] Module 4: `dash` action; feel difference between `is_action_pressed` and `is_action_just_pressed`.
- [ ] Module 5: Coin `Area2D` signal `collected` connected in the Signals dock.
- [ ] Module 6: `$CanvasLayer/Label` path and restart button.
- [ ] Module 7: Timers with `item_scene` assigned; `AnimationPlayer` flash.
- [ ] Module 8: Exit with `change_scene_to_file("res://win.tscn")` (requires creating `win.tscn`).
- [ ] Confirm the Compatibility renderer runs these on the school computers.

Record results (machine, OS, Godot build, pass/fail, notes) here before classroom release.
