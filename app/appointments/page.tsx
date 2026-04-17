import Link from "next/link";
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Text,
} from "@radix-ui/themes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SEEDED_CLINICIAN_ID } from "@/lib/constants";
import { addDays, formatTime, startOfWeek } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage() {
  const sb = await createSupabaseServerClient();

  const weekStart = startOfWeek();
  const weekEnd = addDays(weekStart, 7);

  const { data: appts } = await sb
    .from("appointments")
    .select("id, start_at, end_at, status, cpt_code, location, client:clients(id, legal_name, preferred_name)")
    .eq("clinician_id", SEEDED_CLINICIAN_ID)
    .gte("start_at", weekStart.toISOString())
    .lt("start_at", weekEnd.toISOString())
    .order("start_at");

  const byDay: Record<string, typeof appts> = {};
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    byDay[d.toDateString()] = [];
  }
  (appts ?? []).forEach((a) => {
    const k = new Date(a.start_at).toDateString();
    byDay[k].push(a);
  });

  return (
    <Flex direction="column" gap="5">
      <Flex justify="between" align="center">
        <Box>
          <Heading size="7">Calendar</Heading>
          <Text color="gray">Week of {weekStart.toLocaleDateString(undefined, { month: "long", day: "numeric" })}</Text>
        </Box>
        <Button asChild>
          <Link href="/appointments/new">+ Schedule</Link>
        </Button>
      </Flex>

      <Grid columns="7" gap="3">
        {Array.from({ length: 7 }, (_, i) => {
          const d = addDays(weekStart, i);
          const dayAppts = byDay[d.toDateString()] ?? [];
          const isToday = d.toDateString() === new Date().toDateString();
          return (
            <Card key={i} variant={isToday ? "classic" : "surface"}>
              <Flex direction="column" gap="2" style={{ minHeight: "14rem" }}>
                <Flex justify="between">
                  <Text weight="bold" size="2">
                    {d.toLocaleDateString(undefined, { weekday: "short" })}
                  </Text>
                  <Text size="2" color={isToday ? "indigo" : "gray"}>
                    {d.getDate()}
                  </Text>
                </Flex>
                {dayAppts.length === 0 && (
                  <Text size="1" color="gray">—</Text>
                )}
                {dayAppts.map((a) => (
                  <Link
                    key={a.id}
                    href={`/appointments/${a.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <Box
                      style={{
                        background: "#EEF2FF",
                        border: "1px solid #C7D2FE",
                        borderRadius: 6,
                        padding: "4px 6px",
                      }}
                    >
                      <Text size="1" weight="bold">
                        {formatTime(a.start_at)}
                      </Text>
                      <Text size="1" as="div">
                        {a.client?.preferred_name ?? a.client?.legal_name}
                      </Text>
                      <Badge size="1" variant="soft">{a.status}</Badge>
                    </Box>
                  </Link>
                ))}
              </Flex>
            </Card>
          );
        })}
      </Grid>
    </Flex>
  );
}
