export type TaxGuideBlock =
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "list";
      items: string[];
    }
  | {
      type: "callout";
      tone: "info" | "caution";
      text: string;
    };

export interface TaxGuide {
  slug: string;
  title: string;
  summary: string;
  category: string;
  publishedAt: string;
  updatedAt: string;
  readTimeMinutes: number;
  sourceNote: string;
  blocks: TaxGuideBlock[];
}

const educationalSourceNote =
  "General educational information only. Confirm the current rules with the relevant Nigerian tax authority or a qualified adviser before acting.";

export const taxGuides: TaxGuide[] = [
  {
    slug: "nigerian-pit-basics",
    title: "Nigerian personal income tax basics",
    summary:
      "A plain-language overview of how personal income tax may apply to individuals in Nigeria.",
    category: "personal-income-tax",
    publishedAt: "2026-10-12",
    updatedAt: "2026-10-12",
    readTimeMinutes: 4,
    sourceNote: educationalSourceNote,
    blocks: [
      {
        type: "paragraph",
        text: "Personal income tax is generally assessed by reference to an individual's taxable income and relevant circumstances. The correct treatment can depend on residence, income source, employment status, and the rules in force for the period being reviewed.",
      },
      {
        type: "list",
        items: [
          "Start with a complete list of employment, business, investment, and other relevant income.",
          "Separate gross receipts from amounts that may be treated differently under applicable rules.",
          "Keep records that support both income reported and any relief or deduction claimed.",
        ],
      },
      {
        type: "callout",
        tone: "caution",
        text: "This overview does not state a universal tax rate or determine which Nigerian authority applies to every taxpayer.",
      },
    ],
  },
  {
    slug: "paye-explained",
    title: "PAYE in Nigeria: what employees should know",
    summary:
      "Understand PAYE as an employer withholding process and the records employees should review.",
    category: "employment-tax",
    publishedAt: "2026-10-12",
    updatedAt: "2026-10-12",
    readTimeMinutes: 3,
    sourceNote: educationalSourceNote,
    blocks: [
      {
        type: "paragraph",
        text: "Pay As You Earn (PAYE) is commonly used to collect personal income tax from employment income through employer deductions and remittances. A payslip can help explain deductions, but it is not by itself a complete assessment of every possible tax obligation.",
      },
      {
        type: "list",
        items: [
          "Compare payroll deductions with payslips, employment records, and year-end statements.",
          "Tell the employer promptly when personal or employment details that affect payroll records change.",
          "Ask the relevant tax authority or a qualified adviser how PAYE interacts with other income sources.",
        ],
      },
    ],
  },
  {
    slug: "filing-deadlines",
    title: "Finding your Nigerian tax filing deadline",
    summary:
      "A practical method for checking the deadline that applies to your taxpayer profile and filing route.",
    category: "tax-compliance",
    publishedAt: "2026-10-12",
    updatedAt: "2026-10-12",
    readTimeMinutes: 3,
    sourceNote: educationalSourceNote,
    blocks: [
      {
        type: "paragraph",
        text: "Tax filing and payment dates can vary based on the taxpayer, the type of income, the relevant authority, and any current administrative notice. Treat a remembered date or a generic calendar entry as a prompt to verify, not as proof of the applicable deadline.",
      },
      {
        type: "list",
        items: [
          "Identify whether the filing is personal, employment-related, business-related, or another return type.",
          "Check the latest instruction or notice from the relevant Nigerian tax authority.",
          "Allow time to resolve missing documents, payment references, or portal access issues.",
        ],
      },
      {
        type: "callout",
        tone: "caution",
        text: "Do not rely on this guide for a fixed statutory date; verify the deadline for the relevant filing period before submitting.",
      },
    ],
  },
  {
    slug: "eligible-deductions",
    title: "Understanding eligible tax deductions",
    summary:
      "How to think about deductions and reliefs without assuming every personal expense is allowable.",
    category: "tax-reliefs",
    publishedAt: "2026-10-12",
    updatedAt: "2026-10-12",
    readTimeMinutes: 4,
    sourceNote: educationalSourceNote,
    blocks: [
      {
        type: "paragraph",
        text: "A tax deduction or relief is not simply any expense that feels connected to earning income. Eligibility, limits, timing, and evidence depend on the applicable Nigerian rules and the taxpayer's circumstances.",
      },
      {
        type: "list",
        items: [
          "Describe the expense or relief precisely instead of grouping unrelated costs together.",
          "Retain invoices, receipts, contracts, and other records that support the claim.",
          "Check whether a limit, exclusion, approval, or specific filing treatment applies.",
        ],
      },
      {
        type: "callout",
        tone: "info",
        text: "When the treatment is unclear or material, confirm it with the relevant authority or a qualified tax adviser before claiming it.",
      },
    ],
  },
  {
    slug: "tax-preparation-checklist",
    title: "Nigerian tax preparation checklist",
    summary:
      "A concise checklist for assembling information before reviewing or filing a tax return.",
    category: "tax-preparation",
    publishedAt: "2026-10-12",
    updatedAt: "2026-10-12",
    readTimeMinutes: 3,
    sourceNote: educationalSourceNote,
    blocks: [
      {
        type: "list",
        items: [
          "Gather income statements, payslips, invoices, bank records, and investment summaries for the relevant period.",
          "Check that names, taxpayer identifiers, contact details, and filing period information are consistent.",
          "Organise evidence for any relief, deduction, withholding, or payment already reported.",
          "Verify the current filing and payment instructions before submitting.",
          "Retain a copy of the return and supporting records according to applicable requirements.",
        ],
      },
      {
        type: "paragraph",
        text: "A checklist improves completeness, but it cannot decide the correct tax treatment where the facts or current rules are uncertain.",
      },
    ],
  },
];

export function getTaxGuide(slug: string): TaxGuide | undefined {
  return taxGuides.find((guide) => guide.slug === slug);
}

export function getTaxGuidesByCategory(category?: string): TaxGuide[] {
  if (!category) {
    return taxGuides;
  }

  return taxGuides.filter((guide) => guide.category === category);
}
