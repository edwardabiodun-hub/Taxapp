export type SubmissionEventType =
  | "created"
  | "status_changed"
  | "exported"
  | "user_submitted"
  | "authority_confirmed"
  | "submission_failed"
  | "submission_rejected";

export type SubmissionActor = "user" | "system" | "authority";

export interface SubmissionEvent {
  readonly id: string;
  readonly preparationId: string;
  readonly type: SubmissionEventType;
  readonly actor: SubmissionActor;
  readonly timestamp: string;
  readonly authorityReference?: string;
}
