import { describe, expect, it, afterAll } from "vitest";
import {
  anonClient,
  SEEDED_CLINICIAN,
  SEED_CLIENT_JAMIE,
  cleanupRowsById,
} from "./_helpers";

describe("progress_notes lock semantics (real DB)", () => {
  const sb = anonClient();
  const apptIds: string[] = [];
  const noteIds: string[] = [];

  afterAll(async () => {
    await cleanupRowsById("progress_notes", noteIds);
    await cleanupRowsById("appointments", apptIds);
  });

  async function newAppt() {
    const { data, error } = await sb
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
    expect(error).toBeNull();
    if (!data) throw new Error("appt insert failed");
    apptIds.push(data.id);
    return data.id;
  }

  async function newNote(apptId: string) {
    const { data, error } = await sb
      .from("progress_notes")
      .insert({
        appointment_id: apptId,
        client_id: SEED_CLIENT_JAMIE,
        clinician_id: SEEDED_CLINICIAN,
        format: "SOAP",
        content: {
          subjective: "s", objective: "o", assessment: "a", plan: "p",
        },
      })
      .select()
      .single();
    expect(error).toBeNull();
    if (!data) throw new Error("note insert failed");
    noteIds.push(data.id);
    return data.id;
  }

  it("allows the sign-and-lock UPDATE in a single statement", async () => {
    const apptId = await newAppt();
    const noteId = await newNote(apptId);

    const { error } = await sb
      .from("progress_notes")
      .update({ signed_at: new Date().toISOString(), locked: true })
      .eq("id", noteId);
    expect(error).toBeNull();
  });

  it("rejects content edits after lock", async () => {
    const apptId = await newAppt();
    const noteId = await newNote(apptId);
    await sb
      .from("progress_notes")
      .update({ signed_at: new Date().toISOString(), locked: true })
      .eq("id", noteId);

    const { error } = await sb
      .from("progress_notes")
      .update({ content: { subjective: "edit", objective: "o", assessment: "a", plan: "p" } })
      .eq("id", noteId);
    expect(error).not.toBeNull();
  });

  it("allows addendum inserts after lock", async () => {
    const apptId = await newAppt();
    const noteId = await newNote(apptId);
    await sb
      .from("progress_notes")
      .update({ signed_at: new Date().toISOString(), locked: true })
      .eq("id", noteId);

    const { error } = await sb
      .from("note_addendums")
      .insert({ note_id: noteId, content: "Addendum after lock" });
    expect(error).toBeNull();

    const { data } = await sb
      .from("note_addendums")
      .select("id")
      .eq("note_id", noteId);
    expect((data ?? []).length).toBe(1);
  });
});
