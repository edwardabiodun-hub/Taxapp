import { useEffect, useState } from "react";

const INACTIVITY_MS = 60_000;

export function useContextualSupportPrompt(
  active: boolean,
  contextKey: string,
  delayMs = INACTIVITY_MS,
): { visible: boolean; dismiss: () => void; reset: () => void } {
  const storageKey = `filesmart:support-prompt:${contextKey}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return undefined;
    }

    if (sessionStorage.getItem(storageKey) === "dismissed") return undefined;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setVisible(true), delayMs);
    };
    const activityEvents: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "input", "scroll"];
    activityEvents.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      if (timer) clearTimeout(timer);
      activityEvents.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [active, contextKey, delayMs, storageKey]);

  const dismiss = () => {
    sessionStorage.setItem(storageKey, "dismissed");
    setVisible(false);
  };

  const reset = () => setVisible(false);

  return { visible, dismiss, reset };
}
