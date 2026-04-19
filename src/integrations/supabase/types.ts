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
      assets: {
        Row: {
          assigned_to: string | null
          business_unit_id: string
          condition: Database["public"]["Enums"]["asset_condition"] | null
          created_at: string
          id: string
          name: string
          notes: string | null
          price: number
          purchase_date: string | null
          updated_at: string
          use_purpose: string
        }
        Insert: {
          assigned_to?: string | null
          business_unit_id: string
          condition?: Database["public"]["Enums"]["asset_condition"] | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          price?: number
          purchase_date?: string | null
          updated_at?: string
          use_purpose: string
        }
        Update: {
          assigned_to?: string | null
          business_unit_id?: string
          condition?: Database["public"]["Enums"]["asset_condition"] | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          price?: number
          purchase_date?: string | null
          updated_at?: string
          use_purpose?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          status: Database["public"]["Enums"]["attendance_status"]
          team_member_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          team_member_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      business_units: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      buy_list: {
        Row: {
          business_unit_id: string
          created_at: string
          estimated_price: number
          id: string
          name: string
          priority: Database["public"]["Enums"]["task_priority"]
          purpose: string
          requested_by: string | null
          status: Database["public"]["Enums"]["buy_list_status"]
          updated_at: string
        }
        Insert: {
          business_unit_id: string
          created_at?: string
          estimated_price?: number
          id?: string
          name: string
          priority?: Database["public"]["Enums"]["task_priority"]
          purpose: string
          requested_by?: string | null
          status?: Database["public"]["Enums"]["buy_list_status"]
          updated_at?: string
        }
        Update: {
          business_unit_id?: string
          created_at?: string
          estimated_price?: number
          id?: string
          name?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          purpose?: string
          requested_by?: string | null
          status?: Database["public"]["Enums"]["buy_list_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buy_list_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buy_list_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          billing_label: Database["public"]["Enums"]["billing_label"]
          brand_name: string
          business_unit_id: string
          category: Database["public"]["Enums"]["lead_category"]
          created_at: string
          email: string
          id: string
          location: string
          notes: string | null
          onboarded_at: string
          phone: string
          updated_at: string
        }
        Insert: {
          billing_label?: Database["public"]["Enums"]["billing_label"]
          brand_name: string
          business_unit_id: string
          category?: Database["public"]["Enums"]["lead_category"]
          created_at?: string
          email: string
          id?: string
          location: string
          notes?: string | null
          onboarded_at?: string
          phone: string
          updated_at?: string
        }
        Update: {
          billing_label?: Database["public"]["Enums"]["billing_label"]
          brand_name?: string
          business_unit_id?: string
          category?: Database["public"]["Enums"]["lead_category"]
          created_at?: string
          email?: string
          id?: string
          location?: string
          notes?: string | null
          onboarded_at?: string
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          file_name: string
          file_url: string
          id: string
          team_member_id: string
          uploaded_at: string
        }
        Insert: {
          file_name: string
          file_url: string
          id?: string
          team_member_id: string
          uploaded_at?: string
        }
        Update: {
          file_name?: string
          file_url?: string
          id?: string
          team_member_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_tools: {
        Row: {
          amount: number
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          business_unit_id: string
          category: string | null
          created_at: string
          end_date: string
          id: string
          name: string
          notes: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          amount?: number
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          business_unit_id: string
          category?: string | null
          created_at?: string
          end_date: string
          id?: string
          name: string
          notes?: string | null
          start_date?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          business_unit_id?: string
          category?: string | null
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          notes?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_tools_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          rate: number
        }
        Insert: {
          amount?: number
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          rate?: number
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_reminders: {
        Row: {
          id: string
          invoice_id: string
          message: string | null
          sent_at: string
          sent_to_email: string
        }
        Insert: {
          id?: string
          invoice_id: string
          message?: string | null
          sent_at?: string
          sent_to_email: string
        }
        Update: {
          id?: string
          invoice_id?: string
          message?: string | null
          sent_at?: string
          sent_to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_reminders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          business_unit_id: string
          client_id: string
          created_at: string
          discount: number
          due_date: string
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax_percent: number
          total: number
          updated_at: string
        }
        Insert: {
          business_unit_id: string
          client_id: string
          created_at?: string
          discount?: number
          due_date: string
          id?: string
          invoice_date?: string
          invoice_number: string
          notes?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_percent?: number
          total?: number
          updated_at?: string
        }
        Update: {
          business_unit_id?: string
          client_id?: string
          created_at?: string
          discount?: number
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_percent?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          brand_name: string
          business_unit_id: string
          category: Database["public"]["Enums"]["lead_category"]
          created_at: string
          email: string
          id: string
          location: string
          notes: string | null
          phone: string
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          brand_name: string
          business_unit_id: string
          category?: Database["public"]["Enums"]["lead_category"]
          created_at?: string
          email: string
          id?: string
          location: string
          notes?: string | null
          phone: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          brand_name?: string
          business_unit_id?: string
          category?: Database["public"]["Enums"]["lead_category"]
          created_at?: string
          email?: string
          id?: string
          location?: string
          notes?: string | null
          phone?: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          project_id: string
          team_member_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          team_member_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          billing_label: Database["public"]["Enums"]["billing_label"] | null
          business_unit_id: string
          company_name: string
          contact_email: string
          contact_person: string
          contact_phone: string | null
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          name: string
          start_date: string | null
          status_label: Database["public"]["Enums"]["project_status_tek"] | null
          updated_at: string
        }
        Insert: {
          billing_label?: Database["public"]["Enums"]["billing_label"] | null
          business_unit_id: string
          company_name: string
          contact_email: string
          contact_person: string
          contact_phone?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          name: string
          start_date?: string | null
          status_label?:
            | Database["public"]["Enums"]["project_status_tek"]
            | null
          updated_at?: string
        }
        Update: {
          billing_label?: Database["public"]["Enums"]["billing_label"] | null
          business_unit_id?: string
          company_name?: string
          contact_email?: string
          contact_person?: string
          contact_phone?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status_label?:
            | Database["public"]["Enums"]["project_status_tek"]
            | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          team_member_id: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          team_member_id: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          team_member_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          business_unit_id: string
          created_at: string
          designation: string
          email: string
          employment_label: Database["public"]["Enums"]["employment_label"]
          id: string
          joined_at: string
          name: string
          phone: string | null
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          business_unit_id: string
          created_at?: string
          designation: string
          email: string
          employment_label?: Database["public"]["Enums"]["employment_label"]
          id?: string
          joined_at?: string
          name: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          business_unit_id?: string
          created_at?: string
          designation?: string
          email?: string
          employment_label?: Database["public"]["Enums"]["employment_label"]
          id?: string
          joined_at?: string
          name?: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
        ]
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
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_authenticated_member: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager"
      asset_condition: "new" | "good" | "fair" | "needs_repair"
      attendance_status: "present" | "absent" | "half_day" | "leave"
      billing_cycle: "monthly" | "quarterly" | "annually" | "one_time"
      billing_label: "monthly" | "one_time"
      buy_list_status: "requested" | "approved" | "purchased" | "rejected"
      employment_label: "freelancing" | "salaried"
      invoice_status: "draft" | "sent" | "paid" | "overdue"
      lead_category: "corporate" | "commercial" | "creator"
      lead_status: "contacted" | "not_contacted"
      project_status_tek: "upcoming" | "in_progress" | "completed"
      task_priority: "high" | "medium" | "low"
      task_status: "to_do" | "in_progress" | "done"
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
      app_role: ["admin", "manager"],
      asset_condition: ["new", "good", "fair", "needs_repair"],
      attendance_status: ["present", "absent", "half_day", "leave"],
      billing_cycle: ["monthly", "quarterly", "annually", "one_time"],
      billing_label: ["monthly", "one_time"],
      buy_list_status: ["requested", "approved", "purchased", "rejected"],
      employment_label: ["freelancing", "salaried"],
      invoice_status: ["draft", "sent", "paid", "overdue"],
      lead_category: ["corporate", "commercial", "creator"],
      lead_status: ["contacted", "not_contacted"],
      project_status_tek: ["upcoming", "in_progress", "completed"],
      task_priority: ["high", "medium", "low"],
      task_status: ["to_do", "in_progress", "done"],
    },
  },
} as const
