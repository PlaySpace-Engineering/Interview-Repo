import { describe, expect, it, afterAll, beforeAll } from "vitest";
import {
  anonClient,
  SEEDED_CLINICIAN,
  cleanupRowsById,
} from "./_helpers";

describe("clients integration (real RLS + real Postgres)", () => {
  const sb = anonClient();
  const createdIds: string[] = [];

  afterAll(async () => {
    await cleanupRowsById("clients", createdIds);
  });

  beforeAll(async () => {
    // Sanity check DB is reachable + seed is present.
    const { data, error } = await sb.from("clients").select("id").eq("clinician_id", SEEDED_CLINICIAN);
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThanOrEqual(3);
  });

  it("creates a client under the seeded clinician", async () => {
    const { data, error } = await sb
      .from("clients")
      .insert({
        clinician_id: SEEDED_CLINICIAN,
        legal_name: "Integration Test Client",
        emergency_contact_name: "Kin",
        emergency_contact_phone: "555-TEST",
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBeDefined();
    if (data) createdIds.push(data.id);
  });

  it("blocks insert for a foreign clinician via RLS WITH CHECK", async () => {
    const { error } = await sb.from("clients").insert({
      clinician_id: "99999999-9999-9999-9999-999999999999",
      legal_name: "Ghost",
      emergency_contact_name: "Ghost Kin",
      emergency_contact_phone: "555-GHST",
    });
    expect(error).not.toBeNull();
  });

  it("can update the status of an owned client", async () => {
    const { data: inserted } = await sb
      .from("clients")
      .insert({
        clinician_id: SEEDED_CLINICIAN,
        legal_name: "Temp Status Client",
        emergency_contact_name: "Kin",
        emergency_contact_phone: "555-ST",
      })
      .select()
      .single();
    if (!inserted) throw new Error("seed insert failed");
    createdIds.push(inserted.id);

    const { error } = await sb
      .from("clients")
      .update({ status: "discharged" })
      .eq("id", inserted.id);
    expect(error).toBeNull();

    const { data: after } = await sb
      .from("clients")
      .select("status")
      .eq("id", inserted.id)
      .single();
    expect(after?.status).toBe("discharged");
  });

  it("requires emergency contact (DB NOT NULL)", async () => {
    const { error } = await sb
      .from("clients")
      // @ts-expect-error intentionally missing required fields to assert DB rejects
      .insert({ clinician_id: SEEDED_CLINICIAN, legal_name: "No Kin" });
    expect(error).not.toBeNull();
  });
});
