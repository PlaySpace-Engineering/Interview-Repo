import { notFound } from "next/navigation";
import {
  Button,
  Card,
  Checkbox,
  CheckboxGroup,
  Flex,
  Heading,
  Tabs,
  Text,
  TextArea,
} from "@radix-ui/themes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SEEDED_CLINICIAN_ID, INTERVENTIONS } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { createNoteAction } from "@/app/notes/actions";
import { SignNoteConfirm } from "./sign-confirm";

export default async function NewNotePage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = await params;
  const sb = await createSupabaseServerClient();
  const { data: appt } = await sb
    .from("appointments")
    .select("id, start_at, cpt_code, status, client:clients(legal_name, preferred_name)")
    .eq("id", appointmentId)
    .eq("clinician_id", SEEDED_CLINICIAN_ID)
    .maybeSingle();
  if (!appt) notFound();

  const boundAction = createNoteAction.bind(null, appointmentId);

  return (
    <Flex direction="column" gap="5">
      <Flex direction="column" gap="1">
        <Heading size="7">New progress note</Heading>
        <Text color="gray">
          {appt.client?.preferred_name ?? appt.client?.legal_name} · {formatDateTime(appt.start_at)} · CPT {appt.cpt_code}
        </Text>
      </Flex>

      <Card size="3">
        <form id="newNoteForm" action={boundAction}>
          <Flex direction="column" gap="5">
            <Tabs.Root defaultValue="SOAP">
              <Tabs.List>
                <Tabs.Trigger value="SOAP">SOAP</Tabs.Trigger>
                <Tabs.Trigger value="DAP">DAP</Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="SOAP">
                <input type="hidden" name="format" value="SOAP" />
                <Flex direction="column" gap="3" pt="4">
                  <Field label="Subjective">
                    <TextArea name="subjective" rows={3} placeholder="Client's report in their own words" />
                  </Field>
                  <Field label="Objective">
                    <TextArea name="objective" rows={3} placeholder="Observations, mental status, behaviour" />
                  </Field>
                  <Field label="Assessment">
                    <TextArea name="assessment" rows={3} placeholder="Clinical formulation, diagnostic impression" />
                  </Field>
                  <Field label="Plan">
                    <TextArea name="plan" rows={3} placeholder="Treatment plan, homework, next session" />
                  </Field>
                </Flex>
              </Tabs.Content>

              <Tabs.Content value="DAP">
                <Flex direction="column" gap="3" pt="4">
                  <Field label="Data">
                    <TextArea name="data" rows={4} />
                  </Field>
                  <Field label="Assessment">
                    <TextArea name="assessment" rows={3} />
                  </Field>
                  <Field label="Plan">
                    <TextArea name="plan" rows={3} />
                  </Field>
                </Flex>
              </Tabs.Content>
            </Tabs.Root>

            <Heading size="4">Interventions used</Heading>
            <CheckboxGroup.Root name="interventions">
              <Flex gap="4" wrap="wrap">
                {INTERVENTIONS.map((i) => (
                  <CheckboxGroup.Item key={i} value={i}>
                    {i}
                  </CheckboxGroup.Item>
                ))}
              </Flex>
            </CheckboxGroup.Root>

            <Heading size="4">Risk assessment</Heading>
            <Flex direction="column" gap="2">
              <Text as="label" size="2">
                <Flex gap="2" align="center">
                  <Checkbox name="si" /> Suicidal ideation endorsed
                </Flex>
              </Text>
              <Text as="label" size="2">
                <Flex gap="2" align="center">
                  <Checkbox name="hi" /> Homicidal ideation endorsed
                </Flex>
              </Text>
              <Text as="label" size="2">
                <Flex gap="2" align="center">
                  <Checkbox name="self_harm" /> Self-harm behaviour
                </Flex>
              </Text>
            </Flex>

            <Flex justify="end" gap="3" pt="3">
              <Button type="submit" name="intent" value="save" variant="soft">
                Save draft
              </Button>
              <SignNoteConfirm />
            </Flex>
          </Flex>
        </form>
      </Card>
    </Flex>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <Flex direction="column" gap="1">
        <Text size="2" weight="medium">{label}</Text>
        {children}
      </Flex>
    </label>
  );
}
