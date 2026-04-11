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
      admin_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      affiliate_clicks: {
        Row: {
          created_at: string | null
          deeplink: string | null
          id: string
          network_id: string | null
          trip_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          deeplink?: string | null
          id?: string
          network_id?: string | null
          trip_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          deeplink?: string | null
          id?: string
          network_id?: string | null
          trip_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "affiliate_networks"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_networks: {
        Row: {
          affiliate_id: string | null
          api_key_enc: string | null
          api_secret_enc: string | null
          auth_type: string | null
          base_url: string | null
          category: string
          commission_rate_display: string | null
          cookie_window_days: number | null
          created_at: string | null
          created_by: string | null
          deeplink_template: string | null
          display_name: string
          id: string
          is_enabled: boolean | null
          last_test_at: string | null
          last_test_error: string | null
          last_test_status: string | null
          logo_url: string | null
          notes: string | null
          oauth_client_id: string | null
          oauth_client_secret_enc: string | null
          oauth_redirect_uri: string | null
          payout_currency: string | null
          priority: number | null
          sandbox_api_key_enc: string | null
          sandbox_api_secret_enc: string | null
          sandbox_mode: boolean | null
          slug: string
          sub_id_pattern: string | null
          tracking_pixel_url: string | null
          updated_at: string | null
          updated_by: string | null
          webhook_secret_enc: string | null
          webhook_url: string | null
        }
        Insert: {
          affiliate_id?: string | null
          api_key_enc?: string | null
          api_secret_enc?: string | null
          auth_type?: string | null
          base_url?: string | null
          category?: string
          commission_rate_display?: string | null
          cookie_window_days?: number | null
          created_at?: string | null
          created_by?: string | null
          deeplink_template?: string | null
          display_name: string
          id?: string
          is_enabled?: boolean | null
          last_test_at?: string | null
          last_test_error?: string | null
          last_test_status?: string | null
          logo_url?: string | null
          notes?: string | null
          oauth_client_id?: string | null
          oauth_client_secret_enc?: string | null
          oauth_redirect_uri?: string | null
          payout_currency?: string | null
          priority?: number | null
          sandbox_api_key_enc?: string | null
          sandbox_api_secret_enc?: string | null
          sandbox_mode?: boolean | null
          slug: string
          sub_id_pattern?: string | null
          tracking_pixel_url?: string | null
          updated_at?: string | null
          updated_by?: string | null
          webhook_secret_enc?: string | null
          webhook_url?: string | null
        }
        Update: {
          affiliate_id?: string | null
          api_key_enc?: string | null
          api_secret_enc?: string | null
          auth_type?: string | null
          base_url?: string | null
          category?: string
          commission_rate_display?: string | null
          cookie_window_days?: number | null
          created_at?: string | null
          created_by?: string | null
          deeplink_template?: string | null
          display_name?: string
          id?: string
          is_enabled?: boolean | null
          last_test_at?: string | null
          last_test_error?: string | null
          last_test_status?: string | null
          logo_url?: string | null
          notes?: string | null
          oauth_client_id?: string | null
          oauth_client_secret_enc?: string | null
          oauth_redirect_uri?: string | null
          payout_currency?: string | null
          priority?: number | null
          sandbox_api_key_enc?: string | null
          sandbox_api_secret_enc?: string | null
          sandbox_mode?: boolean | null
          slug?: string
          sub_id_pattern?: string | null
          tracking_pixel_url?: string | null
          updated_at?: string | null
          updated_by?: string | null
          webhook_secret_enc?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      affiliate_webhook_events: {
        Row: {
          created_at: string | null
          event_type: string | null
          id: string
          network_slug: string | null
          payload: Json | null
          processed: boolean | null
          signature_valid: boolean | null
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          network_slug?: string | null
          payload?: Json | null
          processed?: boolean | null
          signature_valid?: boolean | null
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          network_slug?: string | null
          payload?: Json | null
          processed?: boolean | null
          signature_valid?: boolean | null
        }
        Relationships: []
      }
      airfare_alerts: {
        Row: {
          adults: number
          airline: string | null
          booking_link: string | null
          cabin_class: string
          check_count: number | null
          children: number
          confirmation_number: string | null
          created_at: string
          current_price: number | null
          depart_date: string
          destination: string
          flight_numbers: string[] | null
          id: string
          last_checked_at: string | null
          notify_email: boolean | null
          notify_sms: boolean | null
          origin: string
          price_history: Json | null
          return_date: string
          status: string
          stops_max: number | null
          target_price: number
          trip_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          adults?: number
          airline?: string | null
          booking_link?: string | null
          cabin_class?: string
          check_count?: number | null
          children?: number
          confirmation_number?: string | null
          created_at?: string
          current_price?: number | null
          depart_date: string
          destination?: string
          flight_numbers?: string[] | null
          id?: string
          last_checked_at?: string | null
          notify_email?: boolean | null
          notify_sms?: boolean | null
          origin: string
          price_history?: Json | null
          return_date: string
          status?: string
          stops_max?: number | null
          target_price: number
          trip_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          adults?: number
          airline?: string | null
          booking_link?: string | null
          cabin_class?: string
          check_count?: number | null
          children?: number
          confirmation_number?: string | null
          created_at?: string
          current_price?: number | null
          depart_date?: string
          destination?: string
          flight_numbers?: string[] | null
          id?: string
          last_checked_at?: string | null
          notify_email?: boolean | null
          notify_sms?: boolean | null
          origin?: string
          price_history?: Json | null
          return_date?: string
          status?: string
          stops_max?: number | null
          target_price?: number
          trip_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "airfare_alerts_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "saved_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      app_notifications: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_sent: boolean | null
          link_url: string | null
          notification_type: string | null
          sent_at: string | null
          target_audience: string | null
          title: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_sent?: boolean | null
          link_url?: string | null
          notification_type?: string | null
          sent_at?: string | null
          target_audience?: string | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_sent?: boolean | null
          link_url?: string | null
          notification_type?: string | null
          sent_at?: string | null
          target_audience?: string | null
          title?: string
        }
        Relationships: []
      }
      attractions: {
        Row: {
          avg_duration_min: number
          created_at: string
          description: string | null
          has_lightning_lane: boolean
          height_req_in: number | null
          id: string
          image_url: string | null
          land: string
          lat: number | null
          ll_type: string | null
          lng: number | null
          name: string
          park_id: string
          ride_type: string
          thrill_level: number | null
          updated_at: string
        }
        Insert: {
          avg_duration_min?: number
          created_at?: string
          description?: string | null
          has_lightning_lane?: boolean
          height_req_in?: number | null
          id?: string
          image_url?: string | null
          land: string
          lat?: number | null
          ll_type?: string | null
          lng?: number | null
          name: string
          park_id: string
          ride_type?: string
          thrill_level?: number | null
          updated_at?: string
        }
        Update: {
          avg_duration_min?: number
          created_at?: string
          description?: string | null
          has_lightning_lane?: boolean
          height_req_in?: number | null
          id?: string
          image_url?: string | null
          land?: string
          lat?: number | null
          ll_type?: string | null
          lng?: number | null
          name?: string
          park_id?: string
          ride_type?: string
          thrill_level?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      beacon_events: {
        Row: {
          badge: string | null
          badge_color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          emoji: string | null
          event_date: string
          event_time: string
          id: string
          is_active: boolean | null
          location: string
          park: string
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          badge?: string | null
          badge_color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          emoji?: string | null
          event_date: string
          event_time: string
          id?: string
          is_active?: boolean | null
          location: string
          park: string
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          badge?: string | null
          badge_color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          emoji?: string | null
          event_date?: string
          event_time?: string
          id?: string
          is_active?: boolean | null
          location?: string
          park?: string
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      beacon_rsvps: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "beacon_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "beacon_events"
            referencedColumns: ["id"]
          },
        ]
      }
      best_days_predictions: {
        Row: {
          computed_at: string
          crowd_level: number
          grade: string
          id: string
          park_id: string
          pass_tier_blocked: boolean | null
          precip_chance: number | null
          prediction_date: string
          reasons: Json | null
          score: number
          weather_high_f: number | null
          weather_low_f: number | null
          weather_summary: string | null
        }
        Insert: {
          computed_at?: string
          crowd_level?: number
          grade?: string
          id?: string
          park_id: string
          pass_tier_blocked?: boolean | null
          precip_chance?: number | null
          prediction_date: string
          reasons?: Json | null
          score?: number
          weather_high_f?: number | null
          weather_low_f?: number | null
          weather_summary?: string | null
        }
        Update: {
          computed_at?: string
          crowd_level?: number
          grade?: string
          id?: string
          park_id?: string
          pass_tier_blocked?: boolean | null
          precip_chance?: number | null
          prediction_date?: string
          reasons?: Json | null
          score?: number
          weather_high_f?: number | null
          weather_low_f?: number | null
          weather_summary?: string | null
        }
        Relationships: []
      }
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
          priority_launch: boolean
          restaurant_id: string
          status: string | null
          updated_at: string | null
          user_id: string
          window_opens_at: string | null
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
          priority_launch?: boolean
          restaurant_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
          window_opens_at?: string | null
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
          priority_launch?: boolean
          restaurant_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
          window_opens_at?: string | null
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
          created_at: string | null
          delivery_details: Json | null
          delivery_status: string | null
          id: string
          notification_type: string | null
          party_size: number | null
          restaurant_name: string | null
          retry_count: number | null
          sent_at: string | null
          user_id: string | null
        }
        Insert: {
          alert_date?: string | null
          alert_id?: string | null
          availability_url?: string | null
          created_at?: string | null
          delivery_details?: Json | null
          delivery_status?: string | null
          id?: string
          notification_type?: string | null
          party_size?: number | null
          restaurant_name?: string | null
          retry_count?: number | null
          sent_at?: string | null
          user_id?: string | null
        }
        Update: {
          alert_date?: string | null
          alert_id?: string | null
          availability_url?: string | null
          created_at?: string | null
          delivery_details?: Json | null
          delivery_status?: string | null
          id?: string
          notification_type?: string | null
          party_size?: number | null
          restaurant_name?: string | null
          retry_count?: number | null
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
      discount_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          invite_id: string | null
          percent_off: number
          stripe_coupon_id: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          invite_id?: string | null
          percent_off?: number
          stripe_coupon_id?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          invite_id?: string | null
          percent_off?: number
          stripe_coupon_id?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "travel_party_invites"
            referencedColumns: ["id"]
          },
        ]
      }
      disney_offers: {
        Row: {
          category: string
          created_at: string | null
          eligible_for: string[] | null
          full_details: string | null
          id: string
          importance: string | null
          is_active: boolean | null
          is_featured: boolean | null
          offer_url: string | null
          source: string | null
          summary: string
          title: string
          updated_at: string | null
          valid_from: string | null
          valid_through: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          eligible_for?: string[] | null
          full_details?: string | null
          id?: string
          importance?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          offer_url?: string | null
          source?: string | null
          summary: string
          title: string
          updated_at?: string | null
          valid_from?: string | null
          valid_through?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          eligible_for?: string[] | null
          full_details?: string | null
          id?: string
          importance?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          offer_url?: string | null
          source?: string | null
          summary?: string
          title?: string
          updated_at?: string | null
          valid_from?: string | null
          valid_through?: string | null
        }
        Relationships: []
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
      event_alerts: {
        Row: {
          alert_date: string
          alert_email: boolean | null
          alert_sms: boolean | null
          availability_found_at: string | null
          availability_url: string | null
          check_count: number | null
          created_at: string | null
          event_name: string
          event_url: string
          found_times: string[] | null
          id: string
          last_checked_at: string | null
          party_size: number
          preferred_time: string | null
          priority_launch: boolean
          status: string | null
          updated_at: string | null
          user_id: string
          window_opens_at: string | null
        }
        Insert: {
          alert_date: string
          alert_email?: boolean | null
          alert_sms?: boolean | null
          availability_found_at?: string | null
          availability_url?: string | null
          check_count?: number | null
          created_at?: string | null
          event_name: string
          event_url: string
          found_times?: string[] | null
          id?: string
          last_checked_at?: string | null
          party_size?: number
          preferred_time?: string | null
          priority_launch?: boolean
          status?: string | null
          updated_at?: string | null
          user_id: string
          window_opens_at?: string | null
        }
        Update: {
          alert_date?: string
          alert_email?: boolean | null
          alert_sms?: boolean | null
          availability_found_at?: string | null
          availability_url?: string | null
          check_count?: number | null
          created_at?: string | null
          event_name?: string
          event_url?: string
          found_times?: string[] | null
          id?: string
          last_checked_at?: string | null
          party_size?: number
          preferred_time?: string | null
          priority_launch?: boolean
          status?: string | null
          updated_at?: string | null
          user_id?: string
          window_opens_at?: string | null
        }
        Relationships: []
      }
      event_notifications: {
        Row: {
          alert_date: string | null
          alert_id: string | null
          availability_url: string | null
          created_at: string | null
          delivery_details: Json | null
          delivery_status: string | null
          event_name: string | null
          id: string
          notification_type: string | null
          party_size: number | null
          retry_count: number | null
          sent_at: string | null
          user_id: string | null
        }
        Insert: {
          alert_date?: string | null
          alert_id?: string | null
          availability_url?: string | null
          created_at?: string | null
          delivery_details?: Json | null
          delivery_status?: string | null
          event_name?: string | null
          id?: string
          notification_type?: string | null
          party_size?: number | null
          retry_count?: number | null
          sent_at?: string | null
          user_id?: string | null
        }
        Update: {
          alert_date?: string | null
          alert_id?: string | null
          availability_url?: string | null
          created_at?: string | null
          delivery_details?: Json | null
          delivery_status?: string | null
          event_name?: string | null
          id?: string
          notification_type?: string | null
          party_size?: number | null
          retry_count?: number | null
          sent_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_notifications_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "event_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          area: string | null
          category: string
          created_at: string | null
          description: string | null
          event_name: string
          event_url: string
          id: string
          is_active: boolean | null
          location: string
          location_type: string
          price_info: string | null
          requires_reservation: boolean | null
          scrapable: boolean | null
          updated_at: string | null
        }
        Insert: {
          area?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          event_name: string
          event_url: string
          id?: string
          is_active?: boolean | null
          location?: string
          location_type?: string
          price_info?: string | null
          requires_reservation?: boolean | null
          scrapable?: boolean | null
          updated_at?: string | null
        }
        Update: {
          area?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          event_name?: string
          event_url?: string
          id?: string
          is_active?: boolean | null
          location?: string
          location_type?: string
          price_info?: string | null
          requires_reservation?: boolean | null
          scrapable?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      feed_comments: {
        Row: {
          content: string
          created_at: string | null
          display_name: string
          id: string
          post_id: string
          user_id: string
          username: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          display_name: string
          id?: string
          post_id: string
          user_id: string
          username?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          display_name?: string
          id?: string
          post_id?: string
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_feed"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_requests: {
        Row: {
          created_at: string | null
          from_name: string | null
          from_user_id: string
          id: string
          responded_at: string | null
          status: string | null
          to_email: string | null
          to_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          from_name?: string | null
          from_user_id: string
          id?: string
          responded_at?: string | null
          status?: string | null
          to_email?: string | null
          to_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          from_name?: string | null
          from_user_id?: string
          id?: string
          responded_at?: string | null
          status?: string | null
          to_email?: string | null
          to_user_id?: string | null
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string | null
          id: string
          user_id_1: string
          user_id_2: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id_1: string
          user_id_2: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id_1?: string
          user_id_2?: string
        }
        Relationships: []
      }
      game_content: {
        Row: {
          clue_description: string | null
          correct_answer: number | null
          created_at: string | null
          game_type: string
          gps_lat: number | null
          gps_lng: number | null
          id: string
          image_url: string | null
          location_name: string | null
          multiple_choice: string[] | null
          park: string | null
          queue_name: string | null
          status: string | null
          submitted_by: string | null
          title: string
        }
        Insert: {
          clue_description?: string | null
          correct_answer?: number | null
          created_at?: string | null
          game_type: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          image_url?: string | null
          location_name?: string | null
          multiple_choice?: string[] | null
          park?: string | null
          queue_name?: string | null
          status?: string | null
          submitted_by?: string | null
          title: string
        }
        Update: {
          clue_description?: string | null
          correct_answer?: number | null
          created_at?: string | null
          game_type?: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          image_url?: string | null
          location_name?: string | null
          multiple_choice?: string[] | null
          park?: string | null
          queue_name?: string | null
          status?: string | null
          submitted_by?: string | null
          title?: string
        }
        Relationships: []
      }
      game_sessions: {
        Row: {
          completed: boolean | null
          created_at: string | null
          duration_seconds: number | null
          game_id: string
          game_name: string | null
          id: string
          questions_answered: number | null
          score: number | null
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          duration_seconds?: number | null
          game_id: string
          game_name?: string | null
          id?: string
          questions_answered?: number | null
          score?: number | null
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          duration_seconds?: number | null
          game_id?: string
          game_name?: string | null
          id?: string
          questions_answered?: number | null
          score?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      gift_card_alerts: {
        Row: {
          alert_email: boolean | null
          alert_sms: boolean | null
          card_values: string[] | null
          created_at: string | null
          id: string
          is_active: boolean | null
          min_savings: number | null
          retailers: string[] | null
          user_id: string
        }
        Insert: {
          alert_email?: boolean | null
          alert_sms?: boolean | null
          card_values?: string[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          min_savings?: number | null
          retailers?: string[] | null
          user_id: string
        }
        Update: {
          alert_email?: boolean | null
          alert_sms?: boolean | null
          card_values?: string[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          min_savings?: number | null
          retailers?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      gift_card_deals: {
        Row: {
          card_value: number
          created_at: string | null
          deal_url: string | null
          expires_at: string | null
          http_status: number | null
          id: string
          is_live: boolean | null
          last_verified: string | null
          link_checked_at: string | null
          link_error: string | null
          link_status: string | null
          notes: string | null
          priority: number | null
          retailer: string
          sale_price: number
          savings: number | null
          savings_pct: number | null
        }
        Insert: {
          card_value: number
          created_at?: string | null
          deal_url?: string | null
          expires_at?: string | null
          http_status?: number | null
          id?: string
          is_live?: boolean | null
          last_verified?: string | null
          link_checked_at?: string | null
          link_error?: string | null
          link_status?: string | null
          notes?: string | null
          priority?: number | null
          retailer: string
          sale_price: number
          savings?: number | null
          savings_pct?: number | null
        }
        Update: {
          card_value?: number
          created_at?: string | null
          deal_url?: string | null
          expires_at?: string | null
          http_status?: number | null
          id?: string
          is_live?: boolean | null
          last_verified?: string | null
          link_checked_at?: string | null
          link_error?: string | null
          link_status?: string | null
          notes?: string | null
          priority?: number | null
          retailer?: string
          sale_price?: number
          savings?: number | null
          savings_pct?: number | null
        }
        Relationships: []
      }
      haaaa_prompts: {
        Row: {
          category: string
          created_at: string
          difficulty: string
          id: string
          is_active: boolean
          prompt: string
          real_answer: string
        }
        Insert: {
          category?: string
          created_at?: string
          difficulty?: string
          id?: string
          is_active?: boolean
          prompt: string
          real_answer: string
        }
        Update: {
          category?: string
          created_at?: string
          difficulty?: string
          id?: string
          is_active?: boolean
          prompt?: string
          real_answer?: string
        }
        Relationships: []
      }
      headsup_words: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          word: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          word: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          word?: string
        }
        Relationships: []
      }
      hotel_alerts: {
        Row: {
          adults: number
          booking_link: string | null
          check_count: number | null
          check_in: string
          check_out: string
          children: number
          confirmation_number: string | null
          created_at: string
          current_price: number | null
          hotel_id: string | null
          hotel_name: string
          id: string
          last_checked_at: string | null
          last_checked_status: string | null
          notify_email: boolean | null
          notify_sms: boolean | null
          price_history: Json | null
          status: string
          target_price: number
          trip_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          adults?: number
          booking_link?: string | null
          check_count?: number | null
          check_in: string
          check_out: string
          children?: number
          confirmation_number?: string | null
          created_at?: string
          current_price?: number | null
          hotel_id?: string | null
          hotel_name: string
          id?: string
          last_checked_at?: string | null
          last_checked_status?: string | null
          notify_email?: boolean | null
          notify_sms?: boolean | null
          price_history?: Json | null
          status?: string
          target_price: number
          trip_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          adults?: number
          booking_link?: string | null
          check_count?: number | null
          check_in?: string
          check_out?: string
          children?: number
          confirmation_number?: string | null
          created_at?: string
          current_price?: number | null
          hotel_id?: string | null
          hotel_name?: string
          id?: string
          last_checked_at?: string | null
          last_checked_status?: string | null
          notify_email?: boolean | null
          notify_sms?: boolean | null
          price_history?: Json | null
          status?: string
          target_price?: number
          trip_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotel_alerts_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "off_property_hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_alerts_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "saved_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      inbound_email_events: {
        Row: {
          id: string
          message_id: string | null
          processed_at: string | null
          raw_from: string | null
          raw_to: string | null
          reject_reason: string | null
          reservation_id: string | null
          s3_key: string | null
          status: string
          subject: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          message_id?: string | null
          processed_at?: string | null
          raw_from?: string | null
          raw_to?: string | null
          reject_reason?: string | null
          reservation_id?: string | null
          s3_key?: string | null
          status?: string
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          message_id?: string | null
          processed_at?: string | null
          raw_from?: string | null
          raw_to?: string | null
          reject_reason?: string | null
          reservation_id?: string | null
          s3_key?: string | null
          status?: string
          subject?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inbound_email_events_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations_inbox"
            referencedColumns: ["id"]
          },
        ]
      }
      land_crowd_windows: {
        Row: {
          created_at: string
          crowd_level: number
          day_of_week: number
          hour: number
          id: string
          land: string
          park_id: string
        }
        Insert: {
          created_at?: string
          crowd_level?: number
          day_of_week: number
          hour: number
          id?: string
          land: string
          park_id: string
        }
        Update: {
          created_at?: string
          crowd_level?: number
          day_of_week?: number
          hour?: number
          id?: string
          land?: string
          park_id?: string
        }
        Relationships: []
      }
      merchandise: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_limited: boolean
          land: string
          location: string
          name: string
          park_id: string
          tags: string[] | null
          updated_at: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_limited?: boolean
          land: string
          location: string
          name: string
          park_id: string
          tags?: string[] | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_limited?: boolean
          land?: string
          location?: string
          name?: string
          park_id?: string
          tags?: string[] | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message_type: string
          receiver_id: string
          reference_id: string | null
          sender_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string
          receiver_id: string
          reference_id?: string | null
          sender_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string
          receiver_id?: string
          reference_id?: string | null
          sender_id?: string | null
        }
        Relationships: []
      }
      news_sources: {
        Row: {
          added_by: string | null
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_scraped: string | null
          name: string
          notes: string | null
          scrape_frequency: string | null
          url: string
        }
        Insert: {
          added_by?: string | null
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_scraped?: string | null
          name: string
          notes?: string | null
          scrape_frequency?: string | null
          url: string
        }
        Update: {
          added_by?: string | null
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_scraped?: string | null
          name?: string
          notes?: string | null
          scrape_frequency?: string | null
          url?: string
        }
        Relationships: []
      }
      off_property_hotels: {
        Row: {
          amenities: string[] | null
          booking_url_template: string | null
          brand: string | null
          created_at: string
          distance_to_ak_mi: number | null
          distance_to_epcot_mi: number | null
          distance_to_hs_mi: number | null
          distance_to_mk_mi: number | null
          id: string
          image_url: string | null
          lat: number | null
          lng: number | null
          name: string
          star_rating: number | null
          typical_nightly_rate: number | null
          updated_at: string
        }
        Insert: {
          amenities?: string[] | null
          booking_url_template?: string | null
          brand?: string | null
          created_at?: string
          distance_to_ak_mi?: number | null
          distance_to_epcot_mi?: number | null
          distance_to_hs_mi?: number | null
          distance_to_mk_mi?: number | null
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          name: string
          star_rating?: number | null
          typical_nightly_rate?: number | null
          updated_at?: string
        }
        Update: {
          amenities?: string[] | null
          booking_url_template?: string | null
          brand?: string | null
          created_at?: string
          distance_to_ak_mi?: number | null
          distance_to_epcot_mi?: number | null
          distance_to_hs_mi?: number | null
          distance_to_mk_mi?: number | null
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          name?: string
          star_rating?: number | null
          typical_nightly_rate?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      park_crowd_forecasts: {
        Row: {
          crowd_level: number
          fetched_at: string | null
          forecast_date: string
          id: string
          park_id: string
          source: string | null
        }
        Insert: {
          crowd_level?: number
          fetched_at?: string | null
          forecast_date: string
          id?: string
          park_id: string
          source?: string | null
        }
        Update: {
          crowd_level?: number
          fetched_at?: string | null
          forecast_date?: string
          id?: string
          park_id?: string
          source?: string | null
        }
        Relationships: []
      }
      park_paths: {
        Row: {
          created_at: string
          edges: Json
          nodes: Json
          park_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          edges?: Json
          nodes?: Json
          park_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          edges?: Json
          nodes?: Json
          park_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      park_weather_forecasts: {
        Row: {
          fetched_at: string | null
          forecast_date: string
          high_f: number | null
          id: string
          low_f: number | null
          park_id: string
          precip_chance: number | null
          source: string | null
          summary: string | null
        }
        Insert: {
          fetched_at?: string | null
          forecast_date: string
          high_f?: number | null
          id?: string
          low_f?: number | null
          park_id: string
          precip_chance?: number | null
          source?: string | null
          summary?: string | null
        }
        Update: {
          fetched_at?: string | null
          forecast_date?: string
          high_f?: number | null
          id?: string
          low_f?: number | null
          park_id?: string
          precip_chance?: number | null
          source?: string | null
          summary?: string | null
        }
        Relationships: []
      }
      pass_tier_blockouts: {
        Row: {
          blockout_date: string
          id: string
          is_blocked: boolean
          park_id: string
          pass_tier: string
          source: string | null
          updated_at: string | null
        }
        Insert: {
          blockout_date: string
          id?: string
          is_blocked?: boolean
          park_id: string
          pass_tier: string
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          blockout_date?: string
          id?: string
          is_blocked?: boolean
          park_id?: string
          pass_tier?: string
          source?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      photo_submissions: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string | null
          id: string
          image_url: string
          is_featured: boolean | null
          location: string | null
          park: string | null
          photo_type: string
          ride_name: string | null
          status: string | null
          title: string
          user_id: string
          vote_count: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          id?: string
          image_url: string
          is_featured?: boolean | null
          location?: string | null
          park?: string | null
          photo_type: string
          ride_name?: string | null
          status?: string | null
          title: string
          user_id: string
          vote_count?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          id?: string
          image_url?: string
          is_featured?: boolean | null
          location?: string | null
          park?: string | null
          photo_type?: string
          ride_name?: string | null
          status?: string | null
          title?: string
          user_id?: string
          vote_count?: number | null
        }
        Relationships: []
      }
      photo_votes: {
        Row: {
          created_at: string | null
          id: string
          photo_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          photo_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          photo_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_votes_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photo_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      photopass_locations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_magic_shot: boolean
          land: string
          lat: number | null
          lng: number | null
          park_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_magic_shot?: boolean
          land: string
          lat?: number | null
          lng?: number | null
          park_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_magic_shot?: boolean
          land?: string
          lat?: number | null
          lng?: number | null
          park_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_reactions: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      price_check_runs: {
        Row: {
          alerts_checked: number | null
          alerts_updated: number | null
          errors: Json | null
          function_name: string
          id: string
          run_at: string
        }
        Insert: {
          alerts_checked?: number | null
          alerts_updated?: number | null
          errors?: Json | null
          function_name: string
          id?: string
          run_at?: string
        }
        Update: {
          alerts_checked?: number | null
          alerts_updated?: number | null
          errors?: Json | null
          function_name?: string
          id?: string
          run_at?: string
        }
        Relationships: []
      }
      reservations_inbox: {
        Row: {
          attachments: Json | null
          confirmation_number: string | null
          created_at: string
          id: string
          parsed: Json | null
          raw_content: string | null
          reviewed_by_user_at: string | null
          sender_email: string | null
          source: string
          status: string
          trip_id: string | null
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          confirmation_number?: string | null
          created_at?: string
          id?: string
          parsed?: Json | null
          raw_content?: string | null
          reviewed_by_user_at?: string | null
          sender_email?: string | null
          source?: string
          status?: string
          trip_id?: string | null
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          confirmation_number?: string | null
          created_at?: string
          id?: string
          parsed?: Json | null
          raw_content?: string | null
          reviewed_by_user_at?: string | null
          sender_email?: string | null
          source?: string
          status?: string
          trip_id?: string | null
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_inbox_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "saved_trips"
            referencedColumns: ["id"]
          },
        ]
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
      restrooms: {
        Row: {
          created_at: string
          family_restroom: boolean
          id: string
          land: string
          lat: number | null
          lng: number | null
          nursing_room: boolean
          park_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          family_restroom?: boolean
          id?: string
          land: string
          lat?: number | null
          lng?: number | null
          nursing_room?: boolean
          park_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          family_restroom?: boolean
          id?: string
          land?: string
          lat?: number | null
          lng?: number | null
          nursing_room?: boolean
          park_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_trips: {
        Row: {
          adults: number | null
          ages: string | null
          budget: number | null
          category_caps: Json | null
          children: number | null
          created_at: string | null
          end_date: string | null
          estimated_total: number | null
          id: string
          is_public: boolean | null
          itinerary: Json | null
          ll_option: string | null
          name: string
          parks: string[] | null
          ride_preference: string | null
          share_token: string | null
          special_notes: string | null
          start_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          adults?: number | null
          ages?: string | null
          budget?: number | null
          category_caps?: Json | null
          children?: number | null
          created_at?: string | null
          end_date?: string | null
          estimated_total?: number | null
          id?: string
          is_public?: boolean | null
          itinerary?: Json | null
          ll_option?: string | null
          name: string
          parks?: string[] | null
          ride_preference?: string | null
          share_token?: string | null
          special_notes?: string | null
          start_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          adults?: number | null
          ages?: string | null
          budget?: number | null
          category_caps?: Json | null
          children?: number | null
          created_at?: string | null
          end_date?: string | null
          estimated_total?: number | null
          id?: string
          is_public?: boolean | null
          itinerary?: Json | null
          ll_option?: string | null
          name?: string
          parks?: string[] | null
          ride_preference?: string | null
          share_token?: string | null
          special_notes?: string | null
          start_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shows: {
        Row: {
          created_at: string
          duration_min: number
          id: string
          land: string
          location: string | null
          name: string
          park_id: string
          schedule: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_min?: number
          id?: string
          land: string
          location?: string | null
          name: string
          park_id: string
          schedule?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_min?: number
          id?: string
          land?: string
          location?: string | null
          name?: string
          park_id?: string
          schedule?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      snacks: {
        Row: {
          created_at: string
          dietary_flags: string[] | null
          id: string
          image_url: string | null
          land: string
          location: string
          name: string
          park_id: string
          price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dietary_flags?: string[] | null
          id?: string
          image_url?: string | null
          land: string
          location: string
          name: string
          park_id: string
          price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dietary_flags?: string[] | null
          id?: string
          image_url?: string | null
          land?: string
          location?: string
          name?: string
          park_id?: string
          price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      social_feed: {
        Row: {
          author: string | null
          author_emoji: string | null
          author_role: string | null
          category: string
          comment_count: number | null
          content: string
          created_at: string | null
          display_name: string | null
          id: string
          image_url: string | null
          image_urls: string[] | null
          is_pinned: boolean | null
          is_published: boolean | null
          like_count: number | null
          link_label: string | null
          link_url: string | null
          park: string | null
          post_type: string | null
          tags: string[] | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          author?: string | null
          author_emoji?: string | null
          author_role?: string | null
          category: string
          comment_count?: number | null
          content: string
          created_at?: string | null
          display_name?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          is_pinned?: boolean | null
          is_published?: boolean | null
          like_count?: number | null
          link_label?: string | null
          link_url?: string | null
          park?: string | null
          post_type?: string | null
          tags?: string[] | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          author?: string | null
          author_emoji?: string | null
          author_role?: string | null
          category?: string
          comment_count?: number | null
          content?: string
          created_at?: string | null
          display_name?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          is_pinned?: boolean | null
          is_published?: boolean | null
          like_count?: number | null
          link_label?: string | null
          link_url?: string | null
          park?: string | null
          post_type?: string | null
          tags?: string[] | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          post_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          post_type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          post_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      special_events: {
        Row: {
          availability_note: string | null
          booking_url: string | null
          category: string
          created_at: string
          description: string | null
          duration_min: number
          id: string
          image_url: string | null
          name: string
          park_id: string
          price_per_person: number | null
          updated_at: string
        }
        Insert: {
          availability_note?: string | null
          booking_url?: string | null
          category?: string
          created_at?: string
          description?: string | null
          duration_min?: number
          id?: string
          image_url?: string | null
          name: string
          park_id: string
          price_per_person?: number | null
          updated_at?: string
        }
        Update: {
          availability_note?: string | null
          booking_url?: string | null
          category?: string
          created_at?: string
          description?: string | null
          duration_min?: number
          id?: string
          image_url?: string | null
          name?: string
          park_id?: string
          price_per_person?: number | null
          updated_at?: string
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
      travel_party_invites: {
        Row: {
          accepted_at: string | null
          accepted_by_user_id: string | null
          created_at: string
          discount_code: string
          discount_percent: number
          expires_at: string
          first_name: string
          id: string
          invite_token: string
          invitee_email: string
          invitee_phone: string | null
          inviter_user_id: string
          last_name: string
          sent_email_at: string | null
          sent_sms_at: string | null
          status: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          created_at?: string
          discount_code: string
          discount_percent?: number
          expires_at?: string
          first_name: string
          id?: string
          invite_token: string
          invitee_email: string
          invitee_phone?: string | null
          inviter_user_id: string
          last_name: string
          sent_email_at?: string | null
          sent_sms_at?: string | null
          status?: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          created_at?: string
          discount_code?: string
          discount_percent?: number
          expires_at?: string
          first_name?: string
          id?: string
          invite_token?: string
          invitee_email?: string
          invitee_phone?: string | null
          inviter_user_id?: string
          last_name?: string
          sent_email_at?: string | null
          sent_sms_at?: string | null
          status?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_party_invites_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "saved_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          date: string | null
          description: string
          expense_type: string
          id: string
          paid_by_member_id: string | null
          receipt_url: string | null
          split_with: string[] | null
          trip_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string | null
          date?: string | null
          description: string
          expense_type?: string
          id?: string
          paid_by_member_id?: string | null
          receipt_url?: string | null
          split_with?: string[] | null
          trip_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          date?: string | null
          description?: string
          expense_type?: string
          id?: string
          paid_by_member_id?: string | null
          receipt_url?: string | null
          split_with?: string[] | null
          trip_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_expenses_paid_by_member_id_fkey"
            columns: ["paid_by_member_id"]
            isOneToOne: false
            referencedRelation: "trip_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "saved_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_members: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          invite_sent_at: string | null
          is_adult: boolean | null
          is_splitting_expenses: boolean | null
          joined_at: string | null
          last_name: string
          status: string | null
          trip_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          invite_sent_at?: string | null
          is_adult?: boolean | null
          is_splitting_expenses?: boolean | null
          joined_at?: string | null
          last_name: string
          status?: string | null
          trip_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          invite_sent_at?: string | null
          is_adult?: boolean | null
          is_splitting_expenses?: boolean | null
          joined_at?: string | null
          last_name?: string
          status?: string | null
          trip_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_members_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "saved_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_versions: {
        Row: {
          created_at: string
          id: string
          inputs: Json
          is_active: boolean
          name: string
          plans: Json
          totals: Json
          trip_id: string
          updated_at: string
          user_id: string
          version_number: number
          warnings: Json
        }
        Insert: {
          created_at?: string
          id?: string
          inputs?: Json
          is_active?: boolean
          name?: string
          plans?: Json
          totals?: Json
          trip_id: string
          updated_at?: string
          user_id: string
          version_number: number
          warnings?: Json
        }
        Update: {
          created_at?: string
          id?: string
          inputs?: Json
          is_active?: boolean
          name?: string
          plans?: Json
          totals?: Json
          trip_id?: string
          updated_at?: string
          user_id?: string
          version_number?: number
          warnings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "trip_versions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "saved_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trivia_questions: {
        Row: {
          category: string
          correct_answer: number
          created_at: string | null
          difficulty: string | null
          id: string
          is_active: boolean | null
          options: string[]
          park: string | null
          question: string
        }
        Insert: {
          category?: string
          correct_answer: number
          created_at?: string | null
          difficulty?: string | null
          id?: string
          is_active?: boolean | null
          options: string[]
          park?: string | null
          question: string
        }
        Update: {
          category?: string
          correct_answer?: number
          created_at?: string | null
          difficulty?: string | null
          id?: string
          is_active?: boolean | null
          options?: string[]
          park?: string | null
          question?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      user_messages: {
        Row: {
          admin_reply: string | null
          created_at: string | null
          id: string
          message: string
          replied_at: string | null
          replied_by: string | null
          status: string | null
          subject: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          admin_reply?: string | null
          created_at?: string | null
          id?: string
          message: string
          replied_at?: string | null
          replied_by?: string | null
          status?: string | null
          subject?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          admin_reply?: string | null
          created_at?: string | null
          id?: string
          message?: string
          replied_at?: string | null
          replied_by?: string | null
          status?: string | null
          subject?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      users_profile: {
        Row: {
          ap_expiration: string | null
          ap_pass_tier: string | null
          avatar_url: string | null
          created_at: string | null
          disney_plus: boolean | null
          disney_visa: boolean | null
          email: string | null
          feature_tips_seen: string[] | null
          first_name: string | null
          forwarding_token: string | null
          forwarding_token_rotated_at: string | null
          has_seen_welcome: boolean | null
          home_park: string | null
          home_zip: string | null
          id: string
          last_name: string | null
          membership_category: string | null
          mock_lat: number | null
          mock_lng: number | null
          mock_park: string | null
          onboarding_complete: boolean | null
          onboarding_step: number | null
          phone: string | null
          qr_token: string | null
          trusted_senders: Json | null
          username: string | null
          walking_speed_kmh: number | null
        }
        Insert: {
          ap_expiration?: string | null
          ap_pass_tier?: string | null
          avatar_url?: string | null
          created_at?: string | null
          disney_plus?: boolean | null
          disney_visa?: boolean | null
          email?: string | null
          feature_tips_seen?: string[] | null
          first_name?: string | null
          forwarding_token?: string | null
          forwarding_token_rotated_at?: string | null
          has_seen_welcome?: boolean | null
          home_park?: string | null
          home_zip?: string | null
          id: string
          last_name?: string | null
          membership_category?: string | null
          mock_lat?: number | null
          mock_lng?: number | null
          mock_park?: string | null
          onboarding_complete?: boolean | null
          onboarding_step?: number | null
          phone?: string | null
          qr_token?: string | null
          trusted_senders?: Json | null
          username?: string | null
          walking_speed_kmh?: number | null
        }
        Update: {
          ap_expiration?: string | null
          ap_pass_tier?: string | null
          avatar_url?: string | null
          created_at?: string | null
          disney_plus?: boolean | null
          disney_visa?: boolean | null
          email?: string | null
          feature_tips_seen?: string[] | null
          first_name?: string | null
          forwarding_token?: string | null
          forwarding_token_rotated_at?: string | null
          has_seen_welcome?: boolean | null
          home_park?: string | null
          home_zip?: string | null
          id?: string
          last_name?: string | null
          membership_category?: string | null
          mock_lat?: number | null
          mock_lng?: number | null
          mock_park?: string | null
          onboarding_complete?: boolean | null
          onboarding_step?: number | null
          phone?: string | null
          qr_token?: string | null
          trusted_senders?: Json | null
          username?: string | null
          walking_speed_kmh?: number | null
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
          is_game_developer: boolean | null
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
          is_game_developer?: boolean | null
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
          is_game_developer?: boolean | null
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
      game_content_public: {
        Row: {
          clue_description: string | null
          created_at: string | null
          game_type: string | null
          gps_lat: number | null
          gps_lng: number | null
          id: string | null
          image_url: string | null
          location_name: string | null
          multiple_choice: string[] | null
          park: string | null
          queue_name: string | null
          title: string | null
        }
        Insert: {
          clue_description?: string | null
          created_at?: string | null
          game_type?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string | null
          image_url?: string | null
          location_name?: string | null
          multiple_choice?: string[] | null
          park?: string | null
          queue_name?: string | null
          title?: string | null
        }
        Update: {
          clue_description?: string | null
          created_at?: string | null
          game_type?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string | null
          image_url?: string | null
          location_name?: string | null
          multiple_choice?: string[] | null
          park?: string | null
          queue_name?: string | null
          title?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_forwarding_token: { Args: never; Returns: string }
      is_game_developer: { Args: { _user_id: string }; Returns: boolean }
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
