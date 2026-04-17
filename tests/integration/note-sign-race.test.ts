import { describe, expect, it, afterAll } from "vitest";
import { anonClient, SEEDED_CLINICIAN, SEED_CLIENT_JAMIE, cleanupRowsById } from "./_helpers";

describe("concurrent sign-and-lock", () => {
  const sb = anonClient();
  const apptIds: string[] = [];
  const noteIds: string[] = [];

  afterAll(async () => {
    await cleanupRowsById("progress_notes", noteIds);
    await cleanupRowsById("appointments", apptIds);
  });

  async function racingSign(noteId: string) {
    const { data: n } = await sb
      .from("progress_notes")
      .select("id, locked")
      .eq("id", noteId)
      .single();
    if (!n || n.locked) return { ok: true as const };
    await new Promise((r) => setTimeout(r, 50));
    const { error } = await sb
      .from("progress_notes")
      .update({ signed_at: new Date().toISOString(), locked: true })
      .eq("id", noteId);
    return { ok: !error, error };
  }

  it("concurrent sign attempts do not surface a raw lock-trigger error", async () => {
    // seed a fresh appt + unsigned note
    const { data: appt } = await sb.from("appointments").insert({
      clinician_id: SEEDED_CLINICIAN,
      client_id: SEED_CLIENT_JAMIE,
      start_at: new Date(Date.now() + 3_600_000).toISOString(),
      end_at:   new Date(Date.now() + 5_400_000).toISOString(),
      location: "in_person", cpt_code: "90834", status: "attended",
    }).select().single();
    if (!appt) throw new Error("appt insert");
    apptIds.push(appt.id);

    const { data: note } = await sb.from("progress_notes").insert({
      appointment_id: appt.id,
      client_id: SEED_CLIENT_JAMIE,
      clinician_id: SEEDED_CLINICIAN,
      format: "SOAP",
      content: { subjective: "s", objective: "o", assessment: "a", plan: "p" },
    }).select().single();
    if (!note) throw new Error("note insert");
    noteIds.push(note.id);

    const [r1, r2] = await Promise.all([racingSign(note.id), racingSign(note.id)]);
    const results = [r1, r2];
    const failures = results.filter((r) => !r.ok);

    // The fixed implementation (atomic UPDATE ... WHERE locked = false) yields
    // zero failures — the second UPDATE just matches 0 rows. The race pattern
    // planted in signNoteAction yields exactly one raw trigger error.
    expect(failures.map((f) => f.error?.message ?? "")).not.toContainEqual(
      expect.stringMatching(/locked/),
    );
  });
});
