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
      events: {
        Row: {
          category: Database["public"]["Enums"]["event_category"]
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          link_url: string | null
          location: string | null
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["event_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          link_url?: string | null
          location?: string | null
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["event_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          link_url?: string | null
          location?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      funding: {
        Row: {
          amount: number
          beneficiary: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          id: string
          recorded_at: string
          source: Database["public"]["Enums"]["fund_source"]
          status: Database["public"]["Enums"]["fund_status"]
          title: string
          updated_at: string
        }
        Insert: {
          amount: number
          beneficiary?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          id?: string
          recorded_at?: string
          source: Database["public"]["Enums"]["fund_source"]
          status?: Database["public"]["Enums"]["fund_status"]
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          beneficiary?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          id?: string
          recorded_at?: string
          source?: Database["public"]["Enums"]["fund_source"]
          status?: Database["public"]["Enums"]["fund_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          created_at: string
          id: string
          label: string
          poll_id: string
          position: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          poll_id: string
          position?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          poll_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          starts_at: string | null
          status: Database["public"]["Enums"]["poll_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["poll_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["poll_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          employment_status:
            | Database["public"]["Enums"]["employment_status"]
            | null
          full_name: string
          id: string
          phone: string | null
          skills: string[] | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_at: string | null
          verified_by: string | null
          ward: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          employment_status?:
            | Database["public"]["Enums"]["employment_status"]
            | null
          full_name: string
          id: string
          phone?: string | null
          skills?: string[] | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          verified_by?: string | null
          ward?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          employment_status?:
            | Database["public"]["Enums"]["employment_status"]
            | null
          full_name?: string
          id?: string
          phone?: string | null
          skills?: string[] | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          verified_by?: string | null
          ward?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          category: Database["public"]["Enums"]["report_category"]
          created_at: string
          created_by: string | null
          file_url: string | null
          id: string
          is_published: boolean
          published_at: string | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["report_category"]
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["report_category"]
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      suggestions: {
        Row: {
          body: string
          category: string | null
          created_at: string
          id: string
          is_anonymous: boolean
          responded_at: string | null
          responded_by: string | null
          response: string | null
          status: Database["public"]["Enums"]["suggestion_status"]
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          body: string
          category?: string | null
          created_at?: string
          id?: string
          is_anonymous?: boolean
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          status?: Database["public"]["Enums"]["suggestion_status"]
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          body?: string
          category?: string | null
          created_at?: string
          id?: string
          is_anonymous?: boolean
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          status?: Database["public"]["Enums"]["suggestion_status"]
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      talents: {
        Row: {
          category: string | null
          contact: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          talent_type: Database["public"]["Enums"]["talent_type"]
          updated_at: string
          user_id: string | null
          ward: string | null
        }
        Insert: {
          category?: string | null
          contact?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          talent_type?: Database["public"]["Enums"]["talent_type"]
          updated_at?: string
          user_id?: string | null
          ward?: string | null
        }
        Update: {
          category?: string | null
          contact?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          talent_type?: Database["public"]["Enums"]["talent_type"]
          updated_at?: string
          user_id?: string | null
          ward?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      poll_vote_tallies: {
        Row: {
          option_id: string | null
          poll_id: string | null
          vote_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          employment_status:
            | Database["public"]["Enums"]["employment_status"]
            | null
          full_name: string | null
          id: string | null
          skills: string[] | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          ward: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          employment_status?:
            | Database["public"]["Enums"]["employment_status"]
            | null
          full_name?: string | null
          id?: string | null
          skills?: string[] | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          ward?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          employment_status?:
            | Database["public"]["Enums"]["employment_status"]
            | null
          full_name?: string | null
          id?: string | null
          skills?: string[] | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          ward?: string | null
        }
        Relationships: []
      }
      public_talents: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          name: string | null
          talent_type: Database["public"]["Enums"]["talent_type"] | null
          updated_at: string | null
          user_id: string | null
          ward: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          name?: string | null
          talent_type?: Database["public"]["Enums"]["talent_type"] | null
          updated_at?: string | null
          user_id?: string | null
          ward?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          name?: string | null
          talent_type?: Database["public"]["Enums"]["talent_type"] | null
          updated_at?: string | null
          user_id?: string | null
          ward?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "executive" | "member"
      employment_status:
        | "employed"
        | "self_employed"
        | "unemployed"
        | "student"
        | "other"
      event_category:
        | "job"
        | "training"
        | "bursary"
        | "showcase"
        | "meeting"
        | "other"
      fund_source:
        | "uwezo_fund"
        | "youth_enterprise_fund"
        | "bursary"
        | "ngaaf"
        | "other"
      fund_status: "received" | "allocated" | "disbursed"
      poll_status: "draft" | "active" | "closed"
      report_category: "financial" | "minutes" | "decision" | "other"
      suggestion_status: "new" | "reviewing" | "responded" | "closed"
      talent_type: "individual" | "group"
      verification_status: "pending" | "verified" | "rejected"
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
      app_role: ["admin", "executive", "member"],
      employment_status: [
        "employed",
        "self_employed",
        "unemployed",
        "student",
        "other",
      ],
      event_category: [
        "job",
        "training",
        "bursary",
        "showcase",
        "meeting",
        "other",
      ],
      fund_source: [
        "uwezo_fund",
        "youth_enterprise_fund",
        "bursary",
        "ngaaf",
        "other",
      ],
      fund_status: ["received", "allocated", "disbursed"],
      poll_status: ["draft", "active", "closed"],
      report_category: ["financial", "minutes", "decision", "other"],
      suggestion_status: ["new", "reviewing", "responded", "closed"],
      talent_type: ["individual", "group"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
