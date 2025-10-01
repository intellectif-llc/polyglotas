export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      audiobook_alignment: {
        Row: {
          alignment_id: number
          book_id: number
          chapter_id: number | null
          characters_data: Json
          created_at: string | null
          full_text: string
          loss_score: number | null
          words_data: Json
        }
        Insert: {
          alignment_id?: number
          book_id: number
          chapter_id?: number | null
          characters_data: Json
          created_at?: string | null
          full_text: string
          loss_score?: number | null
          words_data: Json
        }
        Update: {
          alignment_id?: number
          book_id?: number
          chapter_id?: number | null
          characters_data?: Json
          created_at?: string | null
          full_text?: string
          loss_score?: number | null
          words_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "audiobook_alignment_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "audiobooks"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "audiobook_alignment_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "audiobook_chapters"
            referencedColumns: ["chapter_id"]
          },
        ]
      }
      audiobook_chapters: {
        Row: {
          audio_url: string
          book_id: number
          chapter_id: number
          chapter_order: number
          chapter_title: string
          created_at: string | null
          duration_seconds: number | null
          is_free_sample: boolean | null
          pic_url: string | null
        }
        Insert: {
          audio_url: string
          book_id: number
          chapter_id?: number
          chapter_order: number
          chapter_title: string
          created_at?: string | null
          duration_seconds?: number | null
          is_free_sample?: boolean | null
          pic_url?: string | null
        }
        Update: {
          audio_url?: string
          book_id?: number
          chapter_id?: number
          chapter_order?: number
          chapter_title?: string
          created_at?: string | null
          duration_seconds?: number | null
          is_free_sample?: boolean | null
          pic_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audiobook_chapters_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "audiobooks"
            referencedColumns: ["book_id"]
          },
        ]
      }
      audiobooks: {
        Row: {
          author: string
          book_id: number
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          is_active: boolean
          language_code: string
          level_code: Database["public"]["Enums"]["level_enum"]
          points_cost: number
          price_cents: number
          title: string
          updated_at: string | null
        }
        Insert: {
          author: string
          book_id?: number
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          is_active?: boolean
          language_code: string
          level_code: Database["public"]["Enums"]["level_enum"]
          points_cost?: number
          price_cents?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string
          book_id?: number
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          is_active?: boolean
          language_code?: string
          level_code?: Database["public"]["Enums"]["level_enum"]
          points_cost?: number
          price_cents?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_audiobooks_language"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["language_code"]
          },
          {
            foreignKeyName: "fk_audiobooks_level"
            columns: ["level_code"]
            isOneToOne: false
            referencedRelation: "language_levels"
            referencedColumns: ["level_code"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          conversation_id: number
          created_at: string | null
          feedback_language_code: string | null
          feedback_text: string | null
          message_id: number
          message_language_code: string
          message_order: number
          message_text: string
          related_prompt_id: number | null
          sender_type: Database["public"]["Enums"]["sender_type_enum"]
          suggested_answer: Json | null
        }
        Insert: {
          conversation_id: number
          created_at?: string | null
          feedback_language_code?: string | null
          feedback_text?: string | null
          message_id?: number
          message_language_code: string
          message_order: number
          message_text: string
          related_prompt_id?: number | null
          sender_type: Database["public"]["Enums"]["sender_type_enum"]
          suggested_answer?: Json | null
        }
        Update: {
          conversation_id?: number
          created_at?: string | null
          feedback_language_code?: string | null
          feedback_text?: string | null
          message_id?: number
          message_language_code?: string
          message_order?: number
          message_text?: string
          related_prompt_id?: number | null
          sender_type?: Database["public"]["Enums"]["sender_type_enum"]
          suggested_answer?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "lesson_chat_conversations"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "conversation_messages_related_prompt_id_fkey"
            columns: ["related_prompt_id"]
            isOneToOne: false
            referencedRelation: "conversation_starters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_conversation_messages_fb_lang"
            columns: ["feedback_language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["language_code"]
          },
          {
            foreignKeyName: "fk_conversation_messages_msg_lang"
            columns: ["message_language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["language_code"]
          },
        ]
      }
      conversation_prompt_status: {
        Row: {
          addressed_at: string
          conversation_id: number
          first_addressed_message_id: number | null
          prompt_id: number
          prompt_status_id: number
        }
        Insert: {
          addressed_at?: string
          conversation_id: number
          first_addressed_message_id?: number | null
          prompt_id: number
          prompt_status_id?: number
        }
        Update: {
          addressed_at?: string
          conversation_id?: number
          first_addressed_message_id?: number | null
          prompt_id?: number
          prompt_status_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "conversation_prompt_status_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "lesson_chat_conversations"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "conversation_prompt_status_first_addressed_message_id_fkey"
            columns: ["first_addressed_message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
            referencedColumns: ["message_id"]
          },
          {
            foreignKeyName: "conversation_prompt_status_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "conversation_starters"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_starter_translations: {
        Row: {
          created_at: string | null
          language_code: string
          starter_id: number
          starter_text: string
          starter_translation_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          language_code: string
          starter_id: number
          starter_text: string
          starter_translation_id?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          language_code?: string
          starter_id?: number
          starter_text?: string
          starter_translation_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_starter_translations_starter_id_fkey"
            columns: ["starter_id"]
            isOneToOne: false
            referencedRelation: "conversation_starters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_conversation_starter_translations_lang"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["language_code"]
          },
        ]
      }
      conversation_starters: {
        Row: {
          created_at: string | null
          id: number
          lesson_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          lesson_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          lesson_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_starters_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      dictation_attempts: {
        Row: {
          attempt_id: number
          attempt_number: number
          created_at: string | null
          language_code: string
          lesson_id: number
          overall_similarity_score: number | null
          phrase_id: number
          profile_id: string
          reference_text: string
          word_level_feedback: Json | null
          written_text: string
        }
        Insert: {
          attempt_id?: number
          attempt_number: number
          created_at?: string | null
          language_code: string
          lesson_id: number
          overall_similarity_score?: number | null
          phrase_id: number
          profile_id: string
          reference_text: string
          word_level_feedback?: Json | null
          written_text: string
        }
        Update: {
          attempt_id?: number
          attempt_number?: number
          created_at?: string | null
          language_code?: string
          lesson_id?: number
          overall_similarity_score?: number | null
          phrase_id?: number
          profile_id?: string
          reference_text?: string
          word_level_feedback?: Json | null
          written_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "dictation_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "dictation_attempts_phrase_id_fkey"
            columns: ["phrase_id"]
            isOneToOne: false
            referencedRelation: "phrases"
            referencedColumns: ["phrase_id"]
          },
          {
            foreignKeyName: "dictation_attempts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "fk_dictation_attempts_lang"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["language_code"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_due: number
          amount_paid: number
          amount_remaining: number
          billing_reason: string | null
          created_at: string | null
          currency: string
          due_date: string | null
          hosted_invoice_url: string | null
          id: number
          invoice_pdf_url: string | null
          issued_at: string | null
          metadata: Json | null
          paid_at: string | null
          profile_id: string
          status: Database["public"]["Enums"]["invoice_status_enum"]
          stripe_customer_id: string | null
          stripe_invoice_id: string
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount_due: number
          amount_paid: number
          amount_remaining: number
          billing_reason?: string | null
          created_at?: string | null
          currency: string
          due_date?: string | null
          hosted_invoice_url?: string | null
          id?: number
          invoice_pdf_url?: string | null
          issued_at?: string | null
          metadata?: Json | null
          paid_at?: string | null
          profile_id: string
          status: Database["public"]["Enums"]["invoice_status_enum"]
          stripe_customer_id?: string | null
          stripe_invoice_id: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          amount_remaining?: number
          billing_reason?: string | null
          created_at?: string | null
          currency?: string
          due_date?: string | null
          hosted_invoice_url?: string | null
          id?: number
          invoice_pdf_url?: string | null
          issued_at?: string | null
          metadata?: Json | null
          paid_at?: string | null
          profile_id?: string
          status?: Database["public"]["Enums"]["invoice_status_enum"]
          stripe_customer_id?: string | null
          stripe_invoice_id?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "invoices_stripe_subscription_id_fkey"
            columns: ["stripe_subscription_id"]
            isOneToOne: false
            referencedRelation: "student_subscriptions"
            referencedColumns: ["stripe_subscription_id"]
          },
        ]
      }
      language_levels: {
        Row: {
          description: string | null
          is_available: boolean
          level_code: Database["public"]["Enums"]["level_enum"]
          level_name: string
          sort_order: number
        }
        Insert: {
          description?: string | null
          is_available?: boolean
          level_code: Database["public"]["Enums"]["level_enum"]
          level_name: string
          sort_order: number
        }
        Update: {
          description?: string | null
          is_available?: boolean
          level_code?: Database["public"]["Enums"]["level_enum"]
          level_name?: string
          sort_order?: number
        }
        Relationships: []
      }
      languages: {
        Row: {
          created_at: string | null
          is_enabled: boolean
          language_code: string
          language_name: string
        }
        Insert: {
          created_at?: string | null
          is_enabled?: boolean
          language_code: string
          language_name: string
        }
        Update: {
          created_at?: string | null
          is_enabled?: boolean
          language_code?: string
          language_name?: string
        }
        Relationships: []
      }
      learning_outcome_translations: {
        Row: {
          created_at: string | null
          language_code: string
          outcome_id: number
          outcome_text: string
          outcome_translation_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          language_code: string
          outcome_id: number
          outcome_text: string
          outcome_translation_id?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          language_code?: string
          outcome_id?: number
          outcome_text?: string
          outcome_translation_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_learning_outcome_translations_lang"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["language_code"]
          },
          {
            foreignKeyName: "learning_outcome_translations_outcome_id_fkey"
            columns: ["outcome_id"]
            isOneToOne: false
            referencedRelation: "learning_outcomes"
            referencedColumns: ["outcome_id"]
          },
        ]
      }
      learning_outcomes: {
        Row: {
          created_at: string | null
          lesson_id: number
          outcome_id: number
        }
        Insert: {
          created_at?: string | null
          lesson_id: number
          outcome_id?: number
        }
        Update: {
          created_at?: string | null
          lesson_id?: number
          outcome_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "learning_outcomes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      lesson_chat_conversations: {
        Row: {
          all_prompts_addressed_at: string | null
          conversation_id: number
          created_at: string | null
          language_code: string
          last_message_at: string | null
          lesson_id: number
          profile_id: string
        }
        Insert: {
          all_prompts_addressed_at?: string | null
          conversation_id?: number
          created_at?: string | null
          language_code: string
          last_message_at?: string | null
          lesson_id: number
          profile_id: string
        }
        Update: {
          all_prompts_addressed_at?: string | null
          conversation_id?: number
          created_at?: string | null
          language_code?: string
          last_message_at?: string | null
          lesson_id?: number
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_lesson_chat_conversations_lang"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["language_code"]
          },
          {
            foreignKeyName: "lesson_chat_conversations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_chat_conversations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      lesson_translations: {
        Row: {
          created_at: string | null
          grammar_focus: string[] | null
          language_code: string
          lesson_id: number
          lesson_title: string
          lesson_translation_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          grammar_focus?: string[] | null
          language_code: string
          lesson_id: number
          lesson_title: string
          lesson_translation_id?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          grammar_focus?: string[] | null
          language_code?: string
          lesson_id?: number
          lesson_title?: string
          lesson_translation_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_lesson_translations_lang"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["language_code"]
          },
          {
            foreignKeyName: "lesson_translations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string | null
          has_chat: boolean
          has_dictation: boolean
          has_pronunciation: boolean
          lesson_id: number
          lesson_order: number
          total_phrases: number
          unit_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          has_chat?: boolean
          has_dictation?: boolean
          has_pronunciation?: boolean
          lesson_id?: number
          lesson_order: number
          total_phrases?: number
          unit_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          has_chat?: boolean
          has_dictation?: boolean
          has_pronunciation?: boolean
          lesson_id?: number
          lesson_order?: number
          total_phrases?: number
          unit_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      partnership_invitations: {
        Row: {
          created_at: string
          expires_at: string
          id: number
          intended_for_email: string
          partnership_id: number
          redeemed_at: string | null
          redeemed_by_profile_id: string | null
          status: Database["public"]["Enums"]["partnership_invitation_status"]
          token: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: number
          intended_for_email: string
          partnership_id: number
          redeemed_at?: string | null
          redeemed_by_profile_id?: string | null
          status?: Database["public"]["Enums"]["partnership_invitation_status"]
          token?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: number
          intended_for_email?: string
          partnership_id?: number
          redeemed_at?: string | null
          redeemed_by_profile_id?: string | null
          status?: Database["public"]["Enums"]["partnership_invitation_status"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "partnership_invitations_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "partnerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partnership_invitations_redeemed_by_profile_id_fkey"
            columns: ["redeemed_by_profile_id"]
            isOneToOne: true
            referencedRelation: "student_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      partnerships: {
        Row: {
          created_at: string
          description: string | null
          discount_percentage: number
          id: number
          is_active: boolean
          name: string
          trial_duration_days: number
          trial_tier: Database["public"]["Enums"]["subscription_tier_enum"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_percentage?: number
          id?: number
          is_active?: boolean
          name: string
          trial_duration_days?: number
          trial_tier?: Database["public"]["Enums"]["subscription_tier_enum"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_percentage?: number
          id?: number
          is_active?: boolean
          name?: string
          trial_duration_days?: number
          trial_tier?: Database["public"]["Enums"]["subscription_tier_enum"]
          updated_at?: string
        }
        Relationships: []
      }
      phrase_versions: {
        Row: {
          audio_url_normal: string | null
          audio_url_slow: string | null
          created_at: string | null
          language_code: string
          phrase_id: number
          phrase_text: string
          phrase_version_id: number
          updated_at: string | null
        }
        Insert: {
          audio_url_normal?: string | null
          audio_url_slow?: string | null
          created_at?: string | null
          language_code: string
          phrase_id: number
          phrase_text: string
          phrase_version_id?: number
          updated_at?: string | null
        }
        Update: {
          audio_url_normal?: string | null
          audio_url_slow?: string | null
          created_at?: string | null
          language_code?: string
          phrase_id?: number
          phrase_text?: string
          phrase_version_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_phrase_versions_lang"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["language_code"]
          },
          {
            foreignKeyName: "phrase_versions_phrase_id_fkey"
            columns: ["phrase_id"]
            isOneToOne: false
            referencedRelation: "phrases"
            referencedColumns: ["phrase_id"]
          },
        ]
      }
      prices: {
        Row: {
          active: boolean | null
          billing_interval:
            | Database["public"]["Enums"]["price_billing_interval_enum"]
            | null
          created_at: string | null
          currency: string
          description: string | null
          id: number
          interval_count: number | null
          metadata: Json | null
          product_id: number
          stripe_price_id: string
          trial_period_days: number | null
          type: Database["public"]["Enums"]["price_type_enum"]
          unit_amount: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          billing_interval?:
            | Database["public"]["Enums"]["price_billing_interval_enum"]
            | null
          created_at?: string | null
          currency: string
          description?: string | null
          id?: number
          interval_count?: number | null
          metadata?: Json | null
          product_id: number
          stripe_price_id: string
          trial_period_days?: number | null
          type: Database["public"]["Enums"]["price_type_enum"]
          unit_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          billing_interval?:
            | Database["public"]["Enums"]["price_billing_interval_enum"]
            | null
          created_at?: string | null
          currency?: string
          description?: string | null
          id?: number
          interval_count?: number | null
          metadata?: Json | null
          product_id?: number
          stripe_price_id?: string
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["price_type_enum"]
          unit_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: number
          metadata: Json | null
          name: string
          stripe_product_id: string
          tier_key: Database["public"]["Enums"]["subscription_tier_enum"] | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: number
          metadata?: Json | null
          name: string
          stripe_product_id: string
          tier_key?:
            | Database["public"]["Enums"]["subscription_tier_enum"]
            | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: number
          metadata?: Json | null
          name?: string
          stripe_product_id?: string
          tier_key?:
            | Database["public"]["Enums"]["subscription_tier_enum"]
            | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          partnership_id: number | null
          role: Database["public"]["Enums"]["user_role_enum"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          partnership_id?: number | null
          role?: Database["public"]["Enums"]["user_role_enum"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          partnership_id?: number | null
          role?: Database["public"]["Enums"]["user_role_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "partnerships"
            referencedColumns: ["id"]
          },
        ]
      }
      speech_attempts: {
        Row: {
          accuracy_score: number | null
          attempt_id: number
          attempt_number: number
          completeness_score: number | null
          created_at: string | null
          fluency_score: number | null
          language_code: string
          lesson_id: number
          phonetic_data: Json | null
          phrase_id: number
          profile_id: string
          pronunciation_score: number | null
          prosody_score: number | null
          recognized_text: string | null
          reference_text: string
        }
        Insert: {
          accuracy_score?: number | null
          attempt_id?: number
          attempt_number: number
          completeness_score?: number | null
          created_at?: string | null
          fluency_score?: number | null
          language_code: string
          lesson_id: number
          phonetic_data?: Json | null
          phrase_id: number
          profile_id: string
          pronunciation_score?: number | null
          prosody_score?: number | null
          recognized_text?: string | null
          reference_text: string
        }
        Update: {
          accuracy_score?: number | null
          attempt_id?: number
          attempt_number?: number
          completeness_score?: number | null
          created_at?: string | null
          fluency_score?: number | null
          language_code?: string
          lesson_id?: number
          phonetic_data?: Json | null
          phrase_id?: number
          profile_id?: string
          pronunciation_score?: number | null
          prosody_score?: number | null
          recognized_text?: string | null
          reference_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_speech_attempts_lang"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["language_code"]
          },
          {
            foreignKeyName: "speech_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "speech_attempts_phrase_id_fkey"
            columns: ["phrase_id"]
            isOneToOne: false
            referencedRelation: "phrases"
            referencedColumns: ["phrase_id"]
          },
          {
            foreignKeyName: "speech_attempts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          billing_address: Json | null
          created_at: string
          current_streak_days: number
          current_target_language_code: string | null
          default_payment_method_details: Json | null
          discount: number | null
          last_streak_date: string | null
          native_language_code: string | null
          partnership_id: number | null
          points: number
          profile_id: string
          selected_level_code: Database["public"]["Enums"]["level_enum"] | null
          status: Database["public"]["Enums"]["account_status_enum"]
          stripe_customer_id: string | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier_enum"]
          updated_at: string
        }
        Insert: {
          billing_address?: Json | null
          created_at?: string
          current_streak_days?: number
          current_target_language_code?: string | null
          default_payment_method_details?: Json | null
          discount?: number | null
          last_streak_date?: string | null
          native_language_code?: string | null
          partnership_id?: number | null
          points?: number
          profile_id: string
          selected_level_code?: Database["public"]["Enums"]["level_enum"] | null
          status: Database["public"]["Enums"]["account_status_enum"]
          stripe_customer_id?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier_enum"]
          updated_at?: string
        }
        Update: {
          billing_address?: Json | null
          created_at?: string
          current_streak_days?: number
          current_target_language_code?: string | null
          default_payment_method_details?: Json | null
          discount?: number | null
          last_streak_date?: string | null
          native_language_code?: string | null
          partnership_id?: number | null
          points?: number
          profile_id?: string
          selected_level_code?: Database["public"]["Enums"]["level_enum"] | null
          status?: Database["public"]["Enums"]["account_status_enum"]
          stripe_customer_id?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_student_profiles_native_lang"
            columns: ["native_language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["language_code"]
          },
          {
            foreignKeyName: "fk_student_profiles_selected_level"
            columns: ["selected_level_code"]
            isOneToOne: false
            referencedRelation: "language_levels"
            referencedColumns: ["level_code"]
          },
          {
            foreignKeyName: "fk_student_profiles_target_lang"
            columns: ["current_target_language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["language_code"]
          },
          {
            foreignKeyName: "student_profiles_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "partnerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          ended_at: string | null
          id: number
          metadata: Json | null
          price_id: number
          profile_id: string
          quantity: number | null
          status: Database["public"]["Enums"]["subscription_status_enum"]
          stripe_created_at: string | null
          stripe_subscription_id: string
          trial_end_at: string | null
          trial_start_at: string | null
          updated_at: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end: string
          current_period_start: string
          ended_at?: string | null
          id?: number
          metadata?: Json | null
          price_id: number
          profile_id: string
          quantity?: number | null
          status: Database["public"]["Enums"]["subscription_status_enum"]
          stripe_created_at?: string | null
          stripe_subscription_id: string
          trial_end_at?: string | null
          trial_start_at?: string | null
          updated_at?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id?: number
          metadata?: Json | null
          price_id?: number
          profile_id?: string
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status_enum"]
          stripe_created_at?: string | null
          stripe_subscription_id?: string
          trial_end_at?: string | null
          trial_start_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      student_target_languages: {
        Row: {
          added_at: string | null
          language_code: string
          profile_id: string
        }
        Insert: {
          added_at?: string | null
          language_code: string
          profile_id: string
        }
        Update: {
          added_at?: string | null
          language_code?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_student_target_languages_lang"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["language_code"]
          },
          {
            foreignKeyName: "student_target_languages_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      tour_steps: {
        Row: {
          content: string
          created_at: string
          media_url: string | null
          page_route: string
          step_id: number
          step_order: number
          target_selector: string
          title: string
          tour_id: number
          tour_props: Json | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          media_url?: string | null
          page_route: string
          step_id?: never
          step_order: number
          target_selector: string
          title: string
          tour_id: number
          tour_props?: Json | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          media_url?: string | null
          page_route?: string
          step_id?: never
          step_order?: number
          target_selector?: string
          title?: string
          tour_id?: number
          tour_props?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_steps_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["tour_id"]
          },
        ]
      }
      tours: {
        Row: {
          created_at: string
          is_active: boolean
          name: string
          tour_id: number
          tour_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          is_active?: boolean
          name: string
          tour_id?: never
          tour_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          is_active?: boolean
          name?: string
          tour_id?: never
          tour_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      unit_translations: {
        Row: {
          created_at: string | null
          description: string | null
          language_code: string
          unit_id: number
          unit_title: string
          unit_translation_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          language_code: string
          unit_id: number
          unit_title: string
          unit_translation_id?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          language_code?: string
          unit_id?: number
          unit_title?: string
          unit_translation_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_unit_translations_lang"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["language_code"]
          },
          {
            foreignKeyName: "unit_translations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string | null
          level: Database["public"]["Enums"]["level_enum"]
          unit_id: number
          unit_order: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          level: Database["public"]["Enums"]["level_enum"]
          unit_id?: number
          unit_order: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          level?: Database["public"]["Enums"]["level_enum"]
          unit_id?: number
          unit_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_units_to_language_levels"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "language_levels"
            referencedColumns: ["level_code"]
          },
        ]
      }
      user_audiobook_chapter_progress: {
        Row: {
          book_id: number
          chapter_id: number
          completed_at: string | null
          created_at: string | null
          current_position_seconds: number | null
          id: number
          is_completed: boolean | null
          last_listened_at: string | null
          profile_id: string
          updated_at: string | null
        }
        Insert: {
          book_id: number
          chapter_id: number
          completed_at?: string | null
          created_at?: string | null
          current_position_seconds?: number | null
          id?: number
          is_completed?: boolean | null
          last_listened_at?: string | null
          profile_id: string
          updated_at?: string | null
        }
        Update: {
          book_id?: number
          chapter_id?: number
          completed_at?: string | null
          created_at?: string | null
          current_position_seconds?: number | null
          id?: number
          is_completed?: boolean | null
          last_listened_at?: string | null
          profile_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_audiobook_chapter_progress_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "audiobooks"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "user_audiobook_chapter_progress_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "audiobook_chapters"
            referencedColumns: ["chapter_id"]
          },
          {
            foreignKeyName: "user_audiobook_chapter_progress_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }

      user_audiobook_progress: {
        Row: {
          book_id: number
          completed_at: string | null
          completed_chapters: number | null
          completion_percentage: number | null
          current_chapter_id: number | null
          current_position_seconds: number | null
          is_completed: boolean | null
          last_read_at: string | null
          profile_id: string
          progress_id: number
          total_chapters: number | null
        }
        Insert: {
          book_id: number
          completed_at?: string | null
          completed_chapters?: number | null
          completion_percentage?: number | null
          current_chapter_id?: number | null
          current_position_seconds?: number | null
          is_completed?: boolean | null
          last_read_at?: string | null
          profile_id: string
          progress_id?: number
          total_chapters?: number | null
        }
        Update: {
          book_id?: number
          completed_at?: string | null
          completed_chapters?: number | null
          completion_percentage?: number | null
          current_chapter_id?: number | null
          current_position_seconds?: number | null
          is_completed?: boolean | null
          last_read_at?: string | null
          profile_id?: string
          progress_id?: number
          total_chapters?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_audiobook_progress_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "audiobooks"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "user_audiobook_progress_current_chapter_id_fkey"
            columns: ["current_chapter_id"]
            isOneToOne: false
            referencedRelation: "audiobook_chapters"
            referencedColumns: ["chapter_id"]
          },
          {
            foreignKeyName: "user_audiobook_progress_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      user_audiobook_purchases: {
        Row: {
          amount_paid_cents: number | null
          book_id: number
          points_spent: number | null
          profile_id: string
          purchase_id: number
          purchase_type: Database["public"]["Enums"]["purchase_type_enum"]
          purchased_at: string | null
        }
        Insert: {
          amount_paid_cents?: number | null
          book_id: number
          points_spent?: number | null
          profile_id: string
          purchase_id?: number
          purchase_type: Database["public"]["Enums"]["purchase_type_enum"]
          purchased_at?: string | null
        }
        Update: {
          amount_paid_cents?: number | null
          book_id?: number
          points_spent?: number | null
          profile_id?: string
          purchase_id?: number
          purchase_type?: Database["public"]["Enums"]["purchase_type_enum"]
          purchased_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_audiobook_purchases_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "audiobooks"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "user_audiobook_purchases_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      user_lesson_activity_progress: {
        Row: {
          activity_progress_id: number
          activity_type: Database["public"]["Enums"]["activity_type_enum"]
          completed_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["activity_status_enum"]
          user_lesson_progress_id: number
        }
        Insert: {
          activity_progress_id?: never
          activity_type: Database["public"]["Enums"]["activity_type_enum"]
          completed_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["activity_status_enum"]
          user_lesson_progress_id: number
        }
        Update: {
          activity_progress_id?: never
          activity_type?: Database["public"]["Enums"]["activity_type_enum"]
          completed_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["activity_status_enum"]
          user_lesson_progress_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_activity_progress_user_lesson_progress_id_fkey"
            columns: ["user_lesson_progress_id"]
            isOneToOne: false
            referencedRelation: "user_lesson_progress"
            referencedColumns: ["progress_id"]
          },
        ]
      }
      user_lesson_progress: {
        Row: {
          last_progress_at: string | null
          lesson_id: number
          profile_id: string
          progress_id: number
          started_at: string | null
        }
        Insert: {
          last_progress_at?: string | null
          lesson_id: number
          profile_id: string
          progress_id?: number
          started_at?: string | null
        }
        Update: {
          last_progress_at?: string | null
          lesson_id?: number
          profile_id?: string
          progress_id?: number
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_lesson_progress_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      user_level_completion: {
        Row: {
          completed_at: string
          created_at: string
          level_code: Database["public"]["Enums"]["level_enum"]
          profile_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          level_code: Database["public"]["Enums"]["level_enum"]
          profile_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          level_code?: Database["public"]["Enums"]["level_enum"]
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_level_completion_level_code_fkey"
            columns: ["level_code"]
            isOneToOne: false
            referencedRelation: "language_levels"
            referencedColumns: ["level_code"]
          },
          {
            foreignKeyName: "user_level_completion_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      user_phrase_progress: {
        Row: {
          dictation_attempts: number | null
          dictation_completed: boolean | null
          dictation_last_attempt_at: string | null
          language_code: string
          last_progress_at: string | null
          lesson_id: number
          phrase_id: number
          phrase_progress_id: number
          profile_id: string
          pronunciation_attempts: number | null
          pronunciation_completed: boolean | null
          pronunciation_last_attempt_at: string | null
        }
        Insert: {
          dictation_attempts?: number | null
          dictation_completed?: boolean | null
          dictation_last_attempt_at?: string | null
          language_code: string
          last_progress_at?: string | null
          lesson_id: number
          phrase_id: number
          phrase_progress_id?: number
          profile_id: string
          pronunciation_attempts?: number | null
          pronunciation_completed?: boolean | null
          pronunciation_last_attempt_at?: string | null
        }
        Update: {
          dictation_attempts?: number | null
          dictation_completed?: boolean | null
          dictation_last_attempt_at?: string | null
          language_code?: string
          last_progress_at?: string | null
          lesson_id?: number
          phrase_id?: number
          phrase_progress_id?: number
          profile_id?: string
          pronunciation_attempts?: number | null
          pronunciation_completed?: boolean | null
          pronunciation_last_attempt_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_phrase_progress_lang"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["language_code"]
          },
          {
            foreignKeyName: "user_phrase_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_phrase_progress_phrase_id_fkey"
            columns: ["phrase_id"]
            isOneToOne: false
            referencedRelation: "phrases"
            referencedColumns: ["phrase_id"]
          },
          {
            foreignKeyName: "user_phrase_progress_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      user_srs_data: {
        Row: {
          user_srs_data_id: number
          profile_id: string
          phrase_id: number
          due_at: string
          interval: number
          ease_factor: number
          repetitions: number
          last_reviewed_at: string | null
          language_code: string
        }
        Insert: {
          user_srs_data_id?: never
          profile_id: string
          phrase_id: number
          due_at?: string
          interval?: number
          ease_factor?: number
          repetitions?: number
          last_reviewed_at?: string | null
          language_code: string
        }
        Update: {
          user_srs_data_id?: never
          profile_id?: string
          phrase_id?: number
          due_at?: string
          interval?: number
          ease_factor?: number
          repetitions?: number
          last_reviewed_at?: string | null
          language_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_srs_data_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "user_srs_data_phrase_id_fkey"
            columns: ["phrase_id"]
            isOneToOne: false
            referencedRelation: "phrases"
            referencedColumns: ["phrase_id"]
          },
          {
            foreignKeyName: "fk_user_srs_data_lang"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["language_code"]
          },
        ]
      }
      user_points_log: {
        Row: {
          activity_type:
            | Database["public"]["Enums"]["activity_type_enum"]
            | null
          created_at: string | null
          log_id: number
          notes: string | null
          points_awarded: number
          profile_id: string
          reason_code: string
          related_lesson_id: number | null
          related_phrase_id: number | null
          related_word_language_code: string | null
          related_word_text: string | null
        }
        Insert: {
          activity_type?:
            | Database["public"]["Enums"]["activity_type_enum"]
            | null
          created_at?: string | null
          log_id?: number
          notes?: string | null
          points_awarded: number
          profile_id: string
          reason_code: string
          related_lesson_id?: number | null
          related_phrase_id?: number | null
          related_word_language_code?: string | null
          related_word_text?: string | null
        }
        Update: {
          activity_type?:
            | Database["public"]["Enums"]["activity_type_enum"]
            | null
          created_at?: string | null
          log_id?: number
          notes?: string | null
          points_awarded?: number
          profile_id?: string
          reason_code?: string
          related_lesson_id?: number | null
          related_phrase_id?: number | null
          related_word_language_code?: string | null
          related_word_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_points_log_related_word_lang"
            columns: ["related_word_language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["language_code"]
          },
          {
            foreignKeyName: "user_points_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "user_points_log_related_lesson_id_fkey"
            columns: ["related_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_points_log_related_phrase_id_fkey"
            columns: ["related_phrase_id"]
            isOneToOne: false
            referencedRelation: "phrases"
            referencedColumns: ["phrase_id"]
          },
        ]
      }
      user_tour_progress: {
        Row: {
          completed_at: string | null
          last_completed_step: number
          profile_id: string
          status: Database["public"]["Enums"]["tour_progress_status"]
          tour_id: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          last_completed_step?: number
          profile_id: string
          status?: Database["public"]["Enums"]["tour_progress_status"]
          tour_id: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          last_completed_step?: number
          profile_id?: string
          status?: Database["public"]["Enums"]["tour_progress_status"]
          tour_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tour_progress_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "user_tour_progress_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["tour_id"]
          },
        ]
      }
      user_word_pronunciation: {
        Row: {
          average_accuracy_score: number | null
          created_at: string | null
          error_count: number | null
          id: number
          language_code: string
          last_accuracy_score: number | null
          last_attempt_at: string | null
          last_error_type: string | null
          needs_practice: boolean | null
          profile_id: string
          sum_accuracy_score: number | null
          total_attempts: number | null
          updated_at: string | null
          word_text: string
        }
        Insert: {
          average_accuracy_score?: number | null
          created_at?: string | null
          error_count?: number | null
          id?: number
          language_code: string
          last_accuracy_score?: number | null
          last_attempt_at?: string | null
          last_error_type?: string | null
          needs_practice?: boolean | null
          profile_id: string
          sum_accuracy_score?: number | null
          total_attempts?: number | null
          updated_at?: string | null
          word_text: string
        }
        Update: {
          average_accuracy_score?: number | null
          created_at?: string | null
          error_count?: number | null
          id?: number
          language_code?: string
          last_accuracy_score?: number | null
          last_attempt_at?: string | null
          last_error_type?: string | null
          needs_practice?: boolean | null
          profile_id?: string
          sum_accuracy_score?: number | null
          total_attempts?: number | null
          updated_at?: string | null
          word_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_word_pronunciation_lang"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["language_code"]
          },
          {
            foreignKeyName: "user_word_pronunciation_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      user_word_spelling: {
        Row: {
          average_word_similarity_score: number | null
          created_at: string | null
          dictation_error_count: number | null
          id: number
          language_code: string
          last_dictation_attempt_at: string | null
          last_reviewed_at: string | null
          last_word_similarity_score: number | null
          needs_spelling_practice: boolean | null
          profile_id: string
          sum_word_similarity_score: number | null
          total_dictation_occurrences: number | null
          updated_at: string | null
          word_text: string
        }
        Insert: {
          average_word_similarity_score?: number | null
          created_at?: string | null
          dictation_error_count?: number | null
          id?: number
          language_code: string
          last_dictation_attempt_at?: string | null
          last_reviewed_at?: string | null
          last_word_similarity_score?: number | null
          needs_spelling_practice?: boolean | null
          profile_id: string
          sum_word_similarity_score?: number | null
          total_dictation_occurrences?: number | null
          updated_at?: string | null
          word_text: string
        }
        Update: {
          average_word_similarity_score?: number | null
          created_at?: string | null
          dictation_error_count?: number | null
          id?: number
          language_code?: string
          last_dictation_attempt_at?: string | null
          last_reviewed_at?: string | null
          last_word_similarity_score?: number | null
          needs_spelling_practice?: boolean | null
          profile_id?: string
          sum_word_similarity_score?: number | null
          total_dictation_occurrences?: number | null
          updated_at?: string | null
          word_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_word_spelling_lang"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["language_code"]
          },
          {
            foreignKeyName: "user_word_spelling_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          ticket_id: number
          profile_id: string
          assigned_to_profile_id: string | null
          status: Database["public"]["Enums"]["ticket_status_enum"]
          reason: Database["public"]["Enums"]["contact_reason_enum"]
          subject: string
          created_at: string
          updated_at: string
          resolved_at: string | null
          last_message_at: string | null
        }
        Insert: {
          ticket_id?: number
          profile_id: string
          assigned_to_profile_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status_enum"]
          reason: Database["public"]["Enums"]["contact_reason_enum"]
          subject: string
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
          last_message_at?: string | null
        }
        Update: {
          ticket_id?: number
          profile_id?: string
          assigned_to_profile_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status_enum"]
          reason?: Database["public"]["Enums"]["contact_reason_enum"]
          subject?: string
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
          last_message_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "support_tickets_assigned_to_profile_id_fkey"
            columns: ["assigned_to_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_messages: {
        Row: {
          message_id: number
          ticket_id: number
          sender_profile_id: string
          message_text: string
          attachment_url: string | null
          created_at: string
        }
        Insert: {
          message_id?: number
          ticket_id: number
          sender_profile_id: string
          message_text: string
          attachment_url?: string | null
          created_at?: string
        }
        Update: {
          message_id?: number
          ticket_id?: number
          sender_profile_id?: string
          message_text?: string
          attachment_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "support_ticket_messages_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_phrases: {
        Row: {
          lesson_phrase_id: number
          lesson_id: number
          phrase_id: number
          phrase_order: number
        }
        Insert: {
          lesson_phrase_id?: never
          lesson_id: number
          phrase_id: number
          phrase_order: number
        }
        Update: {
          lesson_phrase_id?: never
          lesson_id?: number
          phrase_id?: number
          phrase_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_phrases_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_phrases_phrase_id_fkey"
            columns: ["phrase_id"]
            isOneToOne: false
            referencedRelation: "phrases"
            referencedColumns: ["phrase_id"]
          },
        ]
      }
      phrases: {
        Row: {
          phrase_id: number
          concept_description: string | null
          created_at: string | null
        }
        Insert: {
          phrase_id?: never
          concept_description?: string | null
          created_at?: string | null
        }
        Update: {
          phrase_id?: never
          concept_description?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_fix_user_tier: {
        Args: { user_profile_id: string }
        Returns: {
          active_subscriptions: string[]
          new_tier: string
          old_tier: string
        }[]
      }
      calculate_book_completion: {
        Args: { p_book_id: number; p_profile_id: string }
        Returns: {
          completed_chapters: number
          completion_percentage: number
          is_book_completed: boolean
          total_chapters: number
        }[]
      }
      can_user_access_lesson: {
        Args: { lesson_id_param: number; profile_id_param: string }
        Returns: boolean
      }
      can_user_access_level: {
        Args: {
          level_code_param: Database["public"]["Enums"]["level_enum"]
          profile_id_param: string
        }
        Returns: boolean
      }
      can_user_access_unit: {
        Args: { profile_id_param: string; unit_id_param: number }
        Returns: boolean
      }
      check_and_award_unit_completion_bonus: {
        Args: {
          profile_id_param: string
          triggering_lesson_id_param: number
          unit_id_param: number
        }
        Returns: undefined
      }
      check_audiobook_ownership: {
        Args: { p_book_id: number; p_profile_id: string }
        Returns: boolean
      }
      cleanup_user_subscriptions: {
        Args: { user_profile_id: string }
        Returns: string
      }
      expire_partnership_trials: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_user_audiobook_purchases: {
        Args: { p_profile_id: string }
        Returns: {
          amount_paid_cents: number
          author: string
          book_id: number
          cover_image_url: string
          hosted_invoice_url: string
          invoice_pdf_url: string
          points_spent: number
          purchase_type: Database["public"]["Enums"]["purchase_type_enum"]
          purchased_at: string
          title: string
        }[]
      }
      get_user_available_levels: {
        Args: { profile_id_param: string }
        Returns: Database["public"]["Enums"]["level_enum"][]
      }
      get_user_billing_summary: {
        Args: { user_profile_id: string }
        Returns: {
          active_subscriptions_count: number
          current_tier: string
          has_payment_method: boolean
          monthly_amount: number
          next_billing_date: string
        }[]
      }
      get_user_highest_tier: {
        Args: { user_profile_id: string }
        Returns: string
      }
      get_user_progression_status: {
        Args: { profile_id_param: string }
        Returns: {
          lesson_available: boolean
          lesson_completed: boolean
          lesson_id: number
          level_available: boolean
          level_code: Database["public"]["Enums"]["level_enum"]
          unit_available: boolean
          unit_id: number
        }[]
      }
      handle_subscription_tier_conflict: {
        Args: {
          new_tier: Database["public"]["Enums"]["subscription_tier_enum"]
          user_profile_id: string
        }
        Returns: undefined
      }
      handle_user_streak: {
        Args: { profile_id_param: string }
        Returns: number
      }
      handle_user_word_pronunciation_update: {
        Args: {
          language_code_param: string
          profile_id_param: string
          word_data: Json
        }
        Returns: undefined
      }
      is_lesson_complete: {
        Args: { p_lesson_id: number; p_profile_id: string }
        Returns: boolean
      }
      is_unit_complete: {
        Args: { p_profile_id: string; p_unit_id: number }
        Returns: boolean
      }
      process_chat_completion: {
        Args: {
          language_code_param: string
          lesson_id_param: number
          profile_id_param: string
        }
        Returns: {
          points_awarded_total: number
        }[]
      }
      process_user_activity: {
        Args: {
          accuracy_score_param?: number
          activity_type_param: Database["public"]["Enums"]["activity_type_enum"]
          completeness_score_param?: number
          fluency_score_param?: number
          language_code_param: string
          lesson_id_param: number
          overall_similarity_score_param?: number
          phonetic_data_param?: Json
          phrase_id_param?: number
          profile_id_param: string
          pronunciation_score_param?: number
          prosody_score_param?: number
          recognized_text_param?: string
          reference_text_param?: string
          word_level_feedback_param?: Json
          written_text_param?: string
        }
        Returns: {
          points_awarded_total: number
        }[]
      }
      process_word_practice_attempt: {
        Args: {
          accuracy_score_param: number
          language_code_param: string
          profile_id_param: string
          word_text_param: string
        }
        Returns: {
          needs_practice: boolean
          new_average_score: number
          points_awarded: number
          success: boolean
          total_attempts: number
          word_completed: boolean
        }[]
      }
      redeem_partnership_invitation: {
        Args: { p_token: string; p_user_id: string }
        Returns: Json
      }
      update_chapter_progress: {
        Args: {
          p_book_id: number
          p_chapter_duration_seconds?: number
          p_chapter_id: number
          p_position_seconds: number
          p_profile_id: string
        }
        Returns: boolean
      }
      update_user_subscription_tier: {
        Args: { user_profile_id: string }
        Returns: string
      }
      upsert_audiobook_purchase: {
        Args: {
          p_invoice_data: Json
          p_stripe_customer_id: string
          p_stripe_invoice_id: string
        }
        Returns: undefined
      }
      upsert_stripe_invoice: {
        Args: {
          p_invoice_data: Json
          p_stripe_customer_id: string
          p_stripe_invoice_id: string
          p_stripe_subscription_id: string
        }
        Returns: boolean
      }
      upsert_stripe_subscription: {
        Args: {
          p_stripe_customer_id: string
          p_stripe_price_id: string
          p_stripe_subscription_id: string
          p_subscription_data: Json
        }
        Returns: boolean
      }
    }
    Enums: {
      account_status_enum:
        | "pending_verification"
        | "active"
        | "suspended"
        | "deactivated"
      activity_status_enum: "not_started" | "in_progress" | "completed"
      activity_type_enum: "dictation" | "pronunciation" | "chat"
      invoice_status_enum:
        | "draft"
        | "open"
        | "paid"
        | "void"
        | "uncollectible"
        | "past_due"
        | "refunded"
        | "pending"
      level_enum: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
      partnership_invitation_status: "pending" | "redeemed" | "expired"
      price_billing_interval_enum: "day" | "week" | "month" | "year"
      price_type_enum: "recurring" | "one_time"
      purchase_type_enum: "points" | "money"
      sender_type_enum: "user" | "ai"
      subscription_status_enum:
        | "trialing"
        | "active"
        | "past_due"
        | "unpaid"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "paused"
      subscription_tier_enum: "free" | "starter" | "pro"
      tour_progress_status: "pending" | "in_progress" | "completed"
      user_role_enum: "student" | "partnership_manager" | "admin" | "support"
      ticket_status_enum: "open" | "in_progress" | "resolved" | "closed"
      contact_reason_enum: "billing_issue" | "partnership_benefits" | "technical_issue" | "feature_request" | "content_error" | "account_question" | "other"
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
      account_status_enum: [
        "pending_verification",
        "active",
        "suspended",
        "deactivated",
      ],
      activity_status_enum: ["not_started", "in_progress", "completed"],
      activity_type_enum: ["dictation", "pronunciation", "chat"],
      invoice_status_enum: [
        "draft",
        "open",
        "paid",
        "void",
        "uncollectible",
        "past_due",
        "refunded",
        "pending",
      ],
      level_enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
      partnership_invitation_status: ["pending", "redeemed", "expired"],
      price_billing_interval_enum: ["day", "week", "month", "year"],
      price_type_enum: ["recurring", "one_time"],
      purchase_type_enum: ["points", "money"],
      sender_type_enum: ["user", "ai"],
      subscription_status_enum: [
        "trialing",
        "active",
        "past_due",
        "unpaid",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "paused",
      ],
      subscription_tier_enum: ["free", "starter", "pro"],
      tour_progress_status: ["pending", "in_progress", "completed"],
      user_role_enum: ["student", "partnership_manager", "admin", "support"],
      ticket_status_enum: ["open", "in_progress", "resolved", "closed"],
      contact_reason_enum: ["billing_issue", "partnership_benefits", "technical_issue", "feature_request", "content_error", "account_question", "other"],
    },
  },
} as const

