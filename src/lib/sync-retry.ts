/** Maximum number of retries after the initial sync attempt. */
export const MAX_SYNC_RETRIES = 3;

const INITIAL_RETRY_DELAY_MS = 5_000;
const MAX_RETRY_DELAY_MS = 60_000;

/** Return the delay for a retry, or null once the finite budget is exhausted. */
export function getRetryDelay(retryIndex: number): number | null {
  if (!Number.isInteger(retryIndex) || retryIndex < 0 || retryIndex >= MAX_SYNC_RETRIES) {
    return null;
  }
  return Math.min(INITIAL_RETRY_DELAY_MS * 2 ** retryIndex, MAX_RETRY_DELAY_MS);
}
