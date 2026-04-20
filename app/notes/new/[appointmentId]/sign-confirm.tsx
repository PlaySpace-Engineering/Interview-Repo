"use client";

import { useState } from "react";
import { Button, Flex, Heading, Text } from "@radix-ui/themes";

export function SignNoteConfirm() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" color="green" onClick={() => setOpen(true)}>
        Sign &amp; lock note
      </Button>
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.4)",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: 8,
              maxWidth: 420,
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            }}
          >
            <Heading size="4" mb="2">Sign and lock this note?</Heading>
            <Text size="2" as="p" mb="4">
              Once signed, the note becomes read-only. Further changes must be entered as addendums.
            </Text>
            <Flex justify="end" gap="3" mt="4">
              <Button variant="soft" color="gray" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="newNoteForm"
                name="intent"
                value="sign"
                color="green"
              >
                Yes, sign &amp; lock
              </Button>
            </Flex>
          </div>
        </div>
      )}
    </>
  );
}
