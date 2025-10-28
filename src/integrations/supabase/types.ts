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
      articles: {
        Row: {
          author: string | null
          category: Database["public"]["Enums"]["news_category"]
          content: string
          created_at: string | null
          date_modified: string | null
          excerpt: string | null
          featured_image: string | null
          id: string
          image_credit: string | null
          image_url: string | null
          meta_description: string | null
          meta_keywords: string[] | null
          meta_title: string | null
          news_keywords: string[] | null
          og_description: string | null
          og_image: string | null
          og_title: string | null
          publish_at: string | null
          published_at: string | null
          read_time: string | null
          schema_markup: Json | null
          slug: string
          sources: Json | null
          status: Database["public"]["Enums"]["article_status"] | null
          tags: string[] | null
          title: string
          trending_topic_id: string | null
          updated_at: string | null
          views_count: number | null
          word_count: number | null
        }
        Insert: {
          author?: string | null
          category: Database["public"]["Enums"]["news_category"]
          content: string
          created_at?: string | null
          date_modified?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          image_credit?: string | null
          image_url?: string | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          news_keywords?: string[] | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          publish_at?: string | null
          published_at?: string | null
          read_time?: string | null
          schema_markup?: Json | null
          slug: string
          sources?: Json | null
          status?: Database["public"]["Enums"]["article_status"] | null
          tags?: string[] | null
          title: string
          trending_topic_id?: string | null
          updated_at?: string | null
          views_count?: number | null
          word_count?: number | null
        }
        Update: {
          author?: string | null
          category?: Database["public"]["Enums"]["news_category"]
          content?: string
          created_at?: string | null
          date_modified?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          image_credit?: string | null
          image_url?: string | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          news_keywords?: string[] | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          publish_at?: string | null
          published_at?: string | null
          read_time?: string | null
          schema_markup?: Json | null
          slug?: string
          sources?: Json | null
          status?: Database["public"]["Enums"]["article_status"] | null
          tags?: string[] | null
          title?: string
          trending_topic_id?: string | null
          updated_at?: string | null
          views_count?: number | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_trending_topic_id_fkey"
            columns: ["trending_topic_id"]
            isOneToOne: false
            referencedRelation: "trending_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          payload: Json | null
          started_at: string | null
          status: string
          type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          payload?: Json | null
          started_at?: string | null
          status?: string
          type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          payload?: Json | null
          started_at?: string | null
          status?: string
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      publication_queue: {
        Row: {
          article_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          published: boolean | null
          scheduled_for: string
        }
        Insert: {
          article_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          published?: boolean | null
          scheduled_for: string
        }
        Update: {
          article_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          published?: boolean | null
          scheduled_for?: string
        }
        Relationships: [
          {
            foreignKeyName: "publication_queue_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      trending_topics: {
        Row: {
          category: Database["public"]["Enums"]["news_category"] | null
          created_at: string | null
          fetched_at: string | null
          id: string
          keywords: string[] | null
          processed: boolean | null
          region: string | null
          related_queries: string[] | null
          search_volume: number | null
          source_url: string | null
          topic: string
          trend_data: Json | null
          trend_strength: number | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["news_category"] | null
          created_at?: string | null
          fetched_at?: string | null
          id?: string
          keywords?: string[] | null
          processed?: boolean | null
          region?: string | null
          related_queries?: string[] | null
          search_volume?: number | null
          source_url?: string | null
          topic: string
          trend_data?: Json | null
          trend_strength?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["news_category"] | null
          created_at?: string | null
          fetched_at?: string | null
          id?: string
          keywords?: string[] | null
          processed?: boolean | null
          region?: string | null
          related_queries?: string[] | null
          search_volume?: number | null
          source_url?: string | null
          topic?: string
          trend_data?: Json | null
          trend_strength?: number | null
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
      weather_data: {
        Row: {
          created_at: string
          data: Json
          fetched_at: string
          id: string
        }
        Insert: {
          created_at?: string
          data: Json
          fetched_at?: string
          id?: string
        }
        Update: {
          created_at?: string
          data?: Json
          fetched_at?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      trending_analytics: {
        Row: {
          avg_strength: number | null
          category: Database["public"]["Enums"]["news_category"] | null
          processed_count: number | null
          region: string | null
          total_trends: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_read_time: { Args: { content: string }; Returns: string }
      generate_news_schema: { Args: { article_id: string }; Returns: Json }
      generate_slug: { Args: { title: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "editor" | "user"
      article_status: "draft" | "pending_review" | "published" | "archived"
      news_category:
        | "world"
        | "business"
        | "technology"
        | "sports"
        | "entertainment"
        | "science"
        | "politics"
        | "ai_innovation"
        | "lifestyle"
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
      app_role: ["super_admin", "admin", "editor", "user"],
      article_status: ["draft", "pending_review", "published", "archived"],
      news_category: [
        "world",
        "business",
        "technology",
        "sports",
        "entertainment",
        "science",
        "politics",
        "ai_innovation",
        "lifestyle",
      ],
    },
  },
} as const
