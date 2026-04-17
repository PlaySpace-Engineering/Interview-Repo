import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Badge,
  Box,
  Button,
  Callout,
  Card,
  Flex,
  Heading,
  Table,
  Text,
} from "@radix-ui/themes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SEEDED_CLINICIAN_ID } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { PHQ9Chart } from "./chart";

export const dynamic = "force-dynamic";

export default async function PHQ9HistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ latest?: string }>;
}) {
  const { clientId } = await params;
  const { latest } = await searchParams;
  const sb = await createSupabaseServerClient();

  const { data: client } = await sb
    .from("clients")
    .select("id, legal_name, preferred_name")
    .eq("id", clientId)
    .eq("clinician_id", SEEDED_CLINICIAN_ID)
    .maybeSingle();
  if (!client) notFound();

  const { data: rows } = await sb
    .from("assessments")
    .select("id, administered_at, total_score, severity_band, si_flag")
    .eq("client_id", clientId)
    .eq("instrument", "PHQ-9")
    .order("administered_at", { ascending: true });

  const latestRow = latest ? (rows ?? []).find((r) => r.id === latest) : undefined;

  const chartData = (rows ?? []).map((r) => ({
    when: new Date(r.administered_at).toLocaleDateString(),
    score: r.total_score ?? 0,
    severity: r.severity_band,
  }));

  return (
    <Flex direction="column" gap="5">
      <Flex justify="between" align="center">
        <Box>
          <Heading size="7">PHQ-9 history</Heading>
          <Text color="gray">{client.preferred_name ?? client.legal_name}</Text>
        </Box>
        <Flex gap="2">
          <Button asChild variant="soft">
            <Link href={`/clients/${client.id}`}>← Back to chart</Link>
          </Button>
          <Button asChild>
            <Link href={`/assessments/${client.id}/phq9/new`}>Administer again</Link>
          </Button>
        </Flex>
      </Flex>

      {latestRow?.si_flag && (
        <Callout.Root color="red" data-testid="si-flag-callout">
          <Callout.Text>
            <strong>Suicidal ideation screen positive.</strong> The most recent PHQ-9 item 9 response
            was &gt; 0. Document a safety assessment.
          </Callout.Text>
        </Callout.Root>
      )}

      <Card>
        <Heading size="4" mb="3">Score over time</Heading>
        {chartData.length < 2 ? (
          <Text color="gray" size="2">At least two administrations are needed to chart a trend.</Text>
        ) : (
          <PHQ9Chart data={chartData} />
        )}
      </Card>

      <Card>
        <Heading size="4" mb="3">Administrations</Heading>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>When</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Score</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Severity</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>SI flag</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {(rows ?? []).slice().reverse().map((a) => (
              <Table.Row key={a.id}>
                <Table.RowHeaderCell>{formatDateTime(a.administered_at)}</Table.RowHeaderCell>
                <Table.Cell>
                  <Text weight="bold">{a.total_score}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Badge color={bandColor(a.severity_band ?? "")}>{a.severity_band}</Badge>
                </Table.Cell>
                <Table.Cell>
                  {a.si_flag ? <Badge color="red">positive</Badge> : <Badge color="gray">negative</Badge>}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Card>
    </Flex>
  );
}

function bandColor(band: string) {
  switch (band) {
    case "None": return "gray";
    case "Mild": return "green";
    case "Moderate": return "amber";
    case "Moderately Severe": return "orange";
    case "Severe": return "red";
    default: return "gray";
  }
}
