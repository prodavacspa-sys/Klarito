export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]
export type SubscriptionStatus = 'active' | 'inactive'
export type ExpenseCategory = 'fijo' | 'variable'
export type DocumentType = 'factura' | 'boleta/otro'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; user_id: string; email: string | null; business_name: string | null; subscription_status: SubscriptionStatus; flow_subscription_id: string | null; created_at: string; updated_at: string }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      products: {
        Row: { id: string; user_id: string; name: string; cost_price: number; margin_percentage: number; sale_price: number; stock: number; min_stock_alert: number; is_active: boolean; created_at: string; updated_at: string }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      sales: {
        Row: { id: string; user_id: string; net_amount: number; iva_amount: number; total_amount: number; notes: string | null; created_at: string }
        Insert: Omit<Database['public']['Tables']['sales']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['sales']['Insert']>
      }
      sale_items: {
        Row: { id: string; sale_id: string; product_id: string; quantity: number; unit_price: number; subtotal: number; created_at: string }
        Insert: Omit<Database['public']['Tables']['sale_items']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['sale_items']['Insert']>
      }
      expenses: {
        Row: { id: string; user_id: string; description: string; expense_category: ExpenseCategory; document_type: DocumentType; net_amount: number; iva_amount: number; total_amount: number; is_recurring: boolean; created_at: string; updated_at: string }
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>
      }
      recipes: {
        Row: { id: string; user_id: string; product_id: string | null; name: string; description: string | null; monthly_units: number; is_active: boolean; created_at: string; updated_at: string }
        Insert: Omit<Database['public']['Tables']['recipes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['recipes']['Insert']>
      }
      recipe_items: {
        Row: { id: string; recipe_id: string; name: string; quantity: number; unit: string; unit_cost: number; subtotal: number; created_at: string }
        Insert: Omit<Database['public']['Tables']['recipe_items']['Row'], 'id' | 'created_at' | 'subtotal'>
        Update: Partial<Database['public']['Tables']['recipe_items']['Insert']>
      }
    }
    Views: {
      monthly_sales_summary: { Row: { user_id: string; month: string; total_sales: number; total_net: number; total_iva: number; total_gross: number } }
      monthly_expenses_summary: { Row: { user_id: string; month: string; expense_category: ExpenseCategory; document_type: DocumentType; total_net: number; total_iva: number; total_gross: number } }
      low_stock_products: { Row: { id: string; user_id: string; name: string; stock: number; min_stock_alert: number; sale_price: number; cost_price: number } }
      recipe_cost_summary: { Row: { recipe_id: string; user_id: string; recipe_name: string; product_id: string | null; monthly_units: number; variable_cost: number; total_fixed_costs: number; total_monthly_units: number; total_unit_cost: number } }
    }
  }
}
