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
          action_type: Database["public"]["Enums"]["audit_log_action"]
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
          action_type: Database["public"]["Enums"]["audit_log_action"]
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
          action_type?: Database["public"]["Enums"]["audit_log_action"]
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
          created_at: string
          id: string
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["article_status"]
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author_id: string
          category_id: string
          content: string
          created_at?: string
          id?: string
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["article_status"]
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_id?: string
          category_id?: string
          content?: string
          created_at?: string
          id?: string
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["article_status"]
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
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
        ]
      }
      knowledge_categories: {
        Row: {
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
      risk_level: ["low", "medium", "high"],
      user_role_type: ["admin", "partner", "manager", "employee"],
    },
  },
} as const
