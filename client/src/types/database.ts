export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// This type defines the structure of your Supabase database
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          display_name: string | null
          avatar_url: string | null
          email: string | null
        }
        Insert: {
          id: string
          created_at?: string
          display_name?: string | null
          avatar_url?: string | null
          email?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          display_name?: string | null
          avatar_url?: string | null
          email?: string | null
        }
      }
      safety_reports: {
        Row: {
          id: string
          created_at: string
          user_id: string
          severity: string
          category: string
          description: string
          location: string | null
          status: string
          updated_at: string | null
          attachments: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          severity: string
          category: string
          description: string
          location?: string | null
          status?: string
          updated_at?: string | null
          attachments?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          severity?: string
          category?: string
          description?: string
          location?: string | null
          status?: string
          updated_at?: string | null
          attachments?: Json | null
        }
      }
      checklist_responses: {
        Row: {
          id: string
          created_at: string
          user_id: string
          template_id: string
          title: string
          responses: Json
          updated_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          template_id: string
          title: string
          responses: Json
          updated_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          template_id?: string
          title?: string
          responses?: Json
          updated_at?: string | null
        }
      }
      chat_messages: {
        Row: {
          id: string
          created_at: string
          user_id: string
          text: string
          sender: string
          attachments: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          text: string
          sender: string
          attachments?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          text?: string
          sender?: string
          attachments?: Json | null
        }
      }
      watched_videos: {
        Row: {
          id: string
          user_id: string
          video_id: string
          watched_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          video_id: string
          watched_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          video_id?: string
          watched_at?: string
          created_at?: string
        }
      }
      safety_violations: {
        Row: {
          id: string
          created_at: string
          user_id: string
          date: string
          type: string
          severity: string
          description: string
          status: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          date: string
          type: string
          severity: string
          description: string
          status: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          date?: string
          type?: string
          severity?: string
          description?: string
          status?: string
          updated_at?: string | null
        }
      }
      safety_commendations: {
        Row: {
          id: string
          created_at: string
          user_id: string
          date: string
          title: string
          description: string
          issued_by: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          date: string
          title: string
          description: string
          issued_by: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          date?: string
          title?: string
          description?: string
          issued_by?: string
          updated_at?: string | null
        }
      }
      urine_screens: {
        Row: {
          id: string
          created_at: string
          user_id: string
          date: string
          result: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          date: string
          result: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          date?: string
          result?: string
          notes?: string | null
          updated_at?: string | null
        }
      }
      certifications: {
        Row: {
          id: string
          created_at: string
          user_id: string
          name: string
          issue_date: string
          expiry_date: string
          issuing_authority: string
          certificate_url: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          name: string
          issue_date: string
          expiry_date: string
          issuing_authority: string
          certificate_url?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          name?: string
          issue_date?: string
          expiry_date?: string
          issuing_authority?: string
          certificate_url?: string | null
          updated_at?: string | null
        }
      }
      notification_preferences: {
        Row: {
          id: string
          user_id: string
          email_notifications: boolean
          sms_notifications: boolean
          push_notifications: boolean
          certification_expiry_alerts: boolean
          certification_alert_days: number
          drug_screen_reminders: boolean
          safety_alerts: boolean
          project_updates: boolean
          training_reminders: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          email_notifications?: boolean
          sms_notifications?: boolean
          push_notifications?: boolean
          certification_expiry_alerts?: boolean
          certification_alert_days?: number
          drug_screen_reminders?: boolean
          safety_alerts?: boolean
          project_updates?: boolean
          training_reminders?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          email_notifications?: boolean
          sms_notifications?: boolean
          push_notifications?: boolean
          certification_expiry_alerts?: boolean
          certification_alert_days?: number
          drug_screen_reminders?: boolean
          safety_alerts?: boolean
          project_updates?: boolean
          training_reminders?: boolean
          created_at?: string
          updated_at?: string | null
        }
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
  }
}