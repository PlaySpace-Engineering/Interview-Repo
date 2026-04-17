import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Text,
} from "@radix-ui/themes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SEEDED_CLINICIAN_ID, CPT_CODES } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { updateAppointmentStatusAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sb = await createSupabaseServerClient();
  const { data: appt } = await sb
    .from("appointments")
    .select("*, client:clients(id, legal_name, preferred_name), note:progress_notes(id, locked)")
    .eq("id", id)
    .eq("clinician_id", SEEDED_CLINICIAN_ID)
    .maybeSingle();
  if (!appt) notFound();

  const transitions: { label: string; next: "scheduled" | "confirmed" | "attended" | "no_show" | "late_cancel"; color?: "green" | "red" | "amber" | "blue" }[] = [
    { label: "Confirm", next: "confirmed", color: "blue" },
    { label: "Mark attended", next: "attended", color: "green" },
    { label: "Mark no-show", next: "no_show", color: "red" },
    { label: "Late cancel", next: "late_cancel", color: "amber" },
  ];

  const note = Array.isArray(appt.note) ? appt.note[0] : appt.note;

  return (
    <Flex direction="column" gap="5">
      <Flex justify="between" align="center">
        <Box>
          <Heading size="7">{appt.client?.preferred_name ?? appt.client?.legal_name}</Heading>
          <Text color="gray">{formatDateTime(appt.start_at)} · {appt.location} · CPT {appt.cpt_code} ({CPT_CODES[appt.cpt_code]})</Text>
        </Box>
        <Badge size="2">{appt.status}</Badge>
      </Flex>

      <Card>
        <Flex direction="column" gap="3">
          <Heading size="4">Status</Heading>
          <Flex gap="2" wrap="wrap">
            {transitions.map((t) => (
              <form
                key={t.next}
                action={async () => {
                  "use server";
                  await updateAppointmentStatusAction(id, t.next);
                }}
              >
                <Button
                  type="submit"
                  variant={appt.status === t.next ? "solid" : "soft"}
                  color={t.color}
                  disabled={appt.status === t.next}
                >
                  {t.label}
                </Button>
              </form>
            ))}
          </Flex>
        </Flex>
      </Card>

      <Card>
        <Flex direction="column" gap="3">
          <Heading size="4">Progress note</Heading>
          {note ? (
            <Flex gap="3" align="center">
              <Button asChild variant="soft">
                <Link href={`/notes/${note.id}`}>Open note →</Link>
              </Button>
              {note.locked ? <Badge color="green">signed · locked</Badge> : <Badge color="amber">draft</Badge>}
            </Flex>
          ) : appt.status === "attended" ? (
            <Button asChild>
              <Link href={`/notes/new/${appt.id}`}>Create progress note</Link>
            </Button>
          ) : (
            <Text size="2" color="gray">
              Progress note can be created after the appointment is marked attended.
            </Text>
          )}
        </Flex>
      </Card>

      <Button asChild variant="ghost">
        <Link href={`/clients/${appt.client?.id}`}>← Back to client</Link>
      </Button>
    </Flex>
  );
}
