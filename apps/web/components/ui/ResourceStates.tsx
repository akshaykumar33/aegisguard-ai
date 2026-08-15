'use client';

import React from 'react';
import { AlertTriangle, Inbox, Loader2, LockKeyhole, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/client';
import { Button } from '@/components/ui/Button';

/** Placeholder shown while a request is in flight. */
export function LoadingState({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground', className)}>
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      <p className="text-sm">{label}</p>
    </div>
  );
}

/** Shown when a request succeeds but returns nothing. */
export function EmptyState({
  title = 'Nothing here yet',
  description,
  className
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 py-12 text-center', className)}>
      <Inbox className="h-6 w-6 text-muted-foreground" aria-hidden />
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

/**
 * Shown when a request fails.
 *
 * The failure is stated plainly rather than replaced with placeholder data, so a
 * misconfigured or unreachable backend is obvious instead of looking like a
 * populated dashboard.
 */
export function ErrorState({
  error,
  onRetry,
  className
}: {
  error: ApiError;
  onRetry?: () => void;
  className?: string;
}) {
  const isAuth = error.isAuthError;
  const isOffline = error.status === 0;

  const title = isAuth
    ? 'Not authorized'
    : isOffline
      ? 'Cannot reach the API'
      : 'Could not load this data';

  const description = isAuth
    ? 'Your session may have expired, or this view requires a different role. Sign in again to continue.'
    : isOffline
      ? 'The CodeGuard API is not responding. Check that the API service is running on port 3000.'
      : error.message;

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12 text-center', className)}>
      {isAuth ? (
        <LockKeyhole className="h-6 w-6 text-amber-500" aria-hidden />
      ) : (
        <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden />
      )}
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-1">
          <RefreshCw className="mr-2 h-3.5 w-3.5" aria-hidden />
          Try again
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
