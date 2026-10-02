import { useEffect, useState } from "react";
import type { CountdownState, ResolvedDeadline } from "@/domain/deadlines";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const defaultNow = () => new Date();

export function getCountdownState(
  deadline: ResolvedDeadline | null,
  current: Date,
): CountdownState {
  if (!deadline?.dueAt) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      isPassed: false,
      isStale: deadline?.isStale ?? false,
      sourceLabel: deadline?.label ?? "Deadline not verified",
    };
  }

  const difference = Date.parse(deadline.dueAt) - current.getTime();
  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      isPassed: true,
      isStale: deadline.isStale,
      sourceLabel: deadline.label,
    };
  }

  return {
    days: Math.floor(difference / DAY_MS),
    hours: Math.floor((difference % DAY_MS) / HOUR_MS),
    minutes: Math.floor((difference % HOUR_MS) / MINUTE_MS),
    isPassed: false,
    isStale: deadline.isStale,
    sourceLabel: deadline.label,
  };
}

function nextBoundaryDelay(deadline: ResolvedDeadline, current: Date): number | undefined {
  if (!deadline.dueAt) return undefined;
  const difference = Date.parse(deadline.dueAt) - current.getTime();
  if (difference <= 0) return undefined;

  const minuteBoundary = MINUTE_MS - (current.getTime() % MINUTE_MS);
  return Math.max(1, Math.min(difference, minuteBoundary));
}

export function useDeadlineCountdown(
  deadline: ResolvedDeadline | null,
  now: () => Date = defaultNow,
): CountdownState {
  const [countdown, setCountdown] = useState(() =>
    getCountdownState(deadline, now()),
  );

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const update = () => {
      const current = now();
      setCountdown(getCountdownState(deadline, current));
      if (deadline) {
        const delay = nextBoundaryDelay(deadline, current);
        if (delay !== undefined) timer = setTimeout(update, delay);
      }
    };

    update();
    return () => {
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [deadline, now]);

  return countdown;
}
