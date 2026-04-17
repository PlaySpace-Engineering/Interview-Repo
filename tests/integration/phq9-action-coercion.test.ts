import { describe, expect, it, afterAll } from "vitest";
import {
  anonClient,
  SEEDED_CLINICIAN,
  SEED_CLIENT_JAMIE,
  cleanupRowsById,
} from "./_helpers";

describe("PHQ-9 response integer coercion (DB-layer probe)", () => {
  const sb = anonClient();
  const ids: string[] = [];

  afterAll(async () => {
    await cleanupRowsById("assessments", ids);
  });

  it("rejects a fractional response like 2.5 at the DB layer", async () => {
    const { data, error } = await sb
      .from("assessments")
      .insert({
        client_id: SEED_CLIENT_JAMIE,
        clinician_id: SEEDED_CLINICIAN,
        instrument: "PHQ-9",
        responses: [2.5, 3, 3, 3, 3, 3, 3, 3, 3],
      })
      .select()
      .single();

    if (data) ids.push(data.id);
    expect(error).not.toBeNull();
    expect(error?.message ?? "").toMatch(/integer|numeric|invalid input/i);
  });

  it("accepts all-integer responses", async () => {
    const { data, error } = await sb
      .from("assessments")
      .insert({
        client_id: SEED_CLIENT_JAMIE,
        clinician_id: SEEDED_CLINICIAN,
        instrument: "PHQ-9",
        responses: [2, 3, 3, 3, 3, 3, 3, 3, 3],
      })
      .select()
      .single();

    expect(error).toBeNull();
    if (!data) throw new Error("insert returned no row");
    ids.push(data.id);
    expect(data.total_score).toBe(26);
  });
});
