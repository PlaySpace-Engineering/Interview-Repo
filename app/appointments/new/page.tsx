import {
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Select,
  Text,
  TextField,
} from "@radix-ui/themes";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SEEDED_CLINICIAN_ID, CPT_CODES } from "@/lib/constants";
import { createAppointmentAction } from "../actions";

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;
  const sb = await createSupabaseServerClient();
  const { data: clients } = await sb
    .from("clients")
    .select("id, legal_name, preferred_name")
    .eq("clinician_id", SEEDED_CLINICIAN_ID)
    .order("legal_name");

  const now = new Date();
  now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);
  const defaultStart = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);

  return (
    <Flex direction="column" gap="5">
      <Flex justify="between" align="center">
        <Heading size="7">New appointment</Heading>
        <Button asChild variant="ghost">
          <Link href="/appointments">Cancel</Link>
        </Button>
      </Flex>

      <Card size="3">
        <form action={createAppointmentAction}>
          <Flex direction="column" gap="5">
            <Field label="Client *">
              <Select.Root name="client_id" defaultValue={clientId} required>
                <Select.Trigger placeholder="Select client…" />
                <Select.Content>
                  {(clients ?? []).map((c) => (
                    <Select.Item key={c.id} value={c.id}>
                      {c.preferred_name ?? c.legal_name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Field>

            <Grid columns={{ initial: "1", md: "2" }} gap="4">
              <Field label="Start *">
                <TextField.Root
                  name="start_at"
                  type="datetime-local"
                  required
                  defaultValue={defaultStart}
                />
              </Field>
              <Field label="Duration">
                <Select.Root name="duration_min" defaultValue="45">
                  <Select.Trigger />
                  <Select.Content>
                    <Select.Item value="30">30 min</Select.Item>
                    <Select.Item value="45">45 min</Select.Item>
                    <Select.Item value="60">60 min</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Field>
              <Field label="Location">
                <Select.Root name="location" defaultValue="in_person">
                  <Select.Trigger />
                  <Select.Content>
                    <Select.Item value="in_person">In person</Select.Item>
                    <Select.Item value="telehealth">Telehealth</Select.Item>
                    <Select.Item value="phone">Phone</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Field>
              <Field label="CPT code">
                <Select.Root name="cpt_code" defaultValue="90834">
                  <Select.Trigger />
                  <Select.Content>
                    {Object.entries(CPT_CODES).map(([code, desc]) => (
                      <Select.Item key={code} value={code}>
                        {code} — {desc}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Field>
            </Grid>

            <Flex justify="end" gap="3">
              <Button type="submit" size="3">Schedule</Button>
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
