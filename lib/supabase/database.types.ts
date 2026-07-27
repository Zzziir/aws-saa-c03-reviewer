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
  public: {
    Tables: {
      active_session: {
        Row: {
          answers: Json
          client_session_id: string
          config: Json
          current_index: number
          elapsed_sec: number
          finished: boolean
          paused: boolean
          question_ids: number[]
          segment_start: string | null
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          client_session_id: string
          config: Json
          current_index?: number
          elapsed_sec?: number
          finished?: boolean
          paused?: boolean
          question_ids: number[]
          segment_start?: string | null
          started_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          client_session_id?: string
          config?: Json
          current_index?: number
          elapsed_sec?: number
          finished?: boolean
          paused?: boolean
          question_ids?: number[]
          segment_start?: string | null
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      attempt_answers: {
        Row: {
          attempt_id: string
          correct: boolean
          difficulty: Database["public"]["Enums"]["difficulty"]
          domain: Database["public"]["Enums"]["domain"]
          flagged: boolean
          id: string
          position: number
          question_id: number
          selected: Json
          user_id: string
        }
        Insert: {
          attempt_id: string
          correct: boolean
          difficulty: Database["public"]["Enums"]["difficulty"]
          domain: Database["public"]["Enums"]["domain"]
          flagged?: boolean
          id?: string
          position: number
          question_id: number
          selected?: Json
          user_id: string
        }
        Update: {
          attempt_id?: string
          correct?: boolean
          difficulty?: Database["public"]["Enums"]["difficulty"]
          domain?: Database["public"]["Enums"]["domain"]
          flagged?: boolean
          id?: string
          position?: number
          question_id?: number
          selected?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      attempts: {
        Row: {
          client_id: string
          config: Json
          correct: number
          created_at: string
          duration_sec: number
          id: string
          mode: Database["public"]["Enums"]["quiz_mode"]
          occurred_at: string
          passed: boolean
          question_ids: number[]
          score_pct: number
          total: number
          user_id: string
        }
        Insert: {
          client_id: string
          config: Json
          correct: number
          created_at?: string
          duration_sec: number
          id?: string
          mode: Database["public"]["Enums"]["quiz_mode"]
          occurred_at: string
          passed: boolean
          question_ids: number[]
          score_pct: number
          total: number
          user_id: string
        }
        Update: {
          client_id?: string
          config?: Json
          correct?: number
          created_at?: string
          duration_sec?: number
          id?: string
          mode?: Database["public"]["Enums"]["quiz_mode"]
          occurred_at?: string
          passed?: boolean
          question_ids?: number[]
          score_pct?: number
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      flagged_questions: {
        Row: {
          flagged_at: string
          question_id: number
          user_id: string
        }
        Insert: {
          flagged_at?: string
          question_id: number
          user_id: string
        }
        Update: {
          flagged_at?: string
          question_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flagged_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          answer: Json
          created_at: string
          difficulty: Database["public"]["Enums"]["difficulty"]
          domain: Database["public"]["Enums"]["domain"]
          explanation: string
          id: number
          key_takeaway: string
          options: Json
          question: string
        }
        Insert: {
          answer: Json
          created_at?: string
          difficulty: Database["public"]["Enums"]["difficulty"]
          domain: Database["public"]["Enums"]["domain"]
          explanation: string
          id: number
          key_takeaway: string
          options: Json
          question: string
        }
        Update: {
          answer?: Json
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty"]
          domain?: Database["public"]["Enums"]["domain"]
          explanation?: string
          id?: number
          key_takeaway?: string
          options?: Json
          question?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          count: number
          difficulty: Database["public"]["Enums"]["difficulty_filter"]
          domains: Database["public"]["Enums"]["domain"][]
          duration_sec: number
          mode: Database["public"]["Enums"]["quiz_mode"]
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          difficulty?: Database["public"]["Enums"]["difficulty_filter"]
          domains?: Database["public"]["Enums"]["domain"][]
          duration_sec?: number
          mode?: Database["public"]["Enums"]["quiz_mode"]
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          difficulty?: Database["public"]["Enums"]["difficulty_filter"]
          domains?: Database["public"]["Enums"]["domain"][]
          duration_sec?: number
          mode?: Database["public"]["Enums"]["quiz_mode"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      record_attempt: {
        Args: {
          p_answers: Json
          p_client_id: string
          p_config: Json
          p_correct: number
          p_duration_sec: number
          p_mode: Database["public"]["Enums"]["quiz_mode"]
          p_occurred_at: string
          p_passed: boolean
          p_question_ids: number[]
          p_score_pct: number
          p_total: number
        }
        Returns: string
      }
    }
    Enums: {
      difficulty: "easy" | "medium" | "hard"
      difficulty_filter: "easy" | "medium" | "hard" | "mixed"
      domain: "secure" | "resilient" | "performance" | "cost"
      quiz_mode: "reviewer" | "exam"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
