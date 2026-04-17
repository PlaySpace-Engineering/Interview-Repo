// CSS import ORDER MATTERS — Radix first, then our overrides.
import "@radix-ui/themes/styles.css";
import "./globals.css";

import type { Metadata } from "next";
import Link from "next/link";
import {
  Theme,
  Container,
  Flex,
  Heading,
  Box,
  Text,
} from "@radix-ui/themes";

export const metadata: Metadata = {
  title: "EHR POC — Clinical workspace",
  description: "Proof-of-concept EHR for a solo psychologist",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Theme accentColor="indigo" grayColor="slate" radius="medium" scaling="100%">
          <Box
            style={{
              borderBottom: "1px solid var(--gray-a5)",
              background: "var(--color-panel-solid)",
            }}
          >
            <Container size="4" px="5" py="3">
              <Flex justify="between" align="center">
                <Flex align="center" gap="5">
                  <Heading size="4" asChild>
                    <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
                      Clinical Workspace
                    </Link>
                  </Heading>
                  <Flex gap="4">
                    <NavLink href="/">Dashboard</NavLink>
                    <NavLink href="/clients">Clients</NavLink>
                    <NavLink href="/appointments">Calendar</NavLink>
                  </Flex>
                </Flex>
                <Text size="2" color="gray">
                  Dr. Alex Rivera, PsyD
                </Text>
              </Flex>
            </Container>
          </Box>

          <Container size="4" px="5" py="6">
            {children}
          </Container>
        </Theme>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Text size="2" asChild>
      <Link href={href} style={{ color: "var(--gray-12)", textDecoration: "none" }}>
        {children}
      </Link>
    </Text>
  );
}
