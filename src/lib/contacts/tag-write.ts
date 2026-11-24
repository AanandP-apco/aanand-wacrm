import type { SupabaseClient } from '@supabase/supabase-js';
import { getT } from '@/lib/i18n/translate';
import { isUuid } from '@/lib/api/v1/pagination';

const t = getT('LibErrors');

export class ContactTagWriteError extends Error {
  readonly status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = 'ContactTagWriteError';
    this.status = status;
  }
}

interface ContactTagWriteInput {
  accountId: string;
  contactId: string;
  tagId: string;
}

async function assertContactAndTagOwnership(
  db: SupabaseClient,
  input: ContactTagWriteInput
): Promise<void> {
  if (!isUuid(input.contactId)) {
    throw new ContactTagWriteError(t('tags.invalidContactId'), 400);
  }
  if (!isUuid(input.tagId)) {
    throw new ContactTagWriteError(t('tags.invalidTagId'), 400);
  }

  const [contactResult, tagResult] = await Promise.all([
    db
      .from('contacts')
      .select('id')
      .eq('id', input.contactId)
      .eq('account_id', input.accountId)
      .maybeSingle(),
    db
      .from('tags')
      .select('id')
      .eq('id', input.tagId)
      .eq('account_id', input.accountId)
      .maybeSingle(),
  ]);

  if (contactResult.error || tagResult.error) {
    throw new ContactTagWriteError(t('tags.verifyFailed'));
  }
  if (!contactResult.data) {
    throw new ContactTagWriteError(t('tags.contactNotFound'), 404);
  }
  if (!tagResult.data) {
    throw new ContactTagWriteError(t('tags.tagNotFound'), 404);
  }
}

/**
 * Add a tag exactly once. The unique constraint on
 * (contact_id, tag_id) is the concurrency-safe source of truth: a
 * duplicate insert is a no-op and must not emit a tag_added event.
 */
export async function addContactTagIfAbsent(
  db: SupabaseClient,
  input: ContactTagWriteInput
): Promise<boolean> {
  await assertContactAndTagOwnership(db, input);

  const { error } = await db
    .from('contact_tags')
    .insert({ contact_id: input.contactId, tag_id: input.tagId })
    .select('id')
    .maybeSingle();

  if (error?.code === '23505') return false;
  if (error) {
    throw new ContactTagWriteError(
      t('tags.addFailed', { message: error.message })
    );
  }
  return true;
}

export async function removeContactTag(
  db: SupabaseClient,
  input: ContactTagWriteInput
): Promise<void> {
  await assertContactAndTagOwnership(db, input);

  const { error } = await db
    .from('contact_tags')
    .delete()
    .eq('contact_id', input.contactId)
    .eq('tag_id', input.tagId);

  if (error) {
    throw new ContactTagWriteError(
      t('tags.removeFailed', { message: error.message })
    );
  }
}

export interface BulkContactTagWriteInput {
  accountId: string;
  contactIds: string[];
  tagIds: string[];
}

export async function bulkAddContactTags(
  db: SupabaseClient,
  input: BulkContactTagWriteInput
): Promise<{ addedPairs: Array<{ contactId: string; tagId: string }> }> {
  const { accountId, contactIds, tagIds } = input;
  for (const cid of contactIds) {
    if (!isUuid(cid)) throw new ContactTagWriteError(t('tags.invalidContactId'), 400);
  }
  for (const tid of tagIds) {
    if (!isUuid(tid)) throw new ContactTagWriteError(t('tags.invalidTagId'), 400);
  }

  if (contactIds.length === 0 || tagIds.length === 0) {
    return { addedPairs: [] };
  }

  const [contactsResult, tagsResult] = await Promise.all([
    db
      .from('contacts')
      .select('id')
      .in('id', contactIds)
      .eq('account_id', accountId),
    db
      .from('tags')
      .select('id')
      .in('id', tagIds)
      .eq('account_id', accountId),
  ]);

  if (contactsResult.error || tagsResult.error) {
    throw new ContactTagWriteError(t('tags.verifyFailed'));
  }

  const validContactIds = new Set((contactsResult.data ?? []).map((c) => c.id));
  const validTagIds = new Set((tagsResult.data ?? []).map((t) => t.id));

  if (validContactIds.size === 0) {
    throw new ContactTagWriteError(t('tags.contactNotFound'), 404);
  }
  if (validTagIds.size === 0) {
    throw new ContactTagWriteError(t('tags.tagNotFound'), 404);
  }

  const { data: existingJoins, error: existingErr } = await db
    .from('contact_tags')
    .select('contact_id, tag_id')
    .in('contact_id', Array.from(validContactIds))
    .in('tag_id', Array.from(validTagIds));

  if (existingErr) {
    throw new ContactTagWriteError(t('tags.verifyFailed'));
  }

  const existingSet = new Set(
    (existingJoins ?? []).map((j) => `${j.contact_id}:${j.tag_id}`)
  );

  const toInsert: Array<{ contact_id: string; tag_id: string }> = [];
  const addedPairs: Array<{ contactId: string; tagId: string }> = [];

  for (const cid of validContactIds) {
    for (const tid of validTagIds) {
      if (!existingSet.has(`${cid}:${tid}`)) {
        toInsert.push({ contact_id: cid, tag_id: tid });
        addedPairs.push({ contactId: cid, tagId: tid });
      }
    }
  }

  if (toInsert.length > 0) {
    const { error: insertErr } = await db.from('contact_tags').insert(toInsert);
    if (insertErr) {
      throw new ContactTagWriteError(
        t('tags.addFailed', { message: insertErr.message })
      );
    }
  }

  return { addedPairs };
}

export async function bulkRemoveContactTags(
  db: SupabaseClient,
  input: BulkContactTagWriteInput
): Promise<{ removedCount: number }> {
  const { accountId, contactIds, tagIds } = input;
  for (const cid of contactIds) {
    if (!isUuid(cid)) throw new ContactTagWriteError(t('tags.invalidContactId'), 400);
  }
  for (const tid of tagIds) {
    if (!isUuid(tid)) throw new ContactTagWriteError(t('tags.invalidTagId'), 400);
  }

  if (contactIds.length === 0 || tagIds.length === 0) {
    return { removedCount: 0 };
  }

  const [contactsResult, tagsResult] = await Promise.all([
    db
      .from('contacts')
      .select('id')
      .in('id', contactIds)
      .eq('account_id', accountId),
    db
      .from('tags')
      .select('id')
      .in('id', tagIds)
      .eq('account_id', accountId),
  ]);

  if (contactsResult.error || tagsResult.error) {
    throw new ContactTagWriteError(t('tags.verifyFailed'));
  }

  const validContactIds = (contactsResult.data ?? []).map((c) => c.id);
  const validTagIds = (tagsResult.data ?? []).map((t) => t.id);

  if (validContactIds.length === 0 || validTagIds.length === 0) {
    return { removedCount: 0 };
  }

  const { error: delErr, count } = await db
    .from('contact_tags')
    .delete({ count: 'exact' })
    .in('contact_id', validContactIds)
    .in('tag_id', validTagIds);

  if (delErr) {
    throw new ContactTagWriteError(
      t('tags.removeFailed', { message: delErr.message })
    );
  }

  return { removedCount: count ?? 0 };
}
