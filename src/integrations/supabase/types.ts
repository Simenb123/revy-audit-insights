export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
          subject_area: Database["public"]["Enums"]["audit_subject_area"]
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
          subject_area: Database["public"]["Enums"]["audit_subject_area"]
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
          subject_area?: Database["public"]["Enums"]["audit_subject_area"]
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
        ]
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
            foreignKeyName: "client_audit_actions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "audit_action_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      client_chart_of_accounts: {
        Row: {
          account_name: string
          account_number: string
          account_type: string
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
          account_type: string
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
          account_type?: string
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
          ai_suggested_category: string | null
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
          ai_suggested_category?: string | null
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
          ai_suggested_category?: string | null
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
      client_roles: {
        Row: {
          client_id: string | null
          from_date: string | null
          id: string
          name: string | null
          role_type: string | null
          to_date: string | null
        }
        Insert: {
          client_id?: string | null
          from_date?: string | null
          id?: string
          name?: string | null
          role_type?: string | null
          to_date?: string | null
        }
        Update: {
          client_id?: string | null
          from_date?: string | null
          id?: string
          name?: string | null
          role_type?: string | null
          to_date?: string | null
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
          bank_account: string | null
          board_meetings_per_year: number | null
          ceo: string | null
          chair: string | null
          city: string | null
          company_name: string
          contact_person: string | null
          created_at: string
          department: string | null
          department_id: string | null
          email: string | null
          equity_capital: number | null
          homepage: string | null
          id: string
          industry: string | null
          internal_controls: string | null
          is_test_data: boolean | null
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
          bank_account?: string | null
          board_meetings_per_year?: number | null
          ceo?: string | null
          chair?: string | null
          city?: string | null
          company_name: string
          contact_person?: string | null
          created_at?: string
          department?: string | null
          department_id?: string | null
          email?: string | null
          equity_capital?: number | null
          homepage?: string | null
          id?: string
          industry?: string | null
          internal_controls?: string | null
          is_test_data?: boolean | null
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
          bank_account?: string | null
          board_meetings_per_year?: number | null
          ceo?: string | null
          chair?: string | null
          city?: string | null
          company_name?: string
          contact_person?: string | null
          created_at?: string
          department?: string | null
          department_id?: string | null
          email?: string | null
          equity_capital?: number | null
          homepage?: string | null
          id?: string
          industry?: string | null
          internal_controls?: string | null
          is_test_data?: boolean | null
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
      knowledge_articles: {
        Row: {
          author_id: string
          category_id: string
          content: string
          content_type: string | null
          content_type_id: string | null
          created_at: string
          embedding: string | null
          id: string
          published_at: string | null
          reference_code: string | null
          slug: string
          status: Database["public"]["Enums"]["article_status"]
          summary: string | null
          tags: string[] | null
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
          content_type?: string | null
          content_type_id?: string | null
          created_at?: string
          embedding?: string | null
          id?: string
          published_at?: string | null
          reference_code?: string | null
          slug: string
          status?: Database["public"]["Enums"]["article_status"]
          summary?: string | null
          tags?: string[] | null
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
          content_type?: string | null
          content_type_id?: string | null
          created_at?: string
          embedding?: string | null
          id?: string
          published_at?: string | null
          reference_code?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["article_status"]
          summary?: string | null
          tags?: string[] | null
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
      standard_accounts: {
        Row: {
          account_type: string
          analysis_group: string | null
          category: string | null
          created_at: string
          id: string
          standard_name: string
          standard_number: string
        }
        Insert: {
          account_type: string
          analysis_group?: string | null
          category?: string | null
          created_at?: string
          id?: string
          standard_name: string
          standard_number: string
        }
        Update: {
          account_type?: string
          analysis_group?: string | null
          category?: string | null
          created_at?: string
          id?: string
          standard_name?: string
          standard_number?: string
        }
        Relationships: []
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
          tags: string[]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
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
