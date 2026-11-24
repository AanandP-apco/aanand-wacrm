import { NextResponse } from 'next/server';

import { requireRole, toErrorResponse } from '@/lib/auth/account';
import { bulkAddContactTagsAndDispatch } from '@/lib/contacts/tag-events';
import {
  ContactTagWriteError,
  bulkRemoveContactTags,
} from '@/lib/contacts/tag-write';
import { getT } from '@/lib/i18n/translate';

const t = getT('Api');

function tagWriteErrorResponse(error: ContactTagWriteError): NextResponse {
  return NextResponse.json({ error: error.message }, { status: error.status });
}

export async function POST(request: Request) {
  try {
    const ctx = await requireRole('agent');

    const body = (await request.json().catch(() => null)) as {
      contact_ids?: unknown;
      tag_ids?: unknown;
      action?: unknown;
    } | null;

    const contactIds = Array.isArray(body?.contact_ids)
      ? body.contact_ids.filter((id): id is string => typeof id === 'string' && !!id.trim())
      : [];

    const tagIds = Array.isArray(body?.tag_ids)
      ? body.tag_ids.filter((id): id is string => typeof id === 'string' && !!id.trim())
      : [];

    const action = body?.action === 'remove' ? 'remove' : 'add';

    if (contactIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one contact ID is required' },
        { status: 400 }
      );
    }

    if (tagIds.length === 0) {
      return NextResponse.json(
        { error: t('contacts.tagIdRequired') },
        { status: 400 }
      );
    }

    if (action === 'remove') {
      const { removedCount } = await bulkRemoveContactTags(ctx.supabase, {
        accountId: ctx.accountId,
        contactIds,
        tagIds,
      });
      return NextResponse.json({
        ok: true,
        removedCount,
        totalContacts: contactIds.length,
        totalTags: tagIds.length,
      });
    }

    const result = await bulkAddContactTagsAndDispatch({
      db: ctx.supabase,
      accountId: ctx.accountId,
      contactIds,
      tagIds,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof ContactTagWriteError) {
      return tagWriteErrorResponse(error);
    }
    return toErrorResponse(error);
  }
}
