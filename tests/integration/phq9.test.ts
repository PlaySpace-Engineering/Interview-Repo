import { describe, expect, it, afterAll } from "vitest";
import {
  anonClient,
  SEEDED_CLINICIAN,
  SEED_CLIENT_JAMIE,
  cleanupRowsById,
} from "./_helpers";

describe("assessments generated columns (real DB)", () => {
  const sb = anonClient();
  const ids: string[] = [];

  afterAll(async () => {
    await cleanupRowsById("assessments", ids);
  });

  async function insertPHQ(responses: number[]) {
    const { data, error } = await sb
      .from("assessments")
      .insert({
        client_id: SEED_CLIENT_JAMIE,
        clinician_id: SEEDED_CLINICIAN,
        instrument: "PHQ-9",
        responses,
      })
      .select()
      .single();
    if (error) throw error;
    if (!data) throw new Error("insert returned no data");
    ids.push(data.id);
    return data;
  }

  it("computes total_score, severity_band and si_flag via generated columns", async () => {
    const row = await insertPHQ([2, 2, 2, 2, 2, 2, 2, 2, 2]); // 18 → Moderately Severe
    expect(row.total_score).toBe(18);
    expect(row.severity_band).toBe("Moderately Severe");
    expect(row.si_flag).toBe(true);
  });

  it("maps each severity band", async () => {
    const cases: Array<[number[], number, string]> = [
      [[0, 0, 0, 0, 0, 0, 0, 0, 0], 0, "None"],
      [[1, 1, 0, 1, 1, 1, 0, 1, 0], 6, "Mild"],
      [[2, 1, 2, 1, 1, 1, 1, 1, 0], 10, "Moderate"],
      [[3, 2, 2, 2, 2, 1, 1, 1, 1], 15, "Moderately Severe"],
      [[3, 3, 3, 3, 3, 3, 3, 2, 0], 23, "Severe"],
    ];
    for (const [resp, total, band] of cases) {
      const row = await insertPHQ(resp);
      expect(row.total_score).toBe(total);
      expect(row.severity_band).toBe(band);
    }
  });

  it("rejects out-of-range values via CHECK", async () => {
    const { error } = await sb.from("assessments").insert({
      client_id: SEED_CLIENT_JAMIE,
      clinician_id: SEEDED_CLINICIAN,
      instrument: "PHQ-9",
      responses: [0, 0, 0, 0, 0, 0, 0, 0, 4],
    });
    expect(error).not.toBeNull();
  });

  it("rejects wrong-length arrays via CHECK", async () => {
    const { error } = await sb.from("assessments").insert({
      client_id: SEED_CLIENT_JAMIE,
      clinician_id: SEEDED_CLINICIAN,
      instrument: "PHQ-9",
      responses: [0, 0, 0],
    });
    expect(error).not.toBeNull();
  });
});
