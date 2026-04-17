import { z } from "zod";

const nonEmpty = z.string().trim().min(1, "Required");

export const soapSchema = z.object({
  format: z.literal("SOAP"),
  content: z.object({
    subjective: nonEmpty,
    objective: nonEmpty,
    assessment: nonEmpty,
    plan: nonEmpty,
  }),
});

export const dapSchema = z.object({
  format: z.literal("DAP"),
  content: z.object({
    data: nonEmpty,
    assessment: nonEmpty,
    plan: nonEmpty,
  }),
});

export const noteContentSchema = z.discriminatedUnion("format", [
  soapSchema,
  dapSchema,
]);

export type NoteContent = z.infer<typeof noteContentSchema>;

export function parseNoteContent(input: unknown): NoteContent {
  return noteContentSchema.parse(input);
}

export const riskAssessmentSchema = z.object({
  si: z.boolean(),
  hi: z.boolean(),
  self_harm: z.boolean(),
});

export type RiskAssessment = z.infer<typeof riskAssessmentSchema>;
