import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  Flex,
  Heading,
  Table,
  Text,
  TextField,
} from "@radix-ui/themes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SEEDED_CLINICIAN_ID } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const sb = await createSupabaseServerClient();

  let query = sb
    .from("clients")
    .select("id, legal_name, preferred_name, pronouns, status, intake_date, created_at")
    .eq("clinician_id", SEEDED_CLINICIAN_ID)
    .order("legal_name", { ascending: true });

  if (q && q.trim()) {
    const esc = q.replace(/%/g, "").replace(/,/g, " ");
    query = query.or(`legal_name.ilike.%${esc}%,preferred_name.ilike.%${esc}%`);
  }

  const { data: clients } = await query;

  return (
    <Flex direction="column" gap="5">
      <Flex justify="between" align="center">
        <Heading size="7">Clients</Heading>
        <Button asChild>
          <Link href="/clients/new">+ New client</Link>
        </Button>
      </Flex>

      <Card>
        <form>
          <TextField.Root
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by name…"
            size="3"
          />
        </form>
      </Card>

      <Card>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Pronouns</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Intake date</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {(clients ?? []).map((c) => (
              <Table.Row key={c.id}>
                <Table.RowHeaderCell>
                  <Link href={`/clients/${c.id}`}>
                    <Text weight="medium">{c.preferred_name ?? c.legal_name}</Text>
                  </Link>
                  {c.preferred_name && (
                    <Text size="1" color="gray" as="div">
                      {c.legal_name}
                    </Text>
                  )}
                </Table.RowHeaderCell>
                <Table.Cell>{c.pronouns ?? "—"}</Table.Cell>
                <Table.Cell>
                  <Badge color={c.status === "active" ? "green" : "gray"} variant="soft">
                    {c.status}
                  </Badge>
                </Table.Cell>
                <Table.Cell>{formatDate(c.intake_date)}</Table.Cell>
              </Table.Row>
            ))}
            {(clients ?? []).length === 0 && (
              <Table.Row>
                <Table.Cell colSpan={4}>
                  <Text color="gray">No clients match that search.</Text>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Card>
    </Flex>
  );
}
