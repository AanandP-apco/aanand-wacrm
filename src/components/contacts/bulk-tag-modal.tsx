'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { bulkMutateContactTags } from '@/lib/contacts/tag-api';
import type { Tag } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { TagBadge } from '@/components/contacts/tag-badge';
import {
  Tag as TagIcon,
  Search,
  Plus,
  Check,
  Loader2,
  X,
  MinusCircle,
  PlusCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

const PRESET_COLORS = [
  { name: 'emerald', value: '#10b981' },
  { name: 'blue', value: '#3b82f6' },
  { name: 'violet', value: '#8b5cf6' },
  { name: 'amber', value: '#f59e0b' },
  { name: 'rose', value: '#f43f5e' },
  { name: 'cyan', value: '#06b6d4' },
  { name: 'orange', value: '#f97316' },
  { name: 'pink', value: '#ec4899' },
];

interface BulkTagModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactIds: string[];
  availableTags: Tag[];
  canCreateTags?: boolean;
  onTagsUpdated: () => void;
  onTagCreated?: () => void;
}

export function BulkTagModal({
  open,
  onOpenChange,
  contactIds,
  availableTags,
  canCreateTags = false,
  onTagsUpdated,
  onTagCreated,
}: BulkTagModalProps) {
  const t = useTranslations('Contacts.page.bulkTagModal');
  const supabase = createClient();
  const { user, accountId } = useAuth();

  const [action, setAction] = useState<'add' | 'remove'>('add');
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Quick inline tag creation
  const [showCreate, setShowCreate] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].value);
  const [creatingTag, setCreatingTag] = useState(false);

  const contactCount = contactIds.length;

  const filteredTags = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return availableTags;
    return availableTags.filter((t) => t.name.toLowerCase().includes(q));
  }, [availableTags, searchQuery]);

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedTagIds(new Set(filteredTags.map((t) => t.id)));
  }

  function deselectAll() {
    setSelectedTagIds(new Set());
  }

  async function handleCreateTag() {
    const name = newTagName.trim();
    if (!name) {
      toast.error(t('tagRequiresName'));
      return;
    }
    if (!user || !accountId) return;

    setCreatingTag(true);
    try {
      const { data, error } = await supabase
        .from('tags')
        .insert({
          user_id: user.id,
          account_id: accountId,
          name,
          color: selectedColor,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(t('toastTagCreated'));
      setNewTagName('');
      setShowCreate(false);
      onTagCreated?.();
      if (data?.id) {
        setSelectedTagIds((prev) => new Set(prev).add(data.id));
      }
    } catch (err) {
      console.error('Failed to create tag:', err);
      toast.error(t('toastFailedCreate'));
    } finally {
      setCreatingTag(false);
    }
  }

  async function handleApply() {
    if (selectedTagIds.size === 0 || contactIds.length === 0) return;
    setSubmitting(true);

    try {
      const tagIds = Array.from(selectedTagIds);
      const res = await bulkMutateContactTags({
        contactIds,
        tagIds,
        action,
      });

      if (res.ok) {
        if (action === 'add') {
          toast.success(
            t('toastAdded', {
              tagCount: tagIds.length,
              contactCount: contactIds.length,
            })
          );
        } else {
          toast.success(
            t('toastRemoved', {
              tagCount: tagIds.length,
              contactCount: contactIds.length,
            })
          );
        }
        onTagsUpdated();
        onOpenChange(false);
        setSelectedTagIds(new Set());
        setSearchQuery('');
        setShowCreate(false);
      }
    } catch (err) {
      console.error('Failed to update tags:', err);
      toast.error(
        err instanceof Error ? err.message : t('toastFailedUpdate')
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-popover border-border text-popover-foreground sm:max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <TagIcon className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-foreground">
                {contactCount > 1
                  ? t('title', { count: contactCount })
                  : t('titleSingle')}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {t('description')}
              </DialogDescription>
            </div>
          </div>

          {/* Action Tabs: Add vs Remove */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/60 rounded-lg mt-4 text-xs font-medium">
            <button
              type="button"
              onClick={() => setAction('add')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md transition-all ${
                action === 'add'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <PlusCircle className="size-3.5 text-emerald-500" />
              {t('addMode')}
            </button>
            <button
              type="button"
              onClick={() => setAction('remove')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md transition-all ${
                action === 'remove'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MinusCircle className="size-3.5 text-rose-500" />
              {t('removeMode')}
            </button>
          </div>
        </DialogHeader>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Search & Actions Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="pl-8 h-8 text-xs bg-muted/40 border-border"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {filteredTags.length > 0 && (
              <div className="flex items-center gap-1 text-[11px] shrink-0 text-muted-foreground">
                {selectedTagIds.size < filteredTags.length ? (
                  <button
                    type="button"
                    onClick={selectAll}
                    className="hover:text-foreground underline underline-offset-2 px-1 py-0.5"
                  >
                    {t('selectAll')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="hover:text-foreground underline underline-offset-2 px-1 py-0.5"
                  >
                    {t('deselectAll')}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Tags List */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {availableTags.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-xs">
                <TagIcon className="size-6 mx-auto mb-1.5 opacity-40" />
                {t('noTagsYet')}
              </div>
            ) : filteredTags.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-xs">
                {t('noTagsFound')}
              </div>
            ) : (
              filteredTags.map((tag) => {
                const isSelected = selectedTagIds.has(tag.id);
                return (
                  <div
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? action === 'add'
                          ? 'border-emerald-500/50 bg-emerald-500/10 dark:bg-emerald-500/15'
                          : 'border-rose-500/50 bg-rose-500/10 dark:bg-rose-500/15'
                        : 'border-border/60 hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleTag(tag.id)}
                        onClick={(e) => e.stopPropagation()}
                        className={
                          action === 'add'
                            ? 'data-checked:bg-emerald-600 data-checked:border-emerald-600 data-[checked]:bg-emerald-600 data-[checked]:border-emerald-600'
                            : 'data-checked:bg-rose-600 data-checked:border-rose-600 data-[checked]:bg-rose-600 data-[checked]:border-rose-600'
                        }
                      />
                      <TagBadge name={tag.name} color={tag.color} size="md" />
                    </div>
                    {isSelected && (
                      <span className="text-[11px] font-medium flex items-center gap-1 text-muted-foreground">
                        <Check className="size-3" />
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Create Tag Row (if admin) */}
          {canCreateTags && (
            <div className="pt-2 border-t border-border/50">
              {!showCreate ? (
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  {t('createNewTag')}
                </button>
              ) : (
                <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground">
                      {t('createNewTag')}
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowCreate(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder={t('newTagNamePlaceholder')}
                      className="h-8 text-xs bg-card border-border flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateTag();
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={handleCreateTag}
                      disabled={creatingTag || !newTagName.trim()}
                      className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
                    >
                      {creatingTag ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        t('createBtn')
                      )}
                    </Button>
                  </div>

                  {/* Swatches */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setSelectedColor(color.value)}
                        className={`size-5 rounded-full transition-transform cursor-pointer ${
                          selectedColor === color.value
                            ? 'ring-2 ring-primary ring-offset-2 ring-offset-card scale-110'
                            : 'opacity-75 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: color.value }}
                        aria-label={`Color ${color.name}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-3 border-t border-border/60 bg-muted/20 flex flex-row items-center justify-between sm:justify-between">
          <div className="text-xs text-muted-foreground">
            {selectedTagIds.size > 0 && (
              <span className="font-medium text-foreground">
                {selectedTagIds.size} {selectedTagIds.size === 1 ? 'tag' : 'tags'} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="border-border text-muted-foreground hover:bg-muted"
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={submitting || selectedTagIds.size === 0}
              onClick={handleApply}
              className={`gap-1.5 text-xs text-white ${
                action === 'add'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {submitting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              {action === 'add'
                ? t('applyAdd', {
                    tagCount: selectedTagIds.size,
                    contactCount,
                  })
                : t('applyRemove', {
                    tagCount: selectedTagIds.size,
                    contactCount,
                  })}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
