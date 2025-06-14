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
      custom_consolidation_memberships: {
        Row: {
          created_at: string
          custom_consolidation_id: string
          id: string
          shipment_id: string
        }
        Insert: {
          created_at?: string
          custom_consolidation_id: string
          id?: string
          shipment_id: string
        }
        Update: {
          created_at?: string
          custom_consolidation_id?: string
          id?: string
          shipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_consolidation_memberships_custom_consolidation_id_fkey"
            columns: ["custom_consolidation_id"]
            isOneToOne: false
            referencedRelation: "custom_consolidations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_consolidation_memberships_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_consolidations: {
        Row: {
          consolidation_type: Database["public"]["Enums"]["shipment_type"]
          created_at: string
          created_by: string | null
          destination_port_id: string | null
          destination_region_id: string | null
          id: string
          organization_id: string
          origin_port_id: string | null
          origin_region_id: string | null
          updated_at: string
        }
        Insert: {
          consolidation_type: Database["public"]["Enums"]["shipment_type"]
          created_at?: string
          created_by?: string | null
          destination_port_id?: string | null
          destination_region_id?: string | null
          id?: string
          organization_id: string
          origin_port_id?: string | null
          origin_region_id?: string | null
          updated_at?: string
        }
        Update: {
          consolidation_type?: Database["public"]["Enums"]["shipment_type"]
          created_at?: string
          created_by?: string | null
          destination_port_id?: string | null
          destination_region_id?: string | null
          id?: string
          organization_id?: string
          origin_port_id?: string | null
          origin_region_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_consolidations_destination_port_id_fkey"
            columns: ["destination_port_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_consolidations_destination_region_id_fkey"
            columns: ["destination_region_id"]
            isOneToOne: false
            referencedRelation: "port_regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_consolidations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_consolidations_origin_port_id_fkey"
            columns: ["origin_port_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_consolidations_origin_region_id_fkey"
            columns: ["origin_region_id"]
            isOneToOne: false
            referencedRelation: "port_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      debug_logs: {
        Row: {
          component: string
          created_at: string
          function_name: string | null
          id: string
          level: string
          message: string
          metadata: Json | null
          session_id: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          component: string
          created_at?: string
          function_name?: string | null
          id?: string
          level?: string
          message: string
          metadata?: Json | null
          session_id: string
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          component?: string
          created_at?: string
          function_name?: string | null
          id?: string
          level?: string
          message?: string
          metadata?: Json | null
          session_id?: string
          timestamp?: string
          user_id?: string | null
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
          state: Database["public"]["Enums"]["us_state_code"] | null
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
          state?: Database["public"]["Enums"]["us_state_code"] | null
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
          state?: Database["public"]["Enums"]["us_state_code"] | null
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
          state: Database["public"]["Enums"]["us_state_code"] | null
          trusted_agent_email: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          id?: string
          name: string
          state?: Database["public"]["Enums"]["us_state_code"] | null
          trusted_agent_email?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          id?: string
          name?: string
          state?: Database["public"]["Enums"]["us_state_code"] | null
          trusted_agent_email?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      port_code_translations: {
        Row: {
          created_at: string
          external_port_code: string
          id: string
          organization_id: string
          port_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_port_code: string
          id?: string
          organization_id: string
          port_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_port_code?: string
          id?: string
          organization_id?: string
          port_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "port_code_translations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "port_code_translations_port_id_fkey"
            columns: ["port_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
        ]
      }
      port_region_memberships: {
        Row: {
          created_at: string
          id: string
          port_id: string
          region_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          port_id: string
          region_id: string
        }
        Update: {
          created_at?: string
          id?: string
          port_id?: string
          region_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "port_region_memberships_port_id_fkey"
            columns: ["port_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "port_region_memberships_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "port_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      port_regions: {
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
      ports: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          rate_area_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          rate_area_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          rate_area_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ports_rate_area_id_fkey"
            columns: ["rate_area_id"]
            isOneToOne: false
            referencedRelation: "rate_areas"
            referencedColumns: ["rate_area"]
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
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          organization_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          organization_id?: string | null
          status?: string | null
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
      rate_area_region_memberships: {
        Row: {
          created_at: string
          id: string
          rate_area_id: string
          region_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rate_area_id: string
          region_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rate_area_id?: string
          region_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_rate_area"
            columns: ["rate_area_id"]
            isOneToOne: false
            referencedRelation: "rate_areas"
            referencedColumns: ["rate_area"]
          },
          {
            foreignKeyName: "fk_region"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "port_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_area_translations: {
        Row: {
          created_at: string
          external_rate_area_code: string
          id: string
          organization_id: string
          rate_area_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_rate_area_code: string
          id?: string
          organization_id: string
          rate_area_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_rate_area_code?: string
          id?: string
          organization_id?: string
          rate_area_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_area_translations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_areas: {
        Row: {
          country_id: string
          created_at: string | null
          id: string
          is_conus: boolean
          is_intertheater_only: boolean
          name: string | null
          rate_area: string
          updated_at: string | null
          use_for_sample_data: boolean
        }
        Insert: {
          country_id: string
          created_at?: string | null
          id?: string
          is_conus?: boolean
          is_intertheater_only?: boolean
          name?: string | null
          rate_area: string
          updated_at?: string | null
          use_for_sample_data?: boolean
        }
        Update: {
          country_id?: string
          created_at?: string | null
          id?: string
          is_conus?: boolean
          is_intertheater_only?: boolean
          name?: string | null
          rate_area?: string
          updated_at?: string | null
          use_for_sample_data?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "rate_areas_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      scac_claims: {
        Row: {
          approval_token: string
          created_at: string
          id: string
          organization_id: string
          requested_at: string
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["scac_claim_status"]
          tsp_ids: string[]
          updated_at: string
        }
        Insert: {
          approval_token?: string
          created_at?: string
          id?: string
          organization_id: string
          requested_at?: string
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["scac_claim_status"]
          tsp_ids: string[]
          updated_at?: string
        }
        Update: {
          approval_token?: string
          created_at?: string
          id?: string
          organization_id?: string
          requested_at?: string
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["scac_claim_status"]
          tsp_ids?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scac_claims_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_uploads_staging: {
        Row: {
          actual_cube: string | null
          approved_warnings: Json | null
          created_at: string
          destination_rate_area: string | null
          estimated_cube: string | null
          gbl_number: string | null
          id: string
          organization_id: string | null
          origin_rate_area: string | null
          pickup_date: string | null
          raw_actual_cube: string | null
          raw_destination_rate_area: string | null
          raw_estimated_cube: string | null
          raw_gbl_number: string | null
          raw_origin_rate_area: string | null
          raw_pickup_date: string | null
          raw_pod_code: string | null
          raw_poe_code: string | null
          raw_rdd: string | null
          raw_scac_code: string | null
          raw_shipment_type: string | null
          raw_shipper_last_name: string | null
          rdd: string | null
          remaining_cube: string | null
          shipment_type: string | null
          shipper_last_name: string | null
          target_pod_id: string | null
          target_poe_id: string | null
          tsp_id: string | null
          updated_at: string
          upload_session_id: string | null
          user_id: string | null
          validation_errors: Json | null
          validation_status: string | null
          validation_warnings: Json | null
        }
        Insert: {
          actual_cube?: string | null
          approved_warnings?: Json | null
          created_at?: string
          destination_rate_area?: string | null
          estimated_cube?: string | null
          gbl_number?: string | null
          id?: string
          organization_id?: string | null
          origin_rate_area?: string | null
          pickup_date?: string | null
          raw_actual_cube?: string | null
          raw_destination_rate_area?: string | null
          raw_estimated_cube?: string | null
          raw_gbl_number?: string | null
          raw_origin_rate_area?: string | null
          raw_pickup_date?: string | null
          raw_pod_code?: string | null
          raw_poe_code?: string | null
          raw_rdd?: string | null
          raw_scac_code?: string | null
          raw_shipment_type?: string | null
          raw_shipper_last_name?: string | null
          rdd?: string | null
          remaining_cube?: string | null
          shipment_type?: string | null
          shipper_last_name?: string | null
          target_pod_id?: string | null
          target_poe_id?: string | null
          tsp_id?: string | null
          updated_at?: string
          upload_session_id?: string | null
          user_id?: string | null
          validation_errors?: Json | null
          validation_status?: string | null
          validation_warnings?: Json | null
        }
        Update: {
          actual_cube?: string | null
          approved_warnings?: Json | null
          created_at?: string
          destination_rate_area?: string | null
          estimated_cube?: string | null
          gbl_number?: string | null
          id?: string
          organization_id?: string | null
          origin_rate_area?: string | null
          pickup_date?: string | null
          raw_actual_cube?: string | null
          raw_destination_rate_area?: string | null
          raw_estimated_cube?: string | null
          raw_gbl_number?: string | null
          raw_origin_rate_area?: string | null
          raw_pickup_date?: string | null
          raw_pod_code?: string | null
          raw_poe_code?: string | null
          raw_rdd?: string | null
          raw_scac_code?: string | null
          raw_shipment_type?: string | null
          raw_shipper_last_name?: string | null
          rdd?: string | null
          remaining_cube?: string | null
          shipment_type?: string | null
          shipper_last_name?: string | null
          target_pod_id?: string | null
          target_poe_id?: string | null
          tsp_id?: string | null
          updated_at?: string
          upload_session_id?: string | null
          user_id?: string | null
          validation_errors?: Json | null
          validation_status?: string | null
          validation_warnings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "shipment_uploads_staging_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          actual_cube: number | null
          created_at: string | null
          destination_rate_area: string
          estimated_cube: number | null
          gbl_number: string
          id: string
          origin_rate_area: string
          pickup_date: string
          rdd: string
          remaining_cube: number | null
          shipment_type: Database["public"]["Enums"]["shipment_type"]
          shipper_last_name: string
          target_pod_id: string
          target_poe_id: string
          tsp_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_cube?: number | null
          created_at?: string | null
          destination_rate_area: string
          estimated_cube?: number | null
          gbl_number: string
          id?: string
          origin_rate_area: string
          pickup_date: string
          rdd: string
          remaining_cube?: number | null
          shipment_type: Database["public"]["Enums"]["shipment_type"]
          shipper_last_name: string
          target_pod_id: string
          target_poe_id: string
          tsp_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_cube?: number | null
          created_at?: string | null
          destination_rate_area?: string
          estimated_cube?: number | null
          gbl_number?: string
          id?: string
          origin_rate_area?: string
          pickup_date?: string
          rdd?: string
          remaining_cube?: number | null
          shipment_type?: Database["public"]["Enums"]["shipment_type"]
          shipper_last_name?: string
          target_pod_id?: string
          target_poe_id?: string
          tsp_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_destination_rate_area_fkey"
            columns: ["destination_rate_area"]
            isOneToOne: false
            referencedRelation: "rate_areas"
            referencedColumns: ["rate_area"]
          },
          {
            foreignKeyName: "shipments_origin_rate_area_fkey"
            columns: ["origin_rate_area"]
            isOneToOne: false
            referencedRelation: "rate_areas"
            referencedColumns: ["rate_area"]
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
      approve_scac_claim: {
        Args: { _approval_token: string; _approve: boolean }
        Returns: Json
      }
      approve_user_request: {
        Args: { _approval_token: string; _approve: boolean }
        Returns: Json
      }
      cleanup_user_completely: {
        Args: { _user_id: string }
        Returns: Json
      }
      disable_user_account: {
        Args: { _user_id: string }
        Returns: Json
      }
      get_consolidation_org_id: {
        Args: { consolidation_id: string }
        Returns: string
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
      is_org_admin_for_organization: {
        Args: { check_organization_id: string }
        Returns: boolean
      }
      is_user_account_active: {
        Args: { _user_id: string }
        Returns: boolean
      }
      validate_and_consume_setup_token: {
        Args: { _token: string }
        Returns: Json
      }
    }
    Enums: {
      scac_claim_status: "pending" | "approved" | "denied"
      shipment_type: "inbound" | "outbound" | "intertheater"
      us_state_code:
        | "AL"
        | "AK"
        | "AZ"
        | "AR"
        | "CA"
        | "CO"
        | "CT"
        | "DE"
        | "FL"
        | "GA"
        | "HI"
        | "ID"
        | "IL"
        | "IN"
        | "IA"
        | "KS"
        | "KY"
        | "LA"
        | "ME"
        | "MD"
        | "MA"
        | "MI"
        | "MN"
        | "MS"
        | "MO"
        | "MT"
        | "NE"
        | "NV"
        | "NH"
        | "NJ"
        | "NM"
        | "NY"
        | "NC"
        | "ND"
        | "OH"
        | "OK"
        | "OR"
        | "PA"
        | "RI"
        | "SC"
        | "SD"
        | "TN"
        | "TX"
        | "UT"
        | "VT"
        | "VA"
        | "WA"
        | "WV"
        | "WI"
        | "WY"
        | "DC"
        | "GU"
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
      scac_claim_status: ["pending", "approved", "denied"],
      shipment_type: ["inbound", "outbound", "intertheater"],
      us_state_code: [
        "AL",
        "AK",
        "AZ",
        "AR",
        "CA",
        "CO",
        "CT",
        "DE",
        "FL",
        "GA",
        "HI",
        "ID",
        "IL",
        "IN",
        "IA",
        "KS",
        "KY",
        "LA",
        "ME",
        "MD",
        "MA",
        "MI",
        "MN",
        "MS",
        "MO",
        "MT",
        "NE",
        "NV",
        "NH",
        "NJ",
        "NM",
        "NY",
        "NC",
        "ND",
        "OH",
        "OK",
        "OR",
        "PA",
        "RI",
        "SC",
        "SD",
        "TN",
        "TX",
        "UT",
        "VT",
        "VA",
        "WA",
        "WV",
        "WI",
        "WY",
        "DC",
        "GU",
      ],
      user_request_status: ["pending", "approved", "denied"],
      user_role: ["global_admin", "org_admin", "user"],
    },
  },
} as const
