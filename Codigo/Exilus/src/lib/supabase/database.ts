import type {
  BenefitType,
  DocumentType,
  PaymentMethod,
  PaymentStatus,
} from '@/types/patient'
import type { UserRole } from '@/types/roles'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: UserRole
          email: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          role: UserRole
          email?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string
          role?: UserRole
          email?: string | null
          is_active?: boolean
        }
        Relationships: []
      }
      clinic_settings: {
        Row: {
          id: number
          clinic_name: string
          default_amount: number | string
          default_captador_amount: number | string
          quick_colors: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: number
          clinic_name?: string
          default_amount?: number
          default_captador_amount?: number
          quick_colors?: Json
          updated_by?: string | null
        }
        Update: {
          clinic_name?: string
          default_amount?: number
          default_captador_amount?: number
          quick_colors?: Json
          updated_by?: string | null
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          id: string
          email_attempted: string
          attempted_at: string
          success: boolean
          reason: 'success' | 'invalid_credentials' | 'blocked' | 'rate_limited'
          user_id: string | null
          user_agent: string | null
          is_reviewed: boolean
        }
        Insert: {
          id?: string
          email_attempted: string
          attempted_at?: string
          success: boolean
          reason: 'success' | 'invalid_credentials' | 'blocked' | 'rate_limited'
          user_id?: string | null
          user_agent?: string | null
          is_reviewed?: boolean
        }
        Update: {
          is_reviewed?: boolean
        }
        Relationships: []
      }
      patients: {
        Row: {
          id: string
          registered_at: string
          document_type: DocumentType
          document_number: string | null
          first_name: string
          middle_name: string | null
          last_name: string | null
          second_last_name: string | null
          age: number | null
          benefit: BenefitType | null
          captador_first_name: string | null
          captador_last_name: string | null
          optical_name: string | null
          amount: number | string
          entry_time: string | null
          exit_time: string | null
          duration_minutes: number | null
          payment_method: PaymentMethod | null
          payment_status: PaymentStatus | null
          general_observation: string | null
          condition: string | null
          email: string | null
          color_tag: string | null
          is_warranty: boolean
          current_visit_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          registered_at?: string
          document_type: DocumentType
          document_number?: string | null
          first_name: string
          middle_name?: string | null
          last_name?: string | null
          second_last_name?: string | null
          age?: number | null
          benefit?: BenefitType | null
          captador_first_name?: string | null
          captador_last_name?: string | null
          optical_name?: string | null
          amount?: number
          entry_time?: string | null
          exit_time?: string | null
          payment_method?: PaymentMethod | null
          payment_status?: PaymentStatus | null
          general_observation?: string | null
          condition?: string | null
          email?: string | null
          color_tag?: string | null
          is_warranty?: boolean
          current_visit_id?: string | null
          created_by?: string | null
        }
        Update: {
          document_type?: DocumentType
          document_number?: string | null
          first_name?: string
          middle_name?: string | null
          last_name?: string | null
          second_last_name?: string | null
          age?: number | null
          benefit?: BenefitType | null
          captador_first_name?: string | null
          captador_last_name?: string | null
          optical_name?: string | null
          amount?: number
          entry_time?: string | null
          exit_time?: string | null
          payment_method?: PaymentMethod | null
          payment_status?: PaymentStatus | null
          general_observation?: string | null
          condition?: string | null
          email?: string | null
          color_tag?: string | null
          is_warranty?: boolean
          current_visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'consultations_patient_id_fkey'
            columns: ['id']
            isOneToOne: false
            referencedRelation: 'consultations'
            referencedColumns: ['patient_id']
          },
        ]
      }
      consultations: {
        Row: {
          id: string
          patient_id: string
          oi_sphere: number | string | null
          oi_cylinder: number | string | null
          oi_axis: number | null
          od_sphere: number | string | null
          od_cylinder: number | string | null
          od_axis: number | null
          dp: number | string | null
          add_value: number | string | null
          glucose_mg_dl: number | null
          medical_observations: string | null
          visit_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          visit_id?: string | null
          oi_sphere?: number | null
          oi_cylinder?: number | null
          oi_axis?: number | null
          od_sphere?: number | null
          od_cylinder?: number | null
          od_axis?: number | null
          dp?: number | null
          add_value?: number | null
          glucose_mg_dl?: number | null
          medical_observations?: string | null
        }
        Update: {
          oi_sphere?: number | null
          oi_cylinder?: number | null
          oi_axis?: number | null
          od_sphere?: number | null
          od_cylinder?: number | null
          od_axis?: number | null
          dp?: number | null
          add_value?: number | null
          glucose_mg_dl?: number | null
          medical_observations?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'consultations_patient_id_fkey'
            columns: ['patient_id']
            isOneToOne: false
            referencedRelation: 'patients'
            referencedColumns: ['id']
          },
        ]
      }
      prescriptions: {
        Row: {
          id: string
          patient_id: string
          consultation_id: string
          prescription_date: string
          od_sphere: number | string | null
          od_cylinder: number | string | null
          od_axis: number | null
          oi_sphere: number | string | null
          oi_cylinder: number | string | null
          oi_axis: number | null
          dp: number | string | null
          add_value: number | string | null
          observations: string | null
          indications: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          consultation_id: string
          prescription_date?: string
          od_sphere?: number | null
          od_cylinder?: number | null
          od_axis?: number | null
          oi_sphere?: number | null
          oi_cylinder?: number | null
          oi_axis?: number | null
          dp?: number | null
          add_value?: number | null
          observations?: string | null
          indications?: string | null
          created_by?: string
        }
        Update: {
          od_sphere?: number | null
          od_cylinder?: number | null
          od_axis?: number | null
          oi_sphere?: number | null
          oi_cylinder?: number | null
          oi_axis?: number | null
          dp?: number | null
          add_value?: number | null
          observations?: string | null
          indications?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'prescriptions_patient_id_fkey'
            columns: ['patient_id']
            isOneToOne: false
            referencedRelation: 'patients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'prescriptions_consultation_id_fkey'
            columns: ['consultation_id']
            isOneToOne: false
            referencedRelation: 'consultations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'prescriptions_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          user_name: string
          user_role: string
          action: string
          entity_type: string
          entity_id: string | null
          entity_label: string | null
          description: string
          old_data: Json | null
          new_data: Json | null
          created_at: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          user_name: string
          user_role: string
          action: string
          entity_type: string
          entity_id?: string | null
          entity_label?: string | null
          description?: string
          old_data?: Json | null
          new_data?: Json | null
          created_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          user_name?: string
          user_role?: string
          description?: string
        }
        Relationships: [
          {
            foreignKeyName: 'audit_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      optics: {
        Row: {
          id: string
          name: string
          color_tag: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          color_tag?: string | null
        }
        Update: {
          name?: string
          color_tag?: string | null
        }
        Relationships: []
      }
      captadores: {
        Row: {
          id: string
          first_name: string
          last_name: string | null
          optical_id: string
          amount: number | string
          payment_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name?: string | null
          optical_id: string
          amount?: number
          payment_status?: string
        }
        Update: {
          first_name?: string
          last_name?: string | null
          optical_id?: string
          amount?: number
          payment_status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'captadores_optical_id_fkey'
            columns: ['optical_id']
            isOneToOne: false
            referencedRelation: 'optics'
            referencedColumns: ['id']
          },
        ]
      }
      captador_entries: {
        Row: {
          id: string
          captador_id: string
          optical_id: string
          patient_id: string | null
          amount: number | string
          payment_status: string
          occurred_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          captador_id: string
          optical_id: string
          patient_id?: string | null
          amount: number
          payment_status?: string
          occurred_at?: string
        }
        Update: {
          captador_id?: string
          optical_id?: string
          patient_id?: string | null
          amount?: number
          payment_status?: string
          occurred_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'captador_entries_captador_id_fkey'
            columns: ['captador_id']
            isOneToOne: false
            referencedRelation: 'captadores'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'captador_entries_optical_id_fkey'
            columns: ['optical_id']
            isOneToOne: false
            referencedRelation: 'optics'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'captador_entries_patient_id_fkey'
            columns: ['patient_id']
            isOneToOne: true
            referencedRelation: 'patients'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<never, never>
    Functions: {
      set_optical_color: {
        Args: {
          target_id: string
          new_color: string | null
        }
        Returns: Database['public']['Tables']['optics']['Row']
      }
      set_patient_color: {
        Args: {
          target_id: string
          new_color: string | null
        }
        Returns: Database['public']['Tables']['patients']['Row']
      }
      set_patient_warranty: {
        Args: {
          target_id: string
          new_warranty: boolean
        }
        Returns: Database['public']['Tables']['patients']['Row']
      }
      finish_patient_visit: {
        Args: {
          target_id: string
        }
        Returns: Database['public']['Tables']['patients']['Row']
      }
      record_login_attempt: {
        Args: {
          attempted_email: string
          was_success: boolean
          fail_reason: string
          attempted_user_id?: string | null
          client_user_agent?: string | null
        }
        Returns: undefined
      }
      get_login_throttle: {
        Args: {
          attempted_email: string
        }
        Returns: {
          failed_count: number
          is_blocked: boolean
          retry_after: string | null
        }[]
      }
      unreviewed_failed_login_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      mark_login_attempts_reviewed: {
        Args: {
          target_ids?: string[] | null
        }
        Returns: number
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_entity_type: string
          p_description: string
          p_entity_id?: string | null
          p_entity_label?: string | null
          p_old_data?: Json | null
          p_new_data?: Json | null
          p_actor_name?: string | null
        }
        Returns: string
      }
    }
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}

export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type ClinicSettingsRow =
  Database['public']['Tables']['clinic_settings']['Row']
export type LoginAttemptRow =
  Database['public']['Tables']['login_attempts']['Row']
export type PatientRow = Database['public']['Tables']['patients']['Row']
export type PatientInsert = Database['public']['Tables']['patients']['Insert']
export type PatientUpdate = Database['public']['Tables']['patients']['Update']
export type ConsultationRow = Database['public']['Tables']['consultations']['Row']
export type ConsultationInsert =
  Database['public']['Tables']['consultations']['Insert']
export type ConsultationUpdate =
  Database['public']['Tables']['consultations']['Update']
export type PrescriptionRow =
  Database['public']['Tables']['prescriptions']['Row']
export type PrescriptionInsert =
  Database['public']['Tables']['prescriptions']['Insert']
export type PrescriptionUpdate =
  Database['public']['Tables']['prescriptions']['Update']
export type AuditLogRow = Database['public']['Tables']['audit_logs']['Row']
export type OpticalRow = Database['public']['Tables']['optics']['Row']
export type OpticalInsert = Database['public']['Tables']['optics']['Insert']
export type OpticalUpdate = Database['public']['Tables']['optics']['Update']
export type CaptadorRow = Database['public']['Tables']['captadores']['Row']
export type CaptadorInsert = Database['public']['Tables']['captadores']['Insert']
export type CaptadorUpdate = Database['public']['Tables']['captadores']['Update']
export type CaptadorEntryRow =
  Database['public']['Tables']['captador_entries']['Row']
export type CaptadorEntryInsert =
  Database['public']['Tables']['captador_entries']['Insert']
export type CaptadorEntryUpdate =
  Database['public']['Tables']['captador_entries']['Update']
