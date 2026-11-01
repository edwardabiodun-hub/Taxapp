import type { TaxGuideBlock } from "./tax-guides";

export interface NewsArticle {
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
  blocks: TaxGuideBlock[];
}

const launchImage = {
  src: "/brand/filesmart-nigeria-tax-calculator-launch-ui.png",
  alt: "FileSmart Nigeria Tax Calculator shown on a laptop and phone beside a professional user",
};

export const newsArticles: NewsArticle[] = [
  {
    slug: "filesmart-nigeria-tax-calculator-launch",
    title: "FileSmart Launches a Nigeria Tax Calculator for 2026",
    summary:
      "FileSmart's Nigeria Tax Calculator helps individuals explore an indicative 2026 personal income tax result before preparing their return.",
    image: launchImage,
    category: "Product news",
    publishedAt: "2026-11-01",
    updatedAt: "2026-11-01",
    readTimeMinutes: 3,
    sourceNote:
      "This product announcement describes FileSmart's preparation tool. Results are indicative and are not an official tax assessment or a submission to a tax authority.",
    sources: [
      { label: "Nigeria Tax Act 2025", url: "https://nass.gov.ng/documents/download/11249" },
      { label: "2026 Personal Income Tax Guidelines", url: "https://www.jrb.gov.ng/assets/2026-pit-guidelines-TJG3n9-T.pdf" },
    ],
    cta: { label: "Try the Nigeria Tax Calculator", href: "/calculator" },
    blocks: [
      {
        type: "paragraph",
        text: "FileSmart has launched a Nigeria Tax Calculator for the 2026 tax year. It gives individuals a clearer way to organise income and eligible deductions, then explore an indicative personal income tax result before preparing their return.",
      },
      {
        type: "paragraph",
        text: "The calculator is designed for people who want a practical starting point, whether they earn a salary, receive additional income, work independently, or run a small business.",
      },
      { type: "heading", text: "What is the Nigeria Tax Calculator?" },
      {
        type: "paragraph",
        text: "It is a browser-based tool that brings the main 2026 personal income tax inputs into one guided experience. Users can enter relevant income sources, review eligible deductions and reliefs, and see how the information affects an indicative calculation.",
      },
      { type: "heading", text: "What can you review with it?" },
      {
        type: "list",
        items: [
          "Employment income, including salary, commissions, bonuses, and allowances.",
          "Net business, rental, foreign, and other income where the relevant facts are available.",
          "Documented eligible deductions and reliefs, including supported pension, housing-fund, health-insurance, mortgage-interest, insurance, and rent-relief inputs.",
          "The resulting taxable income and progressive band breakdown for 2026.",
          "Warnings where the information entered is not sufficient for a responsible numeric result.",
        ],
      },
      { type: "heading", text: "How to use the calculator" },
      {
        type: "list",
        items: [
          "Open the Nigeria Tax Calculator and select the 2026 tax year.",
          "Enter the income and deduction information you can support with reliable records.",
          "Review the calculation and any facts that still need confirmation.",
          "Use the result to prepare questions, records, and your next filing step.",
        ],
      },
      { type: "heading", text: "What the calculator does not do" },
      {
        type: "paragraph",
        text: "The calculator does not submit a return, send information to a tax authority, or replace an official assessment. Its result is an indicative calculation based on the information entered. Complex or uncertain situations should be checked with the relevant tax authority or a qualified tax professional.",
      },
      { type: "heading", text: "Frequently asked questions" },
      {
        type: "faq",
        question: "Is the FileSmart Nigeria Tax Calculator free to use?",
        answer: "The public calculator is available as a preparation tool. Any separate filing or service terms will be shown before a user proceeds to a paid service.",
      },
      {
        type: "faq",
        question: "Does the calculator file my tax return?",
        answer: "No. It only provides an indicative calculation on the page. Nothing is filed or sent to a tax authority from the public calculator.",
      },
      {
        type: "faq",
        question: "Can I use it if I earn income outside a salary?",
        answer: "Yes. The calculator includes supported fields for other income and eligible deductions. If the facts are uncertain or unsupported, it may withhold a numeric result until they are confirmed.",
      },
      {
        type: "callout",
        tone: "info",
        text: "Try FileSmart's Nigeria Tax Calculator to organise your inputs and explore your 2026 tax position before preparing your return.",
      },
    ],
  },
];

export function getNewsArticle(slug: string): NewsArticle | undefined {
  return newsArticles.find((article) => article.slug === slug);
}
