export type TaxGuideBlock =
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "heading";
      text: string;
      level?: 2 | 3;
    }
  | {
      type: "list";
      items: string[];
    }
  | {
      type: "table";
      headers: string[];
      rows: string[][];
    }
  | {
      type: "faq";
      question: string;
      answer: string;
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
  sources?: { label: string; url: string }[];
  blocks: TaxGuideBlock[];
}

const educationalSourceNote =
  "General educational information only. Confirm the current rules with the relevant tax authority or a qualified adviser before acting.";

export const taxGuides: TaxGuide[] = [
  {
    slug: "nigeria-tax-law-2026-personal-income-tax",
    title: "Nigeria Tax Law 2026: New PAYE Rates and Changes Explained",
    summary:
      "Understand Nigeria's new 2026 personal income tax rates, exemptions, deductions and PAYE changes, with practical examples for employees.",
    category: "personal-income-tax",
    publishedAt: "2026-10-14",
    updatedAt: "2026-10-14",
    readTimeMinutes: 4,
    sourceNote: educationalSourceNote,
    sources: [
      { label: "Nigeria Tax Act 2025", url: "https://www.nipc.gov.ng/wp-content/uploads/2025/07/Nigeria-Tax-Act-2025.pdf" },
      { label: "Personal Income Tax Guidelines 2026", url: "https://www.jrb.gov.ng/assets/2026-pit-guidelines-TJG3n9-T.pdf" },
      { label: "Federal Ministry of Finance transition guidelines", url: "https://finance.gov.ng/ministry/federal-government-issues-transition-guidelines-for-tax-acts-2025/" },
    ],
    blocks: [
      { type: "paragraph", text: "The personal income tax framework changed from January 1, 2026. The Nigeria Tax Act 2025 introduced progressive individual income tax bands, while the 2026 Personal Income Tax Guidelines provide administrative guidance for returns, deductions, and PAYE." },
      { type: "paragraph", text: "If you earn a salary, freelance, or run a small business, understanding the structure can help you prepare accurate records and avoid treating a tax estimate as a final assessment." },
      { type: "heading", text: "What are the new personal income tax rates?" },
      { type: "table", headers: ["Annual taxable income band", "Rate"], rows: [["First ₦800,000", "0%"], ["Next ₦2,200,000", "15%"], ["Next ₦9,000,000", "18%"], ["Next ₦13,000,000", "21%"], ["Next ₦25,000,000", "23%"], ["Above ₦50,000,000", "25%"]] },
      { type: "paragraph", text: "These are progressive rates. You do not apply the highest rate to your entire income. The bands apply to taxable income after applicable reliefs, exemptions, and eligible deductions—not automatically to gross salary." },
      { type: "heading", text: "Example: annual taxable income of ₦2.4 million" },
      { type: "list", items: ["First ₦800,000 at 0% = ₦0", "Remaining ₦1.6 million at 15% = ₦240,000", "Illustrative annual tax = ₦240,000", "Illustrative monthly equivalent = ₦20,000"] },
      { type: "callout", tone: "caution", text: "This example assumes ₦2.4 million is already taxable income. If it is gross salary, eligible deductions and the applicable payroll calculation may change the result." },
      { type: "heading", text: "What deductions and reliefs can matter?" },
      { type: "paragraph", text: "The 2026 framework uses eligible deductions and reliefs in determining chargeable income. Depending on the facts and supporting evidence, these can include approved pension, housing-fund, health-insurance, qualifying mortgage-interest, life-insurance, and rent-relief claims." },
      { type: "paragraph", text: "Rent relief is 20% of qualifying annual rent paid, with the relief itself capped at ₦500,000. The claim requires accurate information and evidence of the rent paid." },
      { type: "heading", text: "Does everyone now pay income tax?" },
      { type: "paragraph", text: "No. An individual's calculated tax can be zero where taxable income falls entirely within the 0% band or eligible deductions reduce taxable income into that band. A zero calculation should not automatically be treated as proof that no registration or filing obligation applies." },
      { type: "heading", text: "What should employees and freelancers do?" },
      { type: "list", items: ["Check whether payroll is using the current bands and recording eligible deductions correctly.", "Keep payslips, income records, receipts, invoices, and evidence of withholding tax.", "Separate income earned before January 1, 2026 from income covered by the new framework.", "Confirm the relevant tax authority, filing route, and current administrative instructions before submitting."] },
      { type: "heading", text: "Frequently asked questions" },
      { type: "faq", question: "Is Nigeria's new tax law already in effect?", answer: "The Federal Ministry of Finance states that the Nigeria Tax Act 2025 applies from January 1, 2026. Transitional rules can apply to earlier periods." },
      { type: "faq", question: "Is the first ₦800,000 of salary tax-free?", answer: "The first ₦800,000 of annual taxable income is charged at 0%. Gross salary and taxable income are not necessarily the same amount." },
      { type: "faq", question: "How can I check my PAYE amount?", answer: "Start with annual taxable income after applicable deductions, apply the progressive bands, and then reconcile the result to the payroll period and employer records." },
      { type: "callout", tone: "info", text: "Use FileSmart's tax calculator to organise income and deduction inputs, estimate your position, and identify questions to confirm with the relevant authority or a qualified adviser." },
    ],
  },
  {
    slug: "personal-income-tax-exemptions-nigeria-2026",
    title: "Who Is Exempt From Income Tax in Nigeria? 2026 Guide",
    summary:
      "Find out who pays zero personal income tax in Nigeria in 2026, how the ₦800,000 tax-free band works, and whether you still need to file.",
    category: "tax-compliance",
    publishedAt: "2026-10-14",
    updatedAt: "2026-10-14",
    readTimeMinutes: 4,
    sourceNote: educationalSourceNote,
    sources: [
      { label: "Nigeria Tax Act 2025", url: "https://www.nipc.gov.ng/wp-content/uploads/2025/07/Nigeria-Tax-Act-2025.pdf" },
      { label: "Personal Income Tax Guidelines 2026", url: "https://www.jrb.gov.ng/assets/2026-pit-guidelines-TJG3n9-T.pdf" },
    ],
    blocks: [
      { type: "paragraph", text: "If your annual taxable income is ₦800,000 or less, your calculated personal income tax under the 2026 progressive bands is zero. But zero tax payable is not the same as a blanket exemption from registration, record-keeping, or filing requirements." },
      { type: "heading", text: "How the 0% band works" },
      { type: "paragraph", text: "The first ₦800,000 of annual taxable income is charged at 0% under the Nigeria Tax Act 2025. Income above that band is taxed progressively; you do not suddenly pay tax on your entire income at 15%." },
      { type: "table", headers: ["Annual taxable income", "Illustrative annual tax"], rows: [["₦600,000", "₦0"], ["₦800,000", "₦0"], ["₦1,000,000", "₦30,000"], ["₦1,500,000", "₦105,000"]] },
      { type: "callout", tone: "caution", text: "These examples assume the amounts shown are taxable income after applicable deductions. They are not a final assessment of a particular taxpayer's liability." },
      { type: "heading", text: "Are unemployed people or students automatically exempt?" },
      { type: "paragraph", text: "Unemployment or student status alone does not create a blanket exemption from tax on taxable earnings. A student or unemployed person may still receive income from work, business, consulting, investments, or other sources. The nature and amount of income matter." },
      { type: "heading", text: "If you pay zero tax, must you still register or file?" },
      { type: "paragraph", text: "The 2026 Personal Income Tax Guidelines state that every taxable person must file an annual income return, whether or not tax is payable. The return is generally due by March 31 of the relevant year of assessment for the preceding basis period. Confirm the current process and authority that applies to you." },
      { type: "heading", text: "How to check your position" },
      { type: "list", items: ["List every income source for the relevant year.", "Separate gross income from taxable income and identify eligible deductions.", "Apply the progressive bands to the resulting taxable income.", "Check your Tax ID, filing route, and current instructions with the relevant authority."] },
      { type: "heading", text: "Frequently asked questions" },
      { type: "faq", question: "Is ₦800,000 the new minimum taxable income?", answer: "It is the first annual taxable-income band charged at 0%. Income above it is taxed progressively." },
      { type: "faq", question: "Does earning less than ₦800,000 mean I do not need a Tax ID?", answer: "Not necessarily. Tax ID and filing requirements depend on whether you are a taxable person and the applicable administrative rules." },
      { type: "faq", question: "Can deductions reduce my tax to zero?", answer: "Eligible deductions can reduce taxable income, and the resulting tax may be zero if the amount falls within the 0% band." },
      { type: "callout", tone: "info", text: "FileSmart can help you organise income and deduction inputs and estimate your tax position. Use the result as preparation support, not as a substitute for advice from the relevant tax authority or a qualified adviser." },
    ],
  },
  {
    slug: "freelancer-side-hustle-tax-nigeria-2026",
    title: "Do Freelancers Pay Tax in Nigeria? 2026 Rules Explained",
    summary:
      "Learn how Nigerian freelancers and side hustlers are taxed in 2026, what records to keep, and how to calculate and file personal income tax.",
    category: "self-employed-tax",
    publishedAt: "2026-10-14",
    updatedAt: "2026-10-14",
    readTimeMinutes: 4,
    sourceNote: educationalSourceNote,
    sources: [
      { label: "Nigeria Tax Act 2025", url: "https://www.nipc.gov.ng/wp-content/uploads/2025/07/Nigeria-Tax-Act-2025.pdf" },
      { label: "Personal Income Tax Guidelines 2026", url: "https://www.jrb.gov.ng/assets/2026-pit-guidelines-TJG3n9-T.pdf" },
      { label: "Niger State IRS tax types guidance", url: "https://www.ngsirs.gov.ng/tax-types/" },
    ],
    blocks: [
      { type: "paragraph", text: "Freelancers, consultants, online sellers, and other side-hustle earners may have personal income tax obligations. The answer depends on taxable income, allowable expenses, deductions, withholding tax, and the applicable rules—not simply on whether a company has been registered." },
      { type: "heading", text: "Is freelance income taxable?" },
      { type: "paragraph", text: "Income from services, trade, business, profession, or vocation can fall within the individual income tax framework. Examples include freelance writing, software development, consulting, creative services, social-media management, photography, online selling, and other independent work." },
      { type: "heading", text: "How much tax do freelancers pay?" },
      { type: "paragraph", text: "The 2026 individual tax bands are progressive. The first ₦800,000 of taxable income is charged at 0%, and higher portions are charged at 15%, 18%, 21%, 23%, and 25% according to the applicable band." },
      { type: "heading", text: "Example: a freelancer earning ₦300,000 monthly" },
      { type: "list", items: ["Annual revenue: ₦300,000 × 12 = ₦3,600,000", "Illustrative allowable business expenses: ₦600,000", "Illustrative income before further deductions: ₦3,000,000", "First ₦800,000 at 0% = ₦0", "Next ₦2,200,000 at 15% = ₦330,000", "Illustrative annual tax = ₦330,000, or ₦27,500 monthly equivalent"] },
      { type: "callout", tone: "caution", text: "This is an illustration, not a definitive assessment. Expenses must qualify under the applicable rules, and additional deductions, exemptions, or withholding tax credits may change the result." },
      { type: "heading", text: "What records should freelancers keep?" },
      { type: "list", items: ["Invoices, contracts, payment records, and bank statements.", "Receipts for business expenses that are directly connected with earning income.", "Evidence of withholding tax deducted by clients.", "A clear separation between personal spending, capital purchases, and operating costs."] },
      { type: "heading", text: "What if you also have a full-time job?" },
      { type: "paragraph", text: "Your employer generally handles PAYE on employment income, but that does not automatically settle the treatment of freelance or business income. Keep the payroll and independent-income records separate, and disclose additional income through the applicable return process." },
      { type: "heading", text: "Do freelancers need to register and file?" },
      { type: "paragraph", text: "The 2026 Personal Income Tax Guidelines provide for annual individual returns and require income from trade, business, profession, or vocation to be supported by appropriate financial information. The general annual-return deadline is March 31 for the preceding basis period, subject to the applicable authority and instructions." },
      { type: "heading", text: "Frequently asked questions" },
      { type: "faq", question: "Do I pay tax if my side hustle earns less than ₦800,000 annually?", answer: "If your total annual taxable income falls entirely within the 0% band, your calculated personal income tax may be zero. Other income sources and filing obligations still matter." },
      { type: "faq", question: "Do freelancers pay PAYE?", answer: "PAYE generally applies to employment income deducted by an employer. Independent freelancers usually deal with their income through the applicable self-assessment and annual-return process, while withholding tax may apply to specified payments." },
      { type: "faq", question: "What if a client deducted withholding tax?", answer: "Keep the evidence. Depending on the payment and applicable rules, the withholding tax may be creditable against your final income tax liability." },
      { type: "callout", tone: "info", text: "FileSmart can help you organise freelance income, expenses, and deductions into a clearer preparation record before you confirm the correct filing route." },
    ],
  },
  {
    slug: "paye-300000-monthly-nigeria-2026",
    title: "If You Earn ₦300,000 Monthly in Nigeria, How Much Tax Will You Pay in 2026?",
    summary:
      "See an illustrative 2026 Nigerian PAYE calculation for a ₦300,000 monthly salary, including progressive bands, deductions, and estimated take-home considerations.",
    category: "employment-tax",
    publishedAt: "2026-10-14",
    updatedAt: "2026-10-14",
    readTimeMinutes: 4,
    sourceNote: educationalSourceNote,
    sources: [
      { label: "Nigeria Tax Act 2025", url: "https://www.nipc.gov.ng/wp-content/uploads/2025/07/Nigeria-Tax-Act-2025.pdf" },
      { label: "Nigeria Tax Administration Act 2025", url: "https://nipc.gov.ng/external-resources/nigeria-tax-administration-act" },
      { label: "Personal Income Tax Guidelines 2026", url: "https://www.jrb.gov.ng/assets/2026-pit-guidelines-TJG3n9-T.pdf" },
      { label: "Federal Ministry of Finance transition guidelines", url: "https://finance.gov.ng/ministry/federal-government-issues-transition-guidelines-for-tax-acts-2025/" },
    ],
    blocks: [
      { type: "paragraph", text: "At ₦300,000 per month, your annual gross salary is ₦3.6 million. Under the tax framework effective from January 1, 2026, your personal income tax depends on taxable income after applicable deductions and reliefs. Without deductions in this illustration, the estimated annual tax is ₦438,000, or ₦36,500 monthly." },
      { type: "heading", text: "How much tax applies to a ₦300,000 monthly salary?" },
      { type: "paragraph", text: "The 2026 personal income tax system uses progressive rates. Different portions of taxable income are charged at different percentages; the highest applicable rate is not applied to the entire salary." },
      { type: "table", headers: ["Calculation", "Amount"], rows: [["Monthly gross salary", "₦300,000"], ["Annual gross salary", "₦3,600,000"], ["First ₦800,000 at 0%", "₦0"], ["Next ₦2,200,000 at 15%", "₦330,000"], ["Remaining ₦600,000 at 18%", "₦108,000"], ["Illustrative annual income tax", "₦438,000"], ["Illustrative monthly income tax", "₦36,500"]] },
      { type: "callout", tone: "caution", text: "This calculation assumes the full ₦3.6 million is taxable income and excludes deductions or reliefs. It is an illustration, not a final assessment or a prescription for what an employer must deduct." },
      { type: "heading", text: "Can your actual tax be lower?" },
      { type: "paragraph", text: "Yes. Your actual calculation may change when eligible deductions and reliefs are considered. Depending on your circumstances, these may include qualifying pension contributions, applicable insurance contributions, and rent relief." },
      { type: "paragraph", text: "Under the 2026 rules, qualifying rent relief is generally 20% of annual rent paid, with relief capped at ₦500,000. For example, ₦1.2 million of qualifying annual rent could produce a potential ₦240,000 relief, subject to the relevant conditions and supporting documentation." },
      { type: "heading", text: "How much will you take home?" },
      { type: "paragraph", text: "Take-home pay depends on more than income tax. An employer may also deduct pension contributions and other applicable amounts. Subtracting the illustrative ₦36,500 tax from ₦300,000 does not necessarily produce your final net salary." },
      { type: "heading", text: "Does your employer pay the tax for you?" },
      { type: "paragraph", text: "For employees, PAYE is generally deducted from salary by the employer and remitted to the relevant tax authority. PAYE deduction and individual tax-return filing are separate compliance questions. Additional freelance, consulting, or business income may create further reporting obligations." },
      { type: "heading", text: "Frequently asked questions" },
      { type: "faq", question: "Is ₦300,000 monthly tax-free in Nigeria?", answer: "No. ₦300,000 monthly equals ₦3.6 million annually. The first ₦800,000 of taxable income is charged at 0%, while higher bands attract tax." },
      { type: "faq", question: "Can pension contributions reduce my PAYE?", answer: "Qualifying pension contributions may affect the income used to calculate PAYE, subject to the applicable rules and documentation." },
      { type: "faq", question: "Can I calculate PAYE online?", answer: "Yes. A calculator using the current tax bands and your eligible inputs can provide an estimate. Confirm the result against your payroll records and the relevant authority's requirements." },
      { type: "callout", tone: "info", text: "Use FileSmart's PAYE calculator to estimate your tax, organise applicable deductions, and understand the next steps for tax preparation." },
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
