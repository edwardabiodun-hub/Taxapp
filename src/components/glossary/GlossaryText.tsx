import { Children, cloneElement, isValidElement, type ReactNode, type ReactElement } from "react";

import { glossaryEntries, tokenizeGlossaryText, type GlossaryEntry } from "@/lib/glossary";
import { GlossaryTooltip } from "./GlossaryTooltip";

interface GlossaryTextProps {
  children: ReactNode;
  entries?: GlossaryEntry[];
}

const excludedTags = new Set(["a", "button", "code", "input", "option", "pre", "select", "textarea"]);

function transformChildren(children: ReactNode, entries: GlossaryEntry[]): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === "string") {
      return tokenizeGlossaryText(child, entries).map((token, index) => {
        if (!token.entryId) return token.text;
        const entry = entries.find((candidate) => candidate.id === token.entryId);
        return entry ? (
          <GlossaryTooltip key={`${entry.id}-${index}`} entry={entry}>
            {token.text}
          </GlossaryTooltip>
        ) : token.text;
      });
    }

    if (!isValidElement(child)) return child;

    const element = child as ReactElement<{ children?: ReactNode; "data-glossary-ignore"?: boolean }>;
    const tagName = typeof element.type === "string" ? element.type : undefined;
    if (element.props["data-glossary-ignore"] || (tagName && excludedTags.has(tagName))) return child;

    return cloneElement(element, undefined, transformChildren(element.props.children, entries));
  });
}

export function GlossaryText({ children, entries = glossaryEntries }: GlossaryTextProps) {
  return <>{transformChildren(children, entries)}</>;
}
