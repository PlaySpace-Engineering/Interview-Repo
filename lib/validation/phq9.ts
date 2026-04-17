export type PHQ9Response = [
  number, number, number, number, number, number, number, number, number,
];

export type PHQ9SeverityBand =
  | "None"
  | "Mild"
  | "Moderate"
  | "Moderately Severe"
  | "Severe";

export const PHQ9_ITEMS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television",
  "Moving or speaking so slowly that other people could have noticed — or the opposite, being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead or of hurting yourself in some way",
] as const;

export const PHQ9_ANSWER_LABELS = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "Several days" },
  { value: 2, label: "More than half the days" },
  { value: 3, label: "Nearly every day" },
] as const;

function assertResponses(r: readonly number[]): asserts r is PHQ9Response {
  if (r.length !== 9) {
    throw new Error(`PHQ-9 requires exactly 9 responses, received ${r.length}`);
  }
  for (const v of r) {
    if (!Number.isInteger(v) || v < 0 || v > 3) {
      throw new Error(`PHQ-9 responses must be integers in 0..3 (got ${v})`);
    }
  }
}

export function scorePHQ9(responses: readonly number[]): number {
  assertResponses(responses);
  return responses.reduce((sum, v) => sum + v, 0);
}

export function severityBand(total: number): PHQ9SeverityBand {
  if (!Number.isInteger(total) || total < 0 || total > 27) {
    throw new Error(`PHQ-9 total must be an integer in 0..27 (got ${total})`);
  }
  if (total <= 4) return "None";
  if (total <= 9) return "Mild";
  if (total <= 14) return "Moderate";
  if (total <= 19) return "Moderately Severe";
  return "Severe";
}

export function siFlag(responses: readonly number[]): boolean {
  assertResponses(responses);
  return responses[8] > 0;
}
