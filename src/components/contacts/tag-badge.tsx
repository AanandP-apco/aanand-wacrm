'use client';

import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface TagBadgeProps {
  name: string;
  color?: string;
  className?: string;
  size?: 'sm' | 'md';
  onRemove?: () => void;
  title?: string;
}

export function TagBadge({
  name,
  color = '#3b82f6',
  className,
  size = 'sm',
  onRemove,
  title,
}: TagBadgeProps) {
  const safeColor = color || '#3b82f6';

  return (
    <span
      title={title ?? name}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium transition-all select-none',
        size === 'sm'
          ? 'px-2 py-0.5 text-[11px] leading-tight'
          : 'px-2.5 py-1 text-xs',
        className
      )}
      style={{
        backgroundColor: `${safeColor}18`,
        borderColor: `${safeColor}35`,
        borderWidth: 1,
        borderStyle: 'solid',
        color: safeColor,
      }}
    >
      <span
        className="size-1.5 rounded-full shrink-0"
        style={{ backgroundColor: safeColor }}
        aria-hidden="true"
      />
      <span className="truncate max-w-[130px]">{name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-75 focus:outline-none -mr-0.5 rounded-full p-0.5 transition-opacity hover:bg-black/10 dark:hover:bg-white/10"
          aria-label={`Remove tag ${name}`}
        >
          <X className="size-2.5" />
        </button>
      )}
    </span>
  );
}
