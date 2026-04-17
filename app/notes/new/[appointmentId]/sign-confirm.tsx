"use client";

import { AlertDialog, Button, Flex } from "@radix-ui/themes";

export function SignNoteConfirm() {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger>
        <Button type="button" color="green">Sign &amp; lock note</Button>
      </AlertDialog.Trigger>
      <AlertDialog.Content>
        <AlertDialog.Title>Sign and lock this note?</AlertDialog.Title>
        <AlertDialog.Description size="2">
          Once signed, the note becomes read-only. Further changes must be entered as addendums.
          This matches how clinical documentation software handles the legal record.
        </AlertDialog.Description>
        <Flex justify="end" gap="3" mt="4">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray">Cancel</Button>
          </AlertDialog.Cancel>
          {/* form="newNoteForm" lets this submit button live inside the dialog
              portal while still submitting the sibling form. Setting
              name=intent value=sign signals the server action to mark
              signed_at + locked in a single UPDATE. */}
          <AlertDialog.Action>
            <Button
              type="submit"
              form="newNoteForm"
              name="intent"
              value="sign"
              color="green"
            >
              Yes, sign &amp; lock
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
