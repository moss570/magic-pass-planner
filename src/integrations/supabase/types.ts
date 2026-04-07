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
      saved_trips: {
        Row: {
          adults: number | null
          ages: string | null
          budget: number | null
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
          has_seen_welcome: boolean | null
          home_park: string | null
          home_zip: string | null
          id: string
          last_name: string | null
          mock_lat: number | null
          mock_lng: number | null
          mock_park: string | null
          onboarding_complete: boolean | null
          onboarding_step: number | null
          phone: string | null
          qr_token: string | null
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
          has_seen_welcome?: boolean | null
          home_park?: string | null
          home_zip?: string | null
          id: string
          last_name?: string | null
          mock_lat?: number | null
          mock_lng?: number | null
          mock_park?: string | null
          onboarding_complete?: boolean | null
          onboarding_step?: number | null
          phone?: string | null
          qr_token?: string | null
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
          has_seen_welcome?: boolean | null
          home_park?: string | null
          home_zip?: string | null
          id?: string
          last_name?: string | null
          mock_lat?: number | null
          mock_lng?: number | null
          mock_park?: string | null
          onboarding_complete?: boolean | null
          onboarding_step?: number | null
          phone?: string | null
          qr_token?: string | null
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
