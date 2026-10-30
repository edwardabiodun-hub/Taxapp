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
  image: { src: string; alt: string };
  category: string;
  publishedAt: string;
  updatedAt: string;
  readTimeMinutes: number;
  sourceNote: string;
  sources?: { label: string; url: string }[];
  cta?: { label: string; href: "/calculator" | "/filing-waitlist" };
  reviewStatus?: "pending-professional-review" | "reviewed";
  blocks: TaxGuideBlock[];
}

const educationalSourceNote =
  "General educational information only. Confirm the current rules with the relevant tax authority or a qualified adviser before acting.";

const taxPreparationImage = {
  src: "/images/filesmart-hero-tax-preparation.webp",
  alt: "Woman reviewing tax records beside a laptop",
};

const smallBusinessImage = {
  src: "/images/filesmart-small-business.png",
  alt: "Small-business owners reviewing records together at a laptop",
};

export const taxGuides: TaxGuide[] = [
  {
    slug: "nigeria-tax-law-2026-personal-income-tax",
    title: "Nigeria Tax Law 2026: New PAYE Rates and Changes Explained",
    summary:
      "Understand Nigeria's new 2026 personal income tax rates, exemptions, deductions and PAYE changes, with practical examples for employees.",
    image: taxPreparationImage,
    category: "personal-income-tax",
    publishedAt: "2026-10-14",
    updatedAt: "2026-10-14",
    readTimeMinutes: 4,
    sourceNote: educationalSourceNote,
    sources: [
      { label: "Nigeria Tax Act 2025", url: "https://www.nipc.gov.ng/wp-content/uploads/2025/07/Nigeria-Tax-Act-2025.pdf" },
      { label: "JRB tax policies and reforms", url: "https://www.jrb.gov.ng/policies-reforms" },
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
    image: taxPreparationImage,
    category: "tax-compliance",
    publishedAt: "2026-10-14",
    updatedAt: "2026-10-14",
    readTimeMinutes: 4,
    sourceNote: educationalSourceNote,
    sources: [
      { label: "Nigeria Tax Act 2025", url: "https://www.nipc.gov.ng/wp-content/uploads/2025/07/Nigeria-Tax-Act-2025.pdf" },
      { label: "JRB tax policies and reforms", url: "https://www.jrb.gov.ng/policies-reforms" },
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
    image: smallBusinessImage,
    category: "self-employed-tax",
    publishedAt: "2026-10-14",
    updatedAt: "2026-10-14",
    readTimeMinutes: 4,
    sourceNote: educationalSourceNote,
    sources: [
      { label: "Nigeria Tax Act 2025", url: "https://www.nipc.gov.ng/wp-content/uploads/2025/07/Nigeria-Tax-Act-2025.pdf" },
      { label: "JRB tax policies and reforms", url: "https://www.jrb.gov.ng/policies-reforms" },
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
    image: taxPreparationImage,
    category: "employment-tax",
    publishedAt: "2026-10-14",
    updatedAt: "2026-10-14",
    readTimeMinutes: 4,
    sourceNote: educationalSourceNote,
    sources: [
      { label: "Nigeria Tax Act 2025", url: "https://www.nipc.gov.ng/wp-content/uploads/2025/07/Nigeria-Tax-Act-2025.pdf" },
      { label: "Nigeria Tax Administration Act 2025", url: "https://nipc.gov.ng/external-resources/nigeria-tax-administration-act" },
      { label: "JRB tax policies and reforms", url: "https://www.jrb.gov.ng/policies-reforms" },
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
  {
    slug: "nigeria-paye-tax-calculator-2026",
    title: "Nigeria PAYE Tax Calculator 2026: How Much Tax Will You Pay?",
    summary:
      "Calculate an illustrative 2026 PAYE estimate using the current income-tax bands, salary examples, and eligible deductions.",
    image: taxPreparationImage,
    category: "employment-tax",
    publishedAt: "2026-10-30",
    updatedAt: "2026-10-30",
    readTimeMinutes: 4,
    sourceNote:
      "General educational information only. This draft is pending review by a Nigerian tax professional. Confirm the current rules with the relevant tax authority or a qualified adviser before acting.",
    reviewStatus: "pending-professional-review",
    cta: { label: "Calculate your PAYE estimate", href: "/calculator" },
    sources: [
      { label: "Nigeria Tax Act 2025", url: "https://www.nipc.gov.ng/wp-content/uploads/2025/07/Nigeria-Tax-Act-2025.pdf" },
      { label: "JRB tax policies and reforms", url: "https://www.jrb.gov.ng/policies-reforms" },
      { label: "Federal Ministry of Finance transition guidelines", url: "https://finance.gov.ng/ministry/federal-government-issues-transition-guidelines-for-tax-acts-2025/" },
    ],
    blocks: [
      { type: "paragraph", text: "A monthly salary is only the starting point for a PAYE estimate. The calculation uses annual taxable income, not simply the amount that appears on a monthly payslip. Under the framework effective from January 1, 2026, the first ₦800,000 of annual taxable income is charged at 0%, with higher portions taxed progressively." },
      { type: "heading", text: "The 2026 PAYE bands" },
      { type: "table", headers: ["Annual taxable income band", "Rate"], rows: [["First ₦800,000", "0%"], ["Next ₦2,200,000", "15%"], ["Next ₦9,000,000", "18%"], ["Next ₦13,000,000", "21%"], ["Next ₦25,000,000", "23%"], ["Above ₦50,000,000", "25%"]] },
      { type: "paragraph", text: "These are marginal rates. The highest rate that applies to part of your income is not applied to the whole amount. First work out taxable income after the deductions and reliefs that genuinely apply to you, then work through the bands." },
      { type: "heading", text: "Worked example: ₦300,000 a month" },
      { type: "paragraph", text: "Assume a gross salary of ₦300,000 a month and, for this simplified example, no deductions or reliefs. Annual gross income is ₦3,600,000." },
      { type: "table", headers: ["Calculation", "Tax"], rows: [["First ₦800,000 × 0%", "₦0"], ["Next ₦2,200,000 × 15%", "₦330,000"], ["Remaining ₦600,000 × 18%", "₦108,000"], ["Illustrative annual PAYE", "₦438,000"], ["Monthly equivalent", "₦36,500"]] },
      { type: "callout", tone: "caution", text: "This assumes the full ₦3.6 million is taxable income. It is an illustration, not a final assessment or a direction to an employer on what to deduct." },
      { type: "heading", text: "Deductions can change the estimate" },
      { type: "paragraph", text: "Depending on the facts and the evidence available, qualifying deductions may include pension contributions, National Housing Fund contributions, eligible health insurance, life insurance premiums, qualifying mortgage interest, and rent relief." },
      { type: "paragraph", text: "Rent relief is generally 20% of qualifying annual rent, subject to a ₦500,000 cap on the relief. Annual qualifying rent of ₦1,500,000 would therefore produce a potential ₦300,000 relief before the rest of the calculation is applied." },
      { type: "heading", text: "What reaches your bank account?" },
      { type: "paragraph", text: "PAYE is only one part of a payslip. Pension contributions and other authorized payroll deductions can also affect take-home pay, so gross salary minus the illustrative PAYE figure is not the same as net salary." },
      { type: "heading", text: "Questions people ask" },
      { type: "faq", question: "Is PAYE calculated monthly or annually?", answer: "The statutory bands are annual. Employers normally translate the resulting liability into payroll deductions, so the payslip amount should be reconciled with the annual calculation." },
      { type: "faq", question: "Is the first ₦800,000 of my salary tax-free?", answer: "The first ₦800,000 of annual taxable income is charged at 0%. Taxable income and gross salary are not always the same amount." },
      { type: "faq", question: "Can I estimate PAYE without an accountant?", answer: "You can make a preliminary estimate using the current bands and your eligible inputs. A complicated income arrangement still deserves professional review." },
      { type: "callout", tone: "info", text: "Use FileSmart's calculator to enter your income and eligible deductions, then treat the result as preparation support rather than an official assessment." },
    ],
  },
  {
    slug: "how-to-calculate-personal-income-tax-nigeria-2026",
    title: "How to Calculate Personal Income Tax in Nigeria: 2026 Guide",
    summary:
      "Work through annual income, eligible deductions, taxable income, and the 2026 progressive bands with practical examples.",
    image: taxPreparationImage,
    category: "personal-income-tax",
    publishedAt: "2026-10-30",
    updatedAt: "2026-10-30",
    readTimeMinutes: 4,
    sourceNote:
      "General educational information only. This draft is pending review by a Nigerian tax professional. Confirm the current rules with the relevant tax authority or a qualified adviser before acting.",
    reviewStatus: "pending-professional-review",
    cta: { label: "Estimate your personal income tax", href: "/calculator" },
    sources: [
      { label: "Nigeria Tax Act 2025", url: "https://www.nipc.gov.ng/wp-content/uploads/2025/07/Nigeria-Tax-Act-2025.pdf" },
      { label: "JRB tax policies and reforms", url: "https://www.jrb.gov.ng/policies-reforms" },
    ],
    blocks: [
      { type: "paragraph", text: "Personal income tax starts with a good income record, not a tax-rate table. Gather the income that belongs in the relevant year, identify deductions you can support, and only then apply the progressive bands." },
      { type: "heading", text: "1. Add the income for the year" },
      { type: "paragraph", text: "An employee may need to consider salary, bonuses, allowances, and taxable benefits. A self-employed person may start with business income after identifying allowable business expenses. If you have more than one source, keep the records together before deciding what is taxable." },
      { type: "paragraph", text: "For instance, ₦250,000 a month is ₦3,000,000 over a full year. Other taxable income may need to be added to that figure." },
      { type: "heading", text: "2. Check the deductions you can support" },
      { type: "paragraph", text: "The 2026 framework may allow qualifying pension, insurance, National Housing Fund, health-insurance, mortgage-interest, and rent-relief deductions. Eligibility depends on the law and the evidence behind the claim. Keep the receipt, statement, certificate, or payroll record that supports each input." },
      { type: "heading", text: "3. Arrive at taxable income" },
      { type: "table", headers: ["Item", "Annual amount"], rows: [["Gross salary", "₦3,000,000"], ["Assumed qualifying deductions", "₦300,000"], ["Illustrative taxable income", "₦2,700,000"]] },
      { type: "callout", tone: "caution", text: "The example assumes all ₦300,000 qualifies. Your result may differ if a deduction is limited, unavailable, or supported by different records." },
      { type: "heading", text: "4. Apply the bands" },
      { type: "paragraph", text: "At ₦2,700,000 of taxable income, the first ₦800,000 is charged at 0%. The remaining ₦1,900,000 falls in the 15% band, producing an illustrative annual tax of ₦285,000, or ₦23,750 per month as a simple equivalent." },
      { type: "paragraph", text: "This is an annual estimate. Payroll timing, salary structure, tax already deducted, and other adjustments can make monthly deductions look different." },
      { type: "heading", text: "5. Reconcile tax already paid" },
      { type: "paragraph", text: "An employer may already have deducted PAYE. A client may also have withheld tax from a freelance payment. Keep the evidence for any tax already paid or withheld so that eligible credits can be considered in the final position." },
      { type: "heading", text: "Common mistakes" },
      { type: "list", items: ["Applying one rate to the whole salary instead of using marginal bands.", "Using gross income without checking eligible deductions.", "Assuming PAYE settles tax on freelance, rental, or business income as well.", "Using a calculator that still applies pre-2026 rules."] },
      { type: "heading", text: "Questions people ask" },
      { type: "faq", question: "How much income is charged at 0% in 2026?", answer: "The first ₦800,000 of annual taxable income is charged at 0%." },
      { type: "faq", question: "Do I pay 15% on my entire salary?", answer: "No. Different portions of taxable income are charged at different rates." },
      { type: "faq", question: "Can I calculate tax with more than one income source?", answer: "You can prepare an estimate, but the result depends on the type of income, allowable deductions, exemptions, and tax already paid." },
      { type: "callout", tone: "info", text: "FileSmart's calculator lets you organise income and deduction inputs without doing each band by hand. Use the estimate to prepare questions and records for the relevant filing route." },
    ],
  },
  {
    slug: "how-to-file-personal-income-tax-online-nigeria-2026",
    title: "How to File Personal Income Tax Online in Nigeria in 2026",
    summary:
      "Prepare for an online personal income tax return with a Tax ID, income records, deduction evidence, and the right authority's filing route.",
    image: smallBusinessImage,
    category: "tax-compliance",
    publishedAt: "2026-10-30",
    updatedAt: "2026-10-30",
    readTimeMinutes: 4,
    sourceNote:
      "General educational information only. This draft is pending review by a Nigerian tax professional. Filing procedures vary by jurisdiction; FileSmart is not an official government portal.",
    reviewStatus: "pending-professional-review",
    cta: { label: "Start preparing your return", href: "/filing-waitlist" },
    sources: [
      { label: "JRB tax policies and reforms", url: "https://www.jrb.gov.ng/policies-reforms" },
      { label: "Joint Revenue Board Tax ID portal", url: "https://taxid.jrb.gov.ng/" },
      { label: "FCT-IRS Tax Portal", url: "https://fcttaxportal.fctirs.gov.ng/" },
    ],
    blocks: [
      { type: "paragraph", text: "Electronic filing may be available through the system supported by the tax authority responsible for your return. The route is not identical everywhere, so the first task is to identify the correct authority rather than searching for a single nationwide form." },
      { type: "heading", text: "Start with the authority that handles your return" },
      { type: "paragraph", text: "Personal income tax is generally administered by the relevant state tax authority, with special rules for some taxpayers. Check the authority, portal, and filing instructions that apply to your residence and income. A portal built for one jurisdiction should not be assumed to accept returns from another." },
      { type: "heading", text: "Get or verify your Tax ID" },
      { type: "paragraph", text: "The Joint Revenue Board provides a Tax ID portal at taxid.jrb.gov.ng. Follow its current instructions and protect the identity information used during retrieval or verification." },
      { type: "heading", text: "Have your records ready" },
      { type: "list", items: ["Tax ID and identification details.", "Employment income and payslips.", "PAYE deductions already made.", "Freelance or business income records.", "Rental or other taxable-income records.", "Evidence for eligible deductions and withholding-tax credits.", "Business statements or accounts where required."] },
      { type: "heading", text: "Calculate before entering the return" },
      { type: "paragraph", text: "Separate gross income from taxable income, apply deductions that you can support, and work through the 2026 bands. If you have salary and other income, do not assume the PAYE on your payslip covers the complete tax position." },
      { type: "heading", text: "Complete the authority's form" },
      { type: "paragraph", text: "Use the official platform designated for your jurisdiction. Enter the income, deductions, computation, and credits it requests, then compare the summary with your records before submission. The authority may use its own form even where the national guidelines provide a standard return template." },
      { type: "heading", text: "Save the confirmation" },
      { type: "paragraph", text: "Keep a copy of the submitted return, supporting records, payment evidence, and acknowledgement. Those records matter if you need to prove when you filed or resolve an assessment question later." },
      { type: "heading", text: "Questions people ask" },
      { type: "faq", question: "Can I file without visiting a tax office?", answer: "Some tax authorities support electronic filing. Check the process and availability for your jurisdiction." },
      { type: "faq", question: "Do I need a Tax ID?", answer: "Tax identification is part of the current registration and compliance framework. Confirm the requirement and retrieval process with the official portal." },
      { type: "faq", question: "What if the calculation shows no tax due?", answer: "A zero amount does not automatically remove registration or annual-return obligations. Confirm the current rule that applies to you." },
      { type: "callout", tone: "info", text: "FileSmart can help you organise your information and prepare for the relevant filing route. It does not replace the official tax-authority portal or submit a return on your behalf." },
    ],
  },
  {
    slug: "paye-employees-annual-tax-return-nigeria",
    title: "Does PAYE Mean You Don't Need to File a Tax Return?",
    summary:
      "PAYE may be deducted from your salary, but that does not automatically answer whether you have an annual individual return to complete.",
    image: taxPreparationImage,
    category: "tax-compliance",
    publishedAt: "2026-10-30",
    updatedAt: "2026-10-30",
    readTimeMinutes: 4,
    sourceNote:
      "General educational information only. This draft is pending review by a Nigerian tax professional. Confirm the current rules and procedure with the relevant tax authority or a qualified adviser.",
    reviewStatus: "pending-professional-review",
    cta: { label: "Review your tax position", href: "/calculator" },
    sources: [
      { label: "JRB tax policies and reforms", url: "https://www.jrb.gov.ng/policies-reforms" },
    ],
    blocks: [
      { type: "paragraph", text: "Seeing PAYE on a payslip is reassuring, but it does not settle every compliance question. PAYE is an employer's withholding and remittance process. An individual annual return is a separate record of the person's income and tax position." },
      { type: "heading", text: "What PAYE covers" },
      { type: "paragraph", text: "An employer generally calculates and deducts PAYE from employment income, then remits it to the relevant tax authority. Employer reporting has its own deadlines: monthly PAYE is generally remitted by the 10th day of the following month, and the standard employer annual return deadline is January 31." },
      { type: "heading", text: "What an individual return covers" },
      { type: "paragraph", text: "An individual return brings together the taxpayer's relevant income, deductions, reliefs, credits, and tax already paid. Salary may be the only income, or it may sit alongside freelance work, a business, rent, investment income, or other receipts." },
      { type: "heading", text: "Salary-only employees" },
      { type: "paragraph", text: "The 2026 guidelines describe an annual return obligation for taxable individuals even where an employer has deducted PAYE. That means the absence of extra tax to pay is not, by itself, proof that no return is required. Keep payslips and evidence of PAYE deductions so the annual position can be checked." },
      { type: "heading", text: "Employees with other income" },
      { type: "paragraph", text: "If you also earn from consulting, design, online sales, or another side activity, the PAYE on your salary normally relates only to the employment income. Additional earnings may need to be included in the wider tax position. A client may already have withheld tax from a payment, so retain the certificate or other evidence for any credit that may be available." },
      { type: "heading", text: "When is the annual return due?" },
      { type: "paragraph", text: "The standard individual annual-return deadline is March 31 for the preceding basis period. For 2026 income, that would ordinarily mean March 31, 2027, unless the relevant authority announces an applicable extension or different requirement." },
      { type: "heading", text: "Questions people ask" },
      { type: "faq", question: "Does PAYE mean all my tax is paid?", answer: "It may cover the employment income handled through payroll, but your complete position depends on other income, deductions, and credits." },
      { type: "faq", question: "Does my employer's annual PAYE return replace mine?", answer: "The 2026 guidelines distinguish employer reporting from the individual's annual income-tax return." },
      { type: "faq", question: "What if I do not owe additional tax?", answer: "You may still have an annual-return obligation. Confirm the current requirement for your circumstances." },
      { type: "callout", tone: "info", text: "FileSmart can help you compare income and deductions, estimate your position, and organise information for an annual return." },
    ],
  },
  {
    slug: "nigeria-tax-deductions-rent-relief-2026",
    title: "Tax Deductions and Rent Relief: What Can You Claim in 2026?",
    summary:
      "Understand how rent relief, pension, NHF, health insurance, mortgage interest, and insurance deductions may affect taxable income.",
    image: smallBusinessImage,
    category: "eligible-deductions",
    publishedAt: "2026-10-30",
    updatedAt: "2026-10-30",
    readTimeMinutes: 4,
    sourceNote:
      "General educational information only. This draft is pending review by a Nigerian tax professional. Claim only deductions supported by the applicable law and appropriate evidence.",
    reviewStatus: "pending-professional-review",
    cta: { label: "Explore your deductions", href: "/calculator" },
    sources: [
      { label: "Nigeria Tax Act 2025", url: "https://www.nipc.gov.ng/wp-content/uploads/2025/07/Nigeria-Tax-Act-2025.pdf" },
      { label: "JRB tax policies and reforms", url: "https://www.jrb.gov.ng/policies-reforms" },
    ],
    blocks: [
      { type: "paragraph", text: "Deductions reduce the income used in the tax calculation; they are not automatic cash refunds. Each one has its own conditions, limits, and evidence requirements. The right approach is to claim only what you can support." },
      { type: "heading", text: "Rent relief" },
      { type: "paragraph", text: "The 2026 framework generally treats rent relief as 20% of qualifying annual rent, with a ₦500,000 cap on the relief itself." },
      { type: "table", headers: ["Qualifying annual rent", "Potential relief"], rows: [["₦600,000", "₦120,000"], ["₦1,200,000", "₦240,000"], ["₦2,000,000", "₦400,000"], ["₦3,000,000", "₦500,000"]] },
      { type: "paragraph", text: "The ₦500,000 figure is the maximum relief in these examples, not the maximum rent you are allowed to report. A ₦240,000 rent relief also does not mean the government pays ₦240,000 back; the relief reduces taxable income, and the actual tax saving depends on the applicable bands." },
      { type: "heading", text: "Evidence for a rent claim" },
      { type: "paragraph", text: "Keep the tenant's name, the amount paid, the period covered, the landlord's details, and the address of the property. If rent covers more than one calendar year, allocate it to the relevant period. For a shared tenancy, use the eligible tenant's own qualifying share rather than the full household rent." },
      { type: "heading", text: "Other deductions to check" },
      { type: "list", items: ["Qualifying pension contributions.", "Eligible National Housing Fund contributions.", "Qualifying National Health Insurance Scheme or health-insurance contributions.", "Certain life-insurance premiums or annuity payments.", "Interest on a qualifying loan for an owner-occupied residential property."] },
      { type: "paragraph", text: "Mortgage relief concerns eligible interest, not the full loan repayment or principal. A commercial or rental-property loan should not automatically be treated as an owner-occupied mortgage claim." },
      { type: "heading", text: "A worked example" },
      { type: "paragraph", text: "Suppose annual income before eligible deductions is ₦4,000,000. Assume ₦300,000 of qualifying deductions and ₦200,000 of rent relief. The illustrative taxable income becomes ₦3,500,000." },
      { type: "list", items: ["First ₦800,000 at 0% = ₦0", "Next ₦2,200,000 at 15% = ₦330,000", "Remaining ₦500,000 at 18% = ₦90,000", "Illustrative annual tax = ₦420,000"] },
      { type: "paragraph", text: "Without the ₦500,000 of deductions in this simplified example, tax on ₦4,000,000 would be ₦510,000. The ₦90,000 difference is an illustrative tax saving, not the value of the deduction itself." },
      { type: "heading", text: "Questions people ask" },
      { type: "faq", question: "Can I claim rent relief when I share a home?", answer: "Potentially. The qualifying amount should reflect the eligible tenant's own share and the arrangement must meet the applicable requirements." },
      { type: "faq", question: "Can I claim all the rent I paid?", answer: "No. The relief is generally 20% of qualifying rent, subject to the ₦500,000 annual cap." },
      { type: "faq", question: "Do deductions reduce tax or taxable income?", answer: "They generally reduce the income on which tax is calculated. The resulting tax saving depends on the bands that apply." },
      { type: "callout", tone: "info", text: "FileSmart's calculator lets you enter eligible deductions and rent relief so you can see how supported inputs affect an estimate." },
    ],
  },
  {
    slug: "nigeria-personal-income-tax-filing-deadline-2026",
    title: "Personal Income Tax Filing Deadline: Who Must File and When?",
    summary:
      "Keep track of the standard individual, employer, and monthly PAYE dates, plus the records to gather before filing.",
    image: taxPreparationImage,
    category: "tax-compliance",
    publishedAt: "2026-10-30",
    updatedAt: "2026-10-30",
    readTimeMinutes: 4,
    sourceNote:
      "General educational information only. This draft is pending review by a Nigerian tax professional. Check current notices from the relevant tax authority before relying on a deadline.",
    reviewStatus: "pending-professional-review",
    cta: { label: "Prepare before the deadline", href: "/calculator" },
    sources: [
      { label: "JRB tax policies and reforms", url: "https://www.jrb.gov.ng/policies-reforms" },
      { label: "FCT-IRS individual filing deadline extension notice", url: "https://fctirs.gov.ng/fct-irs-extends-deadline-for-filing-of-individual-tax-returns-by-one-month/" },
    ],
    blocks: [
      { type: "paragraph", text: "For an individual annual personal income tax return, the standard deadline is March 31 for the preceding basis period. That is the date most people need to plan around, but a jurisdiction-specific notice or extension can change the practical deadline." },
      { type: "heading", text: "The main dates" },
      { type: "table", headers: ["Obligation", "Standard deadline"], rows: [["Individual annual income-tax return", "March 31"], ["Employer annual PAYE return", "January 31"], ["Monthly PAYE remittance", "10th day of the following month"]] },
      { type: "paragraph", text: "Income earned during 2026 would ordinarily be reported by March 31, 2027. The employer dates are separate from an individual's annual-return deadline." },
      { type: "heading", text: "Who should prepare an annual return?" },
      { type: "paragraph", text: "The 2026 guidelines establish annual filing obligations for taxable individuals. That can include employees, freelancers, business owners, and people earning professional or vocational income. A zero tax calculation does not automatically remove the filing obligation." },
      { type: "heading", text: "Employees and PAYE" },
      { type: "paragraph", text: "An employer may deduct and remit PAYE during the year, but that is not the same as an employee's own annual return. Keep payslips and evidence of PAYE deductions so they can be reconciled with the annual figures." },
      { type: "heading", text: "Freelancers and business owners" },
      { type: "paragraph", text: "People earning from a trade, business, profession, or vocation should maintain income records, qualifying-expense records, and evidence of tax withheld by clients. The applicable return may require financial information or a statement of accounts." },
      { type: "heading", text: "Can the deadline move?" },
      { type: "paragraph", text: "An authorized tax authority may announce an extension. For example, a 2026 FCT-IRS notice extended a relevant individual filing deadline from March 31 to April 30, 2026. That was specific to the jurisdiction and filing period; it was not a permanent nationwide change." },
      { type: "heading", text: "If you miss the date" },
      { type: "paragraph", text: "Late filing can lead to penalties or other compliance consequences under the rules that apply to you. Check the current notice from your tax authority, confirm the amount, and regularize the return as soon as possible. Do not assume that no tax payable means there is no late-filing consequence." },
      { type: "heading", text: "Prepare these records now" },
      { type: "list", items: ["Tax ID and identification details.", "Annual income records and payslips.", "Employer PAYE documents.", "Business or freelance income and expense records.", "Evidence for deductions and withholding-tax credits.", "Previous filing confirmations or payment records."] },
      { type: "heading", text: "Questions people ask" },
      { type: "faq", question: "Is March 31 the deadline for everyone?", answer: "It is the standard individual annual-return date. Extensions or special rules may apply to a particular taxpayer or jurisdiction." },
      { type: "faq", question: "When must an employer submit PAYE returns?", answer: "The standard employer annual return deadline is January 31, while monthly PAYE is generally due by the 10th day of the following month." },
      { type: "faq", question: "What if I have already missed the deadline?", answer: "Contact the relevant tax authority or a qualified adviser, confirm the current penalties, and complete the outstanding requirements promptly." },
      { type: "callout", tone: "info", text: "Use FileSmart to organise your income and deductions before you check the submission process for your relevant tax authority." },
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
