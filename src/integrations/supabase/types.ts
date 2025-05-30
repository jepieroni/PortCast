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
      account_setup_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          first_name: string
          id: string
          last_name: string
          organization_id: string | null
          organization_name: string | null
          token: string
          token_type: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          first_name: string
          id?: string
          last_name: string
          organization_id?: string | null
          organization_name?: string | null
          token?: string
          token_type: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          first_name?: string
          id?: string
          last_name?: string
          organization_id?: string | null
          organization_name?: string | null
          token?: string
          token_type?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_setup_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      organization_requests: {
        Row: {
          approval_token: string
          city: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          organization_name: string
          reviewed_at: string | null
          reviewed_by: string | null
          state: string | null
          status: Database["public"]["Enums"]["user_request_status"]
          updated_at: string
        }
        Insert: {
          approval_token?: string
          city?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          organization_name: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["user_request_status"]
          updated_at?: string
        }
        Update: {
          approval_token?: string
          city?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          organization_name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["user_request_status"]
          updated_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          city: string | null
          created_at: string | null
          id: string
          name: string
          state: string | null
          trusted_agent_email: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          id?: string
          name: string
          state?: string | null
          trusted_agent_email?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          id?: string
          name?: string
          state?: string | null
          trusted_agent_email?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ports: {
        Row: {
          code: string
          country_id: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          country_id?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          country_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ports_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          organization_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          organization_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          organization_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          created_at: string | null
          destination_country_id: string | null
          estimated_cube: number | null
          estimated_pieces: number | null
          gbl_number: string
          id: string
          origin_country_id: string | null
          origin_location: string | null
          pickup_date: string
          rdd: string
          remaining_cube: number | null
          remaining_pieces: number | null
          shipment_type: Database["public"]["Enums"]["shipment_type"]
          shipper_last_name: string
          target_pod_id: string | null
          target_poe_id: string | null
          total_cube: number | null
          total_pieces: number | null
          tsp_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          destination_country_id?: string | null
          estimated_cube?: number | null
          estimated_pieces?: number | null
          gbl_number: string
          id?: string
          origin_country_id?: string | null
          origin_location?: string | null
          pickup_date: string
          rdd: string
          remaining_cube?: number | null
          remaining_pieces?: number | null
          shipment_type: Database["public"]["Enums"]["shipment_type"]
          shipper_last_name: string
          target_pod_id?: string | null
          target_poe_id?: string | null
          total_cube?: number | null
          total_pieces?: number | null
          tsp_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          destination_country_id?: string | null
          estimated_cube?: number | null
          estimated_pieces?: number | null
          gbl_number?: string
          id?: string
          origin_country_id?: string | null
          origin_location?: string | null
          pickup_date?: string
          rdd?: string
          remaining_cube?: number | null
          remaining_pieces?: number | null
          shipment_type?: Database["public"]["Enums"]["shipment_type"]
          shipper_last_name?: string
          target_pod_id?: string | null
          target_poe_id?: string | null
          total_cube?: number | null
          total_pieces?: number | null
          tsp_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_destination_country_id_fkey"
            columns: ["destination_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_origin_country_id_fkey"
            columns: ["origin_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_target_pod_id_fkey"
            columns: ["target_pod_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_target_poe_id_fkey"
            columns: ["target_poe_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_tsp_id_fkey"
            columns: ["tsp_id"]
            isOneToOne: false
            referencedRelation: "tsps"
            referencedColumns: ["id"]
          },
        ]
      }
      tsps: {
        Row: {
          created_at: string | null
          id: string
          name: string
          organization_id: string
          scac_code: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          organization_id: string
          scac_code: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          organization_id?: string
          scac_code?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tsps_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_requests: {
        Row: {
          approval_token: string
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          organization_id: string
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["user_request_status"]
          updated_at: string
        }
        Insert: {
          approval_token?: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          organization_id: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["user_request_status"]
          updated_at?: string
        }
        Update: {
          approval_token?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          organization_id?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["user_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          organization_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_user_request: {
        Args: { _approval_token: string; _approve: boolean }
        Returns: Json
      }
      cleanup_user_completely: {
        Args: { _user_id: string }
        Returns: Json
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_users_for_cleanup: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      has_role: {
        Args: {
          user_id: string
          check_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      is_global_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      validate_and_consume_setup_token: {
        Args: { _token: string }
        Returns: Json
      }
    }
    Enums: {
      shipment_type: "inbound" | "outbound" | "intertheater"
      user_request_status: "pending" | "approved" | "denied"
      user_role: "global_admin" | "org_admin" | "user"
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
      shipment_type: ["inbound", "outbound", "intertheater"],
      user_request_status: ["pending", "approved", "denied"],
      user_role: ["global_admin", "org_admin", "user"],
    },
  },
} as const
