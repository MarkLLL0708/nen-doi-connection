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
      answer_reactions: {
        Row: {
          answer_id: string
          couple_id: string
          created_at: string
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          answer_id: string
          couple_id: string
          created_at?: string
          id?: string
          kind: string
          user_id?: string
        }
        Update: {
          answer_id?: string
          couple_id?: string
          created_at?: string
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answer_reactions_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "question_answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_reactions_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      answer_replies: {
        Row: {
          answer_date: string
          body: string
          couple_id: string
          created_at: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          answer_date: string
          body: string
          couple_id: string
          created_at?: string
          id?: string
          question_id: string
          user_id?: string
        }
        Update: {
          answer_date?: string
          body?: string
          couple_id?: string
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answer_replies_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_replies_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "daily_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      capsules: {
        Row: {
          body: string
          couple_id: string
          created_at: string
          id: string
          notified_at: string | null
          opened_at: string | null
          photo_path: string | null
          recipient_id: string
          sealed_at: string | null
          sender_id: string
          status: string
          type: string
          unlock_on: string | null
          updated_at: string
          voice_path: string | null
          voice_seconds: number | null
        }
        Insert: {
          body?: string
          couple_id: string
          created_at?: string
          id?: string
          notified_at?: string | null
          opened_at?: string | null
          photo_path?: string | null
          recipient_id: string
          sealed_at?: string | null
          sender_id: string
          status?: string
          type: string
          unlock_on?: string | null
          updated_at?: string
          voice_path?: string | null
          voice_seconds?: number | null
        }
        Update: {
          body?: string
          couple_id?: string
          created_at?: string
          id?: string
          notified_at?: string | null
          opened_at?: string | null
          photo_path?: string | null
          recipient_id?: string
          sealed_at?: string | null
          sender_id?: string
          status?: string
          type?: string
          unlock_on?: string | null
          updated_at?: string
          voice_path?: string | null
          voice_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "capsules_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      category_requests: {
        Row: {
          couple_id: string
          created_at: string
          decided_at: string | null
          from_user: string
          id: string
          pack: string
          status: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          decided_at?: string | null
          from_user: string
          id?: string
          pack: string
          status?: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          decided_at?: string | null
          from_user?: string
          id?: string
          pack?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_requests_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_history: {
        Row: {
          created_at: string
          dialect: string
          id: string
          input: string
          output: Json
          tone: string
          use_case: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dialect: string
          id?: string
          input: string
          output: Json
          tone: string
          use_case: string
          user_id?: string
        }
        Update: {
          created_at?: string
          dialect?: string
          id?: string
          input?: string
          output?: Json
          tone?: string
          use_case?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_usage: {
        Row: {
          updated_at: string
          used: number
          user_id: string
          week_start: string
        }
        Insert: {
          updated_at?: string
          used?: number
          user_id: string
          week_start: string
        }
        Update: {
          updated_at?: string
          used?: number
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      couple_members: {
        Row: {
          city: string | null
          couple_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          couple_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          couple_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_members_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_question_passes: {
        Row: {
          couple_id: string
          excluded: boolean
          question_id: string
          skips: number
          updated_at: string
        }
        Insert: {
          couple_id: string
          excluded?: boolean
          question_id: string
          skips?: number
          updated_at?: string
        }
        Update: {
          couple_id?: string
          excluded?: boolean
          question_id?: string
          skips?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_question_passes_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_question_passes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "daily_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_questions: {
        Row: {
          couple_id: string
          created_at: string
          day: string
          question_id: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          day: string
          question_id: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          day?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_questions_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "daily_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      couples: {
        Row: {
          active_pack: string | null
          created_at: string
          created_by: string
          id: string
          kind: string
          partner_city: string | null
          relationship_type: string | null
          start_date: string | null
          status: string
          timezone: string
        }
        Insert: {
          active_pack?: string | null
          created_at?: string
          created_by: string
          id?: string
          kind?: string
          partner_city?: string | null
          relationship_type?: string | null
          start_date?: string | null
          status?: string
          timezone?: string
        }
        Update: {
          active_pack?: string | null
          created_at?: string
          created_by?: string
          id?: string
          kind?: string
          partner_city?: string | null
          relationship_type?: string | null
          start_date?: string | null
          status?: string
          timezone?: string
        }
        Relationships: []
      }
      daily_questions: {
        Row: {
          audience: string[]
          created_at: string
          id: string
          pack: string
          sensitivity: string
          sort_order: number
          text_vi: string
          text_vi_genz: string | null
          text_vi_north: string | null
          text_vi_south: string | null
          text_vi_sweet: string | null
        }
        Insert: {
          audience?: string[]
          created_at?: string
          id?: string
          pack: string
          sensitivity?: string
          sort_order?: number
          text_vi: string
          text_vi_genz?: string | null
          text_vi_north?: string | null
          text_vi_south?: string | null
          text_vi_sweet?: string | null
        }
        Update: {
          audience?: string[]
          created_at?: string
          id?: string
          pack?: string
          sensitivity?: string
          sort_order?: number
          text_vi?: string
          text_vi_genz?: string | null
          text_vi_north?: string | null
          text_vi_south?: string | null
          text_vi_sweet?: string | null
        }
        Relationships: []
      }
      date_ideas: {
        Row: {
          audience: string[]
          budget: string | null
          city: string | null
          created_at: string
          id: string
          mood: string | null
          title_vi: string
        }
        Insert: {
          audience?: string[]
          budget?: string | null
          city?: string | null
          created_at?: string
          id?: string
          mood?: string | null
          title_vi: string
        }
        Update: {
          audience?: string[]
          budget?: string | null
          city?: string | null
          created_at?: string
          id?: string
          mood?: string | null
          title_vi?: string
        }
        Relationships: []
      }
      date_swipes: {
        Row: {
          couple_id: string
          created_at: string
          id: string
          idea_id: string
          liked: boolean
          user_id: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          id?: string
          idea_id: string
          liked: boolean
          user_id?: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          id?: string
          idea_id?: string
          liked?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "date_swipes_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "date_swipes_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "date_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      game_content: {
        Row: {
          audience: string[]
          content: Json
          id: string
          pack: string | null
          sort_order: number
          type: string
        }
        Insert: {
          audience?: string[]
          content: Json
          id?: string
          pack?: string | null
          sort_order?: number
          type: string
        }
        Update: {
          audience?: string[]
          content?: Json
          id?: string
          pack?: string | null
          sort_order?: number
          type?: string
        }
        Relationships: []
      }
      game_responses: {
        Row: {
          couple_id: string
          created_at: string
          id: string
          response: Json
          session_id: string
          user_id: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          id?: string
          response: Json
          session_id: string
          user_id?: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          id?: string
          response?: Json
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_responses_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_rounds: {
        Row: {
          answerer: string | null
          couple_id: string
          created_at: string
          created_by: string
          id: string
          played_on: string
          type: string
        }
        Insert: {
          answerer?: string | null
          couple_id: string
          created_at?: string
          created_by: string
          id?: string
          played_on: string
          type: string
        }
        Update: {
          answerer?: string | null
          couple_id?: string
          created_at?: string
          created_by?: string
          id?: string
          played_on?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_rounds_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          content_id: string
          couple_id: string
          created_at: string
          id: string
          played_on: string
          round_id: string | null
        }
        Insert: {
          content_id: string
          couple_id: string
          created_at?: string
          id?: string
          played_on: string
          round_id?: string | null
        }
        Update: {
          content_id?: string
          couple_id?: string
          created_at?: string
          id?: string
          played_on?: string
          round_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "game_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "game_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          code: string
          couple_id: string
          created_at: string
          created_by: string
          expires_at: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          couple_id: string
          created_at?: string
          created_by: string
          expires_at?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          couple_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          couple_id: string
          created_at: string
          created_by: string
          happened_on: string | null
          id: string
          kind: string
          note: string | null
          storage_path: string | null
          title: string
          voice_seconds: number | null
        }
        Insert: {
          couple_id: string
          created_at?: string
          created_by?: string
          happened_on?: string | null
          id?: string
          kind?: string
          note?: string | null
          storage_path?: string | null
          title: string
          voice_seconds?: number | null
        }
        Update: {
          couple_id?: string
          created_at?: string
          created_by?: string
          happened_on?: string | null
          id?: string
          kind?: string
          note?: string | null
          storage_path?: string | null
          title?: string
          voice_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "memories_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json
          id: string
          kind: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          kind: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          kind?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      occasion_catalog: {
        Row: {
          audience: string[]
          created_at: string
          id: string
          ideas_vi: Json
          kind: string
          sort_order: number
          title_vi: string
        }
        Insert: {
          audience?: string[]
          created_at?: string
          id?: string
          ideas_vi?: Json
          kind: string
          sort_order?: number
          title_vi: string
        }
        Update: {
          audience?: string[]
          created_at?: string
          id?: string
          ideas_vi?: Json
          kind?: string
          sort_order?: number
          title_vi?: string
        }
        Relationships: []
      }
      occasions: {
        Row: {
          couple_id: string
          created_at: string
          id: string
          kind: string
          occurs_on: string
          title: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          id?: string
          kind: string
          occurs_on: string
          title: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          id?: string
          kind?: string
          occurs_on?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "occasions_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      pack_consents: {
        Row: {
          agreed: boolean
          couple_id: string
          decided_at: string
          user_id: string
        }
        Insert: {
          agreed: boolean
          couple_id: string
          decided_at?: string
          user_id?: string
        }
        Update: {
          agreed?: boolean
          couple_id?: string
          decided_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pack_consents_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_posts: {
        Row: {
          caption: string | null
          couple_id: string
          created_at: string
          id: string
          post_date: string
          prompt_id: string | null
          storage_path: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          couple_id: string
          created_at?: string
          id?: string
          post_date: string
          prompt_id?: string | null
          storage_path: string
          user_id?: string
        }
        Update: {
          caption?: string | null
          couple_id?: string
          created_at?: string
          id?: string
          post_date?: string
          prompt_id?: string | null
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_posts_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_posts_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "photo_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_prompts: {
        Row: {
          id: string
          sort_order: number
          text_vi: string
        }
        Insert: {
          id?: string
          sort_order?: number
          text_vi: string
        }
        Update: {
          id?: string
          sort_order?: number
          text_vi?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_term: string | null
          age_confirmed: boolean
          avatar: string | null
          birthday: string | null
          consent_at: string | null
          content_style: string | null
          created_at: string
          dialect: string | null
          display_name: string | null
          id: string
          is_test_account: boolean
          language: string
          onboarded: boolean
          partner_call_name: string | null
          save_coach_history: boolean
          theme: string
          timezone: string
          tone: string | null
        }
        Insert: {
          address_term?: string | null
          age_confirmed?: boolean
          avatar?: string | null
          birthday?: string | null
          consent_at?: string | null
          content_style?: string | null
          created_at?: string
          dialect?: string | null
          display_name?: string | null
          id: string
          is_test_account?: boolean
          language?: string
          onboarded?: boolean
          partner_call_name?: string | null
          save_coach_history?: boolean
          theme?: string
          timezone?: string
          tone?: string | null
        }
        Update: {
          address_term?: string | null
          age_confirmed?: boolean
          avatar?: string | null
          birthday?: string | null
          consent_at?: string | null
          content_style?: string | null
          created_at?: string
          dialect?: string | null
          display_name?: string | null
          id?: string
          is_test_account?: boolean
          language?: string
          onboarded?: boolean
          partner_call_name?: string | null
          save_coach_history?: boolean
          theme?: string
          timezone?: string
          tone?: string | null
        }
        Relationships: []
      }
      question_answers: {
        Row: {
          answer_date: string
          body: string
          couple_id: string
          created_at: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          answer_date: string
          body: string
          couple_id: string
          created_at?: string
          id?: string
          question_id: string
          user_id?: string
        }
        Update: {
          answer_date?: string
          body?: string
          couple_id?: string
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_answers_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "daily_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_date_list: {
        Row: {
          couple_id: string
          created_at: string
          done: boolean
          id: string
          idea_id: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          done?: boolean
          id?: string
          idea_id: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          done?: boolean
          id?: string
          idea_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_date_list_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_date_list_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "date_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      streak_freezes: {
        Row: {
          couple_id: string
          covered_date: string
          created_at: string
          id: string
          month: string
        }
        Insert: {
          couple_id: string
          covered_date: string
          created_at?: string
          id?: string
          month: string
        }
        Update: {
          couple_id?: string
          covered_date?: string
          created_at?: string
          id?: string
          month?: string
        }
        Relationships: [
          {
            foreignKeyName: "streak_freezes_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      streaks: {
        Row: {
          best: number
          couple_id: string
          current: number
          last_completed: string | null
          updated_at: string
        }
        Insert: {
          best?: number
          couple_id: string
          current?: number
          last_completed?: string | null
          updated_at?: string
        }
        Update: {
          best?: number
          couple_id?: string
          current?: number
          last_completed?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "streaks_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: true
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          couple_id: string
          plan: string
          renews_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          couple_id: string
          plan?: string
          renews_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          couple_id?: string
          plan?: string
          renews_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: true
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      thumb_syncs: {
        Row: {
          couple_id: string
          created_at: string
          id: string
          sync_date: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          id?: string
          sync_date: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          id?: string
          sync_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "thumb_syncs_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bump_streak: {
        Args: { _couple: string; _day: string }
        Returns: undefined
      }
      can_see_response: { Args: { _session: string }; Returns: boolean }
      cancel_category: { Args: { _id: string }; Returns: undefined }
      capsule_file_readable: { Args: { _name: string }; Returns: boolean }
      capsule_local_today: { Args: { _couple: string }; Returns: string }
      capsule_readable: { Args: { _id: string }; Returns: boolean }
      category_state: { Args: never; Returns: Json }
      coach_premium: { Args: { _user: string }; Returns: boolean }
      couple_size: { Args: { _couple: string }; Returns: number }
      create_couple: {
        Args: {
          _my_city: string
          _partner_city: string
          _start_date: string
          _type: string
        }
        Returns: {
          code: string
          couple_id: string
        }[]
      }
      create_space: {
        Args: {
          _kind: string
          _my_city: string
          _partner_city: string
          _start_date: string
          _type: string
        }
        Returns: {
          code: string
          couple_id: string
        }[]
      }
      gen_invite_code: { Args: never; Returns: string }
      has_answered: {
        Args: { _date: string; _question: string }
        Returns: boolean
      }
      has_posted: { Args: { _date: string }; Returns: boolean }
      has_responded: { Args: { _session: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_couple_member: { Args: { _user: string }; Returns: boolean }
      join_couple: { Args: { _code: string }; Returns: string }
      list_capsules: { Args: never; Returns: Json }
      log_thumb_sync: { Args: never; Returns: number }
      my_couple_id: { Args: never; Returns: string }
      my_space_kind: { Args: never; Returns: string }
      open_capsule: { Args: { _id: string }; Returns: undefined }
      pass_question: { Args: { _mode: string }; Returns: Json }
      refresh_invite: { Args: never; Returns: string }
      request_category: { Args: { _pack: string }; Returns: string }
      respond_category: {
        Args: { _accept: boolean; _id: string }
        Returns: string
      }
      round_completed: { Args: { _round: string }; Returns: boolean }
      round_status: { Args: { _round: string }; Returns: Json }
      seal_capsule: { Args: { _id: string }; Returns: undefined }
      send_thumb_nudge: { Args: never; Returns: boolean }
      start_round: { Args: { _type: string }; Returns: string }
      swipe_date: { Args: { _idea: string; _liked: boolean }; Returns: boolean }
      sync_capsule_notices: { Args: never; Returns: number }
      today_question: { Args: never; Returns: Json }
      today_status: { Args: never; Returns: Json }
      use_coach: { Args: { _consume: boolean; _user: string }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
