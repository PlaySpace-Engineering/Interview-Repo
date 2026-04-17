import { describe, expect, it } from "vitest";
import { noteContentSchema, parseNoteContent } from "@/lib/validation/note";

describe("SOAP validation", () => {
  it("accepts well-formed SOAP", () => {
    const res = noteContentSchema.safeParse({
      format: "SOAP",
      content: {
        subjective: "Reports anxiety at work.",
        objective: "Alert, oriented, affect congruent.",
        assessment: "GAD, moderate.",
        plan: "Continue weekly CBT; homework: thought log.",
      },
    });
    expect(res.success).toBe(true);
  });

  it("rejects SOAP missing a section", () => {
    const res = noteContentSchema.safeParse({
      format: "SOAP",
      content: {
        subjective: "x",
        objective: "x",
        assessment: "x",
      },
    });
    expect(res.success).toBe(false);
  });

  it("rejects SOAP with whitespace-only fields", () => {
    const res = noteContentSchema.safeParse({
      format: "SOAP",
      content: {
        subjective: "   ",
        objective: "x",
        assessment: "x",
        plan: "x",
      },
    });
    expect(res.success).toBe(false);
  });
});

describe("DAP validation", () => {
  it("accepts well-formed DAP", () => {
    const res = noteContentSchema.safeParse({
      format: "DAP",
      content: {
        data: "Session covered recent panic episode.",
        assessment: "Panic disorder with agoraphobia.",
        plan: "Interoceptive exposure scheduled next session.",
      },
    });
    expect(res.success).toBe(true);
  });

  it("rejects DAP missing a field", () => {
    const res = noteContentSchema.safeParse({
      format: "DAP",
      content: { data: "x", assessment: "x" },
    });
    expect(res.success).toBe(false);
  });
});

describe("parseNoteContent helper", () => {
  it("throws on invalid input", () => {
    expect(() =>
      parseNoteContent({ format: "SOAP", content: { subjective: "" } })
    ).toThrow();
  });

  it("returns typed content on valid input", () => {
    const parsed = parseNoteContent({
      format: "DAP",
      content: { data: "a", assessment: "b", plan: "c" },
    });
    expect(parsed.format).toBe("DAP");
    if (parsed.format === "DAP") {
      expect(parsed.content.data).toBe("a");
    }
  });
});
