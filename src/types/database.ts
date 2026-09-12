/**
 * Supabase Database Types
 *
 * These types mirror the database schema defined in
 * supabase/migrations/20260313_initial_schema.sql
 *
 * In production, regenerate with:
 * npx supabase gen types typescript --local > src/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          updated_at?: string;
        };
        Relationships: [];
      };
      studios: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          image_url: string | null;
          capacity: number | null;
          equipment_highlights: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string;
          image_url?: string | null;
          capacity?: number | null;
          equipment_highlights?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string;
          image_url?: string | null;
          capacity?: number | null;
          equipment_highlights?: string[];
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      studio_pricing: {
        Row: {
          id: string;
          studio_id: string;
          day_category: DayCategory;
          time_category: TimeCategory;
          hourly_rate: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          studio_id: string;
          day_category: DayCategory;
          time_category: TimeCategory;
          hourly_rate: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          studio_id?: string;
          day_category?: DayCategory;
          time_category?: TimeCategory;
          hourly_rate?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      engineers: {
        Row: {
          id: string;
          profile_id: string;
          priority_order: number;
          is_available: boolean;
          specialties: string[];
          bio: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          priority_order?: number;
          is_available?: boolean;
          specialties?: string[];
          bio?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          profile_id?: string;
          priority_order?: number;
          is_available?: boolean;
          specialties?: string[];
          bio?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          studio_id: string;
          engineer_id: string | null;
          booking_date: string;
          start_time: string;
          end_time: string;
          duration_hours: number;
          hourly_rate: number;
          total_price: number;
          deposit_amount: number | null;
          booking_status: BookingStatus;
          payment_status: PaymentStatus;
          stripe_payment_intent_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          studio_id: string;
          engineer_id?: string | null;
          booking_date: string;
          start_time: string;
          end_time: string;
          duration_hours: number;
          hourly_rate: number;
          total_price: number;
          deposit_amount?: number | null;
          booking_status?: BookingStatus;
          payment_status?: PaymentStatus;
          stripe_payment_intent_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          studio_id?: string;
          engineer_id?: string | null;
          booking_date?: string;
          start_time?: string;
          end_time?: string;
          duration_hours?: number;
          hourly_rate?: number;
          total_price?: number;
          deposit_amount?: number | null;
          booking_status?: BookingStatus;
          payment_status?: PaymentStatus;
          stripe_payment_intent_id?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      beats: {
        Row: {
          id: string;
          beatmaker_id: string;
          title: string;
          slug: string;
          bpm: number | null;
          key: string | null;
          genre: string | null;
          tags: string[];
          audio_preview_url: string | null;
          audio_full_url: string | null;
          cover_image_url: string | null;
          price_simple: number;
          price_exclusive: number | null;
          is_exclusive_sold: boolean;
          is_published: boolean;
          play_count: number;
          like_count: number;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          beatmaker_id: string;
          title: string;
          slug: string;
          bpm?: number | null;
          key?: string | null;
          genre?: string | null;
          tags?: string[];
          audio_preview_url?: string | null;
          audio_full_url?: string | null;
          cover_image_url?: string | null;
          price_simple: number;
          price_exclusive?: number | null;
          is_exclusive_sold?: boolean;
          is_published?: boolean;
          play_count?: number;
          like_count?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          beatmaker_id?: string;
          title?: string;
          slug?: string;
          bpm?: number | null;
          key?: string | null;
          genre?: string | null;
          tags?: string[];
          audio_preview_url?: string | null;
          audio_full_url?: string | null;
          cover_image_url?: string | null;
          price_simple?: number;
          price_exclusive?: number | null;
          is_exclusive_sold?: boolean;
          is_published?: boolean;
          play_count?: number;
          like_count?: number;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      beat_purchases: {
        Row: {
          id: string;
          user_id: string;
          beat_id: string;
          license_type: LicenseType;
          price_paid: number;
          stripe_payment_intent_id: string | null;
          download_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          beat_id: string;
          license_type: LicenseType;
          price_paid: number;
          stripe_payment_intent_id?: string | null;
          download_url?: string | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          beat_id?: string;
          license_type?: LicenseType;
          price_paid?: number;
          stripe_payment_intent_id?: string | null;
          download_url?: string | null;
        };
        Relationships: [];
      };
      mixing_orders: {
        Row: {
          id: string;
          user_id: string;
          created_by: string | null;
          formula: MixingFormula;
          mixing_status: MixingStatus;
          brief: string;
          notes: string | null;
          price: number;
          stripe_payment_intent_id: string | null;
          payment_status: PaymentStatus;
          revision_count: number;
          max_revisions: number;
          delivered_file_url: string | null;
          meet_link: string | null;
          engineer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_by?: string | null;
          formula: MixingFormula;
          mixing_status?: MixingStatus;
          brief?: string;
          notes?: string | null;
          price: number;
          stripe_payment_intent_id?: string | null;
          payment_status?: PaymentStatus;
          revision_count?: number;
          max_revisions?: number;
          delivered_file_url?: string | null;
          meet_link?: string | null;
          engineer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          created_by?: string | null;
          formula?: MixingFormula;
          mixing_status?: MixingStatus;
          brief?: string;
          notes?: string | null;
          price?: number;
          stripe_payment_intent_id?: string | null;
          payment_status?: PaymentStatus;
          revision_count?: number;
          max_revisions?: number;
          delivered_file_url?: string | null;
          meet_link?: string | null;
          engineer_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      mixing_stems: {
        Row: {
          id: string;
          mixing_order_id: string;
          file_name: string;
          file_url: string;
          file_size: number;
          file_format: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          mixing_order_id: string;
          file_name: string;
          file_url: string;
          file_size: number;
          file_format: string;
          created_at?: string;
        };
        Update: {
          mixing_order_id?: string;
          file_name?: string;
          file_url?: string;
          file_size?: number;
          file_format?: string;
        };
        Relationships: [];
      };
      mixing_revisions: {
        Row: {
          id: string;
          mixing_order_id: string;
          revision_number: number;
          feedback: string;
          revision_status: RevisionStatus;
          delivered_file_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mixing_order_id: string;
          revision_number: number;
          feedback: string;
          revision_status?: RevisionStatus;
          delivered_file_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          mixing_order_id?: string;
          revision_number?: number;
          feedback?: string;
          revision_status?: RevisionStatus;
          delivered_file_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      content_pages: {
        Row: {
          id: string;
          slug: string;
          title: string;
          content: Json;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          content?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          slug?: string;
          title?: string;
          content?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      platform_settings: {
        Row: {
          key: string;
          value: Json;
          description: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          description?: string | null;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          description?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          subject: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          subject: string;
          message: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          email?: string;
          phone?: string | null;
          subject?: string;
          message?: string;
        };
        Relationships: [];
      };
      slot_locks: {
        Row: {
          id: string;
          studio_id: string;
          booking_date: string;
          start_time: string;
          end_time: string;
          user_id: string;
          locked_until: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          studio_id: string;
          booking_date: string;
          start_time: string;
          end_time: string;
          user_id: string;
          locked_until: string;
          created_at?: string;
        };
        Update: {
          studio_id?: string;
          booking_date?: string;
          start_time?: string;
          end_time?: string;
          user_id?: string;
          locked_until?: string;
        };
        Relationships: [];
      };
      beat_favorites: {
        Row: {
          id: string;
          user_id: string;
          beat_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          beat_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          beat_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      day_category: DayCategory;
      time_category: TimeCategory;
      booking_status: BookingStatus;
      payment_status: PaymentStatus;
      license_type: LicenseType;
      mixing_formula: MixingFormula;
      mixing_status: MixingStatus;
      revision_status: RevisionStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

// Enum types
export type UserRole = "client" | "beatmaker" | "engineer" | "admin";
export type DayCategory = "weekday" | "weekend";
export type TimeCategory = "peak" | "off_peak";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type PaymentStatus = "pending" | "deposit_paid" | "fully_paid" | "refunded";
export type LicenseType = "simple" | "exclusive";
export type MixingFormula = "standard" | "premium";
export type MixingStatus = "pending" | "in_progress" | "delivered" | "revision_requested" | "completed";
export type RevisionStatus = "requested" | "in_progress" | "delivered";

// Convenience aliases for Row types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Studio = Database["public"]["Tables"]["studios"]["Row"];
export type StudioPricing = Database["public"]["Tables"]["studio_pricing"]["Row"];
export type Engineer = Database["public"]["Tables"]["engineers"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Beat = Database["public"]["Tables"]["beats"]["Row"];
export type BeatPurchase = Database["public"]["Tables"]["beat_purchases"]["Row"];
export type MixingOrder = Database["public"]["Tables"]["mixing_orders"]["Row"];
export type MixingStem = Database["public"]["Tables"]["mixing_stems"]["Row"];
export type MixingRevision = Database["public"]["Tables"]["mixing_revisions"]["Row"];
export type ContentPage = Database["public"]["Tables"]["content_pages"]["Row"];
export type PlatformSetting = Database["public"]["Tables"]["platform_settings"]["Row"];

// Insert types
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];
export type BeatInsert = Database["public"]["Tables"]["beats"]["Insert"];
export type BeatPurchaseInsert = Database["public"]["Tables"]["beat_purchases"]["Insert"];
export type MixingOrderInsert = Database["public"]["Tables"]["mixing_orders"]["Insert"];
export type MixingStemInsert = Database["public"]["Tables"]["mixing_stems"]["Insert"];
export type MixingRevisionInsert = Database["public"]["Tables"]["mixing_revisions"]["Insert"];

// Update types
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];
export type BeatUpdate = Database["public"]["Tables"]["beats"]["Update"];
export type MixingOrderUpdate = Database["public"]["Tables"]["mixing_orders"]["Update"];

// Beat favorites
export type BeatFavorite = Database["public"]["Tables"]["beat_favorites"]["Row"];
export type BeatFavoriteInsert = Database["public"]["Tables"]["beat_favorites"]["Insert"];
