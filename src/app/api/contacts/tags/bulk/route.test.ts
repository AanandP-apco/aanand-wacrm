import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  bulkAdd: vi.fn(),
  bulkRemove: vi.fn(),
}));

vi.mock('@/lib/auth/account', () => ({
  requireRole: mocks.requireRole,
  toErrorResponse: vi.fn(() =>
    Response.json({ error: 'auth failed' }, { status: 403 })
  ),
}));

vi.mock('@/lib/contacts/tag-events', () => ({
  bulkAddContactTagsAndDispatch: mocks.bulkAdd,
}));

vi.mock('@/lib/contacts/tag-write', () => ({
  ContactTagWriteError: class ContactTagWriteError extends Error {
    status: number;
    constructor(message: string, status = 500) {
      super(message);
      this.status = status;
    }
  },
  bulkRemoveContactTags: mocks.bulkRemove,
}));

import { POST } from './route';

const context = {
  supabase: { name: 'scoped-client' },
  accountId: 'account-1',
  userId: 'user-1',
  role: 'agent',
  account: { id: 'account-1', name: 'Acme' },
};

function request(body: unknown) {
  return new Request('http://localhost/api/contacts/tags/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mocks.requireRole.mockReset();
  mocks.bulkAdd.mockReset();
  mocks.bulkRemove.mockReset();
  mocks.requireRole.mockResolvedValue(context);
});

describe('POST /api/contacts/tags/bulk', () => {
  it('requires agent role and bulk-adds tags with dispatch', async () => {
    mocks.bulkAdd.mockResolvedValue({
      addedCount: 2,
      dispatchedCount: 2,
      totalContacts: 2,
      totalTags: 1,
    });

    const response = await POST(
      request({
        contact_ids: ['c-1', 'c-2'],
        tag_ids: ['t-1'],
        action: 'add',
      })
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.addedCount).toBe(2);
    expect(mocks.requireRole).toHaveBeenCalledWith('agent');
    expect(mocks.bulkAdd).toHaveBeenCalledWith({
      db: context.supabase,
      accountId: 'account-1',
      contactIds: ['c-1', 'c-2'],
      tagIds: ['t-1'],
    });
  });

  it('rejects empty contact_ids with 400', async () => {
    const response = await POST(
      request({
        contact_ids: [],
        tag_ids: ['t-1'],
      })
    );
    expect(response.status).toBe(400);
    expect(mocks.bulkAdd).not.toHaveBeenCalled();
  });

  it('rejects empty tag_ids with 400', async () => {
    const response = await POST(
      request({
        contact_ids: ['c-1'],
        tag_ids: [],
      })
    );
    expect(response.status).toBe(400);
    expect(mocks.bulkAdd).not.toHaveBeenCalled();
  });

  it('bulk-removes tags when action is remove', async () => {
    mocks.bulkRemove.mockResolvedValue({ removedCount: 3 });

    const response = await POST(
      request({
        contact_ids: ['c-1', 'c-2', 'c-3'],
        tag_ids: ['t-1'],
        action: 'remove',
      })
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.removedCount).toBe(3);
    expect(mocks.bulkRemove).toHaveBeenCalledWith(context.supabase, {
      accountId: 'account-1',
      contactIds: ['c-1', 'c-2', 'c-3'],
      tagIds: ['t-1'],
    });
  });
});
