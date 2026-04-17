import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Box,
  Button,
  Card,
  Checkbox,
  Flex,
  Grid,
  Heading,
  Text,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SEEDED_CLINICIAN_ID } from "@/lib/constants";
import { saveIntakeAction } from "../../actions";

export default async function IntakePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sb = await createSupabaseServerClient();
  const { data: client } = await sb
    .from("clients")
    .select("id, legal_name, preferred_name")
    .eq("id", id)
    .eq("clinician_id", SEEDED_CLINICIAN_ID)
    .maybeSingle();
  if (!client) notFound();

  const { data: existing } = await sb.from("intake_forms").select("*").eq("client_id", id).maybeSingle();
  const save = saveIntakeAction.bind(null, id);

  return (
    <Flex direction="column" gap="5">
      <Flex justify="between" align="center">
        <Box>
          <Heading size="7">Intake</Heading>
          <Text color="gray">{client.preferred_name ?? client.legal_name}</Text>
        </Box>
        <Button asChild variant="ghost">
          <Link href={`/clients/${client.id}`}>Back to chart</Link>
        </Button>
      </Flex>

      <Card size="3">
        <form action={save}>
          <Flex direction="column" gap="5">
            <Field label="Presenting problem *">
              <TextArea
                name="presenting_problem"
                required
                rows={4}
                value={existing?.presenting_problem ?? ""}
                placeholder="Brief narrative — what brings the client in?"
              />
            </Field>

            <Grid columns={{ initial: "1", md: "2" }} gap="4">
              <Field label="Symptom duration">
                <TextField.Root
                  name="symptom_duration"
                  defaultValue={existing?.symptom_duration ?? ""}
                  placeholder="e.g. 4 months"
                />
              </Field>
              <Field label="Prior treatment">
                <TextField.Root
                  name="prior_treatment"
                  defaultValue={existing?.prior_treatment ?? ""}
                  placeholder="Previous therapy, meds, hospitalisations"
                />
              </Field>
              <Field label="Medications (comma-separated)">
                <TextField.Root
                  name="medications"
                  defaultValue={existing?.medications?.join(", ") ?? ""}
                />
              </Field>
              <Field label="Allergies (comma-separated)">
                <TextField.Root
                  name="allergies"
                  defaultValue={existing?.allergies?.join(", ") ?? ""}
                />
              </Field>
            </Grid>

            <Heading size="3">Safety screen</Heading>
            <Flex gap="2" align="center" asChild>
              <Text as="label" size="2">
                <Checkbox name="si_screen" defaultChecked={existing?.suicidal_ideation_screen ?? false} />
                Client endorsed suicidal ideation during intake screen
              </Text>
            </Flex>

            <Heading size="3">Consents</Heading>
            <Flex direction="column" gap="2">
              <Text as="label" size="2">
                <Flex gap="2" align="center">
                  <Checkbox name="consent" defaultChecked={!!existing?.consent_signed_at} />
                  Informed consent for treatment signed (timestamped now if checked)
                </Flex>
              </Text>
              <Text as="label" size="2">
                <Flex gap="2" align="center">
                  <Checkbox name="hipaa" defaultChecked={!!existing?.hipaa_ack_signed_at} />
                  HIPAA Notice of Privacy Practices acknowledged
                </Flex>
              </Text>
            </Flex>

            <Flex justify="end" gap="3">
              <Button type="submit" size="3">Save intake</Button>
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
