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
  Section,
  Table,
  Tabs,
  Text,
} from "@radix-ui/themes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SEEDED_CLINICIAN_ID } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ClientChartPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sb = await createSupabaseServerClient();

  const [clientRes, intakeRes, apptsRes, notesRes, assessmentsRes] = await Promise.all([
    sb
      .from("clients")
      .select("*")
      .eq("id", id)
      .eq("clinician_id", SEEDED_CLINICIAN_ID)
      .maybeSingle(),
    sb.from("intake_forms").select("*").eq("client_id", id).maybeSingle(),
    sb
      .from("appointments")
      .select("id, start_at, end_at, status, cpt_code, location")
      .eq("client_id", id)
      .order("start_at", { ascending: false }),
    sb
      .from("progress_notes")
      .select("id, format, created_at, signed_at, locked, appointment_id")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    sb
      .from("assessments")
      .select("id, administered_at, total_score, severity_band, si_flag")
      .eq("client_id", id)
      .order("administered_at", { ascending: false }),
  ]);

  const client = clientRes.data;
  if (!client) notFound();

  return (
    <Flex direction="column" gap="5">
      <Flex justify="between" align="center" wrap="wrap" gap="3">
        <Box>
          <Heading size="7">{client.preferred_name ?? client.legal_name}</Heading>
          <Text size="2" color="gray">
            {client.legal_name}
            {client.pronouns && ` · ${client.pronouns}`}
            {client.dob && ` · DOB ${formatDate(client.dob)}`}
          </Text>
        </Box>
        <Flex gap="2" align="center">
          <Badge color={client.status === "active" ? "green" : "gray"} size="2">
            {client.status}
          </Badge>
          <Button asChild variant="soft">
            <Link href={`/appointments/new?clientId=${client.id}`}>Schedule</Link>
          </Button>
          <Button asChild>
            <Link href={`/assessments/${client.id}/phq9/new`}>Administer PHQ-9</Link>
          </Button>
        </Flex>
      </Flex>

      {!intakeRes.data && (
        <Callout.Root color="amber">
          <Callout.Text>
            No intake form on file.{" "}
            <Link href={`/clients/${client.id}/intake`}>Complete intake →</Link>
          </Callout.Text>
        </Callout.Root>
      )}

      <Tabs.Root defaultValue="overview">
        <Tabs.List>
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          <Tabs.Trigger value="appointments">Appointments</Tabs.Trigger>
          <Tabs.Trigger value="notes">Notes</Tabs.Trigger>
          <Tabs.Trigger value="assessments">Assessments</Tabs.Trigger>
        </Tabs.List>

        <Box pt="4">
          <Tabs.Content value="overview">
            <Card>
              <Flex direction="column" gap="3">
                <Heading size="4">Contact</Heading>
                <KV k="Phone" v={client.phone} />
                <KV k="Email" v={client.email} />
                <KV k="Emergency" v={`${client.emergency_contact_name} · ${client.emergency_contact_phone}`} />
                <Section size="1"><Heading size="4">Intake</Heading></Section>
                {intakeRes.data ? (
                  <>
                    <KV k="Presenting problem" v={intakeRes.data.presenting_problem} />
                    <KV k="Duration" v={intakeRes.data.symptom_duration} />
                    <KV k="Medications" v={intakeRes.data.medications?.join(", ") || "—"} />
                    <KV k="Allergies" v={intakeRes.data.allergies?.join(", ") || "—"} />
                    <KV k="Prior treatment" v={intakeRes.data.prior_treatment} />
                    <KV k="Consent signed" v={formatDate(intakeRes.data.consent_signed_at)} />
                    <KV k="HIPAA acknowledged" v={formatDate(intakeRes.data.hipaa_ack_signed_at)} />
                    <KV k="SI screen" v={intakeRes.data.suicidal_ideation_screen ? "Positive" : "Negative"} />
                  </>
                ) : (
                  <Text color="gray" size="2">Not yet completed.</Text>
                )}
              </Flex>
            </Card>
          </Tabs.Content>

          <Tabs.Content value="appointments">
            <Card>
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>When</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Location</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>CPT</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {(apptsRes.data ?? []).map((a) => (
                    <Table.Row key={a.id}>
                      <Table.RowHeaderCell>
                        <Link href={`/appointments/${a.id}`}>{formatDateTime(a.start_at)}</Link>
                      </Table.RowHeaderCell>
                      <Table.Cell>{a.location}</Table.Cell>
                      <Table.Cell>{a.cpt_code}</Table.Cell>
                      <Table.Cell><Badge>{a.status}</Badge></Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Card>
          </Tabs.Content>

          <Tabs.Content value="notes">
            <Card>
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Drafted</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Format</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>State</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {(notesRes.data ?? []).map((n) => (
                    <Table.Row key={n.id}>
                      <Table.RowHeaderCell>
                        <Link href={`/notes/${n.id}`}>{formatDateTime(n.created_at)}</Link>
                      </Table.RowHeaderCell>
                      <Table.Cell>{n.format}</Table.Cell>
                      <Table.Cell>
                        {n.locked ? (
                          <Badge color="green">Signed · locked</Badge>
                        ) : (
                          <Badge color="amber">Draft</Badge>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Card>
          </Tabs.Content>

          <Tabs.Content value="assessments">
            <Card>
              <Flex justify="between" align="center" mb="3">
                <Heading size="4">PHQ-9</Heading>
                <Flex gap="2">
                  <Button asChild size="2" variant="soft">
                    <Link href={`/assessments/${client.id}/history`}>View history →</Link>
                  </Button>
                  <Button asChild size="2">
                    <Link href={`/assessments/${client.id}/phq9/new`}>Administer</Link>
                  </Button>
                </Flex>
              </Flex>
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
                  {(assessmentsRes.data ?? []).map((a) => (
                    <Table.Row key={a.id}>
                      <Table.RowHeaderCell>{formatDateTime(a.administered_at)}</Table.RowHeaderCell>
                      <Table.Cell>{a.total_score}</Table.Cell>
                      <Table.Cell>{a.severity_band}</Table.Cell>
                      <Table.Cell>
                        {a.si_flag ? <Badge color="red">positive</Badge> : <Badge color="gray">negative</Badge>}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Card>
          </Tabs.Content>
        </Box>
      </Tabs.Root>
    </Flex>
  );
}

function KV({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <Flex gap="3">
      <Text size="2" color="gray" style={{ minWidth: "10rem" }}>{k}</Text>
      <Text size="2">{v ?? "—"}</Text>
    </Flex>
  );
}
