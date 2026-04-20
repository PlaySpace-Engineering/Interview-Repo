"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SEEDED_CLINICIAN_ID } from "@/lib/constants";

export async function submitPHQ9Action(clientId: string, formData: FormData) {
  const responses: number[] = [];
  for (let i = 0; i < 9; i++) {
    const v = formData.get(`q${i}`);
    if (v === null) throw new Error(`Missing response for item ${i + 1}`);
    const n = Number(v);
    if (Number.isNaN(n) || n < 0 || n > 3) {
      throw new Error(`Invalid response for item ${i + 1}`);
    }
    responses.push(n);
  }

  const sb = await createSupabaseServerClient();
  const { data, error } = await sb
    .from("assessments")
    .insert({
      client_id: clientId,
      clinician_id: SEEDED_CLINICIAN_ID,
      instrument: "PHQ-9",
      responses,
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to save assessment");

  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/assessments/${clientId}/history`);
  redirect(`/assessments/${clientId}/history?latest=${data.id}`);
}
