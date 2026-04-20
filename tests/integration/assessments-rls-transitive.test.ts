import { describe, expect, it, afterAll } from "vitest";
import {
  anonClient,
  SEED_CLIENT_JAMIE,
  cleanupRowsById,
} from "./_helpers";

describe("assessments RLS — direct clinician_id predicate", () => {
  const sb = anonClient();
  const ids: string[] = [];

  afterAll(async () => {
    await cleanupRowsById("assessments", ids);
  });

  it("blocks insert when clinician_id does not match the seeded clinician", async () => {
    const { data, error } = await sb
      .from("assessments")
      .insert({
        client_id: SEED_CLIENT_JAMIE,
        clinician_id: "99999999-9999-9999-9999-999999999999",
        instrument: "PHQ-9",
        responses: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      })
      .select()
      .single();

    if (data?.id) ids.push(data.id);
    expect(error).not.toBeNull();
  });
});
