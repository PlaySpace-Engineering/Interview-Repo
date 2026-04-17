import { notFound } from "next/navigation";
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  RadioGroup,
  Text,
} from "@radix-ui/themes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SEEDED_CLINICIAN_ID } from "@/lib/constants";
import { PHQ9_ITEMS, PHQ9_ANSWER_LABELS } from "@/lib/validation/phq9";
import { submitPHQ9Action } from "@/app/assessments/actions";

export default async function AdministerPHQ9Page({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const sb = await createSupabaseServerClient();
  const { data: client } = await sb
    .from("clients")
    .select("id, legal_name, preferred_name")
    .eq("id", clientId)
    .eq("clinician_id", SEEDED_CLINICIAN_ID)
    .maybeSingle();
  if (!client) notFound();

  const bound = submitPHQ9Action.bind(null, clientId);

  return (
    <Flex direction="column" gap="5">
      <Box>
        <Heading size="7">PHQ-9</Heading>
        <Text color="gray">
          {client.preferred_name ?? client.legal_name} · Over the last 2 weeks, how often has the client been bothered by the following?
        </Text>
      </Box>

      <Card size="3">
        <form action={bound}>
          <Flex direction="column" gap="5">
            {PHQ9_ITEMS.map((prompt, i) => (
              <Box key={i}>
                <Text as="p" weight="medium" mb="2">
                  {i + 1}. {prompt}
                </Text>
                <RadioGroup.Root name={`q${i}`} required>
                  <Flex gap="4" wrap="wrap">
                    {PHQ9_ANSWER_LABELS.map((a) => (
                      <Text as="label" size="2" key={a.value}>
                        <Flex gap="2" align="center">
                          <RadioGroup.Item value={String(a.value)} />
                          {a.label} <Text color="gray">({a.value})</Text>
                        </Flex>
                      </Text>
                    ))}
                  </Flex>
                </RadioGroup.Root>
              </Box>
            ))}

            <Flex justify="end">
              <Button type="submit" size="3">Score &amp; save</Button>
            </Flex>
          </Flex>
        </form>
      </Card>
    </Flex>
  );
}
