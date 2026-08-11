export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Generado desde el esquema real de Supabase (proyecto klarito, qfzafugukuquicytzshv)
// vía mcp Supabase generate_typescript_types. Regenerar si cambia el esquema.
export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      expenses: {
        Row: {
          created_at: string
          description: string
          document_type: string
          expense_category: string
          expense_subcategory: string | null
          expense_type: string | null
          id: string
          is_recurring: boolean
          iva_amount: number
          net_amount: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          document_type: string
          expense_category: string
          expense_subcategory?: string | null
          expense_type?: string | null
          id?: string
          is_recurring?: boolean
          iva_amount?: number
          net_amount?: number
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          document_type?: string
          expense_category?: string
          expense_subcategory?: string | null
          expense_type?: string | null
          id?: string
          is_recurring?: boolean
          iva_amount?: number
          net_amount?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      productions: {
        Row: {
          cost_total: number
          created_at: string | null
          id: string
          produced_at: string | null
          product_id: string | null
          quantity: number
          user_id: string | null
        }
        Insert: {
          cost_total: number
          created_at?: string | null
          id?: string
          produced_at?: string | null
          product_id?: string | null
          quantity: number
          user_id?: string | null
        }
        Update: {
          cost_total?: number
          created_at?: string | null
          id?: string
          produced_at?: string | null
          product_id?: string | null
          quantity?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "productions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          cost_per_unit: number | null
          cost_price: number
          created_at: string
          id: string
          is_active: boolean
          margin_percentage: number
          min_stock_alert: number
          name: string
          product_type: string | null
          sale_price: number
          stock: number
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_per_unit?: number | null
          cost_price?: number
          created_at?: string
          id?: string
          is_active?: boolean
          margin_percentage?: number
          min_stock_alert?: number
          name: string
          product_type?: string | null
          sale_price?: number
          stock?: number
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_per_unit?: number | null
          cost_price?: number
          created_at?: string
          id?: string
          is_active?: boolean
          margin_percentage?: number
          min_stock_alert?: number
          name?: string
          product_type?: string | null
          sale_price?: number
          stock?: number
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          business_name: string | null
          commission_credit: number | null
          commission_debit: number | null
          comuna: string | null
          created_at: string
          email: string | null
          empresa_type: string | null
          first_name: string | null
          flow_customer_id: string | null
          flow_subscription_id: string | null
          giro: string | null
          id: string
          last_name: string | null
          phone: string | null
          ppm_rate: number
          referral_code: string | null
          referral_discount: number | null
          referred_by: string | null
          rut_address: string | null
          rut_empresa: string | null
          subscription_status: string
          trial_started_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          commission_credit?: number | null
          commission_debit?: number | null
          comuna?: string | null
          created_at?: string
          email?: string | null
          empresa_type?: string | null
          first_name?: string | null
          flow_customer_id?: string | null
          flow_subscription_id?: string | null
          giro?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          ppm_rate?: number
          referral_code?: string | null
          referral_discount?: number | null
          referred_by?: string | null
          rut_address?: string | null
          rut_empresa?: string | null
          subscription_status?: string
          trial_started_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          business_name?: string | null
          commission_credit?: number | null
          commission_debit?: number | null
          comuna?: string | null
          created_at?: string
          email?: string | null
          empresa_type?: string | null
          first_name?: string | null
          flow_customer_id?: string | null
          flow_subscription_id?: string | null
          giro?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          ppm_rate?: number
          referral_code?: string | null
          referral_discount?: number | null
          referred_by?: string | null
          rut_address?: string | null
          rut_empresa?: string | null
          subscription_status?: string
          trial_started_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          created_at: string | null
          id: string
          ingredient_id: string | null
          product_id: string | null
          quantity: number
          unit: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ingredient_id?: string | null
          product_id?: string | null
          quantity: number
          unit: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ingredient_id?: string | null
          product_id?: string | null
          quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_items: {
        Row: {
          created_at: string
          id: string
          name: string
          quantity: number
          recipe_id: string
          subtotal: number | null
          unit: string
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          quantity: number
          recipe_id: string
          subtotal?: number | null
          unit?: string
          unit_cost?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          quantity?: number
          recipe_id?: string
          subtotal?: number | null
          unit?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          monthly_units: number
          name: string
          product_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          monthly_units?: number
          name: string
          product_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          monthly_units?: number
          name?: string
          product_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_credits: {
        Row: {
          created_at: string
          id: string
          total: number
          updated_at: string
          used: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          total?: number
          updated_at?: string
          used?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          total?: number
          updated_at?: string
          used?: number
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          credit_amount: number
          credited_at: string | null
          id: string
          referral_code: string
          referred_user_id: string | null
          referrer_user_id: string
          status: string
        }
        Insert: {
          created_at?: string
          credit_amount?: number
          credited_at?: string | null
          id?: string
          referral_code: string
          referred_user_id?: string | null
          referrer_user_id: string
          status?: string
        }
        Update: {
          created_at?: string
          credit_amount?: number
          credited_at?: string | null
          id?: string
          referral_code?: string
          referred_user_id?: string | null
          referrer_user_id?: string
          status?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          sale_id: string
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          sale_id: string
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          sale_id?: string
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          commission_amount: number | null
          commission_rate: number | null
          created_at: string
          id: string
          iva_amount: number
          net_amount: number
          notes: string | null
          payment_type: string | null
          total_amount: number
          user_id: string
        }
        Insert: {
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          id?: string
          iva_amount?: number
          net_amount?: number
          notes?: string | null
          payment_type?: string | null
          total_amount?: number
          user_id: string
        }
        Update: {
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          id?: string
          iva_amount?: number
          net_amount?: number
          notes?: string | null
          payment_type?: string | null
          total_amount?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      recipe_cost_summary: {
        Row: {
          recipe_id: string
          recipe_name: string
          user_id: string
          product_id: string | null
          monthly_units: number
          variable_cost: number
          total_fixed_costs: number
          total_monthly_units: number
          total_unit_cost: number
        }
        Relationships: []
      }
    }
    Functions: {
      copy_recurring_expenses: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
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
