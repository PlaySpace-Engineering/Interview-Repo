export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          client_id: string
          clinician_id: string
          cpt_code: Database["public"]["Enums"]["cpt_code"]
          created_at: string
          end_at: string
          id: string
          location: Database["public"]["Enums"]["appt_location"]
          start_at: string
          status: Database["public"]["Enums"]["appt_status"]
        }
        Insert: {
          client_id: string
          clinician_id: string
          cpt_code?: Database["public"]["Enums"]["cpt_code"]
          created_at?: string
          end_at: string
          id?: string
          location?: Database["public"]["Enums"]["appt_location"]
          start_at: string
          status?: Database["public"]["Enums"]["appt_status"]
        }
        Update: {
          client_id?: string
          clinician_id?: string
          cpt_code?: Database["public"]["Enums"]["cpt_code"]
          created_at?: string
          end_at?: string
          id?: string
          location?: Database["public"]["Enums"]["appt_location"]
          start_at?: string
          status?: Database["public"]["Enums"]["appt_status"]
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_clinician_id_fkey"
            columns: ["clinician_id"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          administered_at: string
          client_id: string
          clinician_id: string
          created_at: string
          id: string
          instrument: Database["public"]["Enums"]["instrument"]
          responses: number[]
          severity_band: string | null
          si_flag: boolean | null
          total_score: number | null
        }
        Insert: {
          administered_at?: string
          client_id: string
          clinician_id: string
          created_at?: string
          id?: string
          instrument?: Database["public"]["Enums"]["instrument"]
          responses: number[]
          severity_band?: string | null
          si_flag?: boolean | null
          total_score?: number | null
        }
        Update: {
          administered_at?: string
          client_id?: string
          clinician_id?: string
          created_at?: string
          id?: string
          instrument?: Database["public"]["Enums"]["instrument"]
          responses?: number[]
          severity_band?: string | null
          si_flag?: boolean | null
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_clinician_id_fkey"
            columns: ["clinician_id"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          clinician_id: string
          created_at: string
          dob: string | null
          email: string | null
          emergency_contact_name: string
          emergency_contact_phone: string
          id: string
          intake_date: string | null
          legal_name: string
          phone: string | null
          preferred_name: string | null
          pronouns: string | null
          status: Database["public"]["Enums"]["client_status"]
        }
        Insert: {
          clinician_id: string
          created_at?: string
          dob?: string | null
          email?: string | null
          emergency_contact_name: string
          emergency_contact_phone: string
          id?: string
          intake_date?: string | null
          legal_name: string
          phone?: string | null
          preferred_name?: string | null
          pronouns?: string | null
          status?: Database["public"]["Enums"]["client_status"]
        }
        Update: {
          clinician_id?: string
          created_at?: string
          dob?: string | null
          email?: string | null
          emergency_contact_name?: string
          emergency_contact_phone?: string
          id?: string
          intake_date?: string | null
          legal_name?: string
          phone?: string | null
          preferred_name?: string | null
          pronouns?: string | null
          status?: Database["public"]["Enums"]["client_status"]
        }
        Relationships: [
          {
            foreignKeyName: "clients_clinician_id_fkey"
            columns: ["clinician_id"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id"]
          },
        ]
      }
      clinicians: {
        Row: {
          created_at: string
          email: string
          id: string
          legal_name: string
          license_number: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          legal_name: string
          license_number?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          legal_name?: string
          license_number?: string | null
        }
        Relationships: []
      }
      intake_forms: {
        Row: {
          allergies: string[]
          client_id: string
          consent_signed_at: string | null
          created_at: string
          hipaa_ack_signed_at: string | null
          id: string
          medications: string[]
          presenting_problem: string
          prior_treatment: string | null
          suicidal_ideation_screen: boolean
          symptom_duration: string | null
        }
        Insert: {
          allergies?: string[]
          client_id: string
          consent_signed_at?: string | null
          created_at?: string
          hipaa_ack_signed_at?: string | null
          id?: string
          medications?: string[]
          presenting_problem: string
          prior_treatment?: string | null
          suicidal_ideation_screen?: boolean
          symptom_duration?: string | null
        }
        Update: {
          allergies?: string[]
          client_id?: string
          consent_signed_at?: string | null
          created_at?: string
          hipaa_ack_signed_at?: string | null
          id?: string
          medications?: string[]
          presenting_problem?: string
          prior_treatment?: string | null
          suicidal_ideation_screen?: boolean
          symptom_duration?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intake_forms_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      note_addendums: {
        Row: {
          content: string
          created_at: string
          id: string
          note_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          note_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          note_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_addendums_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "progress_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_notes: {
        Row: {
          appointment_id: string
          client_id: string
          clinician_id: string
          content: Json
          created_at: string
          format: Database["public"]["Enums"]["note_format"]
          id: string
          interventions_used: string[]
          locked: boolean
          risk_assessment: Json
          signed_at: string | null
        }
        Insert: {
          appointment_id: string
          client_id: string
          clinician_id: string
          content: Json
          created_at?: string
          format: Database["public"]["Enums"]["note_format"]
          id?: string
          interventions_used?: string[]
          locked?: boolean
          risk_assessment?: Json
          signed_at?: string | null
        }
        Update: {
          appointment_id?: string
          client_id?: string
          clinician_id?: string
          content?: Json
          created_at?: string
          format?: Database["public"]["Enums"]["note_format"]
          id?: string
          interventions_used?: string[]
          locked?: boolean
          risk_assessment?: Json
          signed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_notes_clinician_id_fkey"
            columns: ["clinician_id"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      seeded_clinician_id: { Args: never; Returns: string }
    }
    Enums: {
      appt_location: "in_person" | "telehealth" | "phone"
      appt_status:
        | "scheduled"
        | "confirmed"
        | "attended"
        | "no_show"
        | "late_cancel"
      client_status: "active" | "inactive" | "waitlist" | "discharged"
      cpt_code: "90791" | "90832" | "90834" | "90837"
      instrument: "PHQ-9"
      note_format: "SOAP" | "DAP"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      appt_location: ["in_person", "telehealth", "phone"],
      appt_status: [
        "scheduled",
        "confirmed",
        "attended",
        "no_show",
        "late_cancel",
      ],
      client_status: ["active", "inactive", "waitlist", "discharged"],
      cpt_code: ["90791", "90832", "90834", "90837"],
      instrument: ["PHQ-9"],
      note_format: ["SOAP", "DAP"],
    },
  },
} as const

