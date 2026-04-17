import Link from "next/link";
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Section,
  Separator,
  Text,
} from "@radix-ui/themes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SEEDED_CLINICIAN_ID } from "@/lib/constants";
import { formatTime, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const sb = await createSupabaseServerClient();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const [
    { data: todaysAppts },
    { data: unsignedNotes },
    { data: recentClients },
  ] = await Promise.all([
    sb
      .from("appointments")
      .select("id, start_at, end_at, status, cpt_code, client:clients(id, legal_name, preferred_name)")
      .eq("clinician_id", SEEDED_CLINICIAN_ID)
      .gte("start_at", startOfDay.toISOString())
      .lt("start_at", endOfDay.toISOString())
      .order("start_at", { ascending: true }),
    sb
      .from("progress_notes")
      .select("id, format, created_at, client:clients(id, legal_name, preferred_name)")
      .eq("clinician_id", SEEDED_CLINICIAN_ID)
      .is("signed_at", null)
      .order("created_at", { ascending: false }),
    sb
      .from("clients")
      .select("id, legal_name, preferred_name, status, created_at")
      .eq("clinician_id", SEEDED_CLINICIAN_ID)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const unsignedCount = unsignedNotes?.length ?? 0;

  return (
    <Flex direction="column" gap="6">
      <Flex justify="between" align="center">
        <Heading size="7">Today</Heading>
        <Flex gap="3">
          <Button asChild variant="soft">
            <Link href="/clients/new">+ New client</Link>
          </Button>
          <Button asChild>
            <Link href="/appointments/new">Schedule appointment</Link>
          </Button>
        </Flex>
      </Flex>

      <Grid columns={{ initial: "1", md: "3" }} gap="5">
        <Card>
          <Flex direction="column" gap="3">
            <Flex justify="between" align="center">
              <Heading size="4">Today&apos;s schedule</Heading>
              <Badge>{todaysAppts?.length ?? 0}</Badge>
            </Flex>
            <Separator size="4" />
            {(todaysAppts ?? []).length === 0 ? (
              <Text color="gray" size="2">No appointments scheduled for today.</Text>
            ) : (
              <Flex direction="column" gap="3">
                {(todaysAppts ?? []).map((a) => (
                  <Box key={a.id}>
                    <Link href={`/appointments/${a.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <Flex justify="between" align="baseline">
                        <Text weight="medium">
                          {formatTime(a.start_at)} — {a.client?.preferred_name ?? a.client?.legal_name}
                        </Text>
                        <Badge color={statusColor(a.status)}>{a.status}</Badge>
                      </Flex>
                      <Text size="1" color="gray">CPT {a.cpt_code}</Text>
                    </Link>
                  </Box>
                ))}
              </Flex>
            )}
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" gap="3">
            <Flex justify="between" align="center">
              <Heading size="4">Unsigned notes</Heading>
              <Badge color={unsignedCount > 0 ? "amber" : "gray"}>{unsignedCount}</Badge>
            </Flex>
            <Separator size="4" />
            {(unsignedNotes ?? []).length === 0 ? (
              <Text color="gray" size="2">All caught up.</Text>
            ) : (
              <Flex direction="column" gap="3">
                {(unsignedNotes ?? []).map((n) => (
                  <Link key={n.id} href={`/notes/${n.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <Flex justify="between">
                      <Text weight="medium">
                        {n.client?.preferred_name ?? n.client?.legal_name}
                      </Text>
                      <Badge variant="soft">{n.format}</Badge>
                    </Flex>
                    <Text size="1" color="gray">drafted {formatDate(n.created_at)}</Text>
                  </Link>
                ))}
              </Flex>
            )}
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" gap="3">
            <Flex justify="between" align="center">
              <Heading size="4">Recent clients</Heading>
              <Button size="1" variant="ghost" asChild>
                <Link href="/clients">View all →</Link>
              </Button>
            </Flex>
            <Separator size="4" />
            <Flex direction="column" gap="3">
              {(recentClients ?? []).map((c) => (
                <Link key={c.id} href={`/clients/${c.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <Flex justify="between">
                    <Text weight="medium">{c.preferred_name ?? c.legal_name}</Text>
                    <Badge variant="soft" color={c.status === "active" ? "green" : "gray"}>
                      {c.status}
                    </Badge>
                  </Flex>
                </Link>
              ))}
            </Flex>
          </Flex>
        </Card>
      </Grid>

      <Section size="1">
        <Text size="2" color="gray">
          Logged in as the seeded clinician. RLS policies enforce per-clinician isolation even with no auth UI.
        </Text>
      </Section>
    </Flex>
  );
}

function statusColor(s: string) {
  switch (s) {
    case "scheduled": return "blue";
    case "confirmed": return "indigo";
    case "attended":  return "green";
    case "no_show":   return "red";
    case "late_cancel": return "amber";
    default: return "gray";
  }
}
