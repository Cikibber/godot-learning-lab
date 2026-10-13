extends SceneTree
# One second of physics frames: velocity (px/s) without delta should move ~160 px.
var body := CharacterBody2D.new()
var frames := 0
func _initialize() -> void:
    var shape := CollisionShape2D.new()
    shape.shape = RectangleShape2D.new()
    body.add_child(shape)
    body.motion_mode = CharacterBody2D.MOTION_MODE_FLOATING
    root.add_child(body)
func _physics_process(_delta: float) -> bool:
    body.velocity = Vector2.RIGHT * 160.0
    body.move_and_slide()
    frames += 1
    if frames == Engine.physics_ticks_per_second:
        print("after_1s_x=", snappedf(body.position.x, 0.1), " ticks=", frames)
        return true
    return false
