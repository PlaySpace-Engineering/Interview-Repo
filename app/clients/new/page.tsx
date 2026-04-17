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
import { createClientAction } from "../actions";

export default function NewClientPage() {
  return (
    <Flex direction="column" gap="5">
      <Flex justify="between" align="center">
        <Heading size="7">New client</Heading>
        <Button asChild variant="ghost">
          <Link href="/clients">Cancel</Link>
        </Button>
      </Flex>

      <Card size="3">
        <form action={createClientAction}>
          <Flex direction="column" gap="5">
            <Heading size="4">Demographics</Heading>
            <Grid columns={{ initial: "1", md: "2" }} gap="4">
              <Field label="Legal name *">
                <TextField.Root name="legal_name" required placeholder="Full legal name" />
              </Field>
              <Field label="Preferred name">
                <TextField.Root name="preferred_name" />
              </Field>
              <Field label="Pronouns">
                <TextField.Root name="pronouns" placeholder="e.g. she/her" />
              </Field>
              <Field label="Date of birth">
                <TextField.Root name="dob" type="date" />
              </Field>
              <Field label="Phone">
                <TextField.Root name="phone" />
              </Field>
              <Field label="Email">
                <TextField.Root name="email" type="email" />
              </Field>
              <Field label="Status">
                <Select.Root name="status" defaultValue="active">
                  <Select.Trigger />
                  <Select.Content>
                    <Select.Item value="active">Active</Select.Item>
                    <Select.Item value="waitlist">Waitlist</Select.Item>
                    <Select.Item value="inactive">Inactive</Select.Item>
                    <Select.Item value="discharged">Discharged</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Field>
            </Grid>

            <Heading size="4">Emergency contact</Heading>
            <Grid columns={{ initial: "1", md: "2" }} gap="4">
              <Field label="Name *">
                <TextField.Root name="emergency_contact_name" required />
              </Field>
              <Field label="Phone *">
                <TextField.Root name="emergency_contact_phone" required />
              </Field>
            </Grid>

            <Flex justify="end" gap="3">
              <Button type="submit" size="3">
                Save &amp; continue to intake →
              </Button>
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
