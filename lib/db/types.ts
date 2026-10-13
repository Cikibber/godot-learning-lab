
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "assignments": {
                  Row: {
                    "class_id": string,"closed_at": string | null,"created_at": string,"due_at": string | null,"id": string,"kind": Database["public"]['Enums']["assignment_kind"],"lesson_version_id": string | null,"position": number,"published_at": string | null,"survey_version_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "class_id": string,"closed_at"?: string | null,"created_at"?: string,"due_at"?: string | null,"id"?: string,"kind": Database["public"]['Enums']["assignment_kind"],"lesson_version_id"?: string | null,"position"?: number,"published_at"?: string | null,"survey_version_id"?: string | null
                  }
                  Update: {
                    "class_id"?: string,"closed_at"?: string | null,"created_at"?: string,"due_at"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["assignment_kind"],"lesson_version_id"?: string | null,"position"?: number,"published_at"?: string | null,"survey_version_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "assignments_class_id_fkey"
      columns: ["class_id"]
isOneToOne: false
      referencedRelation: "classes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assignments_lesson_version_id_fkey"
      columns: ["lesson_version_id"]
isOneToOne: false
      referencedRelation: "lesson_versions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assignments_survey_version_id_fkey"
      columns: ["survey_version_id"]
isOneToOne: false
      referencedRelation: "survey_versions"
      referencedColumns: ["id"]
    }
                  ]
                },"attempt_reviews": {
                  Row: {
                    "attempt_id": string,"created_at": string,"feedback": string,"id": string,"result": Database["public"]['Enums']["review_result"],"teacher_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "attempt_id": string,"created_at"?: string,"feedback": string,"id"?: string,"result": Database["public"]['Enums']["review_result"],"teacher_id"?: string
                  }
                  Update: {
                    "attempt_id"?: string,"created_at"?: string,"feedback"?: string,"id"?: string,"result"?: Database["public"]['Enums']["review_result"],"teacher_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "attempt_reviews_attempt_id_fkey"
      columns: ["attempt_id"]
isOneToOne: false
      referencedRelation: "exercise_attempts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attempt_reviews_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_events": {
                  Row: {
                    "action": string,"actor_id": string | null,"class_id": string | null,"created_at": string,"id": number,"target_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"class_id"?: string | null,"created_at"?: string,"id"?: never,"target_id"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"class_id"?: string | null,"created_at"?: string,"id"?: never,"target_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_events_class_id_fkey"
      columns: ["class_id"]
isOneToOne: false
      referencedRelation: "classes"
      referencedColumns: ["id"]
    }
                  ]
                },"class_invites": {
                  Row: {
                    "class_id": string,"code_hash": string,"created_at": string,"expires_at": string,"id": string,"max_uses": number,"revoked_at": string | null,"uses": number
                  }
                  ComputedFields: never
                  Insert: {
                    "class_id": string,"code_hash": string,"created_at"?: string,"expires_at": string,"id"?: string,"max_uses"?: number,"revoked_at"?: string | null,"uses"?: number
                  }
                  Update: {
                    "class_id"?: string,"code_hash"?: string,"created_at"?: string,"expires_at"?: string,"id"?: string,"max_uses"?: number,"revoked_at"?: string | null,"uses"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "class_invites_class_id_fkey"
      columns: ["class_id"]
isOneToOne: false
      referencedRelation: "classes"
      referencedColumns: ["id"]
    }
                  ]
                },"class_sessions": {
                  Row: {
                    "class_id": string,"created_at": string,"id": string,"label": string,"notes": string
                  }
                  ComputedFields: never
                  Insert: {
                    "class_id": string,"created_at"?: string,"id"?: string,"label": string,"notes"?: string
                  }
                  Update: {
                    "class_id"?: string,"created_at"?: string,"id"?: string,"label"?: string,"notes"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "class_sessions_class_id_fkey"
      columns: ["class_id"]
isOneToOne: false
      referencedRelation: "classes"
      referencedColumns: ["id"]
    }
                  ]
                },"classes": {
                  Row: {
                    "archived_at": string | null,"created_at": string,"id": string,"name": string,"teacher_id": string,"term": string,"timezone": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"created_at"?: string,"id"?: string,"name": string,"teacher_id"?: string,"term"?: string,"timezone"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"created_at"?: string,"id"?: string,"name"?: string,"teacher_id"?: string,"term"?: string,"timezone"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "classes_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"contribution_statements": {
                  Row: {
                    "body": string,"created_at": string,"id": string,"milestone_kind": Database["public"]['Enums']["milestone_kind"],"student_id": string,"team_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"id"?: string,"milestone_kind": Database["public"]['Enums']["milestone_kind"],"student_id"?: string,"team_id": string,"updated_at"?: string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"id"?: string,"milestone_kind"?: Database["public"]['Enums']["milestone_kind"],"student_id"?: string,"team_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "contribution_statements_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contribution_statements_team_id_fkey"
      columns: ["team_id"]
isOneToOne: false
      referencedRelation: "teams"
      referencedColumns: ["id"]
    }
                  ]
                },"enrollments": {
                  Row: {
                    "class_id": string,"decided_at": string | null,"id": string,"requested_at": string,"status": Database["public"]['Enums']["enrollment_status"],"student_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "class_id": string,"decided_at"?: string | null,"id"?: string,"requested_at"?: string,"status"?: Database["public"]['Enums']["enrollment_status"],"student_id": string
                  }
                  Update: {
                    "class_id"?: string,"decided_at"?: string | null,"id"?: string,"requested_at"?: string,"status"?: Database["public"]['Enums']["enrollment_status"],"student_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "enrollments_class_id_fkey"
      columns: ["class_id"]
isOneToOne: false
      referencedRelation: "classes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "enrollments_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"exercise_attempts": {
                  Row: {
                    "answers": NonNullable<Json>,"assignment_id": string,"attempt_no": number,"created_at": string,"evidence": NonNullable<Json>,"id": string,"mode": string,"previous_attempt_id": string | null,"revision": number,"status": Database["public"]['Enums']["work_status"],"student_id": string,"submitted_at": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "answers"?: NonNullable<Json>,"assignment_id": string,"attempt_no"?: number,"created_at"?: string,"evidence"?: NonNullable<Json>,"id"?: string,"mode"?: string,"previous_attempt_id"?: string | null,"revision"?: number,"status"?: Database["public"]['Enums']["work_status"],"student_id"?: string,"submitted_at"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "answers"?: NonNullable<Json>,"assignment_id"?: string,"attempt_no"?: number,"created_at"?: string,"evidence"?: NonNullable<Json>,"id"?: string,"mode"?: string,"previous_attempt_id"?: string | null,"revision"?: number,"status"?: Database["public"]['Enums']["work_status"],"student_id"?: string,"submitted_at"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "exercise_attempts_assignment_id_fkey"
      columns: ["assignment_id"]
isOneToOne: false
      referencedRelation: "assignments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "exercise_attempts_previous_attempt_id_fkey"
      columns: ["previous_attempt_id"]
isOneToOne: false
      referencedRelation: "exercise_attempts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "exercise_attempts_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"lesson_versions": {
                  Row: {
                    "activity_kind": string,"content": NonNullable<Json>,"created_at": string,"id": string,"lesson_key": string,"module_no": number,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "activity_kind": string,"content": NonNullable<Json>,"created_at"?: string,"id"?: string,"lesson_key": string,"module_no": number,"version": number
                  }
                  Update: {
                    "activity_kind"?: string,"content"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"lesson_key"?: string,"module_no"?: number,"version"?: number
                  }
                  Relationships: [
                    
                  ]
                },"milestone_reviews": {
                  Row: {
                    "created_at": string,"feedback": string,"id": string,"milestone_id": string,"observation": string,"result": Database["public"]['Enums']["review_result"],"teacher_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"feedback": string,"id"?: string,"milestone_id": string,"observation"?: string,"result": Database["public"]['Enums']["review_result"],"teacher_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"feedback"?: string,"id"?: string,"milestone_id"?: string,"observation"?: string,"result"?: Database["public"]['Enums']["review_result"],"teacher_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "milestone_reviews_milestone_id_fkey"
      columns: ["milestone_id"]
isOneToOne: true
      referencedRelation: "project_milestones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "milestone_reviews_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"display_name": string,"id": string,"locale": Database["public"]['Enums']["locale_code"],"role": Database["public"]['Enums']["app_role"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"display_name": string,"id": string,"locale"?: Database["public"]['Enums']["locale_code"],"role"?: Database["public"]['Enums']["app_role"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string,"id"?: string,"locale"?: Database["public"]['Enums']["locale_code"],"role"?: Database["public"]['Enums']["app_role"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"project_milestones": {
                  Row: {
                    "body": NonNullable<Json>,"created_at": string,"id": string,"kind": Database["public"]['Enums']["milestone_kind"],"revision": number,"status": Database["public"]['Enums']["work_status"],"submitted_at": string | null,"submitted_by": string | null,"team_id": string,"updated_at": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"kind": Database["public"]['Enums']["milestone_kind"],"revision"?: number,"status"?: Database["public"]['Enums']["work_status"],"submitted_at"?: string | null,"submitted_by"?: string | null,"team_id": string,"updated_at"?: string,"version"?: number
                  }
                  Update: {
                    "body"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["milestone_kind"],"revision"?: number,"status"?: Database["public"]['Enums']["work_status"],"submitted_at"?: string | null,"submitted_by"?: string | null,"team_id"?: string,"updated_at"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_milestones_submitted_by_fkey"
      columns: ["submitted_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_milestones_team_id_fkey"
      columns: ["team_id"]
isOneToOne: false
      referencedRelation: "teams"
      referencedColumns: ["id"]
    }
                  ]
                },"project_proposals": {
                  Row: {
                    "body": NonNullable<Json>,"created_at": string,"id": string,"revision": number,"status": Database["public"]['Enums']["work_status"],"submitted_at": string | null,"submitted_by": string | null,"team_id": string,"updated_at": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"revision"?: number,"status"?: Database["public"]['Enums']["work_status"],"submitted_at"?: string | null,"submitted_by"?: string | null,"team_id": string,"updated_at"?: string,"version"?: number
                  }
                  Update: {
                    "body"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"revision"?: number,"status"?: Database["public"]['Enums']["work_status"],"submitted_at"?: string | null,"submitted_by"?: string | null,"team_id"?: string,"updated_at"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_proposals_submitted_by_fkey"
      columns: ["submitted_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_proposals_team_id_fkey"
      columns: ["team_id"]
isOneToOne: false
      referencedRelation: "teams"
      referencedColumns: ["id"]
    }
                  ]
                },"proposal_reviews": {
                  Row: {
                    "created_at": string,"feedback": string,"id": string,"proposal_id": string,"result": Database["public"]['Enums']["proposal_result"],"teacher_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"feedback": string,"id"?: string,"proposal_id": string,"result": Database["public"]['Enums']["proposal_result"],"teacher_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"feedback"?: string,"id"?: string,"proposal_id"?: string,"result"?: Database["public"]['Enums']["proposal_result"],"teacher_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "proposal_reviews_proposal_id_fkey"
      columns: ["proposal_id"]
isOneToOne: true
      referencedRelation: "project_proposals"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "proposal_reviews_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"rubric_scores": {
                  Row: {
                    "class_id": string,"criterion": string,"feedback": string,"id": string,"points": number,"student_id": string | null,"teacher_id": string,"team_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "class_id": string,"criterion": string,"feedback"?: string,"id"?: string,"points": number,"student_id"?: string | null,"teacher_id"?: string,"team_id": string,"updated_at"?: string
                  }
                  Update: {
                    "class_id"?: string,"criterion"?: string,"feedback"?: string,"id"?: string,"points"?: number,"student_id"?: string | null,"teacher_id"?: string,"team_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "rubric_scores_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "rubric_scores_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "rubric_scores_team_id_class_id_fkey"
      columns: ["team_id","class_id"]
isOneToOne: false
      referencedRelation: "teams"
      referencedColumns: ["id","class_id"]
    }
                  ]
                },"survey_responses": {
                  Row: {
                    "answers": NonNullable<Json>,"assignment_id": string,"created_at": string,"id": string,"revision": number,"status": Database["public"]['Enums']["work_status"],"student_id": string,"submitted_at": string | null,"updated_at": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "answers"?: NonNullable<Json>,"assignment_id": string,"created_at"?: string,"id"?: string,"revision"?: number,"status"?: Database["public"]['Enums']["work_status"],"student_id"?: string,"submitted_at"?: string | null,"updated_at"?: string,"version"?: number
                  }
                  Update: {
                    "answers"?: NonNullable<Json>,"assignment_id"?: string,"created_at"?: string,"id"?: string,"revision"?: number,"status"?: Database["public"]['Enums']["work_status"],"student_id"?: string,"submitted_at"?: string | null,"updated_at"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "survey_responses_assignment_id_fkey"
      columns: ["assignment_id"]
isOneToOne: false
      referencedRelation: "assignments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "survey_responses_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"survey_versions": {
                  Row: {
                    "content": NonNullable<Json>,"created_at": string,"id": string,"survey_key": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "content": NonNullable<Json>,"created_at"?: string,"id"?: string,"survey_key": string,"version": number
                  }
                  Update: {
                    "content"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"survey_key"?: string,"version"?: number
                  }
                  Relationships: [
                    
                  ]
                },"team_members": {
                  Row: {
                    "class_id": string,"id": string,"joined_at": string,"left_at": string | null,"student_id": string,"team_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "class_id": string,"id"?: string,"joined_at"?: string,"left_at"?: string | null,"student_id": string,"team_id": string
                  }
                  Update: {
                    "class_id"?: string,"id"?: string,"joined_at"?: string,"left_at"?: string | null,"student_id"?: string,"team_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "team_members_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "team_members_team_id_class_id_fkey"
      columns: ["team_id","class_id"]
isOneToOne: false
      referencedRelation: "teams"
      referencedColumns: ["id","class_id"]
    }
                  ]
                },"teams": {
                  Row: {
                    "class_id": string,"created_at": string,"id": string,"name": string,"size_exception_reason": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "class_id": string,"created_at"?: string,"id"?: string,"name": string,"size_exception_reason"?: string | null
                  }
                  Update: {
                    "class_id"?: string,"created_at"?: string,"id"?: string,"name"?: string,"size_exception_reason"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "teams_class_id_fkey"
      columns: ["class_id"]
isOneToOne: false
      referencedRelation: "classes"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "class_roster_names":
{ Args: { "p_class_id": string }; Returns: {
              "display_name": string,"student_id": string
            }[]
                           },
"log_export":
{ Args: { "p_class_id": string,"p_kind": string }; Returns: boolean
                           },
"redeem_class_code":
{ Args: { "p_code": string }; Returns: boolean
                           },
"rotate_class_code":
{ Args: { "p_class_id": string,"p_days"?: number,"p_max_uses"?: number }; Returns: string
                           },
"team_roster":
{ Args: { "p_team_id": string }; Returns: {
              "display_name": string,"student_id": string
            }[]
                           }
          }
          Enums: {
            "app_role": "teacher"|"student","assignment_kind": "lesson"|"survey","enrollment_status": "pending"|"approved"|"rejected"|"withdrawn","locale_code": "id"|"en","milestone_kind": "prototype"|"playable_loop"|"final","proposal_result": "approved"|"changes_requested","review_result": "accepted"|"needs_revision","work_status": "draft"|"submitted"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "app_role": ["teacher", "student"],"assignment_kind": ["lesson", "survey"],"enrollment_status": ["pending", "approved", "rejected", "withdrawn"],"locale_code": ["id", "en"],"milestone_kind": ["prototype", "playable_loop", "final"],"proposal_result": ["approved", "changes_requested"],"review_result": ["accepted", "needs_revision"],"work_status": ["draft", "submitted"]
          }
        }
} as const
