'use client';

import React from 'react';
import { AlertTriangle, Inbox, Loader2, LockKeyhole, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/client';
import { Button } from '@/components/ui/Button';

/** Placeholder shown while a request is in flight. */
/** Placeholder shown while a request is in flight with clean skeleton loaders. */
export function LoadingState({
  label = 'Loading live data…',
  className,
  skeletonCount = 3,
}: {
  label?: string;
  className?: string;
  skeletonCount?: number;
}) {
  return (
    <div className={cn('space-y-4 py-4', className)}>
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground shrink-0" aria-hidden />
        <span>{label}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-5 space-y-3.5 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-28 rounded-md bg-muted shimmer" />
              <div className="h-4 w-12 rounded-md bg-muted shimmer" />
            </div>
            <div className="h-7 w-20 rounded-md bg-muted shimmer" />
            <div className="space-y-2 pt-1">
              <div className="h-2 w-full rounded bg-muted shimmer" />
              <div className="h-2 w-3/4 rounded bg-muted shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Shown when a request succeeds but returns nothing. */
export function EmptyState({
  title = 'Nothing here yet',
  description,
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-12 px-4 text-center rounded-xl border border-dashed border-border bg-card/40',
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Inbox className="h-5 w-5 stroke-[1.5]" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && (
          <p className="max-w-sm text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Shown when a request fails.
 */
export function ErrorState({
  error,
  onRetry,
  className,
}: {
  error: ApiError;
  onRetry?: () => void;
  className?: string;
}) {
  const isAuth = error.isAuthError;
  const isOffline = error.status === 0;

  const title = isAuth
    ? 'Authentication required'
    : isOffline
      ? 'Cannot reach CodeGuard API'
      : 'Could not load resource';

  const description = isAuth
    ? 'Your session may have expired or requires elevated permissions. Switch persona to continue.'
    : isOffline
      ? 'The CodeGuard API backend is not responding on port 3000.'
      : error.message;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-10 px-6 text-center rounded-xl border border-border bg-card shadow-xs',
        className
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg border',
          isAuth
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            : 'bg-destructive/10 border-destructive/20 text-destructive'
        )}
      >
        {isAuth ? (
          <LockKeyhole className="h-5 w-5 stroke-[1.5]" aria-hidden />
        ) : (
          <AlertTriangle className="h-5 w-5 stroke-[1.5]" aria-hidden />
        )}
      </div>
      <div className="space-y-1 max-w-md">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-2">
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Retry Connection
        </Button>
      )}
    </div>
  );
}

/**
 * Renders the correct state for a resource, or the children once data exists.
 *
 * Keeps every page consistent and makes it hard to forget the failure path.
 */
export function Resource<T>({
  state,
  children,
  emptyWhen,
  emptyTitle,
  emptyDescription,
  loadingLabel
}: {
  state: { data: T | null; error: ApiError | null; loading: boolean; reload: () => void };
  children: (data: T) => React.ReactNode;
  emptyWhen?: (data: T) => boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  loadingLabel?: string;
}) {
  if (state.loading) return <LoadingState label={loadingLabel} />;
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  if (state.data === null) return <EmptyState title={emptyTitle} description={emptyDescription} />;
  if (emptyWhen?.(state.data)) return <EmptyState title={emptyTitle} description={emptyDescription} />;
  return <>{children(state.data)}</>;
}
