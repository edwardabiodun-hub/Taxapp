import { useEffect } from "react";
import LegalPage, { LEGAL_CONFIG, type LegalSection } from "./LegalPage";
import { setPageMetadata } from "@/lib/seo";

const sections: LegalSection[] = [
  {
    heading: "Scope of these terms",
    body: ["These draft terms describe the intended use of FileSmart as a guided Nigerian tax preparation and education experience. They are not finalized until approved by the operator."],
  },
  {
    heading: "User responsibilities",
    body: ["Users are responsible for providing accurate information, protecting access to their account, reviewing outputs, meeting applicable obligations, and obtaining professional advice when their circumstances require it."],
  },
  {
    heading: "User-generated content",
    body: ["Users retain responsibility for documents, notes, and other content they submit. Users must have the rights and permissions needed to provide that content and must not upload unlawful or harmful material."],
  },
  {
    heading: "Privacy and data handling",
    body: ["Information is intended to be handled as described in the approved privacy notice. The operator must approve the final data practices, retention rules, and service-provider disclosures before launch."],
  },
  {
    heading: "Limitations",
    body: ["FileSmart provides general information and preparation support. It does not guarantee filing acceptance, a tax outcome, uninterrupted availability, or direct submission to a tax authority unless expressly supported and stated."],
  },
  {
    heading: "Disputes",
    body: [LEGAL_CONFIG.disputeLanguage],
  },
];

const Terms = () => {
  useEffect(
    () =>
      setPageMetadata({
        title: "Terms of use | FileSmart",
        description: "Review the FileSmart draft terms for using its Nigerian tax preparation and education experience.",
        path: "/terms",
      }),
    [],
  );

  return <LegalPage title="Terms of use" effectiveDate={LEGAL_CONFIG.effectiveDate} sections={sections} />;
};

export default Terms;
