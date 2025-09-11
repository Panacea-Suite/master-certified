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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor: string
          at: string
          id: number
          meta: Json
          object_id: string
          object_type: string
        }
        Insert: {
          action: string
          actor: string
          at?: string
          id?: number
          meta?: Json
          object_id: string
          object_type: string
        }
        Update: {
          action?: string
          actor?: string
          at?: string
          id?: number
          meta?: Json
          object_id?: string
          object_type?: string
        }
        Relationships: []
      }
      batches: {
        Row: {
          campaign_id: string
          created_at: string
          generated_at: string | null
          id: string
          is_test: boolean
          name: string
          qr_code_count: number
          status: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          generated_at?: string | null
          id?: string
          is_test?: boolean
          name: string
          qr_code_count?: number
          status?: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          generated_at?: string | null
          id?: string
          is_test?: boolean
          name?: string
          qr_code_count?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "batches_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_users: {
        Row: {
          brand_id: string
          created_at: string
          created_via: Database["public"]["Enums"]["auth_provider"]
          first_seen_at: string
          id: string
          is_test: boolean
          last_seen_at: string
          marketing_opt_in: boolean
          source_campaign_id: string | null
          updated_at: string
          user_email: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          created_via?: Database["public"]["Enums"]["auth_provider"]
          first_seen_at?: string
          id?: string
          is_test?: boolean
          last_seen_at?: string
          marketing_opt_in?: boolean
          source_campaign_id?: string | null
          updated_at?: string
          user_email?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          created_via?: Database["public"]["Enums"]["auth_provider"]
          first_seen_at?: string
          id?: string
          is_test?: boolean
          last_seen_at?: string
          marketing_opt_in?: boolean
          source_campaign_id?: string | null
          updated_at?: string
          user_email?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          approved_stores: string[] | null
          brand_colors: Json | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_stores?: string[] | null
          brand_colors?: Json | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_stores?: string[] | null
          brand_colors?: Json | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          approved_stores: string[] | null
          brand_id: string
          created_at: string
          customer_access_token: string
          description: string | null
          final_redirect_url: string | null
          flow_settings: Json | null
          id: string
          is_test: boolean
          locked_design_tokens: Json | null
          locked_template: Json | null
          name: string
          template_id: string | null
          template_version: number | null
          updated_at: string
        }
        Insert: {
          approved_stores?: string[] | null
          brand_id: string
          created_at?: string
          customer_access_token: string
          description?: string | null
          final_redirect_url?: string | null
          flow_settings?: Json | null
          id?: string
          is_test?: boolean
          locked_design_tokens?: Json | null
          locked_template?: Json | null
          name: string
          template_id?: string | null
          template_version?: number | null
          updated_at?: string
        }
        Update: {
          approved_stores?: string[] | null
          brand_id?: string
          created_at?: string
          customer_access_token?: string
          description?: string | null
          final_redirect_url?: string | null
          flow_settings?: Json | null
          id?: string
          is_test?: boolean
          locked_design_tokens?: Json | null
          locked_template?: Json | null
          name?: string
          template_id?: string | null
          template_version?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      design_templates: {
        Row: {
          category: string
          config: Json
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          category: string
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      flow_content: {
        Row: {
          content: Json
          content_type: string
          created_at: string
          file_url: string | null
          flow_id: string
          id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          content: Json
          content_type: string
          created_at?: string
          file_url?: string | null
          flow_id: string
          id?: string
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          content_type?: string
          created_at?: string
          file_url?: string | null
          flow_id?: string
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flow_content_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_content_versions: {
        Row: {
          content: Json
          content_type: string
          created_at: string
          file_url: string | null
          flow_id: string
          id: string
          order_index: number
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          content?: Json
          content_type: string
          created_at?: string
          file_url?: string | null
          flow_id: string
          id?: string
          order_index?: number
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          content?: Json
          content_type?: string
          created_at?: string
          file_url?: string | null
          flow_id?: string
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      flow_sessions: {
        Row: {
          brand_id: string
          campaign_id: string
          created_by_admin: string | null
          id: string
          is_test: boolean
          qr_id: string
          started_at: string
          status: Database["public"]["Enums"]["flow_session_status"]
          store_meta: Json | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          brand_id: string
          campaign_id: string
          created_by_admin?: string | null
          id?: string
          is_test?: boolean
          qr_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["flow_session_status"]
          store_meta?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          brand_id?: string
          campaign_id?: string
          created_by_admin?: string | null
          id?: string
          is_test?: boolean
          qr_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["flow_session_status"]
          store_meta?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      flows: {
        Row: {
          base_url: string | null
          campaign_id: string | null
          created_at: string
          created_by: string | null
          design_template_id: string | null
          flow_config: Json | null
          id: string
          is_system_template: boolean | null
          is_template: boolean | null
          latest_published_version: number | null
          name: string
          published_snapshot: Json | null
          template_category: string | null
          template_description: string | null
          template_preview_image: string | null
          template_tags: string[] | null
          updated_at: string
        }
        Insert: {
          base_url?: string | null
          campaign_id?: string | null
          created_at?: string
          created_by?: string | null
          design_template_id?: string | null
          flow_config?: Json | null
          id?: string
          is_system_template?: boolean | null
          is_template?: boolean | null
          latest_published_version?: number | null
          name: string
          published_snapshot?: Json | null
          template_category?: string | null
          template_description?: string | null
          template_preview_image?: string | null
          template_tags?: string[] | null
          updated_at?: string
        }
        Update: {
          base_url?: string | null
          campaign_id?: string | null
          created_at?: string
          created_by?: string | null
          design_template_id?: string | null
          flow_config?: Json | null
          id?: string
          is_system_template?: boolean | null
          is_template?: boolean | null
          latest_published_version?: number | null
          name?: string
          published_snapshot?: Json | null
          template_category?: string | null
          template_description?: string | null
          template_preview_image?: string | null
          template_tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flows_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flows_design_template_id_fkey"
            columns: ["design_template_id"]
            isOneToOne: false
            referencedRelation: "design_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          brand_colors: Json | null
          brand_logo_url: string | null
          company_name: string | null
          created_at: string
          display_name: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_colors?: Json | null
          brand_logo_url?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_colors?: Json | null
          brand_logo_url?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      qr_codes: {
        Row: {
          batch_id: string
          created_at: string
          flow_id: string | null
          id: string
          is_test: boolean
          qr_url: string
          scans: number
          unique_code: string
          unique_flow_url: string | null
          updated_at: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          flow_id?: string | null
          id?: string
          is_test?: boolean
          qr_url: string
          scans?: number
          unique_code: string
          unique_flow_url?: string | null
          updated_at?: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          flow_id?: string | null
          id?: string
          is_test?: boolean
          qr_url?: string
          scans?: number
          unique_code?: string
          unique_flow_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      team_users: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          joined_at: string | null
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: Database["public"]["Enums"]["team_role"]
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: Database["public"]["Enums"]["team_role"]
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_users_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          brand_id: string
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          base_template_id: string | null
          brand_id: string | null
          content: Json
          created_at: string
          created_by: string
          description: string | null
          id: string
          kind: Database["public"]["Enums"]["template_kind"]
          name: string
          schema: Json
          status: Database["public"]["Enums"]["template_status"]
          updated_at: string
          version: number
        }
        Insert: {
          base_template_id?: string | null
          brand_id?: string | null
          content: Json
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          kind: Database["public"]["Enums"]["template_kind"]
          name: string
          schema: Json
          status?: Database["public"]["Enums"]["template_status"]
          updated_at?: string
          version?: number
        }
        Update: {
          base_template_id?: string | null
          brand_id?: string | null
          content?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["template_kind"]
          name?: string
          schema?: Json
          status?: Database["public"]["Enums"]["template_status"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "templates_base_template_id_fkey"
            columns: ["base_template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invites: {
        Row: {
          accepted_at: string | null
          brand_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invite_token: string
          invited_by: string
          role: string
          team_id: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          brand_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invite_token?: string
          invited_by: string
          role?: string
          team_id: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          brand_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invite_token?: string
          invited_by?: string
          role?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invites_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invites_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      verifications: {
        Row: {
          batch_id: string | null
          batch_info: Json | null
          created_at: string
          expiry_ok: boolean | null
          flow_session_id: string
          id: string
          is_test: boolean
          qr_id: string
          reasons: string[] | null
          result: Database["public"]["Enums"]["verification_result"]
          store_ok: boolean | null
        }
        Insert: {
          batch_id?: string | null
          batch_info?: Json | null
          created_at?: string
          expiry_ok?: boolean | null
          flow_session_id: string
          id?: string
          is_test?: boolean
          qr_id: string
          reasons?: string[] | null
          result: Database["public"]["Enums"]["verification_result"]
          store_ok?: boolean | null
        }
        Update: {
          batch_id?: string | null
          batch_info?: Json | null
          created_at?: string
          expiry_ok?: boolean | null
          flow_session_id?: string
          id?: string
          is_test?: boolean
          qr_id?: string
          reasons?: string[] | null
          result?: Database["public"]["Enums"]["verification_result"]
          store_ok?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "verifications_flow_session_id_fkey"
            columns: ["flow_session_id"]
            isOneToOne: false
            referencedRelation: "flow_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      role_constants: {
        Row: {
          brand_admin: string | null
          customer: string | null
          master_admin: string | null
          team_admin: string | null
          team_member: string | null
          team_viewer: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_get_all_brands: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_display_name: string
          user_email: string
          user_id: string
        }[]
      }
      admin_publish_system_template: {
        Args: { tpl_id: string }
        Returns: Json
      }
      apply_flow_template_to_campaign: {
        Args: {
          p_campaign_id: string
          p_created_by?: string
          p_flow_name: string
          p_template_id: string
        }
        Returns: Json
      }
      brand_fork_system_template: {
        Args: { system_tpl_id: string; target_brand_id: string }
        Returns: Json
      }
      can_access_resource: {
        Args: {
          p_action?: string
          p_resource_id: string
          p_resource_type: string
          p_user_id: string
        }
        Returns: boolean
      }
      cleanup_ephemeral_campaigns: {
        Args: { days_old?: number }
        Returns: Json
      }
      create_campaign_from_template: {
        Args: {
          p_brand_id: string
          p_campaign_name: string
          p_template_id: string
          p_template_version?: number
        }
        Returns: Json
      }
      create_ephemeral_campaign_from_template: {
        Args: { p_created_by: string; p_template_id: string }
        Returns: Json
      }
      create_flow_with_campaign: {
        Args: {
          p_brand_id: string
          p_campaign_name?: string
          p_flow_config?: Json
          p_flow_name: string
        }
        Returns: {
          base_url: string
          campaign_id: string
          flow_id: string
          flow_name: string
        }[]
      }
      gen_compact_uuid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      gen_hex_token: {
        Args: { p_bytes?: number }
        Returns: string
      }
      get_effective_role: {
        Args: { p_brand_id?: string; p_user_id: string }
        Returns: Json
      }
      get_flow_session: {
        Args: { p_session_id: string }
        Returns: Json
      }
      get_user_flows: {
        Args: { p_user_id?: string }
        Returns: {
          base_url: string
          brand_id: string
          brand_name: string
          campaign_id: string
          campaign_name: string
          created_at: string
          created_by: string
          flow_config: Json
          id: string
          is_template: boolean
          name: string
          template_category: string
          updated_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      link_user_to_flow: {
        Args:
          | {
              p_created_via?: Database["public"]["Enums"]["auth_provider"]
              p_is_test?: boolean
              p_marketing_opt_in?: boolean
              p_session_id: string
              p_user_id: string
            }
          | {
              p_created_via?: Database["public"]["Enums"]["auth_provider"]
              p_marketing_opt_in?: boolean
              p_session_id: string
              p_user_id: string
            }
        Returns: Json
      }
      owns_flow: {
        Args: { _flow_id: string }
        Returns: boolean
      }
      publish_flow_version: {
        Args: {
          p_design_tokens?: Json
          p_flow_id: string
          p_flow_snapshot: Json
        }
        Returns: Json
      }
      run_verification: {
        Args: { p_session_id: string }
        Returns: Json
      }
      snapshot_flow: {
        Args: { p_flow_id: string }
        Returns: {
          flow_id: string
          new_version: number
          published_at: string
        }[]
      }
      start_flow_session: {
        Args:
          | { p_campaign_id?: string; p_is_test?: boolean; p_qr_id?: string }
          | { p_qr_id: string }
        Returns: Json
      }
      update_flow_store: {
        Args: { p_session_id: string; p_store_meta: Json }
        Returns: Json
      }
      validate_campaign_token: {
        Args: { p_campaign_id: string; p_token: string }
        Returns: boolean
      }
    }
    Enums: {
      auth_provider: "google" | "apple" | "email"
      flow_session_status: "active" | "completed" | "failed"
      page_type:
        | "landing"
        | "store_selection"
        | "account_creation"
        | "authentication"
        | "content_display"
        | "thank_you"
      team_role: "admin" | "member" | "viewer"
      template_kind: "system" | "brand"
      template_status: "draft" | "published" | "deprecated"
      user_role: "master_admin" | "brand_admin" | "customer"
      verification_result: "pass" | "warn" | "fail"
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
      auth_provider: ["google", "apple", "email"],
      flow_session_status: ["active", "completed", "failed"],
      page_type: [
        "landing",
        "store_selection",
        "account_creation",
        "authentication",
        "content_display",
        "thank_you",
      ],
      team_role: ["admin", "member", "viewer"],
      template_kind: ["system", "brand"],
      template_status: ["draft", "published", "deprecated"],
      user_role: ["master_admin", "brand_admin", "customer"],
      verification_result: ["pass", "warn", "fail"],
    },
  },
} as const
