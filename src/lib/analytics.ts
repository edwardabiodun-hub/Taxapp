export type AnalyticsEventName =
  | "public_calculator_viewed"
  | "public_calculator_estimate_shown"
  | "public_calculator_estimate_unavailable";

export interface AnalyticsEvent {
  readonly name: AnalyticsEventName;
  readonly properties: Readonly<Record<string, string>>;
}

const ANALYTICS_EVENT = "filesmart:analytics";
const SAFE_PROPERTY_KEYS = new Set(["surface", "route", "action", "result"]);
const SAFE_VALUE = /^[a-z0-9:_/-]{1,80}$/i;

function safeProperties(input: Record<string, unknown>): Readonly<Record<string, string>> {
  const properties: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (
      SAFE_PROPERTY_KEYS.has(key) &&
      typeof value === "string" &&
      SAFE_VALUE.test(value)
    ) {
      properties[key] = value;
    }
  }
  return Object.freeze(properties);
}

export function createAnalyticsEvent(
  name: AnalyticsEventName,
  properties: Record<string, unknown> = {},
): AnalyticsEvent {
  return Object.freeze({ name, properties: safeProperties(properties) });
}

/**
 * Emits a browser-local event for a future privacy-reviewed analytics adapter.
 * It deliberately performs no network request and excludes financial, identity,
 * document, and free-form user data from the event contract.
 */
export function trackEvent(
  name: AnalyticsEventName,
  properties: Record<string, unknown> = {},
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AnalyticsEvent>(
      ANALYTICS_EVENT,
      { detail: createAnalyticsEvent(name, properties) },
    ),
  );
}

export { ANALYTICS_EVENT };
