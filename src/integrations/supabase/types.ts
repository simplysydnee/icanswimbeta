export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      assessments: {
        Row: {
          approval_deadline: string | null
          approval_notes: string | null
          approval_status: string | null
          approved_by: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          instructor_notes: string | null
          scheduled_date: string
          session_id: string | null
          status: string
          swimmer_id: string
          updated_at: string
        }
        Insert: {
          approval_deadline?: string | null
          approval_notes?: string | null
          approval_status?: string | null
          approved_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          instructor_notes?: string | null
          scheduled_date: string
          session_id?: string | null
          status?: string
          swimmer_id: string
          updated_at?: string
        }
        Update: {
          approval_deadline?: string | null
          approval_notes?: string | null
          approval_status?: string | null
          approved_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          instructor_notes?: string | null
          scheduled_date?: string
          session_id?: string | null
          status?: string
          swimmer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_swimmer_id_fkey"
            columns: ["swimmer_id"]
            isOneToOne: false
            referencedRelation: "swimmers"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          parent_id: string
          session_id: string
          status: string
          swimmer_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          parent_id: string
          session_id: string
          status?: string
          swimmer_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          parent_id?: string
          session_id?: string
          status?: string
          swimmer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_swimmer_id_fkey"
            columns: ["swimmer_id"]
            isOneToOne: false
            referencedRelation: "swimmers"
            referencedColumns: ["id"]
          },
        ]
      }
      floating_sessions: {
        Row: {
          available_until: string
          claimed_by: string | null
          created_at: string
          id: string
          month_year: string | null
          notification_sent: boolean | null
          original_session_id: string
        }
        Insert: {
          available_until: string
          claimed_by?: string | null
          created_at?: string
          id?: string
          month_year?: string | null
          notification_sent?: boolean | null
          original_session_id: string
        }
        Update: {
          available_until?: string
          claimed_by?: string | null
          created_at?: string
          id?: string
          month_year?: string | null
          notification_sent?: boolean | null
          original_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "floating_sessions_original_session_id_fkey"
            columns: ["original_session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      progress_videos: {
        Row: {
          created_at: string
          id: string
          instructor_notes: string | null
          skill_focus: string | null
          swimmer_id: string
          uploaded_by: string
          video_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_notes?: string | null
          skill_focus?: string | null
          swimmer_id: string
          uploaded_by: string
          video_url: string
        }
        Update: {
          created_at?: string
          id?: string
          instructor_notes?: string | null
          skill_focus?: string | null
          swimmer_id?: string
          uploaded_by?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_videos_swimmer_id_fkey"
            columns: ["swimmer_id"]
            isOneToOne: false
            referencedRelation: "swimmers"
            referencedColumns: ["id"]
          },
        ]
      }
      session_attendance: {
        Row: {
          attended: boolean | null
          booking_id: string
          created_at: string
          id: string
          instructor_notes: string | null
          marked_at: string | null
          marked_by: string | null
          session_id: string
          swimmer_id: string
        }
        Insert: {
          attended?: boolean | null
          booking_id: string
          created_at?: string
          id?: string
          instructor_notes?: string | null
          marked_at?: string | null
          marked_by?: string | null
          session_id: string
          swimmer_id: string
        }
        Update: {
          attended?: boolean | null
          booking_id?: string
          created_at?: string
          id?: string
          instructor_notes?: string | null
          marked_at?: string | null
          marked_by?: string | null
          session_id?: string
          swimmer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_attendance_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendance_swimmer_id_fkey"
            columns: ["swimmer_id"]
            isOneToOne: false
            referencedRelation: "swimmers"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          day_of_week: number | null
          end_time: string
          id: string
          instructor_id: string | null
          is_recurring: boolean | null
          location: string | null
          max_capacity: number
          month_year: string | null
          price_cents: number
          recurrence_pattern: string | null
          session_type: string
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          end_time: string
          id?: string
          instructor_id?: string | null
          is_recurring?: boolean | null
          location?: string | null
          max_capacity?: number
          month_year?: string | null
          price_cents: number
          recurrence_pattern?: string | null
          session_type: string
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          end_time?: string
          id?: string
          instructor_id?: string | null
          is_recurring?: boolean | null
          location?: string | null
          max_capacity?: number
          month_year?: string | null
          price_cents?: number
          recurrence_pattern?: string | null
          session_type?: string
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          created_at: string
          description: string | null
          id: string
          level_id: string
          name: string
          sequence: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          level_id: string
          name: string
          sequence: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          level_id?: string
          name?: string
          sequence?: number
        }
        Relationships: [
          {
            foreignKeyName: "skills_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "swim_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      swim_levels: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          id: string
          name: string
          sequence: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          name: string
          sequence: number
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          name?: string
          sequence?: number
        }
        Relationships: []
      }
      swimmer_skills: {
        Row: {
          created_at: string
          date_mastered: string | null
          id: string
          instructor_notes: string | null
          skill_id: string
          status: string
          swimmer_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_mastered?: string | null
          id?: string
          instructor_notes?: string | null
          skill_id: string
          status?: string
          swimmer_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_mastered?: string | null
          id?: string
          instructor_notes?: string | null
          skill_id?: string
          status?: string
          swimmer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "swimmer_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swimmer_skills_swimmer_id_fkey"
            columns: ["swimmer_id"]
            isOneToOne: false
            referencedRelation: "swimmers"
            referencedColumns: ["id"]
          },
        ]
      }
      swimmers: {
        Row: {
          aggressive_behavior: boolean | null
          aggressive_behavior_description: string | null
          agreed_to_cancellation_policy: boolean | null
          allergies_description: string | null
          assessment_status: string | null
          attendance_standing: string | null
          availability_general: string[] | null
          availability_other: string | null
          behavior_plan_description: string | null
          client_booking_limit: number | null
          client_number: string | null
          comfortable_in_water: string | null
          communication_type: string | null
          created_at: string
          created_by: string | null
          current_level_id: string | null
          date_of_birth: string
          diagnosis: string[] | null
          elopement_description: string | null
          elopement_history: boolean | null
          end_date: string | null
          enrollment_completed: boolean | null
          enrollment_status: string | null
          first_name: string
          gender: string | null
          goals: string | null
          has_allergies: boolean | null
          has_behavior_plan: boolean | null
          has_medical_conditions: boolean | null
          height: string | null
          history_of_seizures: boolean | null
          id: string
          is_vmrc_client: boolean | null
          last_name: string
          last_status_update: string | null
          medical_conditions_description: string | null
          non_ambulatory: boolean | null
          other_therapies: boolean | null
          parent_enrolled: boolean | null
          parent_id: string
          parent_phone: string | null
          payment_type: string
          photo_release: boolean | null
          photo_url: string | null
          previous_swim_lessons: boolean | null
          restraint_description: string | null
          restraint_history: boolean | null
          self_injurious_behavior: boolean | null
          self_injurious_description: string | null
          signed_liability: string | null
          signed_photo_release: string | null
          signed_waiver: boolean | null
          sms_policy_consent: boolean | null
          start_date: string | null
          strengths_interests: string | null
          swim_goals: string[] | null
          therapies_description: string | null
          toilet_trained: boolean | null
          updated_at: string
          vmrc_coordinator_email: string | null
          vmrc_coordinator_name: string | null
          vmrc_coordinator_phone: string | null
          vmrc_current_pos_number: string | null
          vmrc_pos_expires_at: string | null
          vmrc_pos_updated_at: string | null
          vmrc_pos_updated_by: string | null
          vmrc_referral_url: string | null
          vmrc_sessions_authorized: number | null
          vmrc_sessions_used: number | null
          waitlist: boolean
          weight: string | null
        }
        Insert: {
          aggressive_behavior?: boolean | null
          aggressive_behavior_description?: string | null
          agreed_to_cancellation_policy?: boolean | null
          allergies_description?: string | null
          assessment_status?: string | null
          attendance_standing?: string | null
          availability_general?: string[] | null
          availability_other?: string | null
          behavior_plan_description?: string | null
          client_booking_limit?: number | null
          client_number?: string | null
          comfortable_in_water?: string | null
          communication_type?: string | null
          created_at?: string
          created_by?: string | null
          current_level_id?: string | null
          date_of_birth: string
          diagnosis?: string[] | null
          elopement_description?: string | null
          elopement_history?: boolean | null
          end_date?: string | null
          enrollment_completed?: boolean | null
          enrollment_status?: string | null
          first_name: string
          gender?: string | null
          goals?: string | null
          has_allergies?: boolean | null
          has_behavior_plan?: boolean | null
          has_medical_conditions?: boolean | null
          height?: string | null
          history_of_seizures?: boolean | null
          id?: string
          is_vmrc_client?: boolean | null
          last_name: string
          last_status_update?: string | null
          medical_conditions_description?: string | null
          non_ambulatory?: boolean | null
          other_therapies?: boolean | null
          parent_enrolled?: boolean | null
          parent_id: string
          parent_phone?: string | null
          payment_type?: string
          photo_release?: boolean | null
          photo_url?: string | null
          previous_swim_lessons?: boolean | null
          restraint_description?: string | null
          restraint_history?: boolean | null
          self_injurious_behavior?: boolean | null
          self_injurious_description?: string | null
          signed_liability?: string | null
          signed_photo_release?: string | null
          signed_waiver?: boolean | null
          sms_policy_consent?: boolean | null
          start_date?: string | null
          strengths_interests?: string | null
          swim_goals?: string[] | null
          therapies_description?: string | null
          toilet_trained?: boolean | null
          updated_at?: string
          vmrc_coordinator_email?: string | null
          vmrc_coordinator_name?: string | null
          vmrc_coordinator_phone?: string | null
          vmrc_current_pos_number?: string | null
          vmrc_pos_expires_at?: string | null
          vmrc_pos_updated_at?: string | null
          vmrc_pos_updated_by?: string | null
          vmrc_referral_url?: string | null
          vmrc_sessions_authorized?: number | null
          vmrc_sessions_used?: number | null
          waitlist?: boolean
          weight?: string | null
        }
        Update: {
          aggressive_behavior?: boolean | null
          aggressive_behavior_description?: string | null
          agreed_to_cancellation_policy?: boolean | null
          allergies_description?: string | null
          assessment_status?: string | null
          attendance_standing?: string | null
          availability_general?: string[] | null
          availability_other?: string | null
          behavior_plan_description?: string | null
          client_booking_limit?: number | null
          client_number?: string | null
          comfortable_in_water?: string | null
          communication_type?: string | null
          created_at?: string
          created_by?: string | null
          current_level_id?: string | null
          date_of_birth?: string
          diagnosis?: string[] | null
          elopement_description?: string | null
          elopement_history?: boolean | null
          end_date?: string | null
          enrollment_completed?: boolean | null
          enrollment_status?: string | null
          first_name?: string
          gender?: string | null
          goals?: string | null
          has_allergies?: boolean | null
          has_behavior_plan?: boolean | null
          has_medical_conditions?: boolean | null
          height?: string | null
          history_of_seizures?: boolean | null
          id?: string
          is_vmrc_client?: boolean | null
          last_name?: string
          last_status_update?: string | null
          medical_conditions_description?: string | null
          non_ambulatory?: boolean | null
          other_therapies?: boolean | null
          parent_enrolled?: boolean | null
          parent_id?: string
          parent_phone?: string | null
          payment_type?: string
          photo_release?: boolean | null
          photo_url?: string | null
          previous_swim_lessons?: boolean | null
          restraint_description?: string | null
          restraint_history?: boolean | null
          self_injurious_behavior?: boolean | null
          self_injurious_description?: string | null
          signed_liability?: string | null
          signed_photo_release?: string | null
          signed_waiver?: boolean | null
          sms_policy_consent?: boolean | null
          start_date?: string | null
          strengths_interests?: string | null
          swim_goals?: string[] | null
          therapies_description?: string | null
          toilet_trained?: boolean | null
          updated_at?: string
          vmrc_coordinator_email?: string | null
          vmrc_coordinator_name?: string | null
          vmrc_coordinator_phone?: string | null
          vmrc_current_pos_number?: string | null
          vmrc_pos_expires_at?: string | null
          vmrc_pos_updated_at?: string | null
          vmrc_pos_updated_by?: string | null
          vmrc_referral_url?: string | null
          vmrc_sessions_authorized?: number | null
          vmrc_sessions_used?: number | null
          waitlist?: boolean
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "swimmers_current_level_id_fkey"
            columns: ["current_level_id"]
            isOneToOne: false
            referencedRelation: "swim_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vmrc_authorizations: {
        Row: {
          authorized_at: string
          authorized_by: string
          created_at: string
          expires_at: string | null
          id: string
          notes: string | null
          pos_number: string
          sessions_authorized: number
          swimmer_id: string
        }
        Insert: {
          authorized_at?: string
          authorized_by: string
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          pos_number: string
          sessions_authorized?: number
          swimmer_id: string
        }
        Update: {
          authorized_at?: string
          authorized_by?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          pos_number?: string
          sessions_authorized?: number
          swimmer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vmrc_authorizations_swimmer_id_fkey"
            columns: ["swimmer_id"]
            isOneToOne: false
            referencedRelation: "swimmers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_client_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "instructor" | "parent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "instructor", "parent"],
    },
  },
} as const
