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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      a07_account_mappings: {
        Row: {
          a07_performance_code: string
          account_number: string
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          mapping_description: string | null
          updated_at: string
        }
        Insert: {
          a07_performance_code: string
          account_number: string
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          mapping_description?: string | null
          updated_at?: string
        }
        Update: {
          a07_performance_code?: string
          account_number?: string
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          mapping_description?: string | null
          updated_at?: string
        }
        Relationships: []
      }
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
      account_classifications: {
        Row: {
          account_number: string
          applied_at: string
          applied_by: string | null
          classification_type: string
          client_id: string
          id: string
          is_active: boolean
          metadata: Json | null
          new_category: string
          original_category: string
          version_id: string | null
        }
        Insert: {
          account_number: string
          applied_at?: string
          applied_by?: string | null
          classification_type?: string
          client_id: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          new_category: string
          original_category: string
          version_id?: string | null
        }
        Update: {
          account_number?: string
          applied_at?: string
          applied_by?: string | null
          classification_type?: string
          client_id?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          new_category?: string
          original_category?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_classifications_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "accounting_data_versions"
            referencedColumns: ["id"]
          },
        ]
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
      accounting_data_versions: {
        Row: {
          balance_difference: number | null
          client_id: string
          created_at: string
          file_name: string
          id: string
          is_active: boolean
          metadata: Json | null
          total_credit_amount: number | null
          total_debit_amount: number | null
          total_transactions: number
          updated_at: string
          upload_batch_id: string | null
          uploaded_at: string
          uploaded_by: string | null
          version_number: number
        }
        Insert: {
          balance_difference?: number | null
          client_id: string
          created_at?: string
          file_name: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          total_credit_amount?: number | null
          total_debit_amount?: number | null
          total_transactions?: number
          updated_at?: string
          upload_batch_id?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
          version_number: number
        }
        Update: {
          balance_difference?: number | null
          client_id?: string
          created_at?: string
          file_name?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          total_credit_amount?: number | null
          total_debit_amount?: number | null
          total_transactions?: number
          updated_at?: string
          upload_batch_id?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "accounting_data_versions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_data_versions_upload_batch_id_fkey"
            columns: ["upload_batch_id"]
            isOneToOne: false
            referencedRelation: "upload_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      accounting_periods: {
        Row: {
          client_id: string
          created_at: string
          end_date: string
          id: string
          is_closed: boolean
          period_name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          end_date: string
          id?: string
          is_closed?: boolean
          period_name: string
          start_date: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          end_date?: string
          id?: string
          is_closed?: boolean
          period_name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
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
      admin_audit_logs: {
        Row: {
          action_type: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          target_user_id: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          target_user_id?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          target_user_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_analysis_cache: {
        Row: {
          access_count: number | null
          analysis_duration_ms: number | null
          analysis_type: string
          cached_at: string | null
          client_id: string
          confidence_score: number | null
          config_hash: string
          data_version_id: string
          expires_at: string | null
          id: string
          last_accessed: string | null
          metadata: Json | null
          result_data: Json
          transaction_count: number
        }
        Insert: {
          access_count?: number | null
          analysis_duration_ms?: number | null
          analysis_type?: string
          cached_at?: string | null
          client_id: string
          confidence_score?: number | null
          config_hash: string
          data_version_id: string
          expires_at?: string | null
          id?: string
          last_accessed?: string | null
          metadata?: Json | null
          result_data: Json
          transaction_count?: number
        }
        Update: {
          access_count?: number | null
          analysis_duration_ms?: number | null
          analysis_type?: string
          cached_at?: string | null
          client_id?: string
          confidence_score?: number | null
          config_hash?: string
          data_version_id?: string
          expires_at?: string | null
          id?: string
          last_accessed?: string | null
          metadata?: Json | null
          result_data?: Json
          transaction_count?: number
        }
        Relationships: []
      }
      ai_analysis_sessions: {
        Row: {
          analysis_config: Json | null
          client_id: string
          completed_at: string | null
          created_by: string | null
          current_step: string | null
          data_version_id: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          progress_percentage: number | null
          result_data: Json | null
          session_type: string
          started_at: string | null
          status: string
          total_steps: number | null
          updated_at: string | null
        }
        Insert: {
          analysis_config?: Json | null
          client_id: string
          completed_at?: string | null
          created_by?: string | null
          current_step?: string | null
          data_version_id?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          progress_percentage?: number | null
          result_data?: Json | null
          session_type?: string
          started_at?: string | null
          status?: string
          total_steps?: number | null
          updated_at?: string | null
        }
        Update: {
          analysis_config?: Json | null
          client_id?: string
          completed_at?: string | null
          created_by?: string | null
          current_step?: string | null
          data_version_id?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          progress_percentage?: number | null
          result_data?: Json | null
          session_type?: string
          started_at?: string | null
          status?: string
          total_steps?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
      ai_suggested_postings: {
        Row: {
          applied_to_journal_entry_id: string | null
          client_id: string
          confidence_score: number | null
          created_at: string
          document_id: string
          id: string
          status: string
          suggested_entries: Json
          updated_at: string
        }
        Insert: {
          applied_to_journal_entry_id?: string | null
          client_id: string
          confidence_score?: number | null
          created_at?: string
          document_id: string
          id?: string
          status?: string
          suggested_entries: Json
          updated_at?: string
        }
        Update: {
          applied_to_journal_entry_id?: string | null
          client_id?: string
          confidence_score?: number | null
          created_at?: string
          document_id?: string
          id?: string
          status?: string
          suggested_entries?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ai_suggested_postings_document"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "client_documents_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_suggested_postings_journal_entry"
            columns: ["applied_to_journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
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
      amelding_code_map: {
        Row: {
          a07: string
          internal_code: string
        }
        Insert: {
          a07: string
          internal_code: string
        }
        Update: {
          a07?: string
          internal_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "amelding_code_map_a07_fkey"
            columns: ["a07"]
            isOneToOne: true
            referencedRelation: "amelding_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      amelding_codes: {
        Row: {
          aliases: string[] | null
          expected_fordel: string
          id: string
          inserted_at: string | null
          label: string
        }
        Insert: {
          aliases?: string[] | null
          expected_fordel: string
          id: string
          inserted_at?: string | null
          label: string
        }
        Update: {
          aliases?: string[] | null
          expected_fordel?: string
          id?: string
          inserted_at?: string | null
          label?: string
        }
        Relationships: []
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
      analysis_results_v2: {
        Row: {
          analysis_type: string
          confidence_score: number | null
          created_at: string
          id: string
          metadata: Json | null
          result_data: Json
          session_id: string
        }
        Insert: {
          analysis_type: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          metadata?: Json | null
          result_data?: Json
          session_id: string
        }
        Update: {
          analysis_type?: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          metadata?: Json | null
          result_data?: Json
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_results_v2_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analysis_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_sessions: {
        Row: {
          analysis_config: Json
          client_id: string
          completed_at: string | null
          created_by: string | null
          data_version_id: string | null
          error_message: string | null
          id: string
          progress_percentage: number | null
          session_type: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          analysis_config?: Json
          client_id: string
          completed_at?: string | null
          created_by?: string | null
          data_version_id?: string | null
          error_message?: string | null
          id?: string
          progress_percentage?: number | null
          session_type?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          analysis_config?: Json
          client_id?: string
          completed_at?: string | null
          created_by?: string | null
          data_version_id?: string | null
          error_message?: string | null
          id?: string
          progress_percentage?: number | null
          session_type?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_sessions_data_version_id_fkey"
            columns: ["data_version_id"]
            isOneToOne: false
            referencedRelation: "accounting_data_versions"
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
      ap_transactions: {
        Row: {
          account_id: string | null
          account_name: string | null
          account_number: string | null
          amount: number | null
          amount_currency: number | null
          cid: string | null
          client_id: string
          created_at: string | null
          credit: number | null
          currency: string | null
          debit: number | null
          document_no: string | null
          due_date: string | null
          exchange_rate: number | null
          id: number
          journal_id: string | null
          posting_date: string | null
          record_id: string | null
          reference_no: string | null
          supplier_id: string | null
          supplier_name: string | null
          transaction_id: string | null
          upload_batch_id: string
          user_id: string
          value_date: string | null
          vat_base: number | null
          vat_code: string | null
          vat_credit: number | null
          vat_debit: number | null
          vat_rate: number | null
        }
        Insert: {
          account_id?: string | null
          account_name?: string | null
          account_number?: string | null
          amount?: number | null
          amount_currency?: number | null
          cid?: string | null
          client_id: string
          created_at?: string | null
          credit?: number | null
          currency?: string | null
          debit?: number | null
          document_no?: string | null
          due_date?: string | null
          exchange_rate?: number | null
          id?: number
          journal_id?: string | null
          posting_date?: string | null
          record_id?: string | null
          reference_no?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          transaction_id?: string | null
          upload_batch_id: string
          user_id: string
          value_date?: string | null
          vat_base?: number | null
          vat_code?: string | null
          vat_credit?: number | null
          vat_debit?: number | null
          vat_rate?: number | null
        }
        Update: {
          account_id?: string | null
          account_name?: string | null
          account_number?: string | null
          amount?: number | null
          amount_currency?: number | null
          cid?: string | null
          client_id?: string
          created_at?: string | null
          credit?: number | null
          currency?: string | null
          debit?: number | null
          document_no?: string | null
          due_date?: string | null
          exchange_rate?: number | null
          id?: number
          journal_id?: string | null
          posting_date?: string | null
          record_id?: string | null
          reference_no?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          transaction_id?: string | null
          upload_batch_id?: string
          user_id?: string
          value_date?: string | null
          vat_base?: number | null
          vat_code?: string | null
          vat_credit?: number | null
          vat_debit?: number | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ap_transactions_upload_batch_id_fkey"
            columns: ["upload_batch_id"]
            isOneToOne: false
            referencedRelation: "upload_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      app_super_admins: {
        Row: {
          created_at: string
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ar_transactions: {
        Row: {
          account_id: string | null
          account_name: string | null
          account_number: string | null
          amount: number | null
          amount_currency: number | null
          cid: string | null
          client_id: string
          created_at: string | null
          credit: number | null
          currency: string | null
          customer_id: string | null
          customer_name: string | null
          debit: number | null
          document_no: string | null
          due_date: string | null
          exchange_rate: number | null
          id: number
          journal_id: string | null
          posting_date: string | null
          record_id: string | null
          reference_no: string | null
          transaction_id: string | null
          upload_batch_id: string
          user_id: string
          value_date: string | null
          vat_base: number | null
          vat_code: string | null
          vat_credit: number | null
          vat_debit: number | null
          vat_rate: number | null
        }
        Insert: {
          account_id?: string | null
          account_name?: string | null
          account_number?: string | null
          amount?: number | null
          amount_currency?: number | null
          cid?: string | null
          client_id: string
          created_at?: string | null
          credit?: number | null
          currency?: string | null
          customer_id?: string | null
          customer_name?: string | null
          debit?: number | null
          document_no?: string | null
          due_date?: string | null
          exchange_rate?: number | null
          id?: number
          journal_id?: string | null
          posting_date?: string | null
          record_id?: string | null
          reference_no?: string | null
          transaction_id?: string | null
          upload_batch_id: string
          user_id: string
          value_date?: string | null
          vat_base?: number | null
          vat_code?: string | null
          vat_credit?: number | null
          vat_debit?: number | null
          vat_rate?: number | null
        }
        Update: {
          account_id?: string | null
          account_name?: string | null
          account_number?: string | null
          amount?: number | null
          amount_currency?: number | null
          cid?: string | null
          client_id?: string
          created_at?: string | null
          credit?: number | null
          currency?: string | null
          customer_id?: string | null
          customer_name?: string | null
          debit?: number | null
          document_no?: string | null
          due_date?: string | null
          exchange_rate?: number | null
          id?: number
          journal_id?: string | null
          posting_date?: string | null
          record_id?: string | null
          reference_no?: string | null
          transaction_id?: string | null
          upload_batch_id?: string
          user_id?: string
          value_date?: string | null
          vat_base?: number | null
          vat_code?: string | null
          vat_credit?: number | null
          vat_debit?: number | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ar_transactions_upload_batch_id_fkey"
            columns: ["upload_batch_id"]
            isOneToOne: false
            referencedRelation: "upload_batches"
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
      asset_categories: {
        Row: {
          created_at: string
          default_salvage_value_percentage: number | null
          default_useful_life_years: number | null
          depreciation_method: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_salvage_value_percentage?: number | null
          default_useful_life_years?: number | null
          depreciation_method?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_salvage_value_percentage?: number | null
          default_useful_life_years?: number | null
          depreciation_method?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      asset_maintenance_log: {
        Row: {
          cost: number | null
          created_at: string
          created_by: string | null
          description: string
          fixed_asset_id: string
          id: string
          maintenance_date: string
          maintenance_type: string
          next_maintenance_date: string | null
          vendor: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string
          created_by?: string | null
          description: string
          fixed_asset_id: string
          id?: string
          maintenance_date: string
          maintenance_type: string
          next_maintenance_date?: string | null
          vendor?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string
          created_by?: string | null
          description?: string
          fixed_asset_id?: string
          id?: string
          maintenance_date?: string
          maintenance_type?: string
          next_maintenance_date?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_maintenance_log_fixed_asset_id_fkey"
            columns: ["fixed_asset_id"]
            isOneToOne: false
            referencedRelation: "fixed_assets"
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
          claimed_at: string | null
          claimed_by: string | null
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
          claimed_at?: string | null
          claimed_by?: string | null
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
          claimed_at?: string | null
          claimed_by?: string | null
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
        Relationships: [
          {
            foreignKeyName: "audit_firms_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      audit_sampling_exports: {
        Row: {
          created_at: string
          created_by: string | null
          export_type: string
          file_path: string | null
          id: string
          metadata: Json | null
          plan_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          export_type: string
          file_path?: string | null
          id?: string
          metadata?: Json | null
          plan_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          export_type?: string
          file_path?: string | null
          id?: string
          metadata?: Json | null
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_sampling_exports_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "audit_sampling_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_sampling_plans: {
        Row: {
          actual_sample_size: number
          client_id: string
          confidence_factor: number | null
          confidence_level: number
          coverage_percentage: number
          created_at: string
          created_by: string | null
          expected_deviation_rate: number | null
          expected_misstatement: number | null
          fiscal_year: number
          id: string
          materiality: number | null
          metadata: Json | null
          method: string
          min_per_stratum: number | null
          notes: string | null
          param_hash: string | null
          performance_materiality: number | null
          plan_name: string | null
          population_size: number
          population_sum: number
          recommended_sample_size: number
          risk_level: string
          risk_matrix: Json | null
          risk_weighting: string | null
          seed: number | null
          strata_bounds: number[] | null
          test_type: string
          threshold_amount: number | null
          threshold_mode: string | null
          tolerable_deviation_rate: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          actual_sample_size?: number
          client_id: string
          confidence_factor?: number | null
          confidence_level?: number
          coverage_percentage?: number
          created_at?: string
          created_by?: string | null
          expected_deviation_rate?: number | null
          expected_misstatement?: number | null
          fiscal_year: number
          id?: string
          materiality?: number | null
          metadata?: Json | null
          method?: string
          min_per_stratum?: number | null
          notes?: string | null
          param_hash?: string | null
          performance_materiality?: number | null
          plan_name?: string | null
          population_size?: number
          population_sum?: number
          recommended_sample_size?: number
          risk_level?: string
          risk_matrix?: Json | null
          risk_weighting?: string | null
          seed?: number | null
          strata_bounds?: number[] | null
          test_type?: string
          threshold_amount?: number | null
          threshold_mode?: string | null
          tolerable_deviation_rate?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          actual_sample_size?: number
          client_id?: string
          confidence_factor?: number | null
          confidence_level?: number
          coverage_percentage?: number
          created_at?: string
          created_by?: string | null
          expected_deviation_rate?: number | null
          expected_misstatement?: number | null
          fiscal_year?: number
          id?: string
          materiality?: number | null
          metadata?: Json | null
          method?: string
          min_per_stratum?: number | null
          notes?: string | null
          param_hash?: string | null
          performance_materiality?: number | null
          plan_name?: string | null
          population_size?: number
          population_sum?: number
          recommended_sample_size?: number
          risk_level?: string
          risk_matrix?: Json | null
          risk_weighting?: string | null
          seed?: number | null
          strata_bounds?: number[] | null
          test_type?: string
          threshold_amount?: number | null
          threshold_mode?: string | null
          tolerable_deviation_rate?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      audit_sampling_samples: {
        Row: {
          account_name: string
          account_no: string
          amount: number
          created_at: string
          description: string | null
          deviation_amount: number | null
          deviation_notes: string | null
          id: string
          is_high_risk: boolean | null
          is_reviewed: boolean | null
          metadata: Json | null
          plan_id: string
          review_date: string | null
          review_status:
            | Database["public"]["Enums"]["review_status_type"]
            | null
          reviewer_id: string | null
          risk_score: number | null
          sample_type: string | null
          selection_method: string | null
          stratum_id: number | null
          transaction_date: string | null
          transaction_id: string
        }
        Insert: {
          account_name: string
          account_no: string
          amount?: number
          created_at?: string
          description?: string | null
          deviation_amount?: number | null
          deviation_notes?: string | null
          id?: string
          is_high_risk?: boolean | null
          is_reviewed?: boolean | null
          metadata?: Json | null
          plan_id: string
          review_date?: string | null
          review_status?:
            | Database["public"]["Enums"]["review_status_type"]
            | null
          reviewer_id?: string | null
          risk_score?: number | null
          sample_type?: string | null
          selection_method?: string | null
          stratum_id?: number | null
          transaction_date?: string | null
          transaction_id: string
        }
        Update: {
          account_name?: string
          account_no?: string
          amount?: number
          created_at?: string
          description?: string | null
          deviation_amount?: number | null
          deviation_notes?: string | null
          id?: string
          is_high_risk?: boolean | null
          is_reviewed?: boolean | null
          metadata?: Json | null
          plan_id?: string
          review_date?: string | null
          review_status?:
            | Database["public"]["Enums"]["review_status_type"]
            | null
          reviewer_id?: string | null
          risk_score?: number | null
          sample_type?: string | null
          selection_method?: string | null
          stratum_id?: number | null
          transaction_date?: string | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_sampling_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "audit_sampling_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_sampling_strata: {
        Row: {
          created_at: string
          id: string
          lower_bound: number
          min_sample_size: number | null
          plan_id: string
          stratum_index: number
          upper_bound: number | null
          weight_factor: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          lower_bound: number
          min_sample_size?: number | null
          plan_id: string
          stratum_index: number
          upper_bound?: number | null
          weight_factor?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          lower_bound?: number
          min_sample_size?: number | null
          plan_id?: string
          stratum_index?: number
          upper_bound?: number | null
          weight_factor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_sampling_strata_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "audit_sampling_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_working_papers: {
        Row: {
          actual_hours: number | null
          attachments: Json | null
          audit_area: string | null
          client_id: string
          conclusion: string | null
          content: Json
          created_at: string
          cross_references: Json | null
          estimated_hours: number | null
          id: string
          materiality_threshold: number | null
          paper_reference: string
          paper_status: string
          paper_title: string
          paper_type: string
          period_year: number
          preparation_date: string | null
          prepared_by: string | null
          review_date: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          risk_level: string | null
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          attachments?: Json | null
          audit_area?: string | null
          client_id: string
          conclusion?: string | null
          content?: Json
          created_at?: string
          cross_references?: Json | null
          estimated_hours?: number | null
          id?: string
          materiality_threshold?: number | null
          paper_reference: string
          paper_status?: string
          paper_title: string
          paper_type: string
          period_year: number
          preparation_date?: string | null
          prepared_by?: string | null
          review_date?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          risk_level?: string | null
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          attachments?: Json | null
          audit_area?: string | null
          client_id?: string
          conclusion?: string | null
          content?: Json
          created_at?: string
          cross_references?: Json | null
          estimated_hours?: number | null
          id?: string
          materiality_threshold?: number | null
          paper_reference?: string
          paper_status?: string
          paper_title?: string
          paper_type?: string
          period_year?: number
          preparation_date?: string | null
          prepared_by?: string | null
          review_date?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          risk_level?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bank_statements: {
        Row: {
          bank_account_number: string
          client_id: string
          closing_balance: number
          created_at: string
          currency_code: string
          file_name: string | null
          id: string
          opening_balance: number
          statement_date: string
          statement_reference: string | null
          updated_at: string
        }
        Insert: {
          bank_account_number: string
          client_id: string
          closing_balance?: number
          created_at?: string
          currency_code?: string
          file_name?: string | null
          id?: string
          opening_balance?: number
          statement_date: string
          statement_reference?: string | null
          updated_at?: string
        }
        Update: {
          bank_account_number?: string
          client_id?: string
          closing_balance?: number
          created_at?: string
          currency_code?: string
          file_name?: string | null
          id?: string
          opening_balance?: number
          statement_date?: string
          statement_reference?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bank_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          bank_statement_id: string
          created_at: string
          description: string
          id: string
          journal_entry_line_id: string | null
          reconciled_at: string | null
          reconciled_by: string | null
          reconciliation_status: string
          reference_number: string | null
          transaction_date: string
          transaction_type: string | null
          updated_at: string
          value_date: string | null
        }
        Insert: {
          amount: number
          balance_after?: number | null
          bank_statement_id: string
          created_at?: string
          description: string
          id?: string
          journal_entry_line_id?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_status?: string
          reference_number?: string | null
          transaction_date: string
          transaction_type?: string | null
          updated_at?: string
          value_date?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number | null
          bank_statement_id?: string
          created_at?: string
          description?: string
          id?: string
          journal_entry_line_id?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_status?: string
          reference_number?: string | null
          transaction_date?: string
          transaction_type?: string | null
          updated_at?: string
          value_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_statement_id_fkey"
            columns: ["bank_statement_id"]
            isOneToOne: false
            referencedRelation: "bank_statements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_journal_entry_line_id_fkey"
            columns: ["journal_entry_line_id"]
            isOneToOne: false
            referencedRelation: "journal_entry_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_actuals: {
        Row: {
          actual_amount: number
          budget_line_id: string
          budgeted_amount: number
          id: string
          last_updated: string
          period_month: number
          period_year: number
          variance_amount: number | null
          variance_percentage: number | null
        }
        Insert: {
          actual_amount?: number
          budget_line_id: string
          budgeted_amount?: number
          id?: string
          last_updated?: string
          period_month: number
          period_year: number
          variance_amount?: number | null
          variance_percentage?: number | null
        }
        Update: {
          actual_amount?: number
          budget_line_id?: string
          budgeted_amount?: number
          id?: string
          last_updated?: string
          period_month?: number
          period_year?: number
          variance_amount?: number | null
          variance_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_actuals_budget_line_id_fkey"
            columns: ["budget_line_id"]
            isOneToOne: false
            referencedRelation: "budget_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_lines: {
        Row: {
          account_name: string
          account_number: string
          account_type: string
          allocation_method: string | null
          apr_amount: number | null
          aug_amount: number | null
          budget_category: string | null
          budget_id: string
          created_at: string
          dec_amount: number | null
          feb_amount: number | null
          id: string
          jan_amount: number | null
          jul_amount: number | null
          jun_amount: number | null
          mar_amount: number | null
          may_amount: number | null
          notes: string | null
          nov_amount: number | null
          oct_amount: number | null
          period_type: string
          sep_amount: number | null
          total_annual_amount: number | null
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number: string
          account_type: string
          allocation_method?: string | null
          apr_amount?: number | null
          aug_amount?: number | null
          budget_category?: string | null
          budget_id: string
          created_at?: string
          dec_amount?: number | null
          feb_amount?: number | null
          id?: string
          jan_amount?: number | null
          jul_amount?: number | null
          jun_amount?: number | null
          mar_amount?: number | null
          may_amount?: number | null
          notes?: string | null
          nov_amount?: number | null
          oct_amount?: number | null
          period_type?: string
          sep_amount?: number | null
          total_annual_amount?: number | null
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          account_type?: string
          allocation_method?: string | null
          apr_amount?: number | null
          aug_amount?: number | null
          budget_category?: string | null
          budget_id?: string
          created_at?: string
          dec_amount?: number | null
          feb_amount?: number | null
          id?: string
          jan_amount?: number | null
          jul_amount?: number | null
          jun_amount?: number | null
          mar_amount?: number | null
          may_amount?: number | null
          notes?: string | null
          nov_amount?: number | null
          oct_amount?: number | null
          period_type?: string
          sep_amount?: number | null
          total_annual_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_lines_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          template_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          template_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          approval_date: string | null
          approved_by: string | null
          budget_name: string
          budget_type: string
          budget_year: number
          client_id: string
          created_at: string
          created_by: string | null
          currency_code: string
          end_date: string
          id: string
          is_active: boolean | null
          net_income: number | null
          notes: string | null
          start_date: string
          status: string
          template_id: string | null
          total_expenses: number | null
          total_revenue: number | null
          updated_at: string
          version_number: number
        }
        Insert: {
          approval_date?: string | null
          approved_by?: string | null
          budget_name: string
          budget_type?: string
          budget_year: number
          client_id: string
          created_at?: string
          created_by?: string | null
          currency_code?: string
          end_date: string
          id?: string
          is_active?: boolean | null
          net_income?: number | null
          notes?: string | null
          start_date: string
          status?: string
          template_id?: string | null
          total_expenses?: number | null
          total_revenue?: number | null
          updated_at?: string
          version_number?: number
        }
        Update: {
          approval_date?: string | null
          approved_by?: string | null
          budget_name?: string
          budget_type?: string
          budget_year?: number
          client_id?: string
          created_at?: string
          created_by?: string | null
          currency_code?: string
          end_date?: string
          id?: string
          is_active?: boolean | null
          net_income?: number | null
          notes?: string | null
          start_date?: string
          status?: string
          template_id?: string | null
          total_expenses?: number | null
          total_revenue?: number | null
          updated_at?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "budget_templates"
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
          auto_metrics: Json
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
          working_paper_data: Json
          working_paper_template_id: string | null
        }
        Insert: {
          action_type: Database["public"]["Enums"]["action_type"]
          actual_hours?: number | null
          assigned_to?: string | null
          auto_metrics?: Json
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
          working_paper_data?: Json
          working_paper_template_id?: string | null
        }
        Update: {
          action_type?: Database["public"]["Enums"]["action_type"]
          actual_hours?: number | null
          assigned_to?: string | null
          auto_metrics?: Json
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
          working_paper_data?: Json
          working_paper_template_id?: string | null
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
      client_custom_field_values: {
        Row: {
          client_id: string
          created_at: string
          custom_field_id: string
          field_value: string | null
          id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          custom_field_id: string
          field_value?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          custom_field_id?: string
          field_value?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_custom_field_values_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_custom_field_values_custom_field_id_fkey"
            columns: ["custom_field_id"]
            isOneToOne: false
            referencedRelation: "client_custom_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      client_custom_fields: {
        Row: {
          audit_firm_id: string | null
          created_at: string
          created_by: string | null
          display_order: number | null
          field_label: string
          field_name: string
          field_options: Json | null
          field_type: string
          help_text: string | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          updated_at: string
          validation_rules: Json | null
        }
        Insert: {
          audit_firm_id?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number | null
          field_label: string
          field_name: string
          field_options?: Json | null
          field_type?: string
          help_text?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          updated_at?: string
          validation_rules?: Json | null
        }
        Update: {
          audit_firm_id?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number | null
          field_label?: string
          field_name?: string
          field_options?: Json | null
          field_type?: string
          help_text?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          updated_at?: string
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "client_custom_fields_audit_firm_id_fkey"
            columns: ["audit_firm_id"]
            isOneToOne: false
            referencedRelation: "audit_firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_custom_fields_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      client_filters: {
        Row: {
          audit_firm_id: string | null
          created_at: string
          created_by: string | null
          filter_config: Json
          filter_name: string
          id: string
          is_default: boolean | null
          is_public: boolean | null
          updated_at: string
        }
        Insert: {
          audit_firm_id?: string | null
          created_at?: string
          created_by?: string | null
          filter_config?: Json
          filter_name: string
          id?: string
          is_default?: boolean | null
          is_public?: boolean | null
          updated_at?: string
        }
        Update: {
          audit_firm_id?: string | null
          created_at?: string
          created_by?: string | null
          filter_config?: Json
          filter_name?: string
          id?: string
          is_default?: boolean | null
          is_public?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_filters_audit_firm_id_fkey"
            columns: ["audit_firm_id"]
            isOneToOne: false
            referencedRelation: "audit_firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_filters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      client_investments: {
        Row: {
          average_cost_price: number | null
          client_id: string
          created_at: string
          created_by: string | null
          current_market_value: number | null
          current_quantity: number
          id: string
          is_active: boolean
          last_valuation_date: string | null
          notes: string | null
          portfolio_percentage: number | null
          security_id: string
          total_cost_basis: number | null
          updated_at: string
        }
        Insert: {
          average_cost_price?: number | null
          client_id: string
          created_at?: string
          created_by?: string | null
          current_market_value?: number | null
          current_quantity?: number
          id?: string
          is_active?: boolean
          last_valuation_date?: string | null
          notes?: string | null
          portfolio_percentage?: number | null
          security_id: string
          total_cost_basis?: number | null
          updated_at?: string
        }
        Update: {
          average_cost_price?: number | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          current_market_value?: number | null
          current_quantity?: number
          id?: string
          is_active?: boolean
          last_valuation_date?: string | null
          notes?: string | null
          portfolio_percentage?: number | null
          security_id?: string
          total_cost_basis?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_investments_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "investment_securities"
            referencedColumns: ["id"]
          },
        ]
      }
      client_reports: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          id: string
          layout_config: Json
          report_description: string | null
          report_name: string
          updated_at: string
          widgets_config: Json
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          id?: string
          layout_config?: Json
          report_description?: string | null
          report_name: string
          updated_at?: string
          widgets_config?: Json
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          id?: string
          layout_config?: Json
          report_description?: string | null
          report_name?: string
          updated_at?: string
          widgets_config?: Json
        }
        Relationships: []
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
      client_shareholders: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          brreg_data: Json | null
          city: string | null
          client_id: string
          country: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          last_brreg_sync_at: string | null
          number_of_shares: number | null
          ownership_percentage: number | null
          phone: string | null
          postal_code: string | null
          registered_date: string | null
          share_class: string | null
          shareholder_name: string
          shareholder_org_number: string | null
          shareholder_type: string
          updated_at: string
          voting_rights_percentage: number | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          brreg_data?: Json | null
          city?: string | null
          client_id: string
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          last_brreg_sync_at?: string | null
          number_of_shares?: number | null
          ownership_percentage?: number | null
          phone?: string | null
          postal_code?: string | null
          registered_date?: string | null
          share_class?: string | null
          shareholder_name: string
          shareholder_org_number?: string | null
          shareholder_type?: string
          updated_at?: string
          voting_rights_percentage?: number | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          brreg_data?: Json | null
          city?: string | null
          client_id?: string
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          last_brreg_sync_at?: string | null
          number_of_shares?: number | null
          ownership_percentage?: number | null
          phone?: string | null
          postal_code?: string | null
          registered_date?: string | null
          share_class?: string | null
          shareholder_name?: string
          shareholder_org_number?: string | null
          shareholder_type?: string
          updated_at?: string
          voting_rights_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_shareholders_client_id_fkey"
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
      client_view_configurations: {
        Row: {
          column_order: Json
          column_widths: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          sort_config: Json | null
          updated_at: string
          user_id: string
          view_name: string
          visible_columns: Json
        }
        Insert: {
          column_order?: Json
          column_widths?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          sort_config?: Json | null
          updated_at?: string
          user_id: string
          view_name?: string
          visible_columns?: Json
        }
        Update: {
          column_order?: Json
          column_widths?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          sort_config?: Json | null
          updated_at?: string
          user_id?: string
          view_name?: string
          visible_columns?: Json
        }
        Relationships: [
          {
            foreignKeyName: "client_view_configurations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          accountant_name: string | null
          accounting_system: string | null
          actual_industry: string | null
          address: string | null
          address_line: string | null
          ansv: string | null
          audit_fee: number | null
          auditor_since: string | null
          bank_account: string | null
          board_meetings_per_year: number | null
          brreg_sync_version: number | null
          budget_amount: number | null
          budget_hours: number | null
          ceo: string | null
          chair: string | null
          city: string | null
          client_group: string | null
          company_name: string
          contact_person: string | null
          created_at: string
          current_accounting_year: number | null
          current_auditor_name: string | null
          current_auditor_org_number: string | null
          department: string | null
          department_id: string | null
          email: string | null
          engagement_type: Database["public"]["Enums"]["engagement_type"] | null
          equity_capital: number | null
          homepage: string | null
          id: string
          industry: string | null
          internal_controls: string | null
          is_active: boolean
          is_test_data: boolean | null
          last_brreg_sync_at: string | null
          municipality_code: string | null
          municipality_name: string | null
          mva_registered: boolean | null
          nace_code: string | null
          nace_description: string | null
          name: string
          notes: string | null
          org_form_code: string | null
          org_form_description: string | null
          org_number: string
          partner: string | null
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
          accountant_name?: string | null
          accounting_system?: string | null
          actual_industry?: string | null
          address?: string | null
          address_line?: string | null
          ansv?: string | null
          audit_fee?: number | null
          auditor_since?: string | null
          bank_account?: string | null
          board_meetings_per_year?: number | null
          brreg_sync_version?: number | null
          budget_amount?: number | null
          budget_hours?: number | null
          ceo?: string | null
          chair?: string | null
          city?: string | null
          client_group?: string | null
          company_name: string
          contact_person?: string | null
          created_at?: string
          current_accounting_year?: number | null
          current_auditor_name?: string | null
          current_auditor_org_number?: string | null
          department?: string | null
          department_id?: string | null
          email?: string | null
          engagement_type?:
            | Database["public"]["Enums"]["engagement_type"]
            | null
          equity_capital?: number | null
          homepage?: string | null
          id?: string
          industry?: string | null
          internal_controls?: string | null
          is_active?: boolean
          is_test_data?: boolean | null
          last_brreg_sync_at?: string | null
          municipality_code?: string | null
          municipality_name?: string | null
          mva_registered?: boolean | null
          nace_code?: string | null
          nace_description?: string | null
          name: string
          notes?: string | null
          org_form_code?: string | null
          org_form_description?: string | null
          org_number: string
          partner?: string | null
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
          accountant_name?: string | null
          accounting_system?: string | null
          actual_industry?: string | null
          address?: string | null
          address_line?: string | null
          ansv?: string | null
          audit_fee?: number | null
          auditor_since?: string | null
          bank_account?: string | null
          board_meetings_per_year?: number | null
          brreg_sync_version?: number | null
          budget_amount?: number | null
          budget_hours?: number | null
          ceo?: string | null
          chair?: string | null
          city?: string | null
          client_group?: string | null
          company_name?: string
          contact_person?: string | null
          created_at?: string
          current_accounting_year?: number | null
          current_auditor_name?: string | null
          current_auditor_org_number?: string | null
          department?: string | null
          department_id?: string | null
          email?: string | null
          engagement_type?:
            | Database["public"]["Enums"]["engagement_type"]
            | null
          equity_capital?: number | null
          homepage?: string | null
          id?: string
          industry?: string | null
          internal_controls?: string | null
          is_active?: boolean
          is_test_data?: boolean | null
          last_brreg_sync_at?: string | null
          municipality_code?: string | null
          municipality_name?: string | null
          mva_registered?: boolean | null
          nace_code?: string | null
          nace_description?: string | null
          name?: string
          notes?: string | null
          org_form_code?: string | null
          org_form_description?: string | null
          org_number?: string
          partner?: string | null
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
      collaboration_sessions: {
        Row: {
          client_id: string
          created_at: string
          cursor_position: Json | null
          dashboard_id: string
          fiscal_year: number
          id: string
          is_active: boolean
          last_seen: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          cursor_position?: Json | null
          dashboard_id: string
          fiscal_year: number
          id?: string
          is_active?: boolean
          last_seen?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          cursor_position?: Json | null
          dashboard_id?: string
          fiscal_year?: number
          id?: string
          is_active?: boolean
          last_seen?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      column_mapping_history: {
        Row: {
          client_id: string
          confidence_score: number | null
          created_at: string
          file_name: string | null
          file_type: string
          fiscal_year: number | null
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
          fiscal_year?: number | null
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
          fiscal_year?: number | null
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
      country_risk_classifications: {
        Row: {
          country_code: string
          country_name: string
          created_at: string
          description: string | null
          exemption_method_risk_level: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string
          description?: string | null
          exemption_method_risk_level?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string
          description?: string | null
          exemption_method_risk_level?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      currencies: {
        Row: {
          created_at: string
          currency_code: string
          currency_name: string
          decimal_places: number
          id: string
          is_active: boolean
          is_base_currency: boolean
          symbol: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_code: string
          currency_name: string
          decimal_places?: number
          id?: string
          is_active?: boolean
          is_base_currency?: boolean
          symbol?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_code?: string
          currency_name?: string
          decimal_places?: number
          id?: string
          is_active?: boolean
          is_base_currency?: boolean
          symbol?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      custom_permissions: {
        Row: {
          audit_firm_id: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          audit_firm_id?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          audit_firm_id?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_permissions_audit_firm_id_fkey"
            columns: ["audit_firm_id"]
            isOneToOne: false
            referencedRelation: "audit_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_role_permissions: {
        Row: {
          granted_at: string
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          granted_at?: string
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          granted_at?: string
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "custom_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_roles: {
        Row: {
          audit_firm_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          is_system_role: boolean
          name: string
          updated_at: string
        }
        Insert: {
          audit_firm_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_system_role?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          audit_firm_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_system_role?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_roles_audit_firm_id_fkey"
            columns: ["audit_firm_id"]
            isOneToOne: false
            referencedRelation: "audit_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_comments: {
        Row: {
          client_id: string
          content: string
          created_at: string
          dashboard_id: string
          fiscal_year: number
          id: string
          parent_comment_id: string | null
          resolved: boolean
          resolved_at: string | null
          resolved_by_user_id: string | null
          updated_at: string
          user_id: string
          widget_id: string | null
        }
        Insert: {
          client_id: string
          content: string
          created_at?: string
          dashboard_id: string
          fiscal_year: number
          id?: string
          parent_comment_id?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          updated_at?: string
          user_id: string
          widget_id?: string | null
        }
        Update: {
          client_id?: string
          content?: string
          created_at?: string
          dashboard_id?: string
          fiscal_year?: number
          id?: string
          parent_comment_id?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          updated_at?: string
          user_id?: string
          widget_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "dashboard_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_shares: {
        Row: {
          client_id: string
          created_at: string
          dashboard_id: string
          expires_at: string | null
          fiscal_year: number
          id: string
          share_type: string
          shared_by_user_id: string
          shared_with_user_id: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          dashboard_id: string
          expires_at?: string | null
          fiscal_year: number
          id?: string
          share_type: string
          shared_by_user_id: string
          shared_with_user_id?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          dashboard_id?: string
          expires_at?: string | null
          fiscal_year?: number
          id?: string
          share_type?: string
          shared_by_user_id?: string
          shared_with_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dashboard_versions: {
        Row: {
          client_id: string
          created_at: string
          created_by_user_id: string
          dashboard_id: string
          description: string | null
          fiscal_year: number
          id: string
          layouts_data: Json
          settings_data: Json | null
          version_name: string | null
          version_number: number
          widgets_data: Json
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by_user_id: string
          dashboard_id: string
          description?: string | null
          fiscal_year: number
          id?: string
          layouts_data: Json
          settings_data?: Json | null
          version_name?: string | null
          version_number: number
          widgets_data: Json
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by_user_id?: string
          dashboard_id?: string
          description?: string | null
          fiscal_year?: number
          id?: string
          layouts_data?: Json
          settings_data?: Json | null
          version_name?: string | null
          version_number?: number
          widgets_data?: Json
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
      department_access: {
        Row: {
          access_type: string
          department_id: string
          expires_at: string | null
          granted_at: string
          granted_by: string | null
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          access_type: string
          department_id: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          access_type?: string
          department_id?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_access_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
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
      depreciation_schedules: {
        Row: {
          accumulated_depreciation: number
          book_value: number
          created_at: string
          depreciation_amount: number
          fixed_asset_id: string
          id: string
          is_calculated: boolean
          is_posted: boolean
          journal_entry_id: string | null
          period_month: number
          period_year: number
        }
        Insert: {
          accumulated_depreciation: number
          book_value: number
          created_at?: string
          depreciation_amount: number
          fixed_asset_id: string
          id?: string
          is_calculated?: boolean
          is_posted?: boolean
          journal_entry_id?: string | null
          period_month: number
          period_year: number
        }
        Update: {
          accumulated_depreciation?: number
          book_value?: number
          created_at?: string
          depreciation_amount?: number
          fixed_asset_id?: string
          id?: string
          is_calculated?: boolean
          is_posted?: boolean
          journal_entry_id?: string | null
          period_month?: number
          period_year?: number
        }
        Relationships: [
          {
            foreignKeyName: "depreciation_schedules_fixed_asset_id_fkey"
            columns: ["fixed_asset_id"]
            isOneToOne: false
            referencedRelation: "fixed_assets"
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
      documentation_checklists: {
        Row: {
          assigned_to: string | null
          audit_year: number
          checklist_data: Json
          checklist_name: string
          checklist_type: string
          client_id: string
          completed_date: string | null
          completed_items: number | null
          completion_percentage: number | null
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          notes: string | null
          status: string
          total_items: number | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          audit_year: number
          checklist_data?: Json
          checklist_name: string
          checklist_type: string
          client_id: string
          completed_date?: string | null
          completed_items?: number | null
          completion_percentage?: number | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          status?: string
          total_items?: number | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          audit_year?: number
          checklist_data?: Json
          checklist_name?: string
          checklist_type?: string
          client_id?: string
          completed_date?: string | null
          completed_items?: number | null
          completion_percentage?: number | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          status?: string
          total_items?: number | null
          updated_at?: string
        }
        Relationships: []
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
      exchange_rates: {
        Row: {
          created_at: string
          created_by: string | null
          exchange_rate: number
          from_currency_code: string
          id: string
          is_year_end: boolean
          notes: string | null
          rate_date: string
          source: string
          source_reference: string | null
          to_currency_code: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          exchange_rate: number
          from_currency_code: string
          id?: string
          is_year_end?: boolean
          notes?: string | null
          rate_date: string
          source?: string
          source_reference?: string | null
          to_currency_code?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          exchange_rate?: number
          from_currency_code?: string
          id?: string
          is_year_end?: boolean
          notes?: string | null
          rate_date?: string
          source?: string
          source_reference?: string | null
          to_currency_code?: string
          updated_at?: string
        }
        Relationships: []
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
      filtered_data_cache: {
        Row: {
          cache_created_at: string
          client_id: string
          data_version_id: string
          expires_at: string
          filter_criteria: Json
          filter_hash: string
          filtered_data_summary: Json
          id: string
        }
        Insert: {
          cache_created_at?: string
          client_id: string
          data_version_id: string
          expires_at?: string
          filter_criteria: Json
          filter_hash: string
          filtered_data_summary: Json
          id?: string
        }
        Update: {
          cache_created_at?: string
          client_id?: string
          data_version_id?: string
          expires_at?: string
          filter_criteria?: Json
          filter_hash?: string
          filtered_data_summary?: Json
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "filtered_data_cache_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filtered_data_cache_data_version_id_fkey"
            columns: ["data_version_id"]
            isOneToOne: false
            referencedRelation: "accounting_data_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_reports_cache: {
        Row: {
          client_id: string
          created_by: string | null
          expires_at: string
          generated_at: string
          id: string
          parameters: Json | null
          period_end: string
          period_start: string
          report_data: Json
          report_type: string
        }
        Insert: {
          client_id: string
          created_by?: string | null
          expires_at?: string
          generated_at?: string
          id?: string
          parameters?: Json | null
          period_end: string
          period_start: string
          report_data: Json
          report_type: string
        }
        Update: {
          client_id?: string
          created_by?: string | null
          expires_at?: string
          generated_at?: string
          id?: string
          parameters?: Json | null
          period_end?: string
          period_start?: string
          report_data?: Json
          report_type?: string
        }
        Relationships: []
      }
      firm_access_requests: {
        Row: {
          audit_firm_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          email: string | null
          id: string
          message: string | null
          requester_profile_id: string
          role_requested: Database["public"]["Enums"]["user_role_type"]
          status: Database["public"]["Enums"]["access_request_status"]
          updated_at: string
        }
        Insert: {
          audit_firm_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          email?: string | null
          id?: string
          message?: string | null
          requester_profile_id: string
          role_requested?: Database["public"]["Enums"]["user_role_type"]
          status?: Database["public"]["Enums"]["access_request_status"]
          updated_at?: string
        }
        Update: {
          audit_firm_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          email?: string | null
          id?: string
          message?: string | null
          requester_profile_id?: string
          role_requested?: Database["public"]["Enums"]["user_role_type"]
          status?: Database["public"]["Enums"]["access_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "firm_access_requests_audit_firm_id_fkey"
            columns: ["audit_firm_id"]
            isOneToOne: false
            referencedRelation: "audit_firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "firm_access_requests_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "firm_access_requests_requester_profile_id_fkey"
            columns: ["requester_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      firm_account_mapping_rules: {
        Row: {
          account_range_end: number
          account_range_start: number
          audit_firm_id: string
          base_rule_id: string | null
          confidence_score: number | null
          created_at: string
          created_by: string | null
          firm_standard_account_id: string | null
          id: string
          is_active: boolean | null
          is_custom: boolean | null
          rule_name: string
          updated_at: string
        }
        Insert: {
          account_range_end: number
          account_range_start: number
          audit_firm_id: string
          base_rule_id?: string | null
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          firm_standard_account_id?: string | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          rule_name: string
          updated_at?: string
        }
        Update: {
          account_range_end?: number
          account_range_start?: number
          audit_firm_id?: string
          base_rule_id?: string | null
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          firm_standard_account_id?: string | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          rule_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "firm_account_mapping_rules_base_rule_id_fkey"
            columns: ["base_rule_id"]
            isOneToOne: false
            referencedRelation: "account_mapping_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "firm_account_mapping_rules_firm_standard_account_id_fkey"
            columns: ["firm_standard_account_id"]
            isOneToOne: false
            referencedRelation: "firm_standard_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      firm_employees: {
        Row: {
          audit_firm_id: string
          created_at: string
          department_id: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          profile_id: string | null
          role: Database["public"]["Enums"]["user_role_type"]
          status: Database["public"]["Enums"]["employee_status_type"]
          updated_at: string
        }
        Insert: {
          audit_firm_id: string
          created_at?: string
          department_id?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          profile_id?: string | null
          role?: Database["public"]["Enums"]["user_role_type"]
          status?: Database["public"]["Enums"]["employee_status_type"]
          updated_at?: string
        }
        Update: {
          audit_firm_id?: string
          created_at?: string
          department_id?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          profile_id?: string | null
          role?: Database["public"]["Enums"]["user_role_type"]
          status?: Database["public"]["Enums"]["employee_status_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "firm_employees_audit_firm_id_fkey"
            columns: ["audit_firm_id"]
            isOneToOne: false
            referencedRelation: "audit_firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "firm_employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "firm_employees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      firm_formula_definitions: {
        Row: {
          audit_firm_id: string | null
          base_formula_id: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          formula_expression: Json
          id: string
          is_active: boolean | null
          is_custom: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          audit_firm_id?: string | null
          base_formula_id?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          formula_expression: Json
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          audit_firm_id?: string | null
          base_formula_id?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          formula_expression?: Json
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "firm_formula_definitions_audit_firm_id_fkey"
            columns: ["audit_firm_id"]
            isOneToOne: false
            referencedRelation: "audit_firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "firm_formula_definitions_base_formula_id_fkey"
            columns: ["base_formula_id"]
            isOneToOne: false
            referencedRelation: "formula_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      firm_standard_accounts: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type_enum"]
          analysis_group: string | null
          audit_firm_id: string
          base_standard_account_id: string | null
          calculation_formula: Json | null
          category: string | null
          created_at: string
          created_by: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_custom: boolean | null
          is_total_line: boolean | null
          line_type: string
          parent_line_id: string | null
          sign_multiplier: number | null
          standard_name: string
          standard_number: string
          updated_at: string
        }
        Insert: {
          account_type: Database["public"]["Enums"]["account_type_enum"]
          analysis_group?: string | null
          audit_firm_id: string
          base_standard_account_id?: string | null
          calculation_formula?: Json | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          is_total_line?: boolean | null
          line_type?: string
          parent_line_id?: string | null
          sign_multiplier?: number | null
          standard_name: string
          standard_number: string
          updated_at?: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type_enum"]
          analysis_group?: string | null
          audit_firm_id?: string
          base_standard_account_id?: string | null
          calculation_formula?: Json | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          is_total_line?: boolean | null
          line_type?: string
          parent_line_id?: string | null
          sign_multiplier?: number | null
          standard_name?: string
          standard_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "firm_standard_accounts_base_standard_account_id_fkey"
            columns: ["base_standard_account_id"]
            isOneToOne: false
            referencedRelation: "standard_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "firm_standard_accounts_parent_line_id_fkey"
            columns: ["parent_line_id"]
            isOneToOne: false
            referencedRelation: "firm_standard_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_assets: {
        Row: {
          accumulated_depreciation: number
          asset_category_id: string | null
          asset_name: string
          asset_number: string
          book_value: number
          client_id: string
          created_at: string
          created_by: string | null
          depreciation_method: string
          description: string | null
          disposal_date: string | null
          disposal_method: string | null
          disposal_price: number | null
          id: string
          location: string | null
          purchase_date: string
          purchase_price: number
          salvage_value: number | null
          serial_number: string | null
          status: string
          updated_at: string
          useful_life_years: number
          vendor: string | null
          warranty_expiry_date: string | null
        }
        Insert: {
          accumulated_depreciation?: number
          asset_category_id?: string | null
          asset_name: string
          asset_number: string
          book_value?: number
          client_id: string
          created_at?: string
          created_by?: string | null
          depreciation_method?: string
          description?: string | null
          disposal_date?: string | null
          disposal_method?: string | null
          disposal_price?: number | null
          id?: string
          location?: string | null
          purchase_date: string
          purchase_price: number
          salvage_value?: number | null
          serial_number?: string | null
          status?: string
          updated_at?: string
          useful_life_years: number
          vendor?: string | null
          warranty_expiry_date?: string | null
        }
        Update: {
          accumulated_depreciation?: number
          asset_category_id?: string | null
          asset_name?: string
          asset_number?: string
          book_value?: number
          client_id?: string
          created_at?: string
          created_by?: string | null
          depreciation_method?: string
          description?: string | null
          disposal_date?: string | null
          disposal_method?: string | null
          disposal_price?: number | null
          id?: string
          location?: string | null
          purchase_date?: string
          purchase_price?: number
          salvage_value?: number | null
          serial_number?: string | null
          status?: string
          updated_at?: string
          useful_life_years?: number
          vendor?: string | null
          warranty_expiry_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fixed_assets_asset_category_id_fkey"
            columns: ["asset_category_id"]
            isOneToOne: false
            referencedRelation: "asset_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      forecast_lines: {
        Row: {
          account_name: string
          account_number: string
          calculation_method: string | null
          created_at: string
          forecasted_amount: number
          growth_rate: number | null
          id: string
          notes: string | null
          period_month: number
          period_year: number
          scenario_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          calculation_method?: string | null
          created_at?: string
          forecasted_amount?: number
          growth_rate?: number | null
          id?: string
          notes?: string | null
          period_month: number
          period_year: number
          scenario_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          calculation_method?: string | null
          created_at?: string
          forecasted_amount?: number
          growth_rate?: number | null
          id?: string
          notes?: string | null
          period_month?: number
          period_year?: number
          scenario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forecast_lines_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "forecast_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      forecast_scenarios: {
        Row: {
          assumptions: string | null
          base_budget_id: string | null
          client_id: string
          confidence_level: number | null
          created_at: string
          created_by: string | null
          forecast_period_end: string
          forecast_period_start: string
          id: string
          scenario_name: string
          scenario_type: string
          updated_at: string
        }
        Insert: {
          assumptions?: string | null
          base_budget_id?: string | null
          client_id: string
          confidence_level?: number | null
          created_at?: string
          created_by?: string | null
          forecast_period_end: string
          forecast_period_start: string
          id?: string
          scenario_name: string
          scenario_type?: string
          updated_at?: string
        }
        Update: {
          assumptions?: string | null
          base_budget_id?: string | null
          client_id?: string
          confidence_level?: number | null
          created_at?: string
          created_by?: string | null
          forecast_period_end?: string
          forecast_period_start?: string
          id?: string
          scenario_name?: string
          scenario_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forecast_scenarios_base_budget_id_fkey"
            columns: ["base_budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
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
          formula_id: string | null
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
          formula_id?: string | null
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
          formula_id?: string | null
          id?: string
          is_active?: boolean
          is_system_variable?: boolean
          metadata?: Json | null
          name?: string
          updated_at?: string
          value_expression?: Json | null
          variable_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "formula_variables_formula_id_fkey"
            columns: ["formula_id"]
            isOneToOne: false
            referencedRelation: "formula_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      general_ledger_transactions: {
        Row: {
          account_name: string | null
          account_number: string | null
          amount_currency: number | null
          balance_amount: number | null
          cid: string | null
          client_account_id: string
          client_id: string
          created_at: string
          credit_amount: number | null
          currency_code: string | null
          customer_id: string | null
          debit_amount: number | null
          description: string | null
          document_number: string | null
          due_date: string | null
          exchange_rate: number | null
          id: string
          period_month: number
          period_year: number
          reference_number: string | null
          supplier_id: string | null
          transaction_date: string
          upload_batch_id: string | null
          value_date: string | null
          vat_base: number | null
          vat_code: string | null
          vat_credit: number | null
          vat_debit: number | null
          vat_rate: number | null
          version_id: string | null
          voucher_number: string | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          amount_currency?: number | null
          balance_amount?: number | null
          cid?: string | null
          client_account_id: string
          client_id: string
          created_at?: string
          credit_amount?: number | null
          currency_code?: string | null
          customer_id?: string | null
          debit_amount?: number | null
          description?: string | null
          document_number?: string | null
          due_date?: string | null
          exchange_rate?: number | null
          id?: string
          period_month: number
          period_year: number
          reference_number?: string | null
          supplier_id?: string | null
          transaction_date: string
          upload_batch_id?: string | null
          value_date?: string | null
          vat_base?: number | null
          vat_code?: string | null
          vat_credit?: number | null
          vat_debit?: number | null
          vat_rate?: number | null
          version_id?: string | null
          voucher_number?: string | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          amount_currency?: number | null
          balance_amount?: number | null
          cid?: string | null
          client_account_id?: string
          client_id?: string
          created_at?: string
          credit_amount?: number | null
          currency_code?: string | null
          customer_id?: string | null
          debit_amount?: number | null
          description?: string | null
          document_number?: string | null
          due_date?: string | null
          exchange_rate?: number | null
          id?: string
          period_month?: number
          period_year?: number
          reference_number?: string | null
          supplier_id?: string | null
          transaction_date?: string
          upload_batch_id?: string | null
          value_date?: string | null
          vat_base?: number | null
          vat_code?: string | null
          vat_credit?: number | null
          vat_debit?: number | null
          vat_rate?: number | null
          version_id?: string | null
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
          {
            foreignKeyName: "general_ledger_transactions_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "accounting_data_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_reports: {
        Row: {
          client_id: string
          created_at: string
          error_message: string | null
          export_format: string | null
          file_path: string | null
          file_size: number | null
          generated_by: string | null
          generation_date: string
          id: string
          is_final: boolean | null
          metadata: Json | null
          parameters: Json | null
          report_data: Json
          report_name: string
          report_period_end: string
          report_period_start: string
          report_status: string
          review_date: string | null
          review_notes: string | null
          reviewed_by: string | null
          template_id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          error_message?: string | null
          export_format?: string | null
          file_path?: string | null
          file_size?: number | null
          generated_by?: string | null
          generation_date?: string
          id?: string
          is_final?: boolean | null
          metadata?: Json | null
          parameters?: Json | null
          report_data?: Json
          report_name: string
          report_period_end: string
          report_period_start: string
          report_status?: string
          review_date?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          template_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          error_message?: string | null
          export_format?: string | null
          file_path?: string | null
          file_size?: number | null
          generated_by?: string | null
          generation_date?: string
          id?: string
          is_final?: boolean | null
          metadata?: Json | null
          parameters?: Json | null
          report_data?: Json
          report_name?: string
          report_period_end?: string
          report_period_start?: string
          report_status?: string
          review_date?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_reports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      global_a07_mapping_rules: {
        Row: {
          a07_performance_code: string
          account_range_end: number
          account_range_start: number
          confidence_score: number | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          rule_name: string
          updated_at: string
        }
        Insert: {
          a07_performance_code: string
          account_range_end: number
          account_range_start: number
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          rule_name: string
          updated_at?: string
        }
        Update: {
          a07_performance_code?: string
          account_range_end?: number
          account_range_start?: number
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          rule_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      historical_prices: {
        Row: {
          closing_price: number
          created_at: string
          created_by: string | null
          currency_code: string
          high_price: number | null
          id: string
          is_year_end: boolean
          low_price: number | null
          notes: string | null
          opening_price: number | null
          price_date: string
          security_id: string
          source: string
          source_reference: string | null
          updated_at: string
          volume: number | null
        }
        Insert: {
          closing_price: number
          created_at?: string
          created_by?: string | null
          currency_code?: string
          high_price?: number | null
          id?: string
          is_year_end?: boolean
          low_price?: number | null
          notes?: string | null
          opening_price?: number | null
          price_date: string
          security_id: string
          source?: string
          source_reference?: string | null
          updated_at?: string
          volume?: number | null
        }
        Update: {
          closing_price?: number
          created_at?: string
          created_by?: string | null
          currency_code?: string
          high_price?: number | null
          id?: string
          is_year_end?: boolean
          low_price?: number | null
          notes?: string | null
          opening_price?: number | null
          price_date?: string
          security_id?: string
          source?: string
          source_reference?: string | null
          updated_at?: string
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "historical_prices_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "investment_securities"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_codes: {
        Row: {
          aga: boolean
          id: string
          inserted_at: string | null
          label: string
        }
        Insert: {
          aga?: boolean
          id: string
          inserted_at?: string | null
          label: string
        }
        Update: {
          aga?: boolean
          id?: string
          inserted_at?: string | null
          label?: string
        }
        Relationships: []
      }
      investment_holdings: {
        Row: {
          acquisition_date: string | null
          average_cost_price: number | null
          cost_basis: number | null
          cost_price_currency: string | null
          created_at: string
          created_by: string | null
          holding_type: string
          id: string
          is_active: boolean
          notes: string | null
          portfolio_id: string
          quantity: number
          security_id: string
          updated_at: string
        }
        Insert: {
          acquisition_date?: string | null
          average_cost_price?: number | null
          cost_basis?: number | null
          cost_price_currency?: string | null
          created_at?: string
          created_by?: string | null
          holding_type?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          portfolio_id: string
          quantity?: number
          security_id: string
          updated_at?: string
        }
        Update: {
          acquisition_date?: string | null
          average_cost_price?: number | null
          cost_basis?: number | null
          cost_price_currency?: string | null
          created_at?: string
          created_by?: string | null
          holding_type?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          portfolio_id?: string
          quantity?: number
          security_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_holdings_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "investment_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_holdings_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolio_summaries"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "investment_holdings_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "investment_securities"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_portfolios: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          currency_code: string
          description: string | null
          id: string
          is_active: boolean
          portfolio_name: string
          portfolio_type: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          currency_code?: string
          description?: string | null
          id?: string
          is_active?: boolean
          portfolio_name: string
          portfolio_type?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          currency_code?: string
          description?: string | null
          id?: string
          is_active?: boolean
          portfolio_name?: string
          portfolio_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      investment_securities: {
        Row: {
          country_code: string | null
          created_at: string
          created_by: string | null
          currency_code: string
          exchange: string | null
          id: string
          is_active: boolean
          isin_code: string
          name: string
          sector: string | null
          security_type: string
          updated_at: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          currency_code?: string
          exchange?: string | null
          id?: string
          is_active?: boolean
          isin_code: string
          name: string
          sector?: string | null
          security_type?: string
          updated_at?: string
        }
        Update: {
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          currency_code?: string
          exchange?: string | null
          id?: string
          is_active?: boolean
          isin_code?: string
          name?: string
          sector?: string | null
          security_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      investment_transactions: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          currency_code: string
          exchange_rate: number | null
          fees: number | null
          holding_id: string | null
          id: string
          notes: string | null
          price_per_unit: number
          quantity: number
          security_id: string
          tax_withheld: number | null
          total_amount: number
          transaction_date: string
          transaction_type: string
          updated_at: string
          voucher_reference: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          currency_code?: string
          exchange_rate?: number | null
          fees?: number | null
          holding_id?: string | null
          id?: string
          notes?: string | null
          price_per_unit: number
          quantity: number
          security_id: string
          tax_withheld?: number | null
          total_amount: number
          transaction_date: string
          transaction_type: string
          updated_at?: string
          voucher_reference?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          currency_code?: string
          exchange_rate?: number | null
          fees?: number | null
          holding_id?: string | null
          id?: string
          notes?: string | null
          price_per_unit?: number
          quantity?: number
          security_id?: string
          tax_withheld?: number | null
          total_amount?: number
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
          voucher_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investment_transactions_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "current_portfolio_holdings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_transactions_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "investment_holdings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_transactions_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "investment_securities"
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
      journal_entries: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          posted_at: string | null
          posted_by: string | null
          reference_document_id: string | null
          status: string
          total_amount: number
          updated_at: string
          voucher_date: string
          voucher_number: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          posted_at?: string | null
          posted_by?: string | null
          reference_document_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          voucher_date: string
          voucher_number: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          posted_at?: string | null
          posted_by?: string | null
          reference_document_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          voucher_date?: string
          voucher_number?: string
        }
        Relationships: []
      }
      journal_entry_lines: {
        Row: {
          account_id: string
          created_at: string
          credit_amount: number | null
          debit_amount: number | null
          description: string | null
          id: string
          journal_entry_id: string
          line_number: number
          vat_amount: number | null
          vat_code: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          journal_entry_id: string
          line_number: number
          vat_amount?: number | null
          vat_code?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          journal_entry_id?: string
          line_number?: number
          vat_amount?: number | null
          vat_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_journal_entry_lines_account"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "client_chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_journal_entry_lines_journal_entry"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
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
      mapping_rules: {
        Row: {
          account: string
          client_id: string
          code: string
          id: string
          inserted_at: string | null
          keywords: string[] | null
          month_hints: number[] | null
          priority: number | null
          regex: string | null
          split: number | null
          strategy: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          account: string
          client_id: string
          code: string
          id?: string
          inserted_at?: string | null
          keywords?: string[] | null
          month_hints?: number[] | null
          priority?: number | null
          regex?: string | null
          split?: number | null
          strategy?: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          account?: string
          client_id?: string
          code?: string
          id?: string
          inserted_at?: string | null
          keywords?: string[] | null
          month_hints?: number[] | null
          priority?: number | null
          regex?: string | null
          split?: number | null
          strategy?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      materiality_settings: {
        Row: {
          clearly_trivial: number
          client_id: string
          created_at: string
          created_by: string | null
          currency: string
          fiscal_year: number
          id: string
          materiality: number
          updated_at: string
          updated_by: string | null
          working_materiality: number
        }
        Insert: {
          clearly_trivial: number
          client_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          fiscal_year: number
          id?: string
          materiality: number
          updated_at?: string
          updated_by?: string | null
          working_materiality: number
        }
        Update: {
          clearly_trivial?: number
          client_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          fiscal_year?: number
          id?: string
          materiality?: number
          updated_at?: string
          updated_by?: string | null
          working_materiality?: number
        }
        Relationships: [
          {
            foreignKeyName: "materiality_settings_client_fk"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
      naeringsspesifikasjon: {
        Row: {
          active: boolean
          kode: string
          na_regnskapslinjenavn: string | null
          na_regnskapslinjenummer: string | null
          navn: string
          normalized_code: string | null
          sort: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          kode: string
          na_regnskapslinjenavn?: string | null
          na_regnskapslinjenummer?: string | null
          navn: string
          normalized_code?: string | null
          sort?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          kode?: string
          na_regnskapslinjenavn?: string | null
          na_regnskapslinjenummer?: string | null
          navn?: string
          normalized_code?: string | null
          sort?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      payroll_companies: {
        Row: {
          created_at: string
          id: string
          import_id: string
          navn: string | null
          orgnr: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          import_id: string
          navn?: string | null
          orgnr?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          import_id?: string
          navn?: string | null
          orgnr?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_companies_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "payroll_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_deductions: {
        Row: {
          beloep: number
          beskrivelse: string | null
          created_at: string
          id: string
          import_id: string
          recipient_id: string | null
        }
        Insert: {
          beloep?: number
          beskrivelse?: string | null
          created_at?: string
          id?: string
          import_id: string
          recipient_id?: string | null
        }
        Update: {
          beloep?: number
          beskrivelse?: string | null
          created_at?: string
          id?: string
          import_id?: string
          recipient_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_deductions_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "payroll_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_deductions_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "payroll_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_employees: {
        Row: {
          created_at: string
          employee_data: Json
          employee_id: string
          id: string
          payroll_import_id: string
        }
        Insert: {
          created_at?: string
          employee_data?: Json
          employee_id: string
          id?: string
          payroll_import_id: string
        }
        Update: {
          created_at?: string
          employee_data?: Json
          employee_id?: string
          id?: string
          payroll_import_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_employees_payroll_import_id_fkey"
            columns: ["payroll_import_id"]
            isOneToOne: false
            referencedRelation: "payroll_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_employer_contributions: {
        Row: {
          beregningskode: string | null
          created_at: string
          grunnlag: number
          id: string
          import_id: string
          prosentsats: number | null
          sone: string
          type: Database["public"]["Enums"]["payroll_aga_type"]
        }
        Insert: {
          beregningskode?: string | null
          created_at?: string
          grunnlag?: number
          id?: string
          import_id: string
          prosentsats?: number | null
          sone: string
          type: Database["public"]["Enums"]["payroll_aga_type"]
        }
        Update: {
          beregningskode?: string | null
          created_at?: string
          grunnlag?: number
          id?: string
          import_id?: string
          prosentsats?: number | null
          sone?: string
          type?: Database["public"]["Enums"]["payroll_aga_type"]
        }
        Relationships: [
          {
            foreignKeyName: "payroll_employer_contributions_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "payroll_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_employments: {
        Row: {
          created_at: string
          id: string
          import_id: string
          recipient_id: string
          sluttdato: string | null
          startdato: string | null
          stillingsprosent: number | null
          type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          import_id: string
          recipient_id: string
          sluttdato?: string | null
          startdato?: string | null
          stillingsprosent?: number | null
          type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          import_id?: string
          recipient_id?: string
          sluttdato?: string | null
          startdato?: string | null
          stillingsprosent?: number | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_employments_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "payroll_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_employments_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "payroll_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_imports: {
        Row: {
          antall_personer_innrapportert: number | null
          antall_personer_unike: number | null
          avstemmingstidspunkt: string | null
          client_id: string
          created_at: string
          created_by: string | null
          file_name: string | null
          fom_kalendermaaned: string | null
          id: string
          navn: string | null
          orgnr: string | null
          period_key: string
          tom_kalendermaaned: string | null
          updated_at: string
        }
        Insert: {
          antall_personer_innrapportert?: number | null
          antall_personer_unike?: number | null
          avstemmingstidspunkt?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          fom_kalendermaaned?: string | null
          id?: string
          navn?: string | null
          orgnr?: string | null
          period_key: string
          tom_kalendermaaned?: string | null
          updated_at?: string
        }
        Update: {
          antall_personer_innrapportert?: number | null
          antall_personer_unike?: number | null
          avstemmingstidspunkt?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          fom_kalendermaaned?: string | null
          id?: string
          navn?: string | null
          orgnr?: string | null
          period_key?: string
          tom_kalendermaaned?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_imports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_income: {
        Row: {
          aga_pliktig: boolean | null
          antall: number | null
          beloep: number
          beskrivelse: string | null
          created_at: string
          fordel: string | null
          id: string
          import_id: string
          recipient_id: string
          trekkpliktig: boolean | null
        }
        Insert: {
          aga_pliktig?: boolean | null
          antall?: number | null
          beloep?: number
          beskrivelse?: string | null
          created_at?: string
          fordel?: string | null
          id?: string
          import_id: string
          recipient_id: string
          trekkpliktig?: boolean | null
        }
        Update: {
          aga_pliktig?: boolean | null
          antall?: number | null
          beloep?: number
          beskrivelse?: string | null
          created_at?: string
          fordel?: string | null
          id?: string
          import_id?: string
          recipient_id?: string
          trekkpliktig?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_income_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "payroll_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_income_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "payroll_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_income_by_type: {
        Row: {
          benefit_type: string | null
          calendar_month: string
          created_at: string
          id: string
          income_description: string | null
          income_type: string
          payroll_import_id: string
          subject_to_tax_withholding: boolean
          total_amount: number
          triggers_aga: boolean
        }
        Insert: {
          benefit_type?: string | null
          calendar_month: string
          created_at?: string
          id?: string
          income_description?: string | null
          income_type: string
          payroll_import_id: string
          subject_to_tax_withholding?: boolean
          total_amount?: number
          triggers_aga?: boolean
        }
        Update: {
          benefit_type?: string | null
          calendar_month?: string
          created_at?: string
          id?: string
          income_description?: string | null
          income_type?: string
          payroll_import_id?: string
          subject_to_tax_withholding?: boolean
          total_amount?: number
          triggers_aga?: boolean
        }
        Relationships: []
      }
      payroll_income_details: {
        Row: {
          amount: number
          created_at: string
          details: Json
          id: string
          income_type: string
          payroll_employee_id: string
          period_month: number
          period_year: number
        }
        Insert: {
          amount?: number
          created_at?: string
          details?: Json
          id?: string
          income_type: string
          payroll_employee_id: string
          period_month: number
          period_year: number
        }
        Update: {
          amount?: number
          created_at?: string
          details?: Json
          id?: string
          income_type?: string
          payroll_employee_id?: string
          period_month?: number
          period_year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_income_details_payroll_employee_id_fkey"
            columns: ["payroll_employee_id"]
            isOneToOne: false
            referencedRelation: "payroll_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_leaves: {
        Row: {
          beskrivelse: string | null
          created_at: string
          employment_id: string
          id: string
          import_id: string
          slutt_dato: string | null
          start_dato: string | null
        }
        Insert: {
          beskrivelse?: string | null
          created_at?: string
          employment_id: string
          id?: string
          import_id: string
          slutt_dato?: string | null
          start_dato?: string | null
        }
        Update: {
          beskrivelse?: string | null
          created_at?: string
          employment_id?: string
          id?: string
          import_id?: string
          slutt_dato?: string | null
          start_dato?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_leaves_employment_id_fkey"
            columns: ["employment_id"]
            isOneToOne: false
            referencedRelation: "payroll_employments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_leaves_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "payroll_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_monthly_submissions: {
        Row: {
          created_at: string
          id: string
          payroll_import_id: string
          period_month: number
          period_year: number
          submission_data: Json
          summary_data: Json
        }
        Insert: {
          created_at?: string
          id?: string
          payroll_import_id: string
          period_month: number
          period_year: number
          submission_data?: Json
          summary_data?: Json
        }
        Update: {
          created_at?: string
          id?: string
          payroll_import_id?: string
          period_month?: number
          period_year?: number
          submission_data?: Json
          summary_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "payroll_monthly_submissions_payroll_import_id_fkey"
            columns: ["payroll_import_id"]
            isOneToOne: false
            referencedRelation: "payroll_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_payment_info: {
        Row: {
          account_number: string | null
          calendar_month: string
          created_at: string
          due_date: string | null
          id: string
          kid_arbeidsgiveravgift: string | null
          kid_finansskatt: string | null
          kid_forskuddstrekk: string | null
          monthly_submission_id: string | null
          payroll_import_id: string
        }
        Insert: {
          account_number?: string | null
          calendar_month: string
          created_at?: string
          due_date?: string | null
          id?: string
          kid_arbeidsgiveravgift?: string | null
          kid_finansskatt?: string | null
          kid_forskuddstrekk?: string | null
          monthly_submission_id?: string | null
          payroll_import_id: string
        }
        Update: {
          account_number?: string | null
          calendar_month?: string
          created_at?: string
          due_date?: string | null
          id?: string
          kid_arbeidsgiveravgift?: string | null
          kid_finansskatt?: string | null
          kid_forskuddstrekk?: string | null
          monthly_submission_id?: string | null
          payroll_import_id?: string
        }
        Relationships: []
      }
      payroll_pensions: {
        Row: {
          created_at: string
          id: string
          identifikator: string | null
          import_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          identifikator?: string | null
          import_id: string
        }
        Update: {
          created_at?: string
          id?: string
          identifikator?: string | null
          import_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_pensions_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "payroll_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_raw_data: {
        Row: {
          created_at: string
          file_size: number
          id: string
          payroll_import_id: string
          raw_json: Json
        }
        Insert: {
          created_at?: string
          file_size?: number
          id?: string
          payroll_import_id: string
          raw_json: Json
        }
        Update: {
          created_at?: string
          file_size?: number
          id?: string
          payroll_import_id?: string
          raw_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "payroll_raw_data_payroll_import_id_fkey"
            columns: ["payroll_import_id"]
            isOneToOne: false
            referencedRelation: "payroll_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_recipients: {
        Row: {
          ansattnummer: string | null
          company_id: string
          created_at: string
          foedselsdato: string | null
          id: string
          import_id: string
          navn: string | null
        }
        Insert: {
          ansattnummer?: string | null
          company_id: string
          created_at?: string
          foedselsdato?: string | null
          id?: string
          import_id: string
          navn?: string | null
        }
        Update: {
          ansattnummer?: string | null
          company_id?: string
          created_at?: string
          foedselsdato?: string | null
          id?: string
          import_id?: string
          navn?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_recipients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "payroll_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_recipients_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "payroll_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_submission_details: {
        Row: {
          altinn_reference: string | null
          altinn_timestamp: string | null
          calendar_month: string
          created_at: string
          delivery_time: string | null
          id: string
          message_id: string | null
          monthly_submission_id: string | null
          payroll_import_id: string
          source_system: string | null
          status: string | null
          submission_id: string | null
        }
        Insert: {
          altinn_reference?: string | null
          altinn_timestamp?: string | null
          calendar_month: string
          created_at?: string
          delivery_time?: string | null
          id?: string
          message_id?: string | null
          monthly_submission_id?: string | null
          payroll_import_id: string
          source_system?: string | null
          status?: string | null
          submission_id?: string | null
        }
        Update: {
          altinn_reference?: string | null
          altinn_timestamp?: string | null
          calendar_month?: string
          created_at?: string
          delivery_time?: string | null
          id?: string
          message_id?: string | null
          monthly_submission_id?: string | null
          payroll_import_id?: string
          source_system?: string | null
          status?: string | null
          submission_id?: string | null
        }
        Relationships: []
      }
      payroll_submissions: {
        Row: {
          altinn_referanse: string | null
          antall_inntektsmottakere: number | null
          created_at: string
          forfallsdato: string | null
          id: string
          import_id: string
          innsendings_id: string | null
          kalendermaaned: string | null
          kid_aga: string | null
          kid_finansskatt: string | null
          kid_trekk: string | null
          kildesystem: string | null
          kontonummer: string | null
          leveringstidspunkt: string | null
          meldings_id: string | null
          status: string | null
          sum_aga: number | null
          sum_forskuddstrekk: number | null
          tidsstempel_fra_altinn: string | null
        }
        Insert: {
          altinn_referanse?: string | null
          antall_inntektsmottakere?: number | null
          created_at?: string
          forfallsdato?: string | null
          id?: string
          import_id: string
          innsendings_id?: string | null
          kalendermaaned?: string | null
          kid_aga?: string | null
          kid_finansskatt?: string | null
          kid_trekk?: string | null
          kildesystem?: string | null
          kontonummer?: string | null
          leveringstidspunkt?: string | null
          meldings_id?: string | null
          status?: string | null
          sum_aga?: number | null
          sum_forskuddstrekk?: number | null
          tidsstempel_fra_altinn?: string | null
        }
        Update: {
          altinn_referanse?: string | null
          antall_inntektsmottakere?: number | null
          created_at?: string
          forfallsdato?: string | null
          id?: string
          import_id?: string
          innsendings_id?: string | null
          kalendermaaned?: string | null
          kid_aga?: string | null
          kid_finansskatt?: string | null
          kid_trekk?: string | null
          kildesystem?: string | null
          kontonummer?: string | null
          leveringstidspunkt?: string | null
          meldings_id?: string | null
          status?: string | null
          sum_aga?: number | null
          sum_forskuddstrekk?: number | null
          tidsstempel_fra_altinn?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_submissions_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "payroll_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_tax_deductions: {
        Row: {
          beloep: number
          created_at: string
          id: string
          import_id: string
          recipient_id: string | null
        }
        Insert: {
          beloep?: number
          created_at?: string
          id?: string
          import_id: string
          recipient_id?: string | null
        }
        Update: {
          beloep?: number
          created_at?: string
          id?: string
          import_id?: string
          recipient_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_tax_deductions_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "payroll_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_tax_deductions_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "payroll_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_variables: {
        Row: {
          created_at: string
          id: string
          import_id: string
          name: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          import_id: string
          name: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          import_id?: string
          name?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "payroll_variables_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "payroll_imports"
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
      portfolio_valuations: {
        Row: {
          created_at: string
          created_by: string | null
          currency_code: string
          id: string
          is_year_end: boolean | null
          portfolio_id: string
          total_cost_basis: number | null
          total_market_value: number
          unrealized_gain_loss: number | null
          valuation_date: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency_code?: string
          id?: string
          is_year_end?: boolean | null
          portfolio_id: string
          total_cost_basis?: number | null
          total_market_value: number
          unrealized_gain_loss?: number | null
          valuation_date: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency_code?: string
          id?: string
          is_year_end?: boolean | null
          portfolio_id?: string
          total_cost_basis?: number | null
          total_market_value?: number
          unrealized_gain_loss?: number | null
          valuation_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_valuations_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "investment_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_valuations_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolio_summaries"
            referencedColumns: ["portfolio_id"]
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
          initials: string | null
          initials_color: string | null
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
          initials?: string | null
          initials_color?: string | null
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
          initials?: string | null
          initials_color?: string | null
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
      rate_limit_log: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      reconciliation_suggestions: {
        Row: {
          bank_transaction_id: string
          confidence_score: number
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          journal_entry_line_id: string
          match_reason: string | null
          status: string
        }
        Insert: {
          bank_transaction_id: string
          confidence_score?: number
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          journal_entry_line_id: string
          match_reason?: string | null
          status?: string
        }
        Update: {
          bank_transaction_id?: string
          confidence_score?: number
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          journal_entry_line_id?: string
          match_reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_suggestions_bank_transaction_id_fkey"
            columns: ["bank_transaction_id"]
            isOneToOne: false
            referencedRelation: "bank_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_suggestions_journal_entry_line_id_fkey"
            columns: ["journal_entry_line_id"]
            isOneToOne: false
            referencedRelation: "journal_entry_lines"
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
      report_approvals: {
        Row: {
          approval_date: string | null
          approval_level: number
          approval_status: string
          approver_role: string
          assigned_to: string | null
          changes_requested: string | null
          comments: string | null
          created_at: string
          generated_report_id: string
          id: string
          updated_at: string
        }
        Insert: {
          approval_date?: string | null
          approval_level: number
          approval_status?: string
          approver_role: string
          assigned_to?: string | null
          changes_requested?: string | null
          comments?: string | null
          created_at?: string
          generated_report_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          approval_date?: string | null
          approval_level?: number
          approval_status?: string
          approver_role?: string
          assigned_to?: string | null
          changes_requested?: string | null
          comments?: string | null
          created_at?: string
          generated_report_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_approvals_generated_report_id_fkey"
            columns: ["generated_report_id"]
            isOneToOne: false
            referencedRelation: "generated_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_builder_settings: {
        Row: {
          client_key: string
          created_at: string
          fiscal_year: number
          id: string
          settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          client_key: string
          created_at?: string
          fiscal_year: number
          id?: string
          settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          client_key?: string
          created_at?: string
          fiscal_year?: number
          id?: string
          settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      report_layouts: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_template: boolean
          layout_json: Json
          name: string
          updated_at: string
          version: number
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_template?: boolean
          layout_json?: Json
          name: string
          updated_at?: string
          version?: number
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_template?: boolean
          layout_json?: Json
          name?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "report_layouts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      report_sections: {
        Row: {
          conditional_logic: Json | null
          created_at: string
          data_source: string | null
          display_order: number
          id: string
          is_required: boolean | null
          section_config: Json
          section_name: string
          section_type: string
          template_id: string
          updated_at: string
        }
        Insert: {
          conditional_logic?: Json | null
          created_at?: string
          data_source?: string | null
          display_order?: number
          id?: string
          is_required?: boolean | null
          section_config?: Json
          section_name: string
          section_type: string
          template_id: string
          updated_at?: string
        }
        Update: {
          conditional_logic?: Json | null
          created_at?: string
          data_source?: string | null
          display_order?: number
          id?: string
          is_required?: boolean | null
          section_config?: Json
          section_name?: string
          section_type?: string
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_sections_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      report_templates: {
        Row: {
          audit_firm_id: string | null
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          is_global: boolean
          is_system_template: boolean
          layouts: Json
          name: string
          scope: string
          sort_order: number | null
          template_structure: Json | null
          title: string | null
          updated_at: string
          widgets: Json
        }
        Insert: {
          audit_firm_id?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_global?: boolean
          is_system_template?: boolean
          layouts?: Json
          name: string
          scope?: string
          sort_order?: number | null
          template_structure?: Json | null
          title?: string | null
          updated_at?: string
          widgets?: Json
        }
        Update: {
          audit_firm_id?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_global?: boolean
          is_system_template?: boolean
          layouts?: Json
          name?: string
          scope?: string
          sort_order?: number | null
          template_structure?: Json | null
          title?: string | null
          updated_at?: string
          widgets?: Json
        }
        Relationships: [
          {
            foreignKeyName: "report_templates_audit_firm_id_fkey"
            columns: ["audit_firm_id"]
            isOneToOne: false
            referencedRelation: "audit_firms"
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
      sampling_results: {
        Row: {
          conclusion: string | null
          finalized_at: string | null
          finalized_by: string | null
          id: string
          projected_misstatement: number | null
          run_id: string | null
          upper_misstatement: number | null
        }
        Insert: {
          conclusion?: string | null
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          projected_misstatement?: number | null
          run_id?: string | null
          upper_misstatement?: number | null
        }
        Update: {
          conclusion?: string | null
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          projected_misstatement?: number | null
          run_id?: string | null
          upper_misstatement?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sampling_results_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "sampling_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      sampling_runs: {
        Row: {
          budget_hours: number | null
          cl: number | null
          created_at: string | null
          em: number | null
          id: string
          pm: number | null
          population_size: number | null
          seed: string | null
          session_id: string | null
          tm: number | null
          user_id: string | null
        }
        Insert: {
          budget_hours?: number | null
          cl?: number | null
          created_at?: string | null
          em?: number | null
          id?: string
          pm?: number | null
          population_size?: number | null
          seed?: string | null
          session_id?: string | null
          tm?: number | null
          user_id?: string | null
        }
        Update: {
          budget_hours?: number | null
          cl?: number | null
          created_at?: string | null
          em?: number | null
          id?: string
          pm?: number | null
          population_size?: number | null
          seed?: string | null
          session_id?: string | null
          tm?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sampling_runs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sampling_selections: {
        Row: {
          coverage_amount: number | null
          coverage_count: number | null
          created_at: string | null
          hours_est: number | null
          id: string
          method: string | null
          params: Json | null
          run_id: string | null
          selected_ids: Json | null
        }
        Insert: {
          coverage_amount?: number | null
          coverage_count?: number | null
          created_at?: string | null
          hours_est?: number | null
          id?: string
          method?: string | null
          params?: Json | null
          run_id?: string | null
          selected_ids?: Json | null
        }
        Update: {
          coverage_amount?: number | null
          coverage_count?: number | null
          created_at?: string | null
          hours_est?: number | null
          id?: string
          method?: string | null
          params?: Json | null
          run_id?: string | null
          selected_ids?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "sampling_selections_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "sampling_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      sampling_tests: {
        Row: {
          finding_amount: number | null
          finding_type: string | null
          id: string
          notes: string | null
          selection_id: string | null
          tested_at: string | null
          txn_id: string
        }
        Insert: {
          finding_amount?: number | null
          finding_type?: string | null
          id?: string
          notes?: string | null
          selection_id?: string | null
          tested_at?: string | null
          txn_id: string
        }
        Update: {
          finding_amount?: number | null
          finding_type?: string | null
          id?: string
          notes?: string | null
          selection_id?: string | null
          tested_at?: string | null
          txn_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sampling_tests_selection_id_fkey"
            columns: ["selection_id"]
            isOneToOne: false
            referencedRelation: "sampling_selections"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          created_at: string | null
          description: string
          event_type: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          event_type: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          event_type?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
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
      team_member_allocations: {
        Row: {
          budget_hours: number
          client_id: string
          created_at: string
          id: string
          notes: string | null
          period_month: number | null
          period_year: number
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_hours?: number
          client_id: string
          created_at?: string
          id?: string
          notes?: string | null
          period_month?: number | null
          period_year: number
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_hours?: number
          client_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          period_month?: number | null
          period_year?: number
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_member_allocations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_member_allocations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "client_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_member_allocations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      temporary_access: {
        Row: {
          created_at: string
          end_date: string
          granted_by: string
          id: string
          metadata: Json | null
          reason: string | null
          resource_id: string | null
          resource_type: string
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          granted_by: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          resource_id?: string | null
          resource_type: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          granted_by?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          resource_id?: string | null
          resource_type?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      training_actions: {
        Row: {
          action_type: string
          consequences: Json | null
          cost: number
          created_at: string
          description: string
          id: string
          is_mandatory: boolean | null
          prerequisites: Json | null
          reveal_key: string | null
          reveal_text: string | null
          risk_impact: string | null
          scenario_id: string
          score_impact: number | null
          sort_order: number | null
          step_number: number
          title: string
          updated_at: string
        }
        Insert: {
          action_type: string
          consequences?: Json | null
          cost?: number
          created_at?: string
          description: string
          id?: string
          is_mandatory?: boolean | null
          prerequisites?: Json | null
          reveal_key?: string | null
          reveal_text?: string | null
          risk_impact?: string | null
          scenario_id: string
          score_impact?: number | null
          sort_order?: number | null
          step_number: number
          title: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          consequences?: Json | null
          cost?: number
          created_at?: string
          description?: string
          id?: string
          is_mandatory?: boolean | null
          prerequisites?: Json | null
          reveal_key?: string | null
          reveal_text?: string | null
          risk_impact?: string | null
          scenario_id?: string
          score_impact?: number | null
          sort_order?: number | null
          step_number?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_actions_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "training_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      training_actions_catalog: {
        Row: {
          assertions: Json | null
          category: string | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          isa_refs: Json | null
          reveal_markdown: string | null
          session_id: string | null
          time_cost_minutes: number | null
          title: string
        }
        Insert: {
          assertions?: Json | null
          category?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          isa_refs?: Json | null
          reveal_markdown?: string | null
          session_id?: string | null
          time_cost_minutes?: number | null
          title: string
        }
        Update: {
          assertions?: Json | null
          category?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          isa_refs?: Json | null
          reveal_markdown?: string | null
          session_id?: string | null
          time_cost_minutes?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_actions_catalog_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_library_collections: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          program_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          program_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          program_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_library_collections_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      training_library_items: {
        Row: {
          article_id: string | null
          collection_id: string | null
          created_at: string | null
          id: string
        }
        Insert: {
          article_id?: string | null
          collection_id?: string | null
          created_at?: string | null
          id?: string
        }
        Update: {
          article_id?: string | null
          collection_id?: string | null
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_library_items_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_library_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "training_library_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      training_programs: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
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
      training_run_choices: {
        Row: {
          action_code: string
          created_at: string | null
          id: string
          minutes_cost: number | null
          revealed_key: string | null
          revealed_text_md: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          action_code: string
          created_at?: string | null
          id?: string
          minutes_cost?: number | null
          revealed_key?: string | null
          revealed_text_md?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          action_code?: string
          created_at?: string | null
          id?: string
          minutes_cost?: number | null
          revealed_key?: string | null
          revealed_text_md?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_run_choices_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_run_states: {
        Row: {
          action_id: string
          applied_at: string
          cost_paid: number
          created_at: string
          id: string
          notes: string | null
          run_id: string
        }
        Insert: {
          action_id: string
          applied_at?: string
          cost_paid?: number
          created_at?: string
          id?: string
          notes?: string | null
          run_id: string
        }
        Update: {
          action_id?: string
          applied_at?: string
          cost_paid?: number
          created_at?: string
          id?: string
          notes?: string | null
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_run_states_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "training_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_run_states_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "training_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      training_runs: {
        Row: {
          actions_taken: number
          completed_at: string | null
          created_at: string
          current_budget: number
          current_step: number
          id: string
          scenario_id: string
          started_at: string
          status: string
          time_spent_minutes: number | null
          total_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actions_taken?: number
          completed_at?: string | null
          created_at?: string
          current_budget: number
          current_step?: number
          id?: string
          scenario_id: string
          started_at?: string
          status?: string
          time_spent_minutes?: number | null
          total_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actions_taken?: number
          completed_at?: string | null
          created_at?: string
          current_budget?: number
          current_step?: number
          id?: string
          scenario_id?: string
          started_at?: string
          status?: string
          time_spent_minutes?: number | null
          total_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_runs_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "training_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      training_scenarios: {
        Row: {
          company_context: Json
          company_name: string
          created_at: string
          created_by: string | null
          description: string | null
          difficulty_level: string
          estimated_duration_minutes: number | null
          id: string
          initial_budget: number
          is_active: boolean
          learning_objectives: string[] | null
          risk_objectives: string[] | null
          target_actions: number
          title: string
          updated_at: string
        }
        Insert: {
          company_context?: Json
          company_name: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: string
          estimated_duration_minutes?: number | null
          id?: string
          initial_budget?: number
          is_active?: boolean
          learning_objectives?: string[] | null
          risk_objectives?: string[] | null
          target_actions?: number
          title: string
          updated_at?: string
        }
        Update: {
          company_context?: Json
          company_name?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty_level?: string
          estimated_duration_minutes?: number | null
          id?: string
          initial_budget?: number
          is_active?: boolean
          learning_objectives?: string[] | null
          risk_objectives?: string[] | null
          target_actions?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_session_access: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_session_access_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_session_library: {
        Row: {
          collection_id: string
          created_at: string | null
          session_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string | null
          session_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_session_library_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "training_library_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_session_library_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_session_progress: {
        Row: {
          id: string
          score: Json | null
          session_id: string | null
          status: string | null
          time_spent_minutes: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          score?: Json | null
          session_id?: string | null
          status?: string | null
          time_spent_minutes?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          score?: Json | null
          session_id?: string | null
          status?: string | null
          time_spent_minutes?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_session_progress_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          ai_mode: string | null
          created_at: string | null
          default_params: Json | null
          goals: Json | null
          id: string
          is_published: boolean | null
          open_at: string | null
          program_id: string | null
          session_index: number | null
          slug: string | null
          summary: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_mode?: string | null
          created_at?: string | null
          default_params?: Json | null
          goals?: Json | null
          id?: string
          is_published?: boolean | null
          open_at?: string | null
          program_id?: string | null
          session_index?: number | null
          slug?: string | null
          summary?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_mode?: string | null
          created_at?: string | null
          default_params?: Json | null
          goals?: Json | null
          id?: string
          is_published?: boolean | null
          open_at?: string | null
          program_id?: string | null
          session_index?: number | null
          slug?: string | null
          summary?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_balance_mappings: {
        Row: {
          account_number: string
          client_id: string
          created_at: string
          id: string
          statement_line_number: string
          updated_at: string
        }
        Insert: {
          account_number: string
          client_id: string
          created_at?: string
          id?: string
          statement_line_number: string
          updated_at?: string
        }
        Update: {
          account_number?: string
          client_id?: string
          created_at?: string
          id?: string
          statement_line_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trial_balance_mappings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
          is_locked: boolean
          opening_balance: number | null
          period_end_date: string
          period_start_date: string
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
          is_locked?: boolean
          opening_balance?: number | null
          period_end_date: string
          period_start_date: string
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
          is_locked?: boolean
          opening_balance?: number | null
          period_end_date?: string
          period_start_date?: string
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
      user_custom_permissions: {
        Row: {
          expires_at: string | null
          granted_at: string
          granted_by: string | null
          id: string
          permission_id: string
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission_id: string
          user_id: string
        }
        Update: {
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_custom_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "custom_permissions"
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
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      variance_reports: {
        Row: {
          analysis_notes: string | null
          budget_id: string
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          report_period_end: string
          report_period_start: string
          report_type: string
          significant_variances: Json | null
          summary_data: Json
        }
        Insert: {
          analysis_notes?: string | null
          budget_id: string
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          report_period_end: string
          report_period_start: string
          report_type?: string
          significant_variances?: Json | null
          summary_data?: Json
        }
        Update: {
          analysis_notes?: string | null
          budget_id?: string
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          report_period_end?: string
          report_period_start?: string
          report_type?: string
          significant_variances?: Json | null
          summary_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "variance_reports_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      voucher_sequences: {
        Row: {
          client_id: string
          created_at: string
          id: string
          last_voucher_number: number
          month: number
          updated_at: string
          year: number
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          last_voucher_number?: number
          month: number
          updated_at?: string
          year: number
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          last_voucher_number?: number
          month?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      widget_templates: {
        Row: {
          audit_firm_id: string | null
          category: string | null
          created_at: string
          created_by: string | null
          default_config: Json
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          is_global: boolean
          name: string
          sort_order: number | null
          updated_at: string
          widget_type: string
        }
        Insert: {
          audit_firm_id?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          default_config?: Json
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_global?: boolean
          name: string
          sort_order?: number | null
          updated_at?: string
          widget_type: string
        }
        Update: {
          audit_firm_id?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          default_config?: Json
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_global?: boolean
          name?: string
          sort_order?: number | null
          updated_at?: string
          widget_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "widget_templates_audit_firm_id_fkey"
            columns: ["audit_firm_id"]
            isOneToOne: false
            referencedRelation: "audit_firms"
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
      current_portfolio_holdings: {
        Row: {
          acquisition_date: string | null
          average_cost_price: number | null
          client_id: string | null
          cost_basis: number | null
          cost_price_currency: string | null
          created_at: string | null
          current_price: number | null
          id: string | null
          is_active: boolean | null
          isin_code: string | null
          market_value: number | null
          portfolio_id: string | null
          portfolio_name: string | null
          price_date: string | null
          quantity: number | null
          return_percentage: number | null
          security_currency: string | null
          security_id: string | null
          security_name: string | null
          unrealized_gain_loss: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investment_holdings_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "investment_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_holdings_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolio_summaries"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "investment_holdings_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "investment_securities"
            referencedColumns: ["id"]
          },
        ]
      }
      latest_exchange_rates: {
        Row: {
          exchange_rate: number | null
          from_currency_code: string | null
          is_year_end: boolean | null
          rate_date: string | null
          source: string | null
          to_currency_code: string | null
        }
        Relationships: []
      }
      latest_security_prices: {
        Row: {
          closing_price: number | null
          currency_code: string | null
          is_year_end: boolean | null
          price_date: string | null
          security_id: string | null
          source: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historical_prices_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "investment_securities"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_summaries: {
        Row: {
          client_id: string | null
          created_at: string | null
          currency_code: string | null
          portfolio_id: string | null
          portfolio_name: string | null
          portfolio_type: string | null
          total_cost_basis: number | null
          total_holdings: number | null
          total_market_value: number | null
          total_return_percentage: number | null
          total_unrealized_gain_loss: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      year_end_exchange_rates: {
        Row: {
          exchange_rate: number | null
          from_currency_code: string | null
          rate_date: string | null
          source: string | null
          to_currency_code: string | null
          year: number | null
        }
        Insert: {
          exchange_rate?: number | null
          from_currency_code?: string | null
          rate_date?: string | null
          source?: string | null
          to_currency_code?: string | null
          year?: never
        }
        Update: {
          exchange_rate?: number | null
          from_currency_code?: string | null
          rate_date?: string | null
          source?: string | null
          to_currency_code?: string | null
          year?: never
        }
        Relationships: []
      }
      year_end_security_prices: {
        Row: {
          closing_price: number | null
          currency_code: string | null
          price_date: string | null
          security_id: string | null
          source: string | null
          year: number | null
        }
        Insert: {
          closing_price?: number | null
          currency_code?: string | null
          price_date?: string | null
          security_id?: string | null
          source?: string | null
          year?: never
        }
        Update: {
          closing_price?: number | null
          currency_code?: string | null
          price_date?: string | null
          security_id?: string | null
          source?: string | null
          year?: never
        }
        Relationships: [
          {
            foreignKeyName: "historical_prices_security_id_fkey"
            columns: ["security_id"]
            isOneToOne: false
            referencedRelation: "investment_securities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_firm_access_request: {
        Args: {
          p_assign_role?: Database["public"]["Enums"]["user_role_type"]
          p_request_id: string
        }
        Returns: boolean
      }
      approve_user: {
        Args: {
          assign_role?: Database["public"]["Enums"]["user_role_type"]
          user_id_to_approve: string
        }
        Returns: boolean
      }
      calculate_account_distribution: {
        Args: { p_client_id: string; p_version_id: string }
        Returns: {
          account_name: string
          account_number: string
          total_amount: number
          transaction_count: number
        }[]
      }
      calculate_ai_cost: {
        Args: {
          completion_tokens: number
          model_name: string
          prompt_tokens: number
        }
        Returns: number
      }
      calculate_amount_statistics: {
        Args: { p_client_id: string; p_version_id: string }
        Returns: Json
      }
      calculate_budget_totals: {
        Args: { p_budget_id: string }
        Returns: undefined
      }
      calculate_monthly_summary: {
        Args: { p_client_id: string; p_version_id: string }
        Returns: {
          month: string
          total_amount: number
          transaction_count: number
        }[]
      }
      calculate_straight_line_depreciation: {
        Args: {
          p_purchase_price: number
          p_salvage_value: number
          p_useful_life_years: number
        }
        Returns: number
      }
      cancel_my_firm_access_request: {
        Args: { p_request_id: string }
        Returns: boolean
      }
      claim_audit_firm_by_org: {
        Args: { p_firm_name?: string; p_org_number: string }
        Returns: string
      }
      cleanup_expired_ai_analysis_cache: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_financial_reports: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      convert_currency: {
        Args: {
          p_amount: number
          p_date?: string
          p_from_currency: string
          p_to_currency?: string
        }
        Returns: number
      }
      copy_global_mapping_rules_to_firm: {
        Args: { p_audit_firm_id: string }
        Returns: number
      }
      copy_global_standards_to_firm: {
        Args: { p_audit_firm_id: string }
        Returns: number
      }
      find_duplicate_transactions: {
        Args: { p_client_id: string; p_version_id: string }
        Returns: {
          account_number: string
          amount: number
          description: string
          duplicate_key: string
          transaction_count: number
          transaction_date: string
          transaction_ids: string[]
        }[]
      }
      find_time_logic_issues: {
        Args: { p_client_id: string; p_version_id: string }
        Returns: {
          issue_description: string
          issue_type: string
          transaction_date: string
          transaction_id: string
          voucher_number: string
        }[]
      }
      fix_norwegian_encoding_safe: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      generate_balance_sheet: {
        Args: { p_as_of_date: string; p_client_id: string }
        Returns: Json
      }
      generate_certificate_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_client_financial_report: {
        Args: {
          p_client_id: string
          p_parameters?: Json
          p_period_end: string
          p_period_start: string
          p_template_id: string
        }
        Returns: string
      }
      generate_depreciation_schedule: {
        Args: { p_asset_id: string }
        Returns: number
      }
      generate_income_statement: {
        Args: {
          p_client_id: string
          p_period_end: string
          p_period_start: string
        }
        Returns: Json
      }
      get_asset_summary: {
        Args: { p_client_id: string }
        Returns: Json
      }
      get_basic_transaction_info: {
        Args: { p_client_id: string; p_version_id: string }
        Returns: Json
      }
      get_budget_summary: {
        Args: { p_budget_year: number; p_client_id: string }
        Returns: Json
      }
      get_exchange_rate: {
        Args: {
          p_date?: string
          p_from_currency: string
          p_to_currency?: string
        }
        Returns: number
      }
      get_next_version_number: {
        Args: { p_client_id: string }
        Returns: number
      }
      get_next_voucher_number: {
        Args: { p_client_id: string; p_month: number; p_year: number }
        Returns: string
      }
      get_pending_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          workplace_company_name: string
        }[]
      }
      get_potential_clients_summary: {
        Args: { p_auditor_org_number: string }
        Returns: {
          converted: number
          lost: number
          new_this_week: number
          total_potential: number
        }[]
      }
      get_reports_summary: {
        Args: { p_client_id: string }
        Returns: Json
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
      is_super_admin: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_description?: string
          p_event_type: string
          p_metadata?: Json
          p_severity?: string
        }
        Returns: undefined
      }
      match_knowledge_articles: {
        Args: {
          p_match_count: number
          p_match_threshold: number
          p_query_embedding: string
        }
        Returns: {
          author_id: string
          category: Json
          category_id: string
          content: string
          created_at: string
          id: string
          published_at: string
          reference_code: string
          similarity: number
          slug: string
          status: Database["public"]["Enums"]["article_status"]
          summary: string
          title: string
          updated_at: string
          valid_from: string
          valid_until: string
          view_count: number
        }[]
      }
      process_existing_completed_documents: {
        Args: Record<PropertyKey, never>
        Returns: {
          document_id: string
          error_message: string
          file_name: string
          triggered: boolean
        }[]
      }
      queue_articles_for_embedding: {
        Args: Record<PropertyKey, never>
        Returns: {
          content: string
          id: string
          title: string
        }[]
      }
      reject_firm_access_request: {
        Args: { p_request_id: string }
        Returns: boolean
      }
      reject_user: {
        Args: { rejection_reason?: string; user_id_to_reject: string }
        Returns: boolean
      }
      request_firm_access: {
        Args: {
          p_audit_firm_id: string
          p_email?: string
          p_message?: string
          p_role_requested?: Database["public"]["Enums"]["user_role_type"]
        }
        Returns: string
      }
      secure_update_user_role: {
        Args: { p_new_role: string; p_user_id: string }
        Returns: boolean
      }
      set_active_version: {
        Args: { p_version_id: string }
        Returns: undefined
      }
      sync_budget_actuals: {
        Args: { p_budget_id: string; p_month: number; p_year: number }
        Returns: number
      }
      toggle_trial_balance_lock: {
        Args: {
          p_client_id: string
          p_is_locked: boolean
          p_period_year: number
        }
        Returns: boolean
      }
      update_checklist_completion: {
        Args: { p_checklist_id: string }
        Returns: undefined
      }
      user_owns_client: {
        Args: { client_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      access_request_status: "pending" | "approved" | "rejected" | "cancelled"
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
      employee_status_type:
        | "pre_registered"
        | "active"
        | "inactive"
        | "student"
        | "test"
      engagement_type: "revisjon" | "regnskap" | "annet"
      payroll_aga_type: "loenn" | "pensjon" | "fradragSone"
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
      review_status_type: "pending" | "ok" | "deviation" | "follow_up"
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
      access_request_status: ["pending", "approved", "rejected", "cancelled"],
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
      employee_status_type: [
        "pre_registered",
        "active",
        "inactive",
        "student",
        "test",
      ],
      engagement_type: ["revisjon", "regnskap", "annet"],
      payroll_aga_type: ["loenn", "pensjon", "fradragSone"],
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
      review_status_type: ["pending", "ok", "deviation", "follow_up"],
      risk_level: ["low", "medium", "high"],
      user_role_type: ["admin", "partner", "manager", "employee"],
    },
  },
} as const
