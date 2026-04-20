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
  Separator,
  Text,
  TextArea,
} from "@radix-ui/themes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SEEDED_CLINICIAN_ID } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { addAddendumAction, signNoteAction } from "@/app/notes/actions";

export const dynamic = "force-dynamic";

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sb = await createSupabaseServerClient();
  const { data: note } = await sb
    .from("progress_notes")
    .select("*, client:clients(id, legal_name, preferred_name), appointment:appointments(id, start_at, cpt_code)")
    .eq("id", id)
    .eq("clinician_id", SEEDED_CLINICIAN_ID)
    .maybeSingle();
  if (!note) notFound();

  const { data: addendums } = await sb
    .from("note_addendums")
    .select("id, content, created_at")
    .eq("note_id", id)
    .order("created_at", { ascending: true });

  const content = note.content as Record<string, string>;
  const risk = note.risk_assessment as any;
  const sections =
    note.format === "SOAP"
      ? (["subjective", "objective", "assessment", "plan"] as const)
      : (["data", "assessment", "plan"] as const);

  const boundAddendum = addAddendumAction.bind(null, id);

  return (
    <Flex direction="column" gap="5">
      <Flex justify="between" align="center" wrap="wrap" gap="3">
        <Box>
          <Heading size="7">Progress note</Heading>
          <Text color="gray">
            {note.client?.preferred_name ?? note.client?.legal_name} ·{" "}
            {note.appointment?.start_at && formatDateTime(note.appointment.start_at)} · {note.format}
          </Text>
        </Box>
        {note.locked ? (
          <Badge color="green" size="2">signed · locked {formatDateTime(note.signed_at ?? note.created_at)}</Badge>
        ) : (
          <Badge color="amber" size="2">draft</Badge>
        )}
      </Flex>

      {!note.locked && (
        <Callout.Root color="amber">
          <Callout.Text>
            This note is an unsigned draft. Signing makes it the legal record and locks it from further edits.
          </Callout.Text>
        </Callout.Root>
      )}

      <Card size="3">
        <Flex direction="column" gap="4">
          {sections.map((k) => (
            <Box key={k}>
              <Heading size="3" mb="2" style={{ textTransform: "capitalize" }}>{k}</Heading>
              <Text style={{ whiteSpace: "pre-wrap" }}>{content[k]}</Text>
              <Separator size="4" my="3" />
            </Box>
          ))}

          <Box>
            <Heading size="3" mb="2">Interventions</Heading>
            <Flex gap="2" wrap="wrap">
              {(note.interventions_used ?? []).length > 0
                ? note.interventions_used.map((i) => <Badge key={i} variant="soft">{i}</Badge>)
                : <Text size="2" color="gray">None recorded.</Text>}
            </Flex>
          </Box>

          <Box>
            <Heading size="3" mb="2">Risk</Heading>
            <Flex gap="2">
              <Badge color={risk?.si ? "red" : "gray"}>SI: {risk?.si ? "yes" : "no"}</Badge>
              <Badge color={risk?.hi ? "red" : "gray"}>HI: {risk?.hi ? "yes" : "no"}</Badge>
              <Badge color={risk?.self_harm ? "red" : "gray"}>Self-harm: {risk?.self_harm ? "yes" : "no"}</Badge>
            </Flex>
          </Box>
        </Flex>
      </Card>

      {!note.locked && (
        <form
          action={async () => {
            "use server";
            await signNoteAction(id);
          }}
        >
          <Button type="submit" color="green" size="3">Sign &amp; lock</Button>
        </form>
      )}

      <Section size="1">
        <Heading size="5" mb="3">Addendums</Heading>
        <Flex direction="column" gap="3">
          {(addendums ?? []).map((a) => (
            <Card key={a.id}>
              <Text size="1" color="gray">{formatDateTime(a.created_at)}</Text>
              <Text as="p" style={{ whiteSpace: "pre-wrap" }}>{a.content}</Text>
            </Card>
          ))}
          {(addendums ?? []).length === 0 && (
            <Text size="2" color="gray">No addendums yet.</Text>
          )}

          {note.locked && (
            <Card>
              <form action={boundAddendum}>
                <Flex direction="column" gap="3">
                  <TextArea name="content" rows={3} placeholder="Add an addendum…" required />
                  <Flex justify="end">
                    <Button type="submit" variant="soft">Add addendum</Button>
                  </Flex>
                </Flex>
              </form>
            </Card>
          )}
        </Flex>
      </Section>

      <Button asChild variant="ghost">
        <Link href={`/clients/${note.client?.id}`}>← Back to client</Link>
      </Button>
    </Flex>
  );
}
