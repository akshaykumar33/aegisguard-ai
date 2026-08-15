'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from './client';

export interface ResourceState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  /** Re-runs the fetch; use after a mutation or from a "Try again" button. */
  reload: () => void;
}

/**
 * Fetch a resource from the API, exposing the three states a page must handle.
 *
 * Pages previously imported fixture constants directly, so they had no concept
 * of loading or failure. Rendering `error` is not optional — silently swapping
 * in placeholder data is what made a broken backend invisible.
 *
 * `deps` follows the usual effect-dependency contract: pass anything the fetcher
 * closes over.
 */
export function useResource<T>(fetcher: () => Promise<T>, deps: unknown[] = []): ResourceState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (!active) return;
        setData(result);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          err instanceof ApiError ? err : new ApiError((err as Error)?.message ?? 'Unexpected error', 0, '')
        );
        setData(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      // Prevents a slow response from overwriting newer state after unmount.
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { data, error, loading, reload };
}
