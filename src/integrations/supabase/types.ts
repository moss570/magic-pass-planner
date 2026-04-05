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
      dining_alerts: {
        Row: {
          alert_date: string
          alert_email: boolean | null
          alert_push: boolean | null
          alert_sms: boolean | null
          availability_found_at: string | null
          availability_url: string | null
          check_count: number | null
          created_at: string | null
          group_recipient_ids: string[] | null
          id: string
          last_checked_at: string | null
          meal_periods: string[] | null
          party_size: number
          preferred_time: string | null
          restaurant_id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_date: string
          alert_email?: boolean | null
          alert_push?: boolean | null
          alert_sms?: boolean | null
          availability_found_at?: string | null
          availability_url?: string | null
          check_count?: number | null
          created_at?: string | null
          group_recipient_ids?: string[] | null
          id?: string
          last_checked_at?: string | null
          meal_periods?: string[] | null
          party_size?: number
          preferred_time?: string | null
          restaurant_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_date?: string
          alert_email?: boolean | null
          alert_push?: boolean | null
          alert_sms?: boolean | null
          availability_found_at?: string | null
          availability_url?: string | null
          check_count?: number | null
          created_at?: string | null
          group_recipient_ids?: string[] | null
          id?: string
          last_checked_at?: string | null
          meal_periods?: string[] | null
          party_size?: number
          preferred_time?: string | null
          restaurant_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dining_alerts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      dining_notifications: {
        Row: {
          alert_date: string | null
          alert_id: string | null
          availability_url: string | null
          id: string
          notification_type: string | null
          party_size: number | null
          restaurant_name: string | null
          sent_at: string | null
          user_id: string | null
        }
        Insert: {
          alert_date?: string | null
          alert_id?: string | null
          availability_url?: string | null
          id?: string
          notification_type?: string | null
          party_size?: number | null
          restaurant_name?: string | null
          sent_at?: string | null
          user_id?: string | null
        }
        Update: {
          alert_date?: string | null
          alert_id?: string | null
          availability_url?: string | null
          id?: string
          notification_type?: string | null
          party_size?: number | null
          restaurant_name?: string | null
          sent_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dining_notifications_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "dining_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      disney_sessions: {
        Row: {
          access_token: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_refreshed: string | null
          swid: string | null
          token_expiry: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_refreshed?: string | null
          swid?: string | null
          token_expiry?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_refreshed?: string | null
          swid?: string | null
          token_expiry?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          accepts_walk_ins: boolean | null
          area: string | null
          created_at: string | null
          cuisine: string | null
          dining_plan: boolean | null
          disney_entity_id: string | null
          disney_url: string | null
          id: string
          is_active: boolean | null
          location: string
          location_type: string
          meal_periods: string[] | null
          name: string
          phone: string | null
          price_range: string | null
          requires_reservation: boolean | null
          updated_at: string | null
        }
        Insert: {
          accepts_walk_ins?: boolean | null
          area?: string | null
          created_at?: string | null
          cuisine?: string | null
          dining_plan?: boolean | null
          disney_entity_id?: string | null
          disney_url?: string | null
          id?: string
          is_active?: boolean | null
          location: string
          location_type: string
          meal_periods?: string[] | null
          name: string
          phone?: string | null
          price_range?: string | null
          requires_reservation?: boolean | null
          updated_at?: string | null
        }
        Update: {
          accepts_walk_ins?: boolean | null
          area?: string | null
          created_at?: string | null
          cuisine?: string | null
          dining_plan?: boolean | null
          disney_entity_id?: string | null
          disney_url?: string | null
          id?: string
          is_active?: boolean | null
          location?: string
          location_type?: string
          meal_periods?: string[] | null
          name?: string
          phone?: string | null
          price_range?: string | null
          requires_reservation?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          id: string
          plan_interval: string | null
          plan_name: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan_interval?: string | null
          plan_name?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan_interval?: string | null
          plan_name?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      users_profile: {
        Row: {
          ap_expiration: string | null
          ap_pass_tier: string | null
          created_at: string | null
          disney_plus: boolean | null
          disney_visa: boolean | null
          email: string | null
          first_name: string | null
          home_park: string | null
          home_zip: string | null
          id: string
          last_name: string | null
          onboarding_complete: boolean | null
          phone: string | null
        }
        Insert: {
          ap_expiration?: string | null
          ap_pass_tier?: string | null
          created_at?: string | null
          disney_plus?: boolean | null
          disney_visa?: boolean | null
          email?: string | null
          first_name?: string | null
          home_park?: string | null
          home_zip?: string | null
          id: string
          last_name?: string | null
          onboarding_complete?: boolean | null
          phone?: string | null
        }
        Update: {
          ap_expiration?: string | null
          ap_pass_tier?: string | null
          created_at?: string | null
          disney_plus?: boolean | null
          disney_visa?: boolean | null
          email?: string | null
          first_name?: string | null
          home_park?: string | null
          home_zip?: string | null
          id?: string
          last_name?: string | null
          onboarding_complete?: boolean | null
          phone?: string | null
        }
        Relationships: []
      }
      vip_accounts: {
        Row: {
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          invite_accepted_at: string | null
          invite_sent_at: string | null
          invited_by: string | null
          last_name: string | null
          notes: string | null
          reason: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          invite_accepted_at?: string | null
          invite_sent_at?: string | null
          invited_by?: string | null
          last_name?: string | null
          notes?: string | null
          reason?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          invite_accepted_at?: string | null
          invite_sent_at?: string | null
          invited_by?: string | null
          last_name?: string | null
          notes?: string | null
          reason?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
