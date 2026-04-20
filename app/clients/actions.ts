"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SEEDED_CLINICIAN_ID } from "@/lib/constants";

function str(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length === 0 ? null : s;
}

export async function createClientAction(formData: FormData) {
  const legal = str(formData.get("legal_name"));
  const emergencyName = str(formData.get("emergency_contact_name"));
  const emergencyPhone = str(formData.get("emergency_contact_phone"));

  if (!legal || !emergencyName || !emergencyPhone) {
    throw new Error("Legal name and emergency contact are required.");
  }

  const sb = await createSupabaseServerClient();
  const { data, error } = await sb
    .from("clients")
    .insert({
      clinician_id: SEEDED_CLINICIAN_ID,
      legal_name: legal,
      preferred_name: str(formData.get("preferred_name")),
      pronouns: str(formData.get("pronouns")),
      dob: str(formData.get("dob")),
      phone: str(formData.get("phone")),
      email: str(formData.get("email")),
      emergency_contact_name: emergencyName,
      emergency_contact_phone: emergencyPhone,
      status: (str(formData.get("status")) ?? "active") as "active" | "inactive" | "waitlist" | "discharged",
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create client");
  }
  revalidatePath("/clients");
  redirect(`/clients/${data.id}/intake`);
}

export async function updateClientStatusAction(clientId: string, status: string) {
  const sb = await createSupabaseServerClient();
  const { error } = await sb.from("clients").update({ status }).eq("id", clientId);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
}

export async function saveIntakeAction(clientId: string, formData: FormData) {
  const sb = await createSupabaseServerClient();

  const medications = (str(formData.get("medications")) ?? "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  const allergies = (str(formData.get("allergies")) ?? "")
    .split(",").map((s) => s.trim()).filter(Boolean);

  const consent = formData.get("consent") === "on";
  const hipaa = formData.get("hipaa") === "on";
  const siScreen = formData.get("si_screen") === "on";

  const payload = {
    client_id: clientId,
    presenting_problem: str(formData.get("presenting_problem")) ?? "",
    symptom_duration: str(formData.get("symptom_duration")),
    medications,
    allergies,
    prior_treatment: str(formData.get("prior_treatment")),
    suicidal_ideation_screen: siScreen,
    consent_signed_at: consent ? new Date().toISOString() : null,
    hipaa_ack_signed_at: hipaa ? new Date().toISOString() : null,
  };

  if (!payload.presenting_problem) {
    throw new Error("Presenting problem is required.");
  }

  const { error } = await sb
    .from("intake_forms")
    .upsert(payload, { onConflict: "client_id" });
  if (error) throw new Error(error.message);

  await sb.from("clients").update({ intake_date: new Date().toISOString().slice(0, 10) }).eq("id", clientId);

  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}
