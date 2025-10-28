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
      assessment_notification_queue: {
        Row: {
          child_name: string
          created_at: string
          id: string
          notification_sent_at: string | null
          parent_email: string
          parent_name: string
          session_date: string
          status: string | null
          swimmer_id: string
        }
        Insert: {
          child_name: string
          created_at?: string
          id?: string
          notification_sent_at?: string | null
          parent_email: string
          parent_name: string
          session_date: string
          status?: string | null
          swimmer_id: string
        }
        Update: {
          child_name?: string
          created_at?: string
          id?: string
          notification_sent_at?: string | null
          parent_email?: string
          parent_name?: string
          session_date?: string
          status?: string | null
          swimmer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_notification_queue_swimmer_id_fkey"
            columns: ["swimmer_id"]
            isOneToOne: false
            referencedRelation: "swimmers"
            referencedColumns: ["id"]
          },
        ]
      }
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
      blackout_dates: {
        Row: {
          blackout_date: string
          created_at: string | null
          created_by: string | null
          id: string
          reason: string | null
        }
        Insert: {
          blackout_date: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          reason?: string | null
        }
        Update: {
          blackout_date?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          cancel_reason: string | null
          cancel_source: string | null
          canceled_at: string | null
          canceled_by: string | null
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
          cancel_reason?: string | null
          cancel_source?: string | null
          canceled_at?: string | null
          canceled_by?: string | null
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
          cancel_reason?: string | null
          cancel_source?: string | null
          canceled_at?: string | null
          canceled_by?: string | null
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
      breaks: {
        Row: {
          active: boolean | null
          break_end: string
          break_start: string
          created_at: string | null
          created_by: string | null
          days_of_week: number[] | null
          id: string
          label: string | null
          location: string
        }
        Insert: {
          active?: boolean | null
          break_end: string
          break_start: string
          created_at?: string | null
          created_by?: string | null
          days_of_week?: number[] | null
          id?: string
          label?: string | null
          location: string
        }
        Update: {
          active?: boolean | null
          break_end?: string
          break_start?: string
          created_at?: string | null
          created_by?: string | null
          days_of_week?: number[] | null
          id?: string
          label?: string | null
          location?: string
        }
        Relationships: []
      }
      floating_session_notification_preferences: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      parent_invitations: {
        Row: {
          claimed: boolean | null
          claimed_at: string | null
          claimed_by: string | null
          created_at: string | null
          created_by: string | null
          expires_at: string
          id: string
          invitation_token: string
          parent_email: string
          swimmer_ids: string[]
        }
        Insert: {
          claimed?: boolean | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string
          id?: string
          invitation_token?: string
          parent_email: string
          swimmer_ids: string[]
        }
        Update: {
          claimed?: boolean | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string
          id?: string
          invitation_token?: string
          parent_email?: string
          swimmer_ids?: string[]
        }
        Relationships: []
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
      purchase_orders: {
        Row: {
          allowed_lessons: number
          assessment_id: string | null
          authorization_number: string | null
          coordinator_id: string | null
          created_at: string
          end_date: string
          id: string
          lessons_booked: number
          lessons_used: number
          notes: string | null
          parent_po_id: string | null
          po_type: string
          start_date: string
          status: string
          swimmer_id: string
          updated_at: string
        }
        Insert: {
          allowed_lessons?: number
          assessment_id?: string | null
          authorization_number?: string | null
          coordinator_id?: string | null
          created_at?: string
          end_date: string
          id?: string
          lessons_booked?: number
          lessons_used?: number
          notes?: string | null
          parent_po_id?: string | null
          po_type: string
          start_date: string
          status?: string
          swimmer_id: string
          updated_at?: string
        }
        Update: {
          allowed_lessons?: number
          assessment_id?: string | null
          authorization_number?: string | null
          coordinator_id?: string | null
          created_at?: string
          end_date?: string
          id?: string
          lessons_booked?: number
          lessons_used?: number
          notes?: string | null
          parent_po_id?: string | null
          po_type?: string
          start_date?: string
          status?: string
          swimmer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_parent_po_id_fkey"
            columns: ["parent_po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_swimmer_id_fkey"
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
      session_logs: {
        Row: {
          action: string
          allowed: boolean
          booking_id: string | null
          created_at: string | null
          id: string
          reason: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          action: string
          allowed: boolean
          booking_id?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          action?: string
          allowed?: boolean
          booking_id?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          allowed_swim_levels: string[] | null
          batch_id: string | null
          blackout_flag: boolean | null
          booking_count: number | null
          created_at: string
          day_of_week: number | null
          end_time: string
          id: string
          instructor_id: string | null
          is_full: boolean | null
          is_recurring: boolean | null
          location: string | null
          max_capacity: number
          month_year: string | null
          notes_tags: string | null
          open_at: string | null
          price_cents: number
          recurrence_pattern: string | null
          session_type: string
          session_type_detail: string | null
          start_time: string
          status: string
          updated_at: string
          weekday: string | null
        }
        Insert: {
          allowed_swim_levels?: string[] | null
          batch_id?: string | null
          blackout_flag?: boolean | null
          booking_count?: number | null
          created_at?: string
          day_of_week?: number | null
          end_time: string
          id?: string
          instructor_id?: string | null
          is_full?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          max_capacity?: number
          month_year?: string | null
          notes_tags?: string | null
          open_at?: string | null
          price_cents: number
          recurrence_pattern?: string | null
          session_type: string
          session_type_detail?: string | null
          start_time: string
          status?: string
          updated_at?: string
          weekday?: string | null
        }
        Update: {
          allowed_swim_levels?: string[] | null
          batch_id?: string | null
          blackout_flag?: boolean | null
          booking_count?: number | null
          created_at?: string
          day_of_week?: number | null
          end_time?: string
          id?: string
          instructor_id?: string | null
          is_full?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          max_capacity?: number
          month_year?: string | null
          notes_tags?: string | null
          open_at?: string | null
          price_cents?: number
          recurrence_pattern?: string | null
          session_type?: string
          session_type_detail?: string | null
          start_time?: string
          status?: string
          updated_at?: string
          weekday?: string | null
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
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
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
          decline_reason: string | null
          declined_at: string | null
          declined_by: string | null
          diagnosis: string[] | null
          elopement_description: string | null
          elopement_history: boolean | null
          end_date: string | null
          enrollment_completed: boolean | null
          enrollment_status: string | null
          first_name: string
          flexible_swimmer: boolean | null
          flexible_swimmer_reason: string | null
          flexible_swimmer_set_at: string | null
          flexible_swimmer_set_by: string | null
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
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
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
          decline_reason?: string | null
          declined_at?: string | null
          declined_by?: string | null
          diagnosis?: string[] | null
          elopement_description?: string | null
          elopement_history?: boolean | null
          end_date?: string | null
          enrollment_completed?: boolean | null
          enrollment_status?: string | null
          first_name: string
          flexible_swimmer?: boolean | null
          flexible_swimmer_reason?: string | null
          flexible_swimmer_set_at?: string | null
          flexible_swimmer_set_by?: string | null
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
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
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
          decline_reason?: string | null
          declined_at?: string | null
          declined_by?: string | null
          diagnosis?: string[] | null
          elopement_description?: string | null
          elopement_history?: boolean | null
          end_date?: string | null
          enrollment_completed?: boolean | null
          enrollment_status?: string | null
          first_name?: string
          flexible_swimmer?: boolean | null
          flexible_swimmer_reason?: string | null
          flexible_swimmer_set_at?: string | null
          flexible_swimmer_set_by?: string | null
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
      vmrc_referral_requests: {
        Row: {
          additional_info: string | null
          admin_approved_at: string | null
          admin_notes: string | null
          assessment_booking_sent_at: string | null
          availability_general: string[] | null
          availability_other: string | null
          child_age: number
          child_name: string
          coordinator_completed_at: string | null
          coordinator_email: string | null
          coordinator_name: string | null
          coordinator_notes: string | null
          created_at: string
          id: string
          liability_agreement: boolean
          motivation_factors: string | null
          parent_email: string
          parent_name: string
          parent_phone: string
          photo_release: boolean | null
          previous_swim_lessons: boolean | null
          referral_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          strengths_interests: string | null
          swim_goals: string[] | null
          swimmer_id: string | null
          swimmer_photo_url: string | null
        }
        Insert: {
          additional_info?: string | null
          admin_approved_at?: string | null
          admin_notes?: string | null
          assessment_booking_sent_at?: string | null
          availability_general?: string[] | null
          availability_other?: string | null
          child_age: number
          child_name: string
          coordinator_completed_at?: string | null
          coordinator_email?: string | null
          coordinator_name?: string | null
          coordinator_notes?: string | null
          created_at?: string
          id?: string
          liability_agreement?: boolean
          motivation_factors?: string | null
          parent_email: string
          parent_name: string
          parent_phone: string
          photo_release?: boolean | null
          previous_swim_lessons?: boolean | null
          referral_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          strengths_interests?: string | null
          swim_goals?: string[] | null
          swimmer_id?: string | null
          swimmer_photo_url?: string | null
        }
        Update: {
          additional_info?: string | null
          admin_approved_at?: string | null
          admin_notes?: string | null
          assessment_booking_sent_at?: string | null
          availability_general?: string[] | null
          availability_other?: string | null
          child_age?: number
          child_name?: string
          coordinator_completed_at?: string | null
          coordinator_email?: string | null
          coordinator_name?: string | null
          coordinator_notes?: string | null
          created_at?: string
          id?: string
          liability_agreement?: boolean
          motivation_factors?: string | null
          parent_email?: string
          parent_name?: string
          parent_phone?: string
          photo_release?: boolean | null
          previous_swim_lessons?: boolean | null
          referral_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          strengths_interests?: string | null
          swim_goals?: string[] | null
          swimmer_id?: string | null
          swimmer_photo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vmrc_referral_requests_swimmer_id_fkey"
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
      can_cancel_booking: {
        Args: {
          _booking_id: string
          _user_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      generate_client_number: { Args: never; Returns: string }
      get_last_sunday_of_month: {
        Args: { month: number; year: number }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      should_sessions_open: {
        Args: never
        Returns: {
          session_id: string
          session_start_time: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "instructor" | "parent" | "vmrc_coordinator"
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
      app_role: ["admin", "instructor", "parent", "vmrc_coordinator"],
    },
  },
} as const
