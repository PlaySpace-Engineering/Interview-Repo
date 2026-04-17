"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SEEDED_CLINICIAN_ID } from "@/lib/constants";

type CptCode = "90791" | "90832" | "90834" | "90837";
type Location = "in_person" | "telehealth" | "phone";
type ApptStatus = "scheduled" | "confirmed" | "attended" | "no_show" | "late_cancel";

export async function createAppointmentAction(formData: FormData) {
  const clientId = String(formData.get("client_id") ?? "");
  const startAt = String(formData.get("start_at") ?? "");
  const durationMin = Number(formData.get("duration_min") ?? "45");
  const location = String(formData.get("location") ?? "in_person") as Location;
  const cpt = String(formData.get("cpt_code") ?? "90834") as CptCode;

  if (!clientId || !startAt) throw new Error("Client and start time required");

  const start = new Date(startAt);
  const end = new Date(start.getTime() + durationMin * 60_000);

  const sb = await createSupabaseServerClient();
  const { data, error } = await sb
    .from("appointments")
    .insert({
      clinician_id: SEEDED_CLINICIAN_ID,
      client_id: clientId,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      location,
      cpt_code: cpt,
      status: "scheduled",
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to schedule");
  revalidatePath("/appointments");
  revalidatePath(`/clients/${clientId}`);
  redirect(`/appointments/${data.id}`);
}

export async function updateAppointmentStatusAction(id: string, status: ApptStatus) {
  const sb = await createSupabaseServerClient();
  const { error } = await sb.from("appointments").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/appointments/${id}`);
  revalidatePath("/appointments");
  revalidatePath("/");
}
