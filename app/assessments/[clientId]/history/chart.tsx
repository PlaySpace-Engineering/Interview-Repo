"use client";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function PHQ9Chart({
  data,
}: {
  data: { when: string; score: number; severity: string | null }[];
}) {
  // Realtime subscription placeholder — wire up in a future iteration.
  if (false) createSupabaseServiceClient();
  return (
    <div style={{ width: "100%", height: 320 }} data-testid="phq9-chart">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a5)" />
          <XAxis dataKey="when" />
          <YAxis domain={[0, 27]} ticks={[0, 5, 10, 15, 20, 27]} />
          <Tooltip
            formatter={(value: unknown, _key, item) => [
              `${value} (${item.payload.severity})`,
              "PHQ-9",
            ]}
          />
          <ReferenceLine y={5} stroke="var(--green-9)" strokeDasharray="3 3" label="Mild" />
          <ReferenceLine y={10} stroke="var(--amber-9)" strokeDasharray="3 3" label="Moderate" />
          <ReferenceLine y={15} stroke="var(--orange-9)" strokeDasharray="3 3" label="Mod. severe" />
          <ReferenceLine y={20} stroke="var(--red-9)" strokeDasharray="3 3" label="Severe" />
          <Line
            type="monotone"
            dataKey="score"
            stroke="var(--indigo-9)"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
