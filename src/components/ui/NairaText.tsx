import { Fragment, type ReactNode } from "react";

type NairaSymbolProps = { className?: string };

/** Draws the naira mark directly so its two crossbars remain distinct on every font/device. */
export function NairaSymbol({ className }: NairaSymbolProps) {
  return (
    <svg
      aria-label="Naira"
      className={className ?? "naira-symbol inline-block h-[0.88em] w-[0.72em] align-[-0.12em]"}
      fill="none"
      role="img"
      viewBox="0 0 18 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4 20V4L14 20V4" stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.8" />
      <path d="M1.5 9H16.5M1.5 15H16.5" stroke="currentColor" strokeLinecap="square" strokeWidth="1.8" data-testid="naira-symbol-bars" />
    </svg>
  );
}

type NairaTextProps = { children: ReactNode };

/** Replaces literal naira characters in UI copy with the font-independent FileSmart mark. */
export function NairaText({ children }: NairaTextProps) {
  if (typeof children !== "string") return children;

  const parts = children.split("₦");
  return parts.map((part, index) => (
    <Fragment key={index}>
      {index > 0 && <NairaSymbol />}
      {part}
    </Fragment>
  ));
}
