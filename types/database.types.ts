export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "owner" | "admin" | "member";
export type InvitationStatus = "pending" | "accepted" | "cancelled" | "expired";
export type CustomerStatus = "active" | "inactive" | "lead";
export type LeadStage = "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type TaskType = "CALL" | "EMAIL" | "MEETING" | "FOLLOW_UP" | "TODO";
export type SubscriptionPlan = "free" | "starter" | "pro" | "enterprise";
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "incomplete";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          job_title: string | null;
          email_notifications_enabled: boolean;
          in_app_notifications_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          job_title?: string | null;
          email_notifications_enabled?: boolean;
          in_app_notifications_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          job_title?: string | null;
          email_notifications_enabled?: boolean;
          in_app_notifications_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string | null;
          logo_url: string | null;
          contact_email: string | null;
          timezone: string;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug?: string | null;
          logo_url?: string | null;
          contact_email?: string | null;
          timezone?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string | null;
          logo_url?: string | null;
          contact_email?: string | null;
          timezone?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_invitations: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          role: UserRole;
          token_hash: string;
          invited_by: string;
          status: InvitationStatus;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          role?: UserRole;
          token_hash: string;
          invited_by: string;
          status?: InvitationStatus;
          expires_at: string;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          role?: UserRole;
          token_hash?: string;
          invited_by?: string;
          status?: InvitationStatus;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          company: string | null;
          email: string | null;
          phone: string | null;
          website: string | null;
          address: string | null;
          status: CustomerStatus;
          total_revenue: number;
          last_order_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          company?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          address?: string | null;
          status?: CustomerStatus;
          total_revenue?: number;
          last_order_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          company?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          address?: string | null;
          status?: CustomerStatus;
          total_revenue?: number;
          last_order_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          company: string | null;
          email: string | null;
          phone: string | null;
          source: string;
          stage: LeadStage;
          estimated_value: number;
          assigned_to: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          company?: string | null;
          email?: string | null;
          phone?: string | null;
          source?: string;
          stage?: LeadStage;
          estimated_value?: number;
          assigned_to?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          company?: string | null;
          email?: string | null;
          phone?: string | null;
          source?: string;
          stage?: LeadStage;
          estimated_value?: number;
          assigned_to?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leads_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          description: string | null;
          task_type: TaskType;
          priority: TaskPriority;
          status: TaskStatus;
          due_date: string | null;
          assigned_to: string | null;
          customer_id: string | null;
          lead_id: string | null;
          created_by: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          description?: string | null;
          task_type?: TaskType;
          priority?: TaskPriority;
          status?: TaskStatus;
          due_date?: string | null;
          assigned_to?: string | null;
          customer_id?: string | null;
          lead_id?: string | null;
          created_by?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          title?: string;
          description?: string | null;
          task_type?: TaskType;
          priority?: TaskPriority;
          status?: TaskStatus;
          due_date?: string | null;
          assigned_to?: string | null;
          customer_id?: string | null;
          lead_id?: string | null;
          created_by?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      activities: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          entity_type: string;
          entity_id: string | null;
          title: string;
          detail: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id?: string | null;
          entity_type: string;
          entity_id?: string | null;
          title: string;
          detail?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string | null;
          entity_type?: string;
          entity_id?: string | null;
          title?: string;
          detail?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activities_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      notes: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          entity_type: string;
          entity_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id?: string | null;
          entity_type: string;
          entity_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string | null;
          entity_type?: string;
          entity_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notes_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          link: string | null;
          related_entity_type: string | null;
          related_entity_id: string | null;
          dedupe_key: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          title: string;
          message: string;
          type?: string;
          link?: string | null;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          dedupe_key?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: string;
          link?: string | null;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          dedupe_key?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          organization_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan: SubscriptionPlan;
          status: SubscriptionStatus;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: SubscriptionPlan;
          status?: SubscriptionStatus;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: SubscriptionPlan;
          status?: SubscriptionStatus;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_configs: {
        Row: {
          id: string;
          organization_id: string;
          provider: string;
          is_active: boolean;
          config: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          provider: string;
          is_active?: boolean;
          config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          provider?: string;
          is_active?: boolean;
          config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integration_configs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_org_member: {
        Args: { org_id: string };
        Returns: boolean;
      };
      is_org_admin: {
        Args: { org_id: string };
        Returns: boolean;
      };
      is_org_owner: {
        Args: { org_id: string };
        Returns: boolean;
      };
      create_notification: {
        Args: {
          recipient_id: string;
          notification_organization_id: string;
          notification_title: string;
          notification_message: string;
          notification_type: string;
          notification_entity_type?: string | null;
          notification_entity_id?: string | null;
          notification_dedupe_key?: string | null;
        };
        Returns: string | null;
      };
      accept_organization_invitation: {
        Args: { invitation_token_hash: string };
        Returns: string;
      };
      preview_organization_invitation: {
        Args: { invitation_token_hash: string };
        Returns: {
          email: string;
          role: UserRole;
          status: InvitationStatus;
          expires_at: string;
          organization_name: string;
        }[];
      };
      get_dashboard_stats: {
        Args: { p_org_id: string };
        Returns: {
          total_customers: number;
          active_customers: number;
          new_customers_30d: number;
          active_leads: number;
          pending_tasks: number;
          pipeline_value: number;
        }[];
      };
      get_lead_pipeline: {
        Args: { p_org_id: string };
        Returns: {
          stage: string;
          count: number;
        }[];
      };
      get_analytics: {
        Args: { p_org_id: string; p_from?: string | null; p_to?: string | null };
        Returns: {
          total_customers: number;
          active_customers: number;
          inactive_customers: number;
          lead_customers: number;
          customers_created: number;
          total_tasks: number;
          open_tasks: number;
          completed_tasks: number;
          overdue_tasks: number;
          completed_in_range: number;
          total_activities: number;
          activities_created: number;
          completion_rate: number;
          overdue_rate: number;
          customers_created_series: Record<string, number>;
          tasks_created_series: Record<string, number>;
          activities_created_series: Record<string, number>;
          task_statuses: Record<string, number>;
          customer_statuses: Record<string, number>;
          activity_types: Record<string, number>;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
      customer_status: CustomerStatus;
      lead_stage: LeadStage;
      task_priority: TaskPriority;
      task_status: TaskStatus;
      subscription_plan: SubscriptionPlan;
      subscription_status: SubscriptionStatus;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
