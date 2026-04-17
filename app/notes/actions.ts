"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SEEDED_CLINICIAN_ID } from "@/lib/constants";
import { parseNoteContent, type NoteContent } from "@/lib/validation/note";

type Draft = NoteContent & {
  interventions: string[];
  risk: Record<string, boolean>;
};

function parseDraft(formData: FormData): Draft {
  const format = String(formData.get("format") ?? "SOAP") as "SOAP" | "DAP";

  const content =
    format === "SOAP"
      ? {
          subjective: String(formData.get("subjective") ?? ""),
          objective: String(formData.get("objective") ?? ""),
          assessment: String(formData.get("assessment") ?? ""),
          plan: String(formData.get("plan") ?? ""),
        }
      : {
          data: String(formData.get("data") ?? ""),
          assessment: String(formData.get("assessment") ?? ""),
          plan: String(formData.get("plan") ?? ""),
        };

  const parsed = parseNoteContent({ format, content });

  const interventions = formData.getAll("interventions").map((v) => String(v));

  return {
    ...parsed,
    interventions,
    risk: {
      suicidal: formData.get("si") === "on",
      hi: formData.get("hi") === "on",
      self_harm: formData.get("self_harm") === "on",
    },
  };
}

export async function createNoteAction(appointmentId: string, formData: FormData) {
  const draft = parseDraft(formData);
  const intent = String(formData.get("intent") ?? "save");

  const sb = await createSupabaseServerClient();
  const { data: appt, error: apptErr } = await sb
    .from("appointments")
    .select("id, client_id")
    .eq("id", appointmentId)
    .eq("clinician_id", SEEDED_CLINICIAN_ID)
    .single();
  if (apptErr || !appt) throw new Error("Appointment not found");

  const signNow = intent === "sign";

  const { data, error } = await sb
    .from("progress_notes")
    .insert({
      appointment_id: appointmentId,
      client_id: appt.client_id,
      clinician_id: SEEDED_CLINICIAN_ID,
      format: draft.format,
      content: draft.content,
      interventions_used: draft.interventions,
      risk_assessment: draft.risk,
      signed_at: signNow ? new Date().toISOString() : null,
      locked: signNow,
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create note");

  revalidatePath(`/clients/${appt.client_id}`);
  revalidatePath(`/appointments/${appointmentId}`);
  revalidatePath("/");
  redirect(`/notes/${data.id}`);
}

export async function signNoteAction(noteId: string) {
  const sb = await createSupabaseServerClient();
  const { data: note } = await sb
    .from("progress_notes")
    .select("id, locked, client_id, appointment_id")
    .eq("id", noteId)
    .single();
  if (!note || note.locked) return;

  await new Promise((r) => setTimeout(r, 50));

  const { error } = await sb
    .from("progress_notes")
    .update({ signed_at: new Date().toISOString(), locked: true })
    .eq("id", noteId);
  if (error) throw new Error(error.message);

  revalidatePath(`/notes/${noteId}`);
  revalidatePath(`/clients/${note.client_id}`);
  revalidatePath(`/appointments/${note.appointment_id}`);
  revalidatePath("/");
}

export async function addAddendumAction(noteId: string, formData: FormData) {
  const content = String(formData.get("content") ?? "").trim();
  if (!content) throw new Error("Addendum content required");
  const sb = await createSupabaseServerClient();
  const { error } = await sb.from("note_addendums").insert({ note_id: noteId, content });
  if (error) throw new Error(error.message);
  revalidatePath(`/notes/${noteId}`);
}
