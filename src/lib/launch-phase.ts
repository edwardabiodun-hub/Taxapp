// The public build is always gated, even if an environment variable is omitted.
export const isFilingLaunchPhase = import.meta.env.MODE === "public" || import.meta.env.VITE_FILING_LAUNCH_PHASE === "true";
export const publicFilingPath = isFilingLaunchPhase ? "/filing-waitlist" : "/onboarding";
