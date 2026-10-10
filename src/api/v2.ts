// Helpers for the v2 backend: one call per write, the record is saved as
// `queued` and a worker delivers it to Odoo. The browser never calls Odoo
// and never holds an Odoo session.
import { useEffect, useRef } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Idempotency key for a create. Make one per form, reuse it on resubmit. */
export const newRequestId = () => crypto.randomUUID();

const statusOf = (item: any) => String(item?.status || '').toLowerCase();

export const isQueued = (item: any) => statusOf(item) === 'queued';
export const isFailed = (item: any) => statusOf(item) === 'failed';
/** Saved on our side but not in Odoo yet. */
export const isUnsynced = (item: any) => isQueued(item) || isFailed(item);

/**
 * What to show as a record's number: the Odoo id (or sequence) once it has
 * one, the job id until then.
 */
export const recordRef = (item: any, odooRef: any = item?.id) =>
  odooRef
    ? `#${odooRef}`
    : `Job ${String(item?.jobId || item?._id || '')
        .slice(-6)
        .toUpperCase()}`;

/** Message from a failed v2 call. */
export const errorMessage = (error: any, fallback: string) =>
  error?.message && typeof error.message === 'string' ? error.message : fallback;

/**
 * Re-fetch a list every few seconds while it holds queued records, so they
 * turn into sent or failed without a manual refresh.
 */
export const useQueuedRefresh = (
  items: any[],
  refetch: () => void,
  intervalMs = 4000,
) => {
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  const pending = (items || []).some(
    (item) => isQueued(item) || statusOf(item) === 'removing',
  );

  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(() => refetchRef.current(), intervalMs);
    return () => clearInterval(timer);
  }, [pending, intervalMs]);
};
