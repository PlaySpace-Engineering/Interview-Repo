import { describe, expect, it, afterAll } from "vitest";
import {
  anonClient,
  SEEDED_CLINICIAN,
  SEED_CLIENT_JAMIE,
  cleanupRowsById,
} from "./_helpers";

describe("PHQ-9 si_flag semantics", () => {
  const sb = anonClient();
  const ids: string[] = [];

  afterAll(async () => {
    await cleanupRowsById("assessments", ids);
  });

  it("si_flag is false when item 9 is zero", async () => {
    const { data } = await sb
      .from("assessments")
      .insert({
        client_id: SEED_CLIENT_JAMIE,
        clinician_id: SEEDED_CLINICIAN,
        instrument: "PHQ-9",
        responses: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      })
      .select()
      .single();
    if (data) ids.push(data.id);
    expect(data?.si_flag).toBe(false);
  });

  it("si_flag is true when item 9 > 0", async () => {
    const { data } = await sb
      .from("assessments")
      .insert({
        client_id: SEED_CLIENT_JAMIE,
        clinician_id: SEEDED_CLINICIAN,
        instrument: "PHQ-9",
        responses: [0, 0, 0, 0, 0, 0, 0, 0, 1],
      })
      .select()
      .single();
    if (data) ids.push(data.id);
    expect(data?.si_flag).toBe(true);
  });
});
