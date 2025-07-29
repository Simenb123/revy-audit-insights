export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      account_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_system_category: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_system_category?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_system_category?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      account_custom_attributes: {
        Row: {
          attribute_name: string
          attribute_type: string | null
          attribute_value: string | null
          created_at: string
          id: string
          standard_account_id: string | null
          updated_at: string
        }
        Insert: {
          attribute_name: string
          attribute_type?: string | null
          attribute_value?: string | null
          created_at?: string
          id?: string
          standard_account_id?: string | null
          updated_at?: string
        }
        Update: {
          attribute_name?: string
          attribute_type?: string | null
          attribute_value?: string | null
          created_at?: string
          id?: string
          standard_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_custom_attributes_standard_account_id_fkey"
            columns: ["standard_account_id"]
            isOneToOne: false
            referencedRelation: "standard_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      account_mapping_rules: {
        Row: {
          account_range_end: number
          account_range_start: number
          confidence_score: number | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          rule_name: string
          standard_account_id: string
          updated_at: string
        }
        Insert: {
          account_range_end: number
          account_range_start: number
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          rule_name: string
          standard_account_id: string
          updated_at?: string
        }
        Update: {
          account_range_end?: number
          account_range_start?: number
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          rule_name?: string
          standard_account_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      account_mapping_suggestions: {
        Row: {
          approved_by: string | null
          client_account_id: string
          client_id: string
          confidence_score: number | null
          created_at: string
          id: string
          rule_id: string | null
          status: string | null
          suggested_standard_account_id: string
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          client_account_id: string
          client_id: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          rule_id?: string | null
          status?: string | null
          suggested_standard_account_id: string
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          client_account_id?: string
          client_id?: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          rule_id?: string | null
          status?: string | null
          suggested_standard_account_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_mapping_suggestions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "account_mapping_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      account_mappings: {
        Row: {
          client_account_id: string
          client_id: string
          created_at: string
          id: string
          is_manual_mapping: boolean
          mapping_confidence: number | null
          standard_account_id: string
          updated_at: string
        }
        Insert: {
          client_account_id: string
          client_id: string
          created_at?: string
          id?: string
          is_manual_mapping?: boolean
          mapping_confidence?: number | null
          standard_account_id: string
          updated_at?: string
        }
        Update: {
          client_account_id?: string
          client_id?: string
          created_at?: string
          id?: string
          is_manual_mapping?: boolean
          mapping_confidence?: number | null
          standard_account_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_mappings_client_account_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "client_chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_mappings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_mappings_standard_account_id_fkey"
            columns: ["standard_account_id"]
            isOneToOne: false
            referencedRelation: "standard_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      account_relationships: {
        Row: {
          child_account_id: string | null
          created_at: string
          id: string
          is_active: boolean
          metadata: Json | null
          parent_account_id: string | null
          relationship_type: string
          updated_at: string
          weight: number | null
        }
        Insert: {
          child_account_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          parent_account_id?: string | null
          relationship_type: string
          updated_at?: string
          weight?: number | null
        }
        Update: {
          child_account_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          parent_account_id?: string | null
          relationship_type?: string
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "account_relationships_child_account_id_fkey"
            columns: ["child_account_id"]
            isOneToOne: false
            referencedRelation: "standard_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_relationships_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "standard_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      account_risk_mappings: {
        Row: {
          created_at: string
          id: string
          impact_description: string | null
          mitigation_notes: string | null
          risk_factor_id: string | null
          risk_level: string | null
          standard_account_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          impact_description?: string | null
          mitigation_notes?: string | null
          risk_factor_id?: string | null
          risk_level?: string | null
          standard_account_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          impact_description?: string | null
          mitigation_notes?: string | null
          risk_factor_id?: string | null
          risk_level?: string | null
          standard_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_risk_mappings_risk_factor_id_fkey"
            columns: ["risk_factor_id"]
            isOneToOne: false
            referencedRelation: "risk_factors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_risk_mappings_standard_account_id_fkey"
            columns: ["standard_account_id"]
            isOneToOne: false
            referencedRelation: "standard_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      action_ai_metadata: {
        Row: {
          action_template_id: string | null
          ai_variant_id: string | null
          common_issues: Json | null
          created_at: string
          estimated_complexity: number | null
          id: string
          quality_checkpoints: Json | null
          risk_indicators: Json | null
          specialized_prompt: string | null
          typical_documents: Json | null
          updated_at: string
        }
        Insert: {
          action_template_id?: string | null
          ai_variant_id?: string | null
          common_issues?: Json | null
          created_at?: string
          estimated_complexity?: number | null
          id?: string
          quality_checkpoints?: Json | null
          risk_indicators?: Json | null
          specialized_prompt?: string | null
          typical_documents?: Json | null
          updated_at?: string
        }
        Update: {
          action_template_id?: string | null
          ai_variant_id?: string | null
          common_issues?: Json | null
          created_at?: string
          estimated_complexity?: number | null
          id?: string
          quality_checkpoints?: Json | null
          risk_indicators?: Json | null
          specialized_prompt?: string | null
          typical_documents?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_ai_metadata_action_template_id_fkey"
            columns: ["action_template_id"]
            isOneToOne: true
            referencedRelation: "audit_action_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_ai_metadata_ai_variant_id_fkey"
            columns: ["ai_variant_id"]
            isOneToOne: false
            referencedRelation: "ai_revy_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      action_groups: {
        Row: {
          audit_firm_id: string | null
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_system_group: boolean | null
          name: string
          sort_order: number | null
          subject_area: Database["public"]["Enums"]["audit_subject_area"]
          subject_area_id: string | null
          updated_at: string
        }
        Insert: {
          audit_firm_id?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system_group?: boolean | null
          name: string
          sort_order?: number | null
          subject_area: Database["public"]["Enums"]["audit_subject_area"]
          subject_area_id?: string | null
          updated_at?: string
        }
        Update: {
          audit_firm_id?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system_group?: boolean | null
          name?: string
          sort_order?: number | null
          subject_area?: Database["public"]["Enums"]["audit_subject_area"]
          subject_area_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_groups_audit_firm_id_fkey"
            columns: ["audit_firm_id"]
            isOneToOne: false
            referencedRelation: "audit_firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_groups_subject_area_id_fkey"
            columns: ["subject_area_id"]
            isOneToOne: false
            referencedRelation: "subject_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_cache: {
        Row: {
          client_id: string | null
          created_at: string
          hits: number
          id: string
          last_hit_at: string
          model: string
          request_hash: string
          response: Json
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          hits?: number
          id?: string
          last_hit_at?: string
          model: string
          request_hash: string
          response: Json
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          hits?: number
          id?: string
          last_hit_at?: string
          model?: string
          request_hash?: string
          response?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_cache_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prompt_configurations: {
        Row: {
          base_prompt: string
          context_prompts: Json
          created_at: string
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          base_prompt: string
          context_prompts?: Json
          created_at?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          base_prompt?: string
          context_prompts?: Json
          created_at?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_prompt_history: {
        Row: {
          base_prompt: string
          configuration_id: string | null
          context_prompts: Json
          created_at: string
          id: string
          updated_by: string | null
        }
        Insert: {
          base_prompt: string
          configuration_id?: string | null
          context_prompts?: Json
          created_at?: string
          id?: string
          updated_by?: string | null
        }
        Update: {
          base_prompt?: string
          configuration_id?: string | null
          context_prompts?: Json
          created_at?: string
          id?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_prompt_history_configuration_id_fkey"
            columns: ["configuration_id"]
            isOneToOne: false
            referencedRelation: "ai_prompt_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_revy_variants: {
        Row: {
          available_contexts: string[] | null
          context_requirements: Json | null
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          system_prompt_template: string
          updated_at: string
        }
        Insert: {
          available_contexts?: string[] | null
          context_requirements?: Json | null
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          system_prompt_template: string
          updated_at?: string
        }
        Update: {
          available_contexts?: string[] | null
          context_requirements?: Json | null
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          system_prompt_template?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          client_id: string | null
          completion_tokens: number
          context_type: string | null
          created_at: string
          error_message: string | null
          estimated_cost_usd: number
          id: string
          model: string
          prompt_tokens: number
          request_type: string
          response_time_ms: number | null
          session_id: string | null
          total_tokens: number
          user_id: string
        }
        Insert: {
          client_id?: string | null
          completion_tokens?: number
          context_type?: string | null
          created_at?: string
          error_message?: string | null
          estimated_cost_usd?: number
          id?: string
          model: string
          prompt_tokens?: number
          request_type?: string
          response_time_ms?: number | null
          session_id?: string | null
          total_tokens?: number
          user_id: string
        }
        Update: {
          client_id?: string | null
          completion_tokens?: number
          context_type?: string | null
          created_at?: string
          error_message?: string | null
          estimated_cost_usd?: number
          id?: string
          model?: string
          prompt_tokens?: number
          request_type?: string
          response_time_ms?: number | null
          session_id?: string | null
          total_tokens?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_results: {
        Row: {
          client_id: string
          created_at: string
          id: string
          period_end: string
          period_start: string
          results_json: Json
          template_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          results_json: Json
          template_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          results_json?: Json
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_results_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_results_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "analysis_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_templates: {
        Row: {
          config_json: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_system_template: boolean
          name: string
          template_type: string
          updated_at: string
        }
        Insert: {
          config_json: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system_template?: boolean
          name: string
          template_type: string
          updated_at?: string
        }
        Update: {
          config_json?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system_template?: boolean
          name?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          client_id: string
          created_at: string | null
          date: string
          id: string
          is_read: boolean | null
          title: string
          type: string
          url: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          date: string
          id?: string
          is_read?: boolean | null
          title: string
          type: string
          url: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          date?: string
          id?: string
          is_read?: boolean | null
          title?: string
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      article_media: {
        Row: {
          alt_text: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          user_id: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          user_id: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          user_id?: string
        }
        Relationships: []
      }
      article_subject_areas: {
        Row: {
          article_id: string
          created_at: string
          id: string
          subject_area_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          subject_area_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          subject_area_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_subject_areas_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_subject_areas_subject_area_id_fkey"
            columns: ["subject_area_id"]
            isOneToOne: false
            referencedRelation: "subject_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      article_unified_categories: {
        Row: {
          article_id: string
          created_at: string
          id: string
          relevance_score: number | null
          unified_category_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          relevance_score?: number | null
          unified_category_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          relevance_score?: number | null
          unified_category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_unified_categories_unified_category_id_fkey"
            columns: ["unified_category_id"]
            isOneToOne: false
            referencedRelation: "unified_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_action_area_mappings: {
        Row: {
          action_template_id: string | null
          audit_area_id: string | null
          created_at: string
          id: string
          relevance_level: string
          sort_order: number | null
        }
        Insert: {
          action_template_id?: string | null
          audit_area_id?: string | null
          created_at?: string
          id?: string
          relevance_level?: string
          sort_order?: number | null
        }
        Update: {
          action_template_id?: string | null
          audit_area_id?: string | null
          created_at?: string
          id?: string
          relevance_level?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_action_area_mappings_action_template_id_fkey"
            columns: ["action_template_id"]
            isOneToOne: false
            referencedRelation: "audit_action_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_action_area_mappings_audit_area_id_fkey"
            columns: ["audit_area_id"]
            isOneToOne: false
            referencedRelation: "audit_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_action_contexts: {
        Row: {
          action_template_id: string | null
          applicable_conditions: Json | null
          context_description: string | null
          context_name: string
          created_at: string
          estimated_hours_adjustment: number | null
          id: string
          modified_documentation_requirements: string | null
          modified_procedures: string
          risk_level_adjustment: string | null
          updated_at: string
        }
        Insert: {
          action_template_id?: string | null
          applicable_conditions?: Json | null
          context_description?: string | null
          context_name: string
          created_at?: string
          estimated_hours_adjustment?: number | null
          id?: string
          modified_documentation_requirements?: string | null
          modified_procedures: string
          risk_level_adjustment?: string | null
          updated_at?: string
        }
        Update: {
          action_template_id?: string | null
          applicable_conditions?: Json | null
          context_description?: string | null
          context_name?: string
          created_at?: string
          estimated_hours_adjustment?: number | null
          id?: string
          modified_documentation_requirements?: string | null
          modified_procedures?: string
          risk_level_adjustment?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_action_contexts_action_template_id_fkey"
            columns: ["action_template_id"]
            isOneToOne: false
            referencedRelation: "audit_action_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_action_document_mappings: {
        Row: {
          action_template_id: string | null
          created_at: string
          document_requirement_id: string | null
          id: string
          is_mandatory: boolean
          timing: string | null
        }
        Insert: {
          action_template_id?: string | null
          created_at?: string
          document_requirement_id?: string | null
          id?: string
          is_mandatory?: boolean
          timing?: string | null
        }
        Update: {
          action_template_id?: string | null
          created_at?: string
          document_requirement_id?: string | null
          id?: string
          is_mandatory?: boolean
          timing?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_action_document_mappings_action_template_id_fkey"
            columns: ["action_template_id"]
            isOneToOne: false
            referencedRelation: "audit_action_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_action_document_mappings_document_requirement_id_fkey"
            columns: ["document_requirement_id"]
            isOneToOne: false
            referencedRelation: "document_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_action_isa_mappings: {
        Row: {
          action_template_id: string | null
          created_at: string
          id: string
          isa_standard_id: string | null
          relevance_level: string
        }
        Insert: {
          action_template_id?: string | null
          created_at?: string
          id?: string
          isa_standard_id?: string | null
          relevance_level?: string
        }
        Update: {
          action_template_id?: string | null
          created_at?: string
          id?: string
          isa_standard_id?: string | null
          relevance_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_action_isa_mappings_action_template_id_fkey"
            columns: ["action_template_id"]
            isOneToOne: false
            referencedRelation: "audit_action_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_action_isa_mappings_isa_standard_id_fkey"
            columns: ["isa_standard_id"]
            isOneToOne: false
            referencedRelation: "isa_standards"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_action_recommendations: {
        Row: {
          action_template_id: string | null
          ai_metadata: Json | null
          client_id: string | null
          created_at: string
          id: string
          reasoning: string | null
          recommendation_score: number
          risk_assessment_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          action_template_id?: string | null
          ai_metadata?: Json | null
          client_id?: string | null
          created_at?: string
          id?: string
          reasoning?: string | null
          recommendation_score?: number
          risk_assessment_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          action_template_id?: string | null
          ai_metadata?: Json | null
          client_id?: string | null
          created_at?: string
          id?: string
          reasoning?: string | null
          recommendation_score?: number
          risk_assessment_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_action_recommendations_action_template_id_fkey"
            columns: ["action_template_id"]
            isOneToOne: false
            referencedRelation: "audit_action_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_action_recommendations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_action_recommendations_risk_assessment_id_fkey"
            columns: ["risk_assessment_id"]
            isOneToOne: false
            referencedRelation: "client_risk_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_action_risk_mappings: {
        Row: {
          action_template_id: string | null
          created_at: string
          effectiveness_level: string
          id: string
          response_type: string
          risk_factor_id: string | null
        }
        Insert: {
          action_template_id?: string | null
          created_at?: string
          effectiveness_level?: string
          id?: string
          response_type?: string
          risk_factor_id?: string | null
        }
        Update: {
          action_template_id?: string | null
          created_at?: string
          effectiveness_level?: string
          id?: string
          response_type?: string
          risk_factor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_action_risk_mappings_action_template_id_fkey"
            columns: ["action_template_id"]
            isOneToOne: false
            referencedRelation: "audit_action_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_action_risk_mappings_risk_factor_id_fkey"
            columns: ["risk_factor_id"]
            isOneToOne: false
            referencedRelation: "risk_factors"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_action_subject_areas: {
        Row: {
          action_template_id: string | null
          created_at: string
          id: string
          subject_area_id: string | null
        }
        Insert: {
          action_template_id?: string | null
          created_at?: string
          id?: string
          subject_area_id?: string | null
        }
        Update: {
          action_template_id?: string | null
          created_at?: string
          id?: string
          subject_area_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_action_subject_areas_action_template_id_fkey"
            columns: ["action_template_id"]
            isOneToOne: false
            referencedRelation: "audit_action_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_action_subject_areas_subject_area_id_fkey"
            columns: ["subject_area_id"]
            isOneToOne: false
            referencedRelation: "subject_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_action_tags: {
        Row: {
          action_template_id: string | null
          created_at: string
          id: string
          tag_id: string | null
        }
        Insert: {
          action_template_id?: string | null
          created_at?: string
          id?: string
          tag_id?: string | null
        }
        Update: {
          action_template_id?: string | null
          created_at?: string
          id?: string
          tag_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_action_tags_action_template_id_fkey"
            columns: ["action_template_id"]
            isOneToOne: false
            referencedRelation: "audit_action_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_action_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_action_templates: {
        Row: {
          action_type: Database["public"]["Enums"]["action_type"]
          applicable_phases: Database["public"]["Enums"]["audit_phase"][] | null
          audit_firm_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          documentation_requirements: string | null
          estimated_hours: number | null
          group_id: string | null
          id: string
          is_active: boolean | null
          is_system_template: boolean | null
          name: string
          objective: string | null
          procedures: string
          risk_level: string | null
          sort_order: number | null
          subject_area: Database["public"]["Enums"]["audit_subject_area"] | null
          subject_area_id: string | null
          updated_at: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["action_type"]
          applicable_phases?:
            | Database["public"]["Enums"]["audit_phase"][]
            | null
          audit_firm_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          documentation_requirements?: string | null
          estimated_hours?: number | null
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          is_system_template?: boolean | null
          name: string
          objective?: string | null
          procedures: string
          risk_level?: string | null
          sort_order?: number | null
          subject_area?:
            | Database["public"]["Enums"]["audit_subject_area"]
            | null
          subject_area_id?: string | null
          updated_at?: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["action_type"]
          applicable_phases?:
            | Database["public"]["Enums"]["audit_phase"][]
            | null
          audit_firm_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          documentation_requirements?: string | null
          estimated_hours?: number | null
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          is_system_template?: boolean | null
          name?: string
          objective?: string | null
          procedures?: string
          risk_level?: string | null
          sort_order?: number | null
          subject_area?:
            | Database["public"]["Enums"]["audit_subject_area"]
            | null
          subject_area_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_action_templates_audit_firm_id_fkey"
            columns: ["audit_firm_id"]
            isOneToOne: false
            referencedRelation: "audit_firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_action_templates_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "action_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_action_templates_subject_area_id_fkey"
            columns: ["subject_area_id"]
            isOneToOne: false
            referencedRelation: "subject_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_areas: {
        Row: {
          audit_number: number
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_system_area: boolean | null
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          audit_number: number
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system_area?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          audit_number?: number
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system_area?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      audit_firms: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          org_number: string | null
          phone: string | null
          postal_code: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          org_number?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          org_number?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action_type: Database["public"]["Enums"]["audit_action_type"]
          area_name: string
          client_id: string
          created_at: string
          description: string | null
          id: string
          is_reviewed: boolean | null
          metadata: Json | null
          reviewed_at: string | null
          reviewer_id: string | null
          user_id: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["audit_action_type"]
          area_name: string
          client_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_reviewed?: boolean | null
          metadata?: Json | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          user_id: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["audit_action_type"]
          area_name?: string
          client_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_reviewed?: boolean | null
          metadata?: Json | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_import_sessions: {
        Row: {
          auditor_name: string | null
          auditor_org_number: string
          completed_at: string | null
          error_message: string | null
          id: string
          lost_clients: number | null
          new_potential_clients: number | null
          session_data: Json | null
          session_type: string
          started_at: string
          started_by: string | null
          status: string
          total_found: number | null
          updated_clients: number | null
        }
        Insert: {
          auditor_name?: string | null
          auditor_org_number: string
          completed_at?: string | null
          error_message?: string | null
          id?: string
          lost_clients?: number | null
          new_potential_clients?: number | null
          session_data?: Json | null
          session_type: string
          started_at?: string
          started_by?: string | null
          status?: string
          total_found?: number | null
          updated_clients?: number | null
        }
        Update: {
          auditor_name?: string | null
          auditor_org_number?: string
          completed_at?: string | null
          error_message?: string | null
          id?: string
          lost_clients?: number | null
          new_potential_clients?: number | null
          session_data?: Json | null
          session_type?: string
          started_at?: string
          started_by?: string | null
          status?: string
          total_found?: number | null
          updated_clients?: number | null
        }
        Relationships: []
      }
      chat_rooms: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          reference_id: string
          room_type: Database["public"]["Enums"]["communication_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          reference_id: string
          room_type: Database["public"]["Enums"]["communication_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          reference_id?: string
          room_type?: Database["public"]["Enums"]["communication_type"]
          updated_at?: string
        }
        Relationships: []
      }
      client_audit_actions: {
        Row: {
          action_type: Database["public"]["Enums"]["action_type"]
          actual_hours: number | null
          assigned_to: string | null
          client_id: string
          completed_at: string | null
          conclusion: string | null
          copied_from_action_id: string | null
          copied_from_client_id: string | null
          created_at: string
          description: string | null
          documentation_requirements: string | null
          due_date: string | null
          estimated_hours: number | null
          findings: string | null
          id: string
          name: string
          objective: string | null
          phase: Database["public"]["Enums"]["audit_phase"]
          procedures: string
          reviewed_at: string | null
          reviewed_by: string | null
          risk_level: string | null
          sort_order: number | null
          status: Database["public"]["Enums"]["action_status"] | null
          subject_area: Database["public"]["Enums"]["audit_subject_area"]
          subject_area_id: string | null
          template_id: string | null
          updated_at: string
          work_notes: string | null
        }
        Insert: {
          action_type: Database["public"]["Enums"]["action_type"]
          actual_hours?: number | null
          assigned_to?: string | null
          client_id: string
          completed_at?: string | null
          conclusion?: string | null
          copied_from_action_id?: string | null
          copied_from_client_id?: string | null
          created_at?: string
          description?: string | null
          documentation_requirements?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          findings?: string | null
          id?: string
          name: string
          objective?: string | null
          phase: Database["public"]["Enums"]["audit_phase"]
          procedures: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_level?: string | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["action_status"] | null
          subject_area: Database["public"]["Enums"]["audit_subject_area"]
          subject_area_id?: string | null
          template_id?: string | null
          updated_at?: string
          work_notes?: string | null
        }
        Update: {
          action_type?: Database["public"]["Enums"]["action_type"]
          actual_hours?: number | null
          assigned_to?: string | null
          client_id?: string
          completed_at?: string | null
          conclusion?: string | null
          copied_from_action_id?: string | null
          copied_from_client_id?: string | null
          created_at?: string
          description?: string | null
          documentation_requirements?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          findings?: string | null
          id?: string
          name?: string
          objective?: string | null
          phase?: Database["public"]["Enums"]["audit_phase"]
          procedures?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_level?: string | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["action_status"] | null
          subject_area?: Database["public"]["Enums"]["audit_subject_area"]
          subject_area_id?: string | null
          template_id?: string | null
          updated_at?: string
          work_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_audit_actions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_audit_actions_copied_from_action_id_fkey"
            columns: ["copied_from_action_id"]
            isOneToOne: false
            referencedRelation: "client_audit_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_audit_actions_copied_from_client_id_fkey"
            columns: ["copied_from_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_audit_actions_subject_area_id_fkey"
            columns: ["subject_area_id"]
            isOneToOne: false
            referencedRelation: "subject_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_audit_actions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "audit_action_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      client_auditor_history: {
        Row: {
          auditor_name: string | null
          auditor_org_number: string
          auditor_type: string | null
          brreg_data: Json | null
          client_id: string
          created_at: string
          discovered_via: string
          id: string
          is_current: boolean
          updated_at: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          auditor_name?: string | null
          auditor_org_number: string
          auditor_type?: string | null
          brreg_data?: Json | null
          client_id: string
          created_at?: string
          discovered_via?: string
          id?: string
          is_current?: boolean
          updated_at?: string
          valid_from: string
          valid_to?: string | null
        }
        Update: {
          auditor_name?: string | null
          auditor_org_number?: string
          auditor_type?: string | null
          brreg_data?: Json | null
          client_id?: string
          created_at?: string
          discovered_via?: string
          id?: string
          is_current?: boolean
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_auditor_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_chart_of_accounts: {
        Row: {
          account_name: string
          account_number: string
          account_type: Database["public"]["Enums"]["account_type_enum"]
          client_id: string
          created_at: string
          id: string
          is_active: boolean
          parent_account_id: string | null
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number: string
          account_type: Database["public"]["Enums"]["account_type_enum"]
          client_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          parent_account_id?: string | null
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          account_type?: Database["public"]["Enums"]["account_type_enum"]
          client_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          parent_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_chart_of_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_chart_of_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "client_chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contacts: {
        Row: {
          client_id: string
          created_at: string
          email: string | null
          id: string
          is_primary: boolean | null
          name: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          phone?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_documents: {
        Row: {
          client_id: string
          created_at: string
          due_date: string
          id: string
          status: Database["public"]["Enums"]["document_status"]
          type: Database["public"]["Enums"]["document_type"]
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          due_date: string
          id?: string
          status?: Database["public"]["Enums"]["document_status"]
          type: Database["public"]["Enums"]["document_type"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          due_date?: string
          id?: string
          status?: Database["public"]["Enums"]["document_status"]
          type?: Database["public"]["Enums"]["document_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_documents_files: {
        Row: {
          ai_analysis_summary: string | null
          ai_confidence_score: number | null
          ai_isa_standard_references: string[] | null
          ai_revision_phase_relevance: Json | null
          ai_suggested_category: string | null
          ai_suggested_subject_areas: string[] | null
          category: string | null
          client_id: string
          created_at: string
          extracted_text: string | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          manual_category_override: boolean | null
          mime_type: string
          subject_area: string | null
          text_extraction_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_analysis_summary?: string | null
          ai_confidence_score?: number | null
          ai_isa_standard_references?: string[] | null
          ai_revision_phase_relevance?: Json | null
          ai_suggested_category?: string | null
          ai_suggested_subject_areas?: string[] | null
          category?: string | null
          client_id: string
          created_at?: string
          extracted_text?: string | null
          file_name: string
          file_path: string
          file_size: number
          id?: string
          manual_category_override?: boolean | null
          mime_type: string
          subject_area?: string | null
          text_extraction_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_analysis_summary?: string | null
          ai_confidence_score?: number | null
          ai_isa_standard_references?: string[] | null
          ai_revision_phase_relevance?: Json | null
          ai_suggested_category?: string | null
          ai_suggested_subject_areas?: string[] | null
          category?: string | null
          client_id?: string
          created_at?: string
          extracted_text?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          manual_category_override?: boolean | null
          mime_type?: string
          subject_area?: string | null
          text_extraction_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_files_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_history_logs: {
        Row: {
          change_metadata: Json | null
          change_source: string
          change_type: string
          changed_by: string | null
          client_id: string
          created_at: string
          description: string | null
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          change_metadata?: Json | null
          change_source?: string
          change_type: string
          changed_by?: string | null
          client_id: string
          created_at?: string
          description?: string | null
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          change_metadata?: Json | null
          change_source?: string
          change_type?: string
          changed_by?: string | null
          client_id?: string
          created_at?: string
          description?: string | null
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_history_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_risk_assessments: {
        Row: {
          assessed_by: string | null
          assessment_date: string
          assessment_notes: string | null
          audit_area_id: string | null
          client_id: string | null
          created_at: string
          id: string
          risk_factors: Json | null
          risk_level: string
          updated_at: string
        }
        Insert: {
          assessed_by?: string | null
          assessment_date?: string
          assessment_notes?: string | null
          audit_area_id?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          risk_factors?: Json | null
          risk_level?: string
          updated_at?: string
        }
        Update: {
          assessed_by?: string | null
          assessment_date?: string
          assessment_notes?: string | null
          audit_area_id?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          risk_factors?: Json | null
          risk_level?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_risk_assessments_audit_area_id_fkey"
            columns: ["audit_area_id"]
            isOneToOne: false
            referencedRelation: "audit_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_risk_assessments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_roles: {
        Row: {
          brreg_data: Json | null
          client_id: string | null
          created_at: string | null
          discovered_via: string | null
          from_date: string | null
          id: string
          is_current: boolean | null
          name: string | null
          org_number: string | null
          person_id: string | null
          role_description: string | null
          role_type: string | null
          to_date: string | null
          updated_at: string | null
        }
        Insert: {
          brreg_data?: Json | null
          client_id?: string | null
          created_at?: string | null
          discovered_via?: string | null
          from_date?: string | null
          id?: string
          is_current?: boolean | null
          name?: string | null
          org_number?: string | null
          person_id?: string | null
          role_description?: string | null
          role_type?: string | null
          to_date?: string | null
          updated_at?: string | null
        }
        Update: {
          brreg_data?: Json | null
          client_id?: string | null
          created_at?: string | null
          discovered_via?: string | null
          from_date?: string | null
          id?: string
          is_current?: boolean | null
          name?: string | null
          org_number?: string | null
          person_id?: string | null
          role_description?: string | null
          role_type?: string | null
          to_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_roles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_teams: {
        Row: {
          client_id: string
          created_at: string
          department_id: string
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          name: string
          start_date: string | null
          team_lead_id: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          department_id: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          start_date?: string | null
          team_lead_id?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          department_id?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          start_date?: string | null
          team_lead_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_teams_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_teams_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          accounting_system: string | null
          address: string | null
          address_line: string | null
          audit_fee: number | null
          auditor_since: string | null
          bank_account: string | null
          board_meetings_per_year: number | null
          brreg_sync_version: number | null
          ceo: string | null
          chair: string | null
          city: string | null
          company_name: string
          contact_person: string | null
          created_at: string
          current_auditor_name: string | null
          current_auditor_org_number: string | null
          department: string | null
          department_id: string | null
          email: string | null
          equity_capital: number | null
          homepage: string | null
          id: string
          industry: string | null
          internal_controls: string | null
          is_test_data: boolean | null
          last_brreg_sync_at: string | null
          municipality_code: string | null
          municipality_name: string | null
          nace_code: string | null
          nace_description: string | null
          name: string
          notes: string | null
          org_form_code: string | null
          org_form_description: string | null
          org_number: string
          phase: Database["public"]["Enums"]["audit_phase"]
          phone: string | null
          postal_code: string | null
          previous_auditor: string | null
          progress: number
          registration_date: string | null
          risk_assessment: string | null
          share_capital: number | null
          status: string | null
          updated_at: string
          user_id: string
          year_end_date: string | null
        }
        Insert: {
          accounting_system?: string | null
          address?: string | null
          address_line?: string | null
          audit_fee?: number | null
          auditor_since?: string | null
          bank_account?: string | null
          board_meetings_per_year?: number | null
          brreg_sync_version?: number | null
          ceo?: string | null
          chair?: string | null
          city?: string | null
          company_name: string
          contact_person?: string | null
          created_at?: string
          current_auditor_name?: string | null
          current_auditor_org_number?: string | null
          department?: string | null
          department_id?: string | null
          email?: string | null
          equity_capital?: number | null
          homepage?: string | null
          id?: string
          industry?: string | null
          internal_controls?: string | null
          is_test_data?: boolean | null
          last_brreg_sync_at?: string | null
          municipality_code?: string | null
          municipality_name?: string | null
          nace_code?: string | null
          nace_description?: string | null
          name: string
          notes?: string | null
          org_form_code?: string | null
          org_form_description?: string | null
          org_number: string
          phase?: Database["public"]["Enums"]["audit_phase"]
          phone?: string | null
          postal_code?: string | null
          previous_auditor?: string | null
          progress?: number
          registration_date?: string | null
          risk_assessment?: string | null
          share_capital?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
          year_end_date?: string | null
        }
        Update: {
          accounting_system?: string | null
          address?: string | null
          address_line?: string | null
          audit_fee?: number | null
          auditor_since?: string | null
          bank_account?: string | null
          board_meetings_per_year?: number | null
          brreg_sync_version?: number | null
          ceo?: string | null
          chair?: string | null
          city?: string | null
          company_name?: string
          contact_person?: string | null
          created_at?: string
          current_auditor_name?: string | null
          current_auditor_org_number?: string | null
          department?: string | null
          department_id?: string | null
          email?: string | null
          equity_capital?: number | null
          homepage?: string | null
          id?: string
          industry?: string | null
          internal_controls?: string | null
          is_test_data?: boolean | null
          last_brreg_sync_at?: string | null
          municipality_code?: string | null
          municipality_name?: string | null
          nace_code?: string | null
          nace_description?: string | null
          name?: string
          notes?: string | null
          org_form_code?: string | null
          org_form_description?: string | null
          org_number?: string
          phase?: Database["public"]["Enums"]["audit_phase"]
          phone?: string | null
          postal_code?: string | null
          previous_auditor?: string | null
          progress?: number
          registration_date?: string | null
          risk_assessment?: string | null
          share_capital?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
          year_end_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      column_mapping_history: {
        Row: {
          client_id: string
          confidence_score: number | null
          created_at: string
          file_name: string | null
          file_type: string
          id: string
          is_manual_override: boolean | null
          source_column: string
          target_field: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          confidence_score?: number | null
          created_at?: string
          file_name?: string | null
          file_type: string
          id?: string
          is_manual_override?: boolean | null
          source_column: string
          target_field: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          confidence_score?: number | null
          created_at?: string
          file_name?: string | null
          file_type?: string
          id?: string
          is_manual_override?: boolean | null
          source_column?: string
          target_field?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_types: {
        Row: {
          color: string
          created_at: string
          description: string | null
          display_name: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      data_import_exports: {
        Row: {
          completed_at: string | null
          created_at: string
          error_details: Json | null
          file_name: string
          file_size: number | null
          id: string
          operation_type: string
          records_failed: number | null
          records_processed: number | null
          records_successful: number | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_details?: Json | null
          file_name: string
          file_size?: number | null
          id?: string
          operation_type: string
          records_failed?: number | null
          records_processed?: number | null
          records_successful?: number | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_details?: Json | null
          file_name?: string
          file_size?: number | null
          id?: string
          operation_type?: string
          records_failed?: number | null
          records_processed?: number | null
          records_successful?: number | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          audit_firm_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          partner_id: string | null
          updated_at: string
        }
        Insert: {
          audit_firm_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          partner_id?: string | null
          updated_at?: string
        }
        Update: {
          audit_firm_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          partner_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_audit_firm_id_fkey"
            columns: ["audit_firm_id"]
            isOneToOne: false
            referencedRelation: "audit_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      document_categories: {
        Row: {
          category_name: string
          created_at: string
          description: string | null
          expected_file_patterns: string[] | null
          id: string
          is_standard: boolean | null
          subject_area: string
        }
        Insert: {
          category_name: string
          created_at?: string
          description?: string | null
          expected_file_patterns?: string[] | null
          id?: string
          is_standard?: boolean | null
          subject_area: string
        }
        Update: {
          category_name?: string
          created_at?: string
          description?: string | null
          expected_file_patterns?: string[] | null
          id?: string
          is_standard?: boolean | null
          subject_area?: string
        }
        Relationships: []
      }
      document_category_subject_area_mappings: {
        Row: {
          audit_phases: string[] | null
          confidence_score: number | null
          created_at: string
          document_category_id: string | null
          id: string
          isa_standards: string[] | null
          risk_level: string | null
          subject_area: string
        }
        Insert: {
          audit_phases?: string[] | null
          confidence_score?: number | null
          created_at?: string
          document_category_id?: string | null
          id?: string
          isa_standards?: string[] | null
          risk_level?: string | null
          subject_area: string
        }
        Update: {
          audit_phases?: string[] | null
          confidence_score?: number | null
          created_at?: string
          document_category_id?: string | null
          id?: string
          isa_standards?: string[] | null
          risk_level?: string | null
          subject_area?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_category_subject_area_mappin_document_category_id_fkey"
            columns: ["document_category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      document_cross_references: {
        Row: {
          confidence_score: number | null
          created_at: string
          id: string
          reference_text: string | null
          reference_type: string
          source_document_id: string | null
          target_document_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          reference_text?: string | null
          reference_type: string
          source_document_id?: string | null
          target_document_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          reference_text?: string | null
          reference_type?: string
          source_document_id?: string | null
          target_document_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_cross_references_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_cross_references_target_document_id_fkey"
            columns: ["target_document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_metadata: {
        Row: {
          amount_fields: Json | null
          column_mappings: Json | null
          contract_date: string | null
          created_at: string
          detected_system: string | null
          document_id: string
          document_type_id: string | null
          employee_id: string | null
          id: string
          period_end: string | null
          period_month: number | null
          period_start: string | null
          period_year: number | null
          processing_notes: string | null
          quality_score: number | null
          updated_at: string
          validation_errors: Json | null
          validation_status: string | null
        }
        Insert: {
          amount_fields?: Json | null
          column_mappings?: Json | null
          contract_date?: string | null
          created_at?: string
          detected_system?: string | null
          document_id: string
          document_type_id?: string | null
          employee_id?: string | null
          id?: string
          period_end?: string | null
          period_month?: number | null
          period_start?: string | null
          period_year?: number | null
          processing_notes?: string | null
          quality_score?: number | null
          updated_at?: string
          validation_errors?: Json | null
          validation_status?: string | null
        }
        Update: {
          amount_fields?: Json | null
          column_mappings?: Json | null
          contract_date?: string | null
          created_at?: string
          detected_system?: string | null
          document_id?: string
          document_type_id?: string | null
          employee_id?: string | null
          id?: string
          period_end?: string | null
          period_month?: number | null
          period_start?: string | null
          period_year?: number | null
          processing_notes?: string | null
          quality_score?: number | null
          updated_at?: string
          validation_errors?: Json | null
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_metadata_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "client_documents_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_metadata_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
        ]
      }
      document_relationships: {
        Row: {
          child_document_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          parent_document_id: string
          relationship_type: string
        }
        Insert: {
          child_document_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          parent_document_id: string
          relationship_type: string
        }
        Update: {
          child_document_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          parent_document_id?: string
          relationship_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_relationships_child_document_id_fkey"
            columns: ["child_document_id"]
            isOneToOne: false
            referencedRelation: "client_documents_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_relationships_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "client_documents_files"
            referencedColumns: ["id"]
          },
        ]
      }
      document_requirements: {
        Row: {
          audit_phases: string[] | null
          created_at: string
          description: string | null
          document_type: string
          file_pattern_hints: string[] | null
          id: string
          is_mandatory: boolean
          name: string
          subject_area: string | null
          updated_at: string
        }
        Insert: {
          audit_phases?: string[] | null
          created_at?: string
          description?: string | null
          document_type: string
          file_pattern_hints?: string[] | null
          id?: string
          is_mandatory?: boolean
          name: string
          subject_area?: string | null
          updated_at?: string
        }
        Update: {
          audit_phases?: string[] | null
          created_at?: string
          description?: string | null
          document_type?: string
          file_pattern_hints?: string[] | null
          id?: string
          is_mandatory?: boolean
          name?: string
          subject_area?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      document_tag_assignments: {
        Row: {
          assigned_by_ai: boolean | null
          confidence_score: number | null
          created_at: string
          document_id: string
          id: string
          tag_id: string
        }
        Insert: {
          assigned_by_ai?: boolean | null
          confidence_score?: number | null
          created_at?: string
          document_id: string
          id?: string
          tag_id: string
        }
        Update: {
          assigned_by_ai?: boolean | null
          confidence_score?: number | null
          created_at?: string
          document_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_tag_assignments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "client_documents_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "document_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      document_tags: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_system_tag: boolean | null
          name: string
          usage_count: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_system_tag?: boolean | null
          name: string
          usage_count?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_system_tag?: boolean | null
          name?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      document_type_categories: {
        Row: {
          category_id: string
          created_at: string
          document_type_id: string
          id: string
          is_primary: boolean | null
        }
        Insert: {
          category_id: string
          created_at?: string
          document_type_id: string
          id?: string
          is_primary?: boolean | null
        }
        Update: {
          category_id?: string
          created_at?: string
          document_type_id?: string
          id?: string
          is_primary?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "document_type_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_type_categories_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
        ]
      }
      document_type_subject_areas: {
        Row: {
          created_at: string
          document_type_id: string | null
          id: string
          subject_area_id: string | null
        }
        Insert: {
          created_at?: string
          document_type_id?: string | null
          id?: string
          subject_area_id?: string | null
        }
        Update: {
          created_at?: string
          document_type_id?: string | null
          id?: string
          subject_area_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_type_subject_areas_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_type_subject_areas_subject_area_id_fkey"
            columns: ["subject_area_id"]
            isOneToOne: false
            referencedRelation: "subject_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      document_types: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          expected_structure: Json | null
          file_pattern_hints: string[] | null
          id: string
          is_standard: boolean | null
          name: string
          sort_order: number | null
          updated_at: string
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          expected_structure?: Json | null
          file_pattern_hints?: string[] | null
          id?: string
          is_standard?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          expected_structure?: Json | null
          file_pattern_hints?: string[] | null
          id?: string
          is_standard?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string
          validation_rules?: Json | null
        }
        Relationships: []
      }
      document_versions: {
        Row: {
          change_description: string | null
          change_source: string
          client_audit_action_id: string
          content: string
          created_at: string
          created_by_user_id: string | null
          id: string
          version_name: string
        }
        Insert: {
          change_description?: string | null
          change_source: string
          client_audit_action_id: string
          content: string
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          version_name: string
        }
        Update: {
          change_description?: string | null
          change_source?: string
          client_audit_action_id?: string
          content?: string
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          version_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_client_audit_action_id_fkey"
            columns: ["client_audit_action_id"]
            isOneToOne: false
            referencedRelation: "client_audit_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_indicators: {
        Row: {
          audit_considerations: string | null
          complexity_level: string | null
          created_at: string
          estimate_type: string | null
          estimation_method: string | null
          id: string
          is_estimate: boolean | null
          key_assumptions: string | null
          sensitivity_analysis_required: boolean | null
          standard_account_id: string | null
          updated_at: string
        }
        Insert: {
          audit_considerations?: string | null
          complexity_level?: string | null
          created_at?: string
          estimate_type?: string | null
          estimation_method?: string | null
          id?: string
          is_estimate?: boolean | null
          key_assumptions?: string | null
          sensitivity_analysis_required?: boolean | null
          standard_account_id?: string | null
          updated_at?: string
        }
        Update: {
          audit_considerations?: string | null
          complexity_level?: string | null
          created_at?: string
          estimate_type?: string | null
          estimation_method?: string | null
          id?: string
          is_estimate?: boolean | null
          key_assumptions?: string | null
          sensitivity_analysis_required?: boolean | null
          standard_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_indicators_standard_account_id_fkey"
            columns: ["standard_account_id"]
            isOneToOne: true
            referencedRelation: "standard_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      field_definitions: {
        Row: {
          aliases: string[] | null
          created_at: string
          data_type: string
          field_key: string
          field_label: string
          file_type: string
          id: string
          is_active: boolean | null
          is_required: boolean
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          aliases?: string[] | null
          created_at?: string
          data_type?: string
          field_key: string
          field_label: string
          file_type: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          aliases?: string[] | null
          created_at?: string
          data_type?: string
          field_key?: string
          field_label?: string
          file_type?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      formula_definitions: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          formula_expression: Json
          id: string
          is_active: boolean
          is_system_formula: boolean
          metadata: Json | null
          name: string
          updated_at: string
          version: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          formula_expression: Json
          id?: string
          is_active?: boolean
          is_system_formula?: boolean
          metadata?: Json | null
          name: string
          updated_at?: string
          version?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          formula_expression?: Json
          id?: string
          is_active?: boolean
          is_system_formula?: boolean
          metadata?: Json | null
          name?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      formula_usage_logs: {
        Row: {
          account_id: string | null
          client_id: string | null
          created_at: string
          execution_time_ms: number | null
          formula_id: string | null
          id: string
          input_values: Json | null
          metadata: Json | null
          result_value: number | null
          session_id: string | null
          usage_context: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          client_id?: string | null
          created_at?: string
          execution_time_ms?: number | null
          formula_id?: string | null
          id?: string
          input_values?: Json | null
          metadata?: Json | null
          result_value?: number | null
          session_id?: string | null
          usage_context?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          client_id?: string | null
          created_at?: string
          execution_time_ms?: number | null
          formula_id?: string | null
          id?: string
          input_values?: Json | null
          metadata?: Json | null
          result_value?: number | null
          session_id?: string | null
          usage_context?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "formula_usage_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "standard_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formula_usage_logs_formula_id_fkey"
            columns: ["formula_id"]
            isOneToOne: false
            referencedRelation: "formula_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      formula_variables: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          data_type: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean
          is_system_variable: boolean
          metadata: Json | null
          name: string
          updated_at: string
          value_expression: Json | null
          variable_type: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          data_type?: string
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          is_system_variable?: boolean
          metadata?: Json | null
          name: string
          updated_at?: string
          value_expression?: Json | null
          variable_type?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          data_type?: string
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          is_system_variable?: boolean
          metadata?: Json | null
          name?: string
          updated_at?: string
          value_expression?: Json | null
          variable_type?: string
        }
        Relationships: []
      }
      general_ledger_transactions: {
        Row: {
          balance_amount: number | null
          client_account_id: string
          client_id: string
          created_at: string
          credit_amount: number | null
          debit_amount: number | null
          description: string | null
          id: string
          period_month: number
          period_year: number
          reference_number: string | null
          transaction_date: string
          upload_batch_id: string | null
          voucher_number: string | null
        }
        Insert: {
          balance_amount?: number | null
          client_account_id: string
          client_id: string
          created_at?: string
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          period_month: number
          period_year: number
          reference_number?: string | null
          transaction_date: string
          upload_batch_id?: string | null
          voucher_number?: string | null
        }
        Update: {
          balance_amount?: number | null
          client_account_id?: string
          client_id?: string
          created_at?: string
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          period_month?: number
          period_year?: number
          reference_number?: string | null
          transaction_date?: string
          upload_batch_id?: string | null
          voucher_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "general_ledger_transactions_client_account_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "client_chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "general_ledger_transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      isa_standards: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          effective_date: string | null
          id: string
          is_active: boolean
          isa_number: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          effective_date?: string | null
          id?: string
          is_active?: boolean
          isa_number: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          effective_date?: string | null
          id?: string
          is_active?: boolean
          isa_number?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_article_tags: {
        Row: {
          article_id: string | null
          created_at: string
          id: string
          tag_id: string | null
        }
        Insert: {
          article_id?: string | null
          created_at?: string
          id?: string
          tag_id?: string | null
        }
        Update: {
          article_id?: string | null
          created_at?: string
          id?: string
          tag_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_article_tags_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_article_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_articles: {
        Row: {
          author_id: string
          category_id: string
          content: string
          content_type_id: string
          created_at: string
          embedding: string | null
          id: string
          published_at: string | null
          reference_code: string | null
          slug: string
          status: Database["public"]["Enums"]["article_status"]
          summary: string | null
          title: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
          view_count: number
        }
        Insert: {
          author_id: string
          category_id: string
          content: string
          content_type_id: string
          created_at?: string
          embedding?: string | null
          id?: string
          published_at?: string | null
          reference_code?: string | null
          slug: string
          status?: Database["public"]["Enums"]["article_status"]
          summary?: string | null
          title: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          view_count?: number
        }
        Update: {
          author_id?: string
          category_id?: string
          content?: string
          content_type_id?: string
          created_at?: string
          embedding?: string | null
          id?: string
          published_at?: string | null
          reference_code?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["article_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "knowledge_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_articles_content_type_id_fkey"
            columns: ["content_type_id"]
            isOneToOne: false
            referencedRelation: "content_types"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_categories: {
        Row: {
          applicable_phases: Database["public"]["Enums"]["audit_phase"][] | null
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          name: string
          parent_category_id: string | null
          updated_at: string
        }
        Insert: {
          applicable_phases?:
            | Database["public"]["Enums"]["audit_phase"][]
            | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name: string
          parent_category_id?: string | null
          updated_at?: string
        }
        Update: {
          applicable_phases?:
            | Database["public"]["Enums"]["audit_phase"][]
            | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name?: string
          parent_category_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "knowledge_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_favorites: {
        Row: {
          article_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_favorites_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_reading_history: {
        Row: {
          article_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          article_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          article_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_reading_history_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_certifications: {
        Row: {
          certificate_data: Json | null
          certificate_number: string
          created_at: string
          enrollment_id: string
          final_score: number
          id: string
          issued_by: string | null
          issued_date: string
          learning_path_id: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          certificate_data?: Json | null
          certificate_number: string
          created_at?: string
          enrollment_id: string
          final_score: number
          id?: string
          issued_by?: string | null
          issued_date?: string
          learning_path_id: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          certificate_data?: Json | null
          certificate_number?: string
          created_at?: string
          enrollment_id?: string
          final_score?: number
          id?: string
          issued_by?: string | null
          issued_date?: string
          learning_path_id?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_certifications_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_learning_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_certifications_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_notifications: {
        Row: {
          created_at: string
          enrollment_id: string | null
          id: string
          is_read: boolean | null
          message: string
          notification_type: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enrollment_id?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          notification_type: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          enrollment_id?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_notifications_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_learning_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_path_modules: {
        Row: {
          created_at: string
          description: string | null
          estimated_hours: number | null
          id: string
          is_mandatory: boolean | null
          learning_path_id: string
          name: string
          sort_order: number | null
          unlock_after_days: number | null
          updated_at: string
          week_number: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          is_mandatory?: boolean | null
          learning_path_id: string
          name: string
          sort_order?: number | null
          unlock_after_days?: number | null
          updated_at?: string
          week_number: number
        }
        Update: {
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          is_mandatory?: boolean | null
          learning_path_id?: string
          name?: string
          sort_order?: number | null
          unlock_after_days?: number | null
          updated_at?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "learning_path_modules_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          audit_firm_id: string | null
          certification_required: boolean | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_weeks: number
          id: string
          is_active: boolean | null
          is_mandatory: boolean | null
          minimum_score: number | null
          name: string
          target_role: string | null
          updated_at: string
        }
        Insert: {
          audit_firm_id?: string | null
          certification_required?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_weeks?: number
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          minimum_score?: number | null
          name: string
          target_role?: string | null
          updated_at?: string
        }
        Update: {
          audit_firm_id?: string | null
          certification_required?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_weeks?: number
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          minimum_score?: number | null
          name?: string
          target_role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      legal_citations: {
        Row: {
          citation_context: string | null
          citation_text: string
          created_at: string
          document_id: string | null
          id: string
          is_verified: boolean | null
          position_end: number | null
          position_start: number | null
          provision_id: string | null
        }
        Insert: {
          citation_context?: string | null
          citation_text: string
          created_at?: string
          document_id?: string | null
          id?: string
          is_verified?: boolean | null
          position_end?: number | null
          position_start?: number | null
          provision_id?: string | null
        }
        Update: {
          citation_context?: string | null
          citation_text?: string
          created_at?: string
          document_id?: string | null
          id?: string
          is_verified?: boolean | null
          position_end?: number | null
          position_start?: number | null
          provision_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_citations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_citations_provision_id_fkey"
            columns: ["provision_id"]
            isOneToOne: false
            referencedRelation: "legal_provisions"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_document_types: {
        Row: {
          authority_weight: number | null
          color: string | null
          created_at: string
          description: string | null
          display_name: string
          hierarchy_level: number
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          authority_weight?: number | null
          color?: string | null
          created_at?: string
          description?: string | null
          display_name: string
          hierarchy_level?: number
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          authority_weight?: number | null
          color?: string | null
          created_at?: string
          description?: string | null
          display_name?: string
          hierarchy_level?: number
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          content: string
          created_at: string
          document_number: string | null
          document_status: string | null
          document_type_id: string | null
          effective_date: string | null
          embedding: string | null
          expiry_date: string | null
          id: string
          is_primary_source: boolean | null
          issuing_authority: string | null
          publication_date: string | null
          source_url: string | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          document_number?: string | null
          document_status?: string | null
          document_type_id?: string | null
          effective_date?: string | null
          embedding?: string | null
          expiry_date?: string | null
          id?: string
          is_primary_source?: boolean | null
          issuing_authority?: string | null
          publication_date?: string | null
          source_url?: string | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          document_number?: string | null
          document_status?: string | null
          document_type_id?: string | null
          effective_date?: string | null
          embedding?: string | null
          expiry_date?: string | null
          id?: string
          is_primary_source?: boolean | null
          issuing_authority?: string | null
          publication_date?: string | null
          source_url?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "legal_document_types"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_provisions: {
        Row: {
          content: string | null
          created_at: string
          hierarchy_path: string | null
          id: string
          is_active: boolean | null
          law_full_name: string | null
          law_identifier: string
          parent_provision_id: string | null
          provision_number: string
          provision_type: string
          sort_order: number | null
          title: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          hierarchy_path?: string | null
          id?: string
          is_active?: boolean | null
          law_full_name?: string | null
          law_identifier: string
          parent_provision_id?: string | null
          provision_number: string
          provision_type: string
          sort_order?: number | null
          title: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          hierarchy_path?: string | null
          id?: string
          is_active?: boolean | null
          law_full_name?: string | null
          law_identifier?: string
          parent_provision_id?: string | null
          provision_number?: string
          provision_type?: string
          sort_order?: number | null
          title?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_provisions_parent_provision_id_fkey"
            columns: ["parent_provision_id"]
            isOneToOne: false
            referencedRelation: "legal_provisions"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_subject_area_mappings: {
        Row: {
          confidence_score: number | null
          created_at: string
          document_id: string | null
          id: string
          provision_id: string | null
          relevance_level: string | null
          subject_area_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          document_id?: string | null
          id?: string
          provision_id?: string | null
          relevance_level?: string | null
          subject_area_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          document_id?: string | null
          id?: string
          provision_id?: string | null
          relevance_level?: string | null
          subject_area_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_subject_area_mappings_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_subject_area_mappings_provision_id_fkey"
            columns: ["provision_id"]
            isOneToOne: false
            referencedRelation: "legal_provisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_subject_area_mappings_subject_area_id_fkey"
            columns: ["subject_area_id"]
            isOneToOne: false
            referencedRelation: "subject_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      main_groups: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_system_group: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_system_group?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_system_group?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          edited_at: string | null
          id: string
          is_edited: boolean | null
          message_type: string | null
          metadata: Json | null
          parent_message_id: string | null
          room_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          parent_message_id?: string | null
          room_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          parent_message_id?: string | null
          room_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_conversions: {
        Row: {
          category_id: string
          completed_at: string | null
          conversion_type: string
          created_at: string
          error_message: string | null
          estimated_time: number | null
          extracted_text: string | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          progress: number | null
          status: string
          structured_content: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          completed_at?: string | null
          conversion_type: string
          created_at?: string
          error_message?: string | null
          estimated_time?: number | null
          extracted_text?: string | null
          file_name: string
          file_path: string
          file_size: number
          id?: string
          progress?: number | null
          status?: string
          structured_content?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          completed_at?: string | null
          conversion_type?: string
          created_at?: string
          error_message?: string | null
          estimated_time?: number | null
          extracted_text?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          progress?: number | null
          status?: string
          structured_content?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_conversions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "knowledge_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_documents: {
        Row: {
          category: string
          created_at: string
          description: string | null
          extracted_text: Json | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          is_favorite: boolean
          isa_number: string | null
          nrs_number: string | null
          tags: string[] | null
          text_extraction_status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          extracted_text?: Json | null
          file_name: string
          file_path: string
          file_size: number
          id?: string
          is_favorite?: boolean
          isa_number?: string | null
          nrs_number?: string | null
          tags?: string[] | null
          text_extraction_status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          extracted_text?: Json | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          is_favorite?: boolean
          isa_number?: string | null
          nrs_number?: string | null
          tags?: string[] | null
          text_extraction_status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      planning_fraud_risks: {
        Row: {
          client_id: string
          created_at: string
          id: string
          management_override_risk_assessment: string | null
          other_risks: Json | null
          related_parties_risk_assessment: string | null
          revenue_manipulation_risk_assessment: string | null
          team_discussion_summary: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          management_override_risk_assessment?: string | null
          other_risks?: Json | null
          related_parties_risk_assessment?: string | null
          revenue_manipulation_risk_assessment?: string | null
          team_discussion_summary?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          management_override_risk_assessment?: string | null
          other_risks?: Json | null
          related_parties_risk_assessment?: string | null
          revenue_manipulation_risk_assessment?: string | null
          team_discussion_summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_fraud_risks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_materiality: {
        Row: {
          benchmark_amount: number | null
          benchmark_basis: string | null
          client_id: string
          created_at: string
          id: string
          justification: string | null
          materiality_percentage: number | null
          overall_materiality: number | null
          performance_materiality: number | null
          performance_materiality_percentage: number | null
          trivial_threshold: number | null
          updated_at: string
        }
        Insert: {
          benchmark_amount?: number | null
          benchmark_basis?: string | null
          client_id: string
          created_at?: string
          id?: string
          justification?: string | null
          materiality_percentage?: number | null
          overall_materiality?: number | null
          performance_materiality?: number | null
          performance_materiality_percentage?: number | null
          trivial_threshold?: number | null
          updated_at?: string
        }
        Update: {
          benchmark_amount?: number | null
          benchmark_basis?: string | null
          client_id?: string
          created_at?: string
          id?: string
          justification?: string | null
          materiality_percentage?: number | null
          overall_materiality?: number | null
          performance_materiality?: number | null
          performance_materiality_percentage?: number | null
          trivial_threshold?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_materiality_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_module_statuses: {
        Row: {
          client_id: string
          id: string
          module_key: Database["public"]["Enums"]["planning_module_key"]
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          id?: string
          module_key: Database["public"]["Enums"]["planning_module_key"]
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          id?: string
          module_key?: Database["public"]["Enums"]["planning_module_key"]
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_module_statuses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      potential_clients: {
        Row: {
          auditor_name: string | null
          auditor_org_number: string
          brreg_data: Json | null
          company_name: string
          contact_info: Json | null
          converted_to_client_id: string | null
          created_at: string
          created_by: string | null
          discovered_at: string
          id: string
          last_seen_at: string
          notes: string | null
          org_number: string
          status: string
          updated_at: string
        }
        Insert: {
          auditor_name?: string | null
          auditor_org_number: string
          brreg_data?: Json | null
          company_name: string
          contact_info?: Json | null
          converted_to_client_id?: string | null
          created_at?: string
          created_by?: string | null
          discovered_at?: string
          id?: string
          last_seen_at?: string
          notes?: string | null
          org_number: string
          status?: string
          updated_at?: string
        }
        Update: {
          auditor_name?: string | null
          auditor_org_number?: string
          brreg_data?: Json | null
          company_name?: string
          contact_info?: Json | null
          converted_to_client_id?: string | null
          created_at?: string
          created_by?: string | null
          discovered_at?: string
          id?: string
          last_seen_at?: string
          notes?: string | null
          org_number?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "potential_clients_converted_to_client_id_fkey"
            columns: ["converted_to_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          audit_firm_id: string | null
          created_at: string
          department_id: string | null
          email: string | null
          first_name: string | null
          hire_date: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          updated_at: string
          user_role: Database["public"]["Enums"]["user_role_type"] | null
          workplace_company_name: string | null
        }
        Insert: {
          audit_firm_id?: string | null
          created_at?: string
          department_id?: string | null
          email?: string | null
          first_name?: string | null
          hire_date?: string | null
          id: string
          is_active?: boolean | null
          last_name?: string | null
          updated_at?: string
          user_role?: Database["public"]["Enums"]["user_role_type"] | null
          workplace_company_name?: string | null
        }
        Update: {
          audit_firm_id?: string | null
          created_at?: string
          department_id?: string | null
          email?: string | null
          first_name?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          updated_at?: string
          user_role?: Database["public"]["Enums"]["user_role_type"] | null
          workplace_company_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_audit_firm_id_fkey"
            columns: ["audit_firm_id"]
            isOneToOne: false
            referencedRelation: "audit_firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      provision_document_relations: {
        Row: {
          context_description: string | null
          created_at: string
          document_id: string | null
          id: string
          provision_id: string | null
          relation_type: string
          relevance_score: number | null
        }
        Insert: {
          context_description?: string | null
          created_at?: string
          document_id?: string | null
          id?: string
          provision_id?: string | null
          relation_type: string
          relevance_score?: number | null
        }
        Update: {
          context_description?: string | null
          created_at?: string
          document_id?: string | null
          id?: string
          provision_id?: string | null
          relation_type?: string
          relevance_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "provision_document_relations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provision_document_relations_provision_id_fkey"
            columns: ["provision_id"]
            isOneToOne: false
            referencedRelation: "legal_provisions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string
          difficulty_level: string | null
          explanation: string | null
          id: string
          module_name: string
          options: Json | null
          points: number | null
          question_text: string
          question_type: string
          scenario_id: string | null
        }
        Insert: {
          correct_answer: string
          created_at?: string
          difficulty_level?: string | null
          explanation?: string | null
          id?: string
          module_name: string
          options?: Json | null
          points?: number | null
          question_text: string
          question_type?: string
          scenario_id?: string | null
        }
        Update: {
          correct_answer?: string
          created_at?: string
          difficulty_level?: string | null
          explanation?: string | null
          id?: string
          module_name?: string
          options?: Json | null
          points?: number | null
          question_text?: string
          question_type?: string
          scenario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "test_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      related_party_indicators: {
        Row: {
          created_at: string
          description: string | null
          disclosure_requirements: string | null
          id: string
          indicator_type: string | null
          is_related_party: boolean | null
          standard_account_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          disclosure_requirements?: string | null
          id?: string
          indicator_type?: string | null
          is_related_party?: boolean | null
          standard_account_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          disclosure_requirements?: string | null
          id?: string
          indicator_type?: string | null
          is_related_party?: boolean | null
          standard_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "related_party_indicators_standard_account_id_fkey"
            columns: ["standard_account_id"]
            isOneToOne: true
            referencedRelation: "standard_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      revy_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          sender: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          sender: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          sender?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revy_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "revy_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      revy_chat_sessions: {
        Row: {
          client_id: string | null
          context: string | null
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          context?: string | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          context?: string | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revy_chat_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_areas: {
        Row: {
          client_id: string
          created_at: string
          id: string
          name: string
          risk: Database["public"]["Enums"]["risk_level"]
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          name: string
          risk?: Database["public"]["Enums"]["risk_level"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          name?: string
          risk?: Database["public"]["Enums"]["risk_level"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_areas_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_factors: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_system_risk: boolean | null
          name: string
          risk_category: string | null
          risk_level: string | null
          risk_number: number
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system_risk?: boolean | null
          name: string
          risk_category?: string | null
          risk_level?: string | null
          risk_number: number
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system_risk?: boolean | null
          name?: string
          risk_category?: string | null
          risk_level?: string | null
          risk_number?: number
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      standard_account_audit_area_mappings: {
        Row: {
          audit_area_id: string | null
          created_at: string
          id: string
          is_primary: boolean | null
          notes: string | null
          relevance_score: number | null
          standard_account_id: string | null
          updated_at: string
        }
        Insert: {
          audit_area_id?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          relevance_score?: number | null
          standard_account_id?: string | null
          updated_at?: string
        }
        Update: {
          audit_area_id?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          relevance_score?: number | null
          standard_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "standard_account_audit_area_mappings_audit_area_id_fkey"
            columns: ["audit_area_id"]
            isOneToOne: false
            referencedRelation: "audit_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standard_account_audit_area_mappings_standard_account_id_fkey"
            columns: ["standard_account_id"]
            isOneToOne: false
            referencedRelation: "standard_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      standard_accounts: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type_enum"]
          ai_tags: string[] | null
          analysis_group: string | null
          audit_significance: string | null
          business_rules: Json | null
          calculation_formula: Json | null
          category: string | null
          complexity_score: number | null
          created_at: string
          display_order: number
          id: string
          is_total_line: boolean
          last_used_at: string | null
          line_type: string
          ml_features: Json | null
          parent_line_id: string | null
          sign_multiplier: number
          standard_name: string
          standard_number: string
          usage_frequency: number | null
          validation_rules: Json | null
        }
        Insert: {
          account_type: Database["public"]["Enums"]["account_type_enum"]
          ai_tags?: string[] | null
          analysis_group?: string | null
          audit_significance?: string | null
          business_rules?: Json | null
          calculation_formula?: Json | null
          category?: string | null
          complexity_score?: number | null
          created_at?: string
          display_order?: number
          id?: string
          is_total_line?: boolean
          last_used_at?: string | null
          line_type?: string
          ml_features?: Json | null
          parent_line_id?: string | null
          sign_multiplier?: number
          standard_name: string
          standard_number: string
          usage_frequency?: number | null
          validation_rules?: Json | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type_enum"]
          ai_tags?: string[] | null
          analysis_group?: string | null
          audit_significance?: string | null
          business_rules?: Json | null
          calculation_formula?: Json | null
          category?: string | null
          complexity_score?: number | null
          created_at?: string
          display_order?: number
          id?: string
          is_total_line?: boolean
          last_used_at?: string | null
          line_type?: string
          ml_features?: Json | null
          parent_line_id?: string | null
          sign_multiplier?: number
          standard_name?: string
          standard_number?: string
          usage_frequency?: number | null
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "standard_accounts_parent_line_id_fkey"
            columns: ["parent_line_id"]
            isOneToOne: false
            referencedRelation: "standard_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_areas: {
        Row: {
          color: string
          created_at: string
          description: string | null
          display_name: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          parent_subject_area_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_subject_area_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_subject_area_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_areas_parent_subject_area_id_fkey"
            columns: ["parent_subject_area_id"]
            isOneToOne: false
            referencedRelation: "subject_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          category: string | null
          color: string
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          color?: string
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          color?: string
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      team_communications: {
        Row: {
          communication_type: Database["public"]["Enums"]["communication_type"]
          created_at: string
          id: string
          is_announcement: boolean | null
          message: string
          parent_message_id: string | null
          reference_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          communication_type: Database["public"]["Enums"]["communication_type"]
          created_at?: string
          id?: string
          is_announcement?: boolean | null
          message: string
          parent_message_id?: string | null
          reference_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          communication_type?: Database["public"]["Enums"]["communication_type"]
          created_at?: string
          id?: string
          is_announcement?: boolean | null
          message?: string
          parent_message_id?: string | null
          reference_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_communications_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "team_communications"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          assigned_date: string | null
          created_at: string
          id: string
          is_active: boolean | null
          role: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          assigned_date?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          role?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          assigned_date?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          role?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "client_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      test_scenarios: {
        Row: {
          annual_revenue: number | null
          company_story: string
          created_at: string
          description: string
          employee_count: number | null
          id: string
          industry: string
          key_challenges: string[]
          name: string
        }
        Insert: {
          annual_revenue?: number | null
          company_story: string
          created_at?: string
          description: string
          employee_count?: number | null
          id?: string
          industry: string
          key_challenges?: string[]
          name: string
        }
        Update: {
          annual_revenue?: number | null
          company_story?: string
          created_at?: string
          description?: string
          employee_count?: number | null
          id?: string
          industry?: string
          key_challenges?: string[]
          name?: string
        }
        Relationships: []
      }
      training_progress: {
        Row: {
          attempts: number | null
          completed_at: string | null
          created_at: string
          enrollment_id: string | null
          id: string
          learning_path_id: string | null
          max_score: number | null
          module_name: string
          scenario_id: string
          score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string
          enrollment_id?: string | null
          id?: string
          learning_path_id?: string | null
          max_score?: number | null
          module_name: string
          scenario_id: string
          score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string
          enrollment_id?: string | null
          id?: string
          learning_path_id?: string | null
          max_score?: number | null
          module_name?: string
          scenario_id?: string
          score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_learning_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_progress_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_progress_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "test_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_balances: {
        Row: {
          client_account_id: string
          client_id: string
          closing_balance: number | null
          created_at: string
          credit_turnover: number | null
          debit_turnover: number | null
          id: string
          opening_balance: number | null
          period_end_date: string
          period_year: number
          upload_batch_id: string | null
          version: string | null
        }
        Insert: {
          client_account_id: string
          client_id: string
          closing_balance?: number | null
          created_at?: string
          credit_turnover?: number | null
          debit_turnover?: number | null
          id?: string
          opening_balance?: number | null
          period_end_date: string
          period_year: number
          upload_batch_id?: string | null
          version?: string | null
        }
        Update: {
          client_account_id?: string
          client_id?: string
          closing_balance?: number | null
          created_at?: string
          credit_turnover?: number | null
          debit_turnover?: number | null
          id?: string
          opening_balance?: number | null
          period_end_date?: string
          period_year?: number
          upload_batch_id?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_balances_client_account_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "client_chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_balances_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      unified_categories: {
        Row: {
          audit_phases: string[] | null
          category_type: string
          color: string
          compliance_framework: string[] | null
          created_at: string
          description: string | null
          display_name: string
          icon: string | null
          id: string
          is_active: boolean
          isa_standard_reference: string[] | null
          name: string
          parent_id: string | null
          risk_level: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          audit_phases?: string[] | null
          category_type?: string
          color?: string
          compliance_framework?: string[] | null
          created_at?: string
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_active?: boolean
          isa_standard_reference?: string[] | null
          name: string
          parent_id?: string | null
          risk_level?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          audit_phases?: string[] | null
          category_type?: string
          color?: string
          compliance_framework?: string[] | null
          created_at?: string
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          isa_standard_reference?: string[] | null
          name?: string
          parent_id?: string | null
          risk_level?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unified_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "unified_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      upload_batches: {
        Row: {
          batch_type: string
          client_id: string
          completed_at: string | null
          created_at: string
          error_log: string | null
          error_records: number | null
          file_name: string
          file_size: number | null
          id: string
          processed_records: number | null
          status: string
          total_records: number | null
          user_id: string
        }
        Insert: {
          batch_type: string
          client_id: string
          completed_at?: string | null
          created_at?: string
          error_log?: string | null
          error_records?: number | null
          file_name: string
          file_size?: number | null
          id?: string
          processed_records?: number | null
          status?: string
          total_records?: number | null
          user_id: string
        }
        Update: {
          batch_type?: string
          client_id?: string
          completed_at?: string | null
          created_at?: string
          error_log?: string | null
          error_records?: number | null
          file_name?: string
          file_size?: number | null
          id?: string
          processed_records?: number | null
          status?: string
          total_records?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upload_batches_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_name: string
          badge_type: string
          description: string | null
          earned_at: string
          id: string
          points_earned: number | null
          scenario_id: string | null
          user_id: string
        }
        Insert: {
          badge_name: string
          badge_type: string
          description?: string | null
          earned_at?: string
          id?: string
          points_earned?: number | null
          scenario_id?: string | null
          user_id: string
        }
        Update: {
          badge_name?: string
          badge_type?: string
          description?: string | null
          earned_at?: string
          id?: string
          points_earned?: number | null
          scenario_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "test_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_learning_enrollments: {
        Row: {
          actual_completion_date: string | null
          certification_date: string | null
          certification_earned: boolean | null
          created_at: string
          current_week: number | null
          enrolled_by: string | null
          id: string
          learning_path_id: string
          overall_score: number | null
          start_date: string
          status: string | null
          target_completion_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_completion_date?: string | null
          certification_date?: string | null
          certification_earned?: boolean | null
          created_at?: string
          current_week?: number | null
          enrolled_by?: string | null
          id?: string
          learning_path_id: string
          overall_score?: number | null
          start_date?: string
          status?: string | null
          target_completion_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_completion_date?: string | null
          certification_date?: string | null
          certification_earned?: boolean | null
          created_at?: string
          current_week?: number | null
          enrolled_by?: string | null
          id?: string
          learning_path_id?: string
          overall_score?: number | null
          start_date?: string
          status?: string | null
          target_completion_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_learning_enrollments_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      user_module_completions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          attempts: number | null
          completed_at: string | null
          created_at: string
          enrollment_id: string
          feedback: string | null
          id: string
          module_id: string
          score: number | null
          time_spent_minutes: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          attempts?: number | null
          completed_at?: string | null
          created_at?: string
          enrollment_id: string
          feedback?: string | null
          id?: string
          module_id: string
          score?: number | null
          time_spent_minutes?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          attempts?: number | null
          completed_at?: string | null
          created_at?: string
          enrollment_id?: string
          feedback?: string | null
          id?: string
          module_id?: string
          score?: number | null
          time_spent_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_module_completions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_learning_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_module_completions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "learning_path_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          current_room_id: string | null
          id: string
          is_online: boolean | null
          last_seen: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          current_room_id?: string | null
          id?: string
          is_online?: boolean | null
          last_seen?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          current_room_id?: string | null
          id?: string
          is_online?: boolean | null
          last_seen?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_current_room_id_fkey"
            columns: ["current_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      working_paper_templates: {
        Row: {
          action_type: string
          audit_firm_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_system_template: boolean
          name: string
          subject_area: string
          template_structure: Json
          updated_at: string
        }
        Insert: {
          action_type: string
          audit_firm_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system_template?: boolean
          name: string
          subject_area: string
          template_structure?: Json
          updated_at?: string
        }
        Update: {
          action_type?: string
          audit_firm_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system_template?: boolean
          name?: string
          subject_area?: string
          template_structure?: Json
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_ai_cost: {
        Args: {
          model_name: string
          prompt_tokens: number
          completion_tokens: number
        }
        Returns: number
      }
      generate_certificate_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_potential_clients_summary: {
        Args: { p_auditor_org_number: string }
        Returns: {
          total_potential: number
          new_this_week: number
          converted: number
          lost: number
        }[]
      }
      get_user_department: {
        Args: { user_uuid: string }
        Returns: string
      }
      get_user_firm: {
        Args: { user_uuid: string }
        Returns: string
      }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role_type"]
      }
      get_user_team_ids: {
        Args: { user_uuid: string }
        Returns: {
          team_id: string
        }[]
      }
      get_user_teams: {
        Args: { user_uuid: string }
        Returns: {
          team_id: string
        }[]
      }
      increment_cache_hit: {
        Args: { hash_to_update: string }
        Returns: undefined
      }
      match_knowledge_articles: {
        Args: {
          p_query_embedding: string
          p_match_threshold: number
          p_match_count: number
        }
        Returns: {
          id: string
          title: string
          slug: string
          summary: string
          content: string
          category_id: string
          status: Database["public"]["Enums"]["article_status"]
          author_id: string
          view_count: number
          created_at: string
          updated_at: string
          published_at: string
          category: Json
          similarity: number
          reference_code: string
          valid_from: string
          valid_until: string
        }[]
      }
      queue_articles_for_embedding: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          title: string
          content: string
        }[]
      }
      user_owns_client: {
        Args: { client_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      account_type_enum: "eiendeler" | "gjeld" | "egenkapital" | "resultat"
      action_status:
        | "not_started"
        | "in_progress"
        | "completed"
        | "reviewed"
        | "approved"
      action_type:
        | "analytical"
        | "substantive"
        | "control_test"
        | "inquiry"
        | "observation"
        | "inspection"
        | "recalculation"
        | "confirmation"
      article_status: "draft" | "published" | "archived"
      audit_action_type:
        | "review_completed"
        | "task_assigned"
        | "document_uploaded"
        | "analysis_performed"
        | "ai_content_generated"
        | "document_version_restored"
        | "document_version_created"
      audit_log_action:
        | "review_completed"
        | "task_assigned"
        | "document_uploaded"
        | "analysis_performed"
      audit_phase: "engagement" | "planning" | "execution" | "conclusion"
      audit_subject_area:
        | "sales"
        | "payroll"
        | "operating_expenses"
        | "inventory"
        | "finance"
        | "banking"
        | "fixed_assets"
        | "receivables"
        | "payables"
        | "equity"
        | "other"
      communication_type: "team" | "department" | "firm"
      document_status: "pending" | "submitted" | "accepted" | "rejected"
      document_type: "shareholder_report" | "tax_return" | "annual_report"
      planning_module_key:
        | "ANALYTICAL_REVIEW"
        | "TEAM_DISCUSSION"
        | "MANAGEMENT_INQUIRY"
        | "OBSERVATION_INSPECTION"
        | "GOING_CONCERN"
        | "OPENING_BALANCE"
        | "FRAUD_RISK"
        | "ESTIMATES_PROFILE"
        | "MATERIALITY"
        | "RISK_MATRIX"
      risk_level: "low" | "medium" | "high"
      user_role_type: "admin" | "partner" | "manager" | "employee"
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
      account_type_enum: ["eiendeler", "gjeld", "egenkapital", "resultat"],
      action_status: [
        "not_started",
        "in_progress",
        "completed",
        "reviewed",
        "approved",
      ],
      action_type: [
        "analytical",
        "substantive",
        "control_test",
        "inquiry",
        "observation",
        "inspection",
        "recalculation",
        "confirmation",
      ],
      article_status: ["draft", "published", "archived"],
      audit_action_type: [
        "review_completed",
        "task_assigned",
        "document_uploaded",
        "analysis_performed",
        "ai_content_generated",
        "document_version_restored",
        "document_version_created",
      ],
      audit_log_action: [
        "review_completed",
        "task_assigned",
        "document_uploaded",
        "analysis_performed",
      ],
      audit_phase: ["engagement", "planning", "execution", "conclusion"],
      audit_subject_area: [
        "sales",
        "payroll",
        "operating_expenses",
        "inventory",
        "finance",
        "banking",
        "fixed_assets",
        "receivables",
        "payables",
        "equity",
        "other",
      ],
      communication_type: ["team", "department", "firm"],
      document_status: ["pending", "submitted", "accepted", "rejected"],
      document_type: ["shareholder_report", "tax_return", "annual_report"],
      planning_module_key: [
        "ANALYTICAL_REVIEW",
        "TEAM_DISCUSSION",
        "MANAGEMENT_INQUIRY",
        "OBSERVATION_INSPECTION",
        "GOING_CONCERN",
        "OPENING_BALANCE",
        "FRAUD_RISK",
        "ESTIMATES_PROFILE",
        "MATERIALITY",
        "RISK_MATRIX",
      ],
      risk_level: ["low", "medium", "high"],
      user_role_type: ["admin", "partner", "manager", "employee"],
    },
  },
} as const
