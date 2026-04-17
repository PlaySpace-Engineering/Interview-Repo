import { describe, expect, it, afterAll } from "vitest";
import {
  anonClient,
  SEEDED_CLINICIAN,
  SEED_CLIENT_JAMIE,
  cleanupRowsById,
} from "./_helpers";

describe("progress_notes uniqueness per appointment", () => {
  const sb = anonClient();
  const apptIds: string[] = [];
  const noteIds: string[] = [];

  afterAll(async () => {
    await cleanupRowsById("progress_notes", noteIds);
    await cleanupRowsById("appointments", apptIds);
  });

  it("rejects a second progress note for the same appointment", async () => {
    const { data: appt, error: apptErr } = await sb
      .from("appointments")
      .insert({
        clinician_id: SEEDED_CLINICIAN,
        client_id: SEED_CLIENT_JAMIE,
        start_at: new Date(Date.now() + 3_600_000).toISOString(),
        end_at: new Date(Date.now() + 5_400_000).toISOString(),
        location: "in_person",
        cpt_code: "90834",
        status: "attended",
      })
      .select()
      .single();
    expect(apptErr).toBeNull();
    if (!appt) throw new Error("appt insert failed");
    apptIds.push(appt.id);

    const { data: firstNote, error: firstErr } = await sb
      .from("progress_notes")
      .insert({
        appointment_id: appt.id,
        client_id: SEED_CLIENT_JAMIE,
        clinician_id: SEEDED_CLINICIAN,
        format: "SOAP",
        content: { subjective: "s", objective: "o", assessment: "a", plan: "p" },
      })
      .select()
      .single();
    expect(firstErr).toBeNull();
    if (firstNote) noteIds.push(firstNote.id);

    const { data: secondNote, error: secondError } = await sb
      .from("progress_notes")
      .insert({
        appointment_id: appt.id,
        client_id: SEED_CLIENT_JAMIE,
        clinician_id: SEEDED_CLINICIAN,
        format: "SOAP",
        content: { subjective: "s2", objective: "o2", assessment: "a2", plan: "p2" },
      })
      .select()
      .single();
    if (secondNote?.id) noteIds.push(secondNote.id);

    // The UNIQUE constraint on appointment_id should make this insert fail.
    expect(secondError).not.toBeNull();
  });
});
