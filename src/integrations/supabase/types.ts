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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      archived_jobs: {
        Row: {
          archived_at: string
          assigned_provider_id: string | null
          budget: string | null
          category: string
          city: string
          date_time: string | null
          description: string
          id: string
          latitude: number | null
          longitude: number | null
          original_created_at: string
          original_updated_at: string
          posted_by: string
          status: string
          title: string
        }
        Insert: {
          archived_at?: string
          assigned_provider_id?: string | null
          budget?: string | null
          category: string
          city: string
          date_time?: string | null
          description: string
          id: string
          latitude?: number | null
          longitude?: number | null
          original_created_at: string
          original_updated_at: string
          posted_by: string
          status: string
          title: string
        }
        Update: {
          archived_at?: string
          assigned_provider_id?: string | null
          budget?: string | null
          category?: string
          city?: string
          date_time?: string | null
          description?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          original_created_at?: string
          original_updated_at?: string
          posted_by?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      archived_messages: {
        Row: {
          archived_at: string
          id: string
          is_read: boolean
          job_id: string
          message_text: string
          original_created_at: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          archived_at?: string
          id: string
          is_read: boolean
          job_id: string
          message_text: string
          original_created_at: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          archived_at?: string
          id?: string
          is_read?: boolean
          job_id?: string
          message_text?: string
          original_created_at?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          admin_notes: string | null
          assigned_admin: string | null
          created_at: string
          created_by: string
          description: string
          id: string
          image_url: string | null
          job_id: string | null
          provider_id: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          assigned_admin?: string | null
          created_at?: string
          created_by: string
          description: string
          id?: string
          image_url?: string | null
          job_id?: string | null
          provider_id?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          assigned_admin?: string | null
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          image_url?: string | null
          job_id?: string | null
          provider_id?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_requests: {
        Row: {
          created_at: string
          id: string
          job_id: string
          message: string
          proposed_rate: number | null
          provider_id: string
          status: Database["public"]["Enums"]["job_request_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          message: string
          proposed_rate?: number | null
          provider_id: string
          status?: Database["public"]["Enums"]["job_request_status"]
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          message?: string
          proposed_rate?: number | null
          provider_id?: string
          status?: Database["public"]["Enums"]["job_request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "job_requests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          assigned_provider_id: string | null
          budget: string | null
          category: string
          city: string
          created_at: string
          date_time: string | null
          description: string
          id: string
          latitude: number | null
          longitude: number | null
          posted_by: string
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_provider_id?: string | null
          budget?: string | null
          category: string
          city: string
          created_at?: string
          date_time?: string | null
          description: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          posted_by: string
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_provider_id?: string | null
          budget?: string | null
          category?: string
          city?: string
          created_at?: string
          date_time?: string | null
          description?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          posted_by?: string
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          job_id: string
          message_text: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          job_id: string
          message_text: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          job_id?: string
          message_text?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_read?: boolean
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          created_at: string
          homeowner_id: string
          id: string
          job_id: string
          offered_rate: number
          payment_method: string | null
          payment_screenshot_url: string | null
          platform_fee: number
          provider_id: string
          status: string
          total_amount: number
          transaction_reference: string | null
          verification_status: string | null
        }
        Insert: {
          created_at?: string
          homeowner_id: string
          id?: string
          job_id: string
          offered_rate: number
          payment_method?: string | null
          payment_screenshot_url?: string | null
          platform_fee?: number
          provider_id: string
          status?: string
          total_amount: number
          transaction_reference?: string | null
          verification_status?: string | null
        }
        Update: {
          created_at?: string
          homeowner_id?: string
          id?: string
          job_id?: string
          offered_rate?: number
          payment_method?: string | null
          payment_screenshot_url?: string | null
          platform_fee?: number
          provider_id?: string
          status?: string
          total_amount?: number
          transaction_reference?: string | null
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          block_reason: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_blocked: boolean
          phone: string | null
        }
        Insert: {
          block_reason?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_blocked?: boolean
          phone?: string | null
        }
        Update: {
          block_reason?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_blocked?: boolean
          phone?: string | null
        }
        Relationships: []
      }
      provider_kyc: {
        Row: {
          address: string | null
          cnic_back_url: string
          cnic_front_url: string
          cnic_number: string
          created_at: string
          full_name: string
          id: string
          phone: string
          provider_id: string
          rejection_reason: string | null
          selfie_url: string
          status: string
          submitted_at: string
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          address?: string | null
          cnic_back_url: string
          cnic_front_url: string
          cnic_number: string
          created_at?: string
          full_name: string
          id?: string
          phone: string
          provider_id: string
          rejection_reason?: string | null
          selfie_url: string
          status?: string
          submitted_at?: string
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          address?: string | null
          cnic_back_url?: string
          cnic_front_url?: string
          cnic_number?: string
          created_at?: string
          full_name?: string
          id?: string
          phone?: string
          provider_id?: string
          rejection_reason?: string | null
          selfie_url?: string
          status?: string
          submitted_at?: string
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      provider_profiles: {
        Row: {
          bio: string | null
          city: string
          created_at: string
          full_name: string
          id: string
          is_verified: boolean
          latitude: number | null
          longitude: number | null
          phone: string
          profile_image_url: string | null
          service_radius_km: number | null
          skill_category: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          city: string
          created_at?: string
          full_name: string
          id?: string
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          phone: string
          profile_image_url?: string | null
          service_radius_km?: number | null
          skill_category: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          city?: string
          created_at?: string
          full_name?: string
          id?: string
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          phone?: string
          profile_image_url?: string | null
          service_radius_km?: number | null
          skill_category?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_ratings: {
        Row: {
          created_at: string
          homeowner_id: string
          id: string
          job_id: string
          provider_id: string
          rating: number
          review: string | null
        }
        Insert: {
          created_at?: string
          homeowner_id: string
          id?: string
          job_id: string
          provider_id: string
          rating: number
          review?: string | null
        }
        Update: {
          created_at?: string
          homeowner_id?: string
          id?: string
          job_id?: string
          provider_id?: string
          rating?: number
          review?: string | null
        }
        Relationships: []
      }
      provider_transactions: {
        Row: {
          commission: number
          created_at: string
          gross_amount: number
          id: string
          job_id: string
          net_amount: number
          provider_id: string
        }
        Insert: {
          commission: number
          created_at?: string
          gross_amount: number
          id?: string
          job_id: string
          net_amount: number
          provider_id: string
        }
        Update: {
          commission?: number
          created_at?: string
          gross_amount?: number
          id?: string
          job_id?: string
          net_amount?: number
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_transactions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_wallet: {
        Row: {
          balance: number
          provider_id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          provider_id: string
          updated_at?: string
        }
        Update: {
          balance?: number
          provider_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action_count: number
          action_type: string
          created_at: string
          id: string
          user_id: string
          window_start: string
        }
        Insert: {
          action_count?: number
          action_type: string
          created_at?: string
          id?: string
          user_id: string
          window_start?: string
        }
        Update: {
          action_count?: number
          action_type?: string
          created_at?: string
          id?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          account_number: string
          account_title: string
          admin_notes: string | null
          amount: number
          bank_name: string | null
          created_at: string
          id: string
          processed_at: string | null
          provider_id: string
          status: string
          withdrawal_method: string
        }
        Insert: {
          account_number: string
          account_title: string
          admin_notes?: string | null
          amount: number
          bank_name?: string | null
          created_at?: string
          id?: string
          processed_at?: string | null
          provider_id: string
          status?: string
          withdrawal_method: string
        }
        Update: {
          account_number?: string
          account_title?: string
          admin_notes?: string | null
          amount?: number
          bank_name?: string | null
          created_at?: string
          id?: string
          processed_at?: string | null
          provider_id?: string
          status?: string
          withdrawal_method?: string
        }
        Relationships: []
      }
    }
    Views: {
      provider_ratings_public: {
        Row: {
          created_at: string | null
          id: string | null
          provider_id: string | null
          rating: number | null
          review: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          provider_id?: string | null
          rating?: number | null
          review?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          provider_id?: string | null
          rating?: number | null
          review?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      archive_old_data: { Args: { days_old?: number }; Returns: Json }
      calculate_distance_km: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      get_fuzzy_coordinates: {
        Args: { lat: number; lon: number; precision_km?: number }
        Returns: {
          fuzzy_lat: number
          fuzzy_lon: number
        }[]
      }
      get_nearby_providers: {
        Args: { job_category: string; job_lat: number; job_lon: number }
        Returns: {
          distance_km: number
          full_name: string
          provider_id: string
          user_id: string
        }[]
      }
      has_applied_to_job: {
        Args: { _job_id: string; _user_id: string }
        Returns: boolean
      }
      has_job_relationship: {
        Args: { _profile_id: string; _viewer_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_job_owner: {
        Args: { _job_id: string; _user_id: string }
        Returns: boolean
      }
      is_provider_kyc_verified: {
        Args: { _provider_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "homeowner" | "service_provider" | "admin"
      job_request_status: "pending" | "accepted" | "rejected"
      job_status: "open" | "assigned" | "completed" | "in_progress"
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
      app_role: ["homeowner", "service_provider", "admin"],
      job_request_status: ["pending", "accepted", "rejected"],
      job_status: ["open", "assigned", "completed", "in_progress"],
    },
  },
} as const
