export type SubmissionEventType =
  | "created"
  | "status_changed"
  | "exported"
  | "user_submitted"
  | "authority_confirmed"
  | "submission_failed"
  | "submission_rejected";

export type SubmissionActor = "user" | "system" | "authority";

interface SubmissionEventBase {
  readonly id: string;
  readonly preparationId: string;
  readonly actor: SubmissionActor;
  readonly timestamp: string;
  readonly authorityReference?: string;
}

export type SubmissionEvent =
  | (SubmissionEventBase & {
      readonly type: Exclude<SubmissionEventType, "authority_confirmed">;
    })
  | (SubmissionEventBase & {
      readonly type: "authority_confirmed";
      readonly actor: "authority";
      readonly authorityReference: string;
    });

export function isSubmissionEventValid(event: SubmissionEvent): boolean {
  if (event.type !== "authority_confirmed") return true;

  return event.authorityReference.trim().length > 0;
}
