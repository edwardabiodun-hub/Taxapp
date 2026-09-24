import type { LocalDeclaration } from "./local-db";

/**
 * NTAA 2025 s.31(5): tax records "shall be kept for a period not less than
 * six years after the year of assessment in which the income relates."
 * Modeled conservatively as retained through Dec 31 of (taxYear + 6) —
 * eligible for deletion starting Jan 1 of (taxYear + 7), giving a full six
 * elapsed years beyond the assessment year itself.
 *
 * NTAA s.36(4): the six-year limit is removed entirely for deliberate
 * misstatement/fraud. This schema's closest signal for "under active
 * regulatory scrutiny" is status === "audit_request", treated as an
 * indefinite hold until the status changes.
 *
 * Mirrored server-side by the RLS delete policy in
 * supabase/migrations/20260924010000_retention_hold.sql — keep both in
 * sync if this logic ever changes; the DB policy is the real enforcement
 * boundary, this is for client-side display/gating.
 */

const RETENTION_YEARS = 6;

export function retentionHoldEndsAt(declaration: Pick<LocalDeclaration, "taxYear">): Date {
  const assessmentYear = parseInt(declaration.taxYear, 10);
  const holdEndYear = assessmentYear + RETENTION_YEARS + 1;
  return new Date(Date.UTC(holdEndYear, 0, 1));
}

export function isUnderRetentionHold(
  declaration: Pick<LocalDeclaration, "taxYear" | "status">,
  now: Date = new Date()
): boolean {
  if (declaration.status === "audit_request") return true;
  return now < retentionHoldEndsAt(declaration);
}
