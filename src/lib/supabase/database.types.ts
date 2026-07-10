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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          booking_window_days: number
          cancellation_cutoff_minutes: number
          id: number
          session_horizon_days: number
          updated_at: string
        }
        Insert: {
          booking_window_days?: number
          cancellation_cutoff_minutes?: number
          id?: number
          session_horizon_days?: number
          updated_at?: string
        }
        Update: {
          booking_window_days?: number
          cancellation_cutoff_minutes?: number
          id?: number
          session_horizon_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          booking_id: string | null
          checked_in_at: string
          checked_in_by: string | null
          id: string
          location_id: string
          member_id: string
          membership_id: string | null
          session_id: string
        }
        Insert: {
          booking_id?: string | null
          checked_in_at?: string
          checked_in_by?: string | null
          id?: string
          location_id: string
          member_id: string
          membership_id?: string | null
          session_id: string
        }
        Update: {
          booking_id?: string | null
          checked_in_at?: string
          checked_in_by?: string | null
          id?: string
          location_id?: string
          member_id?: string
          membership_id?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "membership_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_availability"
            referencedColumns: ["session_id"]
          },
        ]
      }
      benchmarks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booked_at: string
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          id: string
          member_id: string
          promoted_at: string | null
          session_id: string
          status: Database["public"]["Enums"]["booking_status"]
        }
        Insert: {
          booked_at?: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          id?: string
          member_id: string
          promoted_at?: string | null
          session_id: string
          status?: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          booked_at?: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          id?: string
          member_id?: string
          promoted_at?: string | null
          session_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: [
          {
            foreignKeyName: "bookings_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_availability"
            referencedColumns: ["session_id"]
          },
        ]
      }
      class_sessions: {
        Row: {
          capacity: number
          coach_id: string | null
          created_at: string
          ends_at: string
          id: string
          location_id: string
          name: string
          session_date: string
          starts_at: string
          status: Database["public"]["Enums"]["session_status"]
          template_id: string | null
          updated_at: string
          workout_id: string | null
        }
        Insert: {
          capacity: number
          coach_id?: string | null
          created_at?: string
          ends_at: string
          id?: string
          location_id: string
          name: string
          session_date: string
          starts_at: string
          status?: Database["public"]["Enums"]["session_status"]
          template_id?: string | null
          updated_at?: string
          workout_id?: string | null
        }
        Update: {
          capacity?: number
          coach_id?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          location_id?: string
          name?: string
          session_date?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          template_id?: string | null
          updated_at?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "class_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      class_templates: {
        Row: {
          cancellation_cutoff_minutes: number | null
          capacity: number
          coach_id: string | null
          created_at: string
          day_of_week: number
          duration_minutes: number
          id: string
          is_active: boolean
          location_id: string
          name: string
          start_time: string
          updated_at: string
        }
        Insert: {
          cancellation_cutoff_minutes?: number | null
          capacity: number
          coach_id?: string | null
          created_at?: string
          day_of_week: number
          duration_minutes?: number
          id?: string
          is_active?: boolean
          location_id: string
          name: string
          start_time: string
          updated_at?: string
        }
        Update: {
          cancellation_cutoff_minutes?: number | null
          capacity?: number
          coach_id?: string | null
          created_at?: string
          day_of_week?: number
          duration_minutes?: number
          id?: string
          is_active?: boolean
          location_id?: string
          name?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_templates_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_templates_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_templates_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category: Database["public"]["Enums"]["exercise_category"]
          created_at: string
          demo_url: string | null
          id: string
          is_active: boolean
          is_tracked_lift: boolean
          name_en: string
          name_th: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["exercise_category"]
          created_at?: string
          demo_url?: string | null
          id?: string
          is_active?: boolean
          is_tracked_lift?: boolean
          name_en: string
          name_th?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["exercise_category"]
          created_at?: string
          demo_url?: string | null
          id?: string
          is_active?: boolean
          is_tracked_lift?: boolean
          name_en?: string
          name_th?: string | null
        }
        Relationships: []
      }
      holds: {
        Row: {
          created_at: string
          created_by: string | null
          ends_on: string
          id: string
          membership_id: string
          reason: string | null
          starts_on: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ends_on: string
          id?: string
          membership_id: string
          reason?: string | null
          starts_on: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ends_on?: string
          id?: string
          membership_id?: string
          reason?: string | null
          starts_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "holds_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holds_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holds_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "membership_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holds_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          created_at: string
          created_by: string
          email: string | null
          expires_at: string
          note: string | null
          role: Database["public"]["Enums"]["user_role"]
          token: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          email?: string | null
          expires_at?: string
          note?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string | null
          expires_at?: string
          note?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          timezone: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          timezone?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          timezone?: string
        }
        Relationships: []
      }
      membership_plans: {
        Row: {
          created_at: string
          duration_months: number | null
          id: string
          is_active: boolean
          name_en: string
          name_th: string
          plan_type: Database["public"]["Enums"]["plan_type"]
          price_thb: number
          sort_order: number
          visit_count: number | null
          weekly_visit_limit: number | null
        }
        Insert: {
          created_at?: string
          duration_months?: number | null
          id?: string
          is_active?: boolean
          name_en: string
          name_th: string
          plan_type: Database["public"]["Enums"]["plan_type"]
          price_thb: number
          sort_order?: number
          visit_count?: number | null
          weekly_visit_limit?: number | null
        }
        Update: {
          created_at?: string
          duration_months?: number | null
          id?: string
          is_active?: boolean
          name_en?: string
          name_th?: string
          plan_type?: Database["public"]["Enums"]["plan_type"]
          price_thb?: number
          sort_order?: number
          visit_count?: number | null
          weekly_visit_limit?: number | null
        }
        Relationships: []
      }
      memberships: {
        Row: {
          cancelled_at: string | null
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          member_id: string
          note: string | null
          plan_id: string
          start_date: string
          visits_remaining: number | null
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          member_id: string
          note?: string | null
          plan_id: string
          start_date: string
          visits_remaining?: number | null
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          member_id?: string
          note?: string | null
          plan_id?: string
          start_date?: string
          visits_remaining?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "memberships_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          member_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          member_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          member_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_outbox: {
        Row: {
          created_at: string
          id: string
          kind: string
          member_id: string
          payload: Json
          sent_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          member_id: string
          payload?: Json
          sent_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          member_id?: string
          payload?: Json
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_outbox_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_outbox_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_thb: number
          created_at: string
          id: string
          membership_id: string
          method: Database["public"]["Enums"]["payment_method"]
          note: string | null
          paid_on: string
          recorded_by: string
        }
        Insert: {
          amount_thb: number
          created_at?: string
          id?: string
          membership_id: string
          method: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          paid_on: string
          recorded_by: string
        }
        Update: {
          amount_thb?: number
          created_at?: string
          id?: string
          membership_id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          paid_on?: string
          recorded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "membership_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          nickname: string | null
          phone: string | null
          preferred_language: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          is_active?: boolean
          nickname?: string | null
          phone?: string | null
          preferred_language?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          nickname?: string | null
          phone?: string | null
          preferred_language?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prs: {
        Row: {
          achieved_on: string
          benchmark_id: string | null
          created_at: string
          exercise_id: string | null
          id: string
          is_rx: boolean
          kind: Database["public"]["Enums"]["pr_kind"]
          member_id: string
          result_id: string
          score_type: Database["public"]["Enums"]["score_type"]
          value: number
        }
        Insert: {
          achieved_on: string
          benchmark_id?: string | null
          created_at?: string
          exercise_id?: string | null
          id?: string
          is_rx: boolean
          kind: Database["public"]["Enums"]["pr_kind"]
          member_id: string
          result_id: string
          score_type: Database["public"]["Enums"]["score_type"]
          value: number
        }
        Update: {
          achieved_on?: string
          benchmark_id?: string | null
          created_at?: string
          exercise_id?: string | null
          id?: string
          is_rx?: boolean
          kind?: Database["public"]["Enums"]["pr_kind"]
          member_id?: string
          result_id?: string
          score_type?: Database["public"]["Enums"]["score_type"]
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "prs_benchmark_id_fkey"
            columns: ["benchmark_id"]
            isOneToOne: false
            referencedRelation: "benchmarks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prs_result_id_fkey"
            columns: ["result_id"]
            isOneToOne: false
            referencedRelation: "results"
            referencedColumns: ["id"]
          },
        ]
      }
      results: {
        Row: {
          calories: number | null
          comment: string | null
          component_id: string
          created_at: string
          distance_m: number | null
          entered_by: string | null
          id: string
          is_pr: boolean
          is_rx: boolean
          load_kg: number | null
          member_id: string
          reps: number | null
          rounds: number | null
          score_type: Database["public"]["Enums"]["score_type"]
          session_id: string | null
          time_seconds: number | null
          updated_at: string
        }
        Insert: {
          calories?: number | null
          comment?: string | null
          component_id: string
          created_at?: string
          distance_m?: number | null
          entered_by?: string | null
          id?: string
          is_pr?: boolean
          is_rx?: boolean
          load_kg?: number | null
          member_id: string
          reps?: number | null
          rounds?: number | null
          score_type: Database["public"]["Enums"]["score_type"]
          session_id?: string | null
          time_seconds?: number | null
          updated_at?: string
        }
        Update: {
          calories?: number | null
          comment?: string | null
          component_id?: string
          created_at?: string
          distance_m?: number | null
          entered_by?: string | null
          id?: string
          is_pr?: boolean
          is_rx?: boolean
          load_kg?: number | null
          member_id?: string
          reps?: number | null
          rounds?: number | null
          score_type?: Database["public"]["Enums"]["score_type"]
          session_id?: string | null
          time_seconds?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "results_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "workout_components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_availability"
            referencedColumns: ["session_id"]
          },
        ]
      }
      workout_component_exercises: {
        Row: {
          component_id: string
          exercise_id: string
          position: number
        }
        Insert: {
          component_id: string
          exercise_id: string
          position?: number
        }
        Update: {
          component_id?: string
          exercise_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_component_exercises_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "workout_components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_component_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_components: {
        Row: {
          created_at: string
          description: string
          id: string
          kind: Database["public"]["Enums"]["component_kind"]
          position: number
          score_type: Database["public"]["Enums"]["score_type"]
          title: string | null
          workout_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          kind?: Database["public"]["Enums"]["component_kind"]
          position?: number
          score_type?: Database["public"]["Enums"]["score_type"]
          title?: string | null
          workout_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          kind?: Database["public"]["Enums"]["component_kind"]
          position?: number
          score_type?: Database["public"]["Enums"]["score_type"]
          title?: string | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_components_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          benchmark_id: string | null
          coach_notes: string | null
          created_at: string
          created_by: string | null
          id: string
          location_id: string | null
          published: boolean
          reveal_at: string | null
          scheduled_on: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          benchmark_id?: string | null
          coach_notes?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location_id?: string | null
          published?: boolean
          reveal_at?: string | null
          scheduled_on?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          benchmark_id?: string | null
          coach_notes?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location_id?: string | null
          published?: boolean
          reveal_at?: string | null
          scheduled_on?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_benchmark_id_fkey"
            columns: ["benchmark_id"]
            isOneToOne: false
            referencedRelation: "benchmarks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      member_directory: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string | null
          nickname: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
          nickname?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
          nickname?: string | null
        }
        Relationships: []
      }
      membership_summaries: {
        Row: {
          cancelled_at: string | null
          duration_months: number | null
          end_date: string | null
          id: string | null
          member_id: string | null
          note: string | null
          plan_id: string | null
          plan_name_en: string | null
          plan_name_th: string | null
          plan_type: Database["public"]["Enums"]["plan_type"] | null
          price_thb: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["membership_status"] | null
          upcoming_hold: Json | null
          visit_count: number | null
          visits_remaining: number | null
          weekly_visit_limit: number | null
        }
        Relationships: [
          {
            foreignKeyName: "memberships_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      session_availability: {
        Row: {
          booked_count: number | null
          capacity: number | null
          session_id: string | null
          waitlist_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_create_hold: {
        Args: {
          p_ends_on: string
          p_membership_id: string
          p_reason?: string
          p_starts_on: string
        }
        Returns: Json
      }
      admin_delete_hold: { Args: { p_hold_id: string }; Returns: Json }
      admin_record_renewal: {
        Args: {
          p_amount_thb: number
          p_membership_id: string
          p_method: Database["public"]["Enums"]["payment_method"]
          p_note?: string
          p_paid_on: string
        }
        Returns: Json
      }
      bkk_today: { Args: never; Returns: string }
      bkk_week_start: { Args: { ts: string }; Returns: string }
      book_class: {
        Args: { p_member_id?: string; p_session_id: string }
        Returns: Json
      }
      bootstrap_first_admin: { Args: never; Returns: boolean }
      cancel_booking: { Args: { p_booking_id: string }; Returns: Json }
      check_in: {
        Args: { p_member_id?: string; p_session_id: string }
        Returns: Json
      }
      current_membership: {
        Args: { p_date?: string; p_member: string }
        Returns: {
          cancelled_at: string | null
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          member_id: string
          note: string | null
          plan_id: string
          start_date: string
          visits_remaining: number | null
        }
        SetofOptions: {
          from: "*"
          to: "memberships"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      evaluate_pr_lanes: {
        Args: { r: Database["public"]["Tables"]["results"]["Row"] }
        Returns: Json
      }
      generate_sessions: { Args: { p_horizon_days?: number }; Returns: number }
      is_admin: { Args: never; Returns: boolean }
      is_approved: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      membership_check: {
        Args: { p_member: string; p_session_starts: string }
        Returns: Json
      }
      membership_status_of: {
        Args: { m: Database["public"]["Tables"]["memberships"]["Row"] }
        Returns: Database["public"]["Enums"]["membership_status"]
      }
      result_norm_value: {
        Args: { r: Database["public"]["Tables"]["results"]["Row"] }
        Returns: number
      }
      undo_check_in: { Args: { p_attendance_id: string }; Returns: Json }
    }
    Enums: {
      booking_status: "booked" | "waitlisted" | "cancelled" | "late_cancelled"
      component_kind:
        | "warmup"
        | "strength"
        | "skill"
        | "metcon"
        | "cooldown"
        | "other"
      exercise_category:
        | "squat"
        | "hinge"
        | "press"
        | "pull"
        | "olympic_lift"
        | "gymnastics"
        | "monostructural"
        | "core"
        | "other"
      membership_status: "active" | "expiring_soon" | "expired" | "on_hold"
      payment_method: "cash" | "transfer" | "promptpay" | "other"
      plan_type: "unlimited" | "weekly_limited" | "visit_pack" | "drop_in"
      pr_kind: "benchmark" | "lift"
      score_type:
        | "time"
        | "rounds_reps"
        | "load"
        | "reps"
        | "distance"
        | "calories"
        | "none"
      session_status: "scheduled" | "cancelled"
      user_role: "admin" | "coach" | "member"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      booking_status: ["booked", "waitlisted", "cancelled", "late_cancelled"],
      component_kind: [
        "warmup",
        "strength",
        "skill",
        "metcon",
        "cooldown",
        "other",
      ],
      exercise_category: [
        "squat",
        "hinge",
        "press",
        "pull",
        "olympic_lift",
        "gymnastics",
        "monostructural",
        "core",
        "other",
      ],
      membership_status: ["active", "expiring_soon", "expired", "on_hold"],
      payment_method: ["cash", "transfer", "promptpay", "other"],
      plan_type: ["unlimited", "weekly_limited", "visit_pack", "drop_in"],
      pr_kind: ["benchmark", "lift"],
      score_type: [
        "time",
        "rounds_reps",
        "load",
        "reps",
        "distance",
        "calories",
        "none",
      ],
      session_status: ["scheduled", "cancelled"],
      user_role: ["admin", "coach", "member"],
    },
  },
} as const
