export type DeadlineSourceKind =
  | "verified_state"
  | "national_baseline"
  | "unverified";

export type DeadlineConfidence = "high" | "medium" | "low";

export interface ResolvedDeadline {
  readonly taxYear: string;
  readonly sourceKind: DeadlineSourceKind;
  readonly label: string;
  readonly dueAt?: string;
  readonly source?: string;
  readonly verifiedAt?: string;
  readonly effectiveFrom?: string;
  readonly effectiveTo?: string;
  readonly timezone?: string;
  readonly recurrence?: string;
  readonly confidence: DeadlineConfidence;
  readonly isStale: boolean;
  readonly isAvailable?: boolean;
}

export interface CountdownState {
  readonly days: number;
  readonly hours: number;
  readonly minutes?: number;
  readonly isPassed: boolean;
  readonly isStale: boolean;
  readonly sourceLabel: string;
}
