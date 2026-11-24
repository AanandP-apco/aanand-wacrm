interface ContactTagMutationResult {
  added?: boolean;
  dispatched?: boolean;
  reason?: 'duplicate' | 'max_depth';
}

async function mutateContactTag(
  contactId: string,
  tagId: string,
  method: 'POST' | 'DELETE'
): Promise<ContactTagMutationResult> {
  const response = await fetch(`/api/contacts/${contactId}/tags`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag_id: tagId }),
  });
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
  } & ContactTagMutationResult;
  if (!response.ok) {
    throw new Error(body.error ?? 'Failed to update contact tag');
  }
  return body;
}

export function addContactTag(contactId: string, tagId: string) {
  return mutateContactTag(contactId, tagId, 'POST');
}

export function deleteContactTag(contactId: string, tagId: string) {
  return mutateContactTag(contactId, tagId, 'DELETE');
}

export interface BulkContactTagsInput {
  contactIds: string[];
  tagIds: string[];
  action?: 'add' | 'remove';
}

export interface BulkContactTagsResult {
  ok: boolean;
  addedCount?: number;
  removedCount?: number;
  dispatchedCount?: number;
  totalContacts: number;
  totalTags: number;
}

export async function bulkMutateContactTags(
  input: BulkContactTagsInput
): Promise<BulkContactTagsResult> {
  const response = await fetch('/api/contacts/tags/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contact_ids: input.contactIds,
      tag_ids: input.tagIds,
      action: input.action ?? 'add',
    }),
  });
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
  } & BulkContactTagsResult;
  if (!response.ok) {
    throw new Error(body.error ?? 'Failed to bulk update contact tags');
  }
  return body;
}
