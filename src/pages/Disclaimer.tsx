import LegalPage, { LEGAL_CONFIG, type LegalSection } from "./LegalPage";

const sections: LegalSection[] = [
  {
    heading: "Educational scope",
    body: ["FileSmart offers general educational information and guided preparation support for Nigerian tax topics. Content is not a substitute for advice from a qualified tax professional or the relevant tax authority."],
  },
  {
    heading: "User responsibilities",
    body: ["Users must check whether information applies to their circumstances, verify dates and requirements, review all entries, and make their own filing and compliance decisions."],
  },
  {
    heading: "Privacy and user content",
    body: ["Users should avoid sharing information they are not authorized to share. The final privacy notice will explain how information and user-generated content are handled after operator approval."],
  },
  {
    heading: "Limitations",
    body: ["No result, estimate, checklist, or guide guarantees a tax position, filing acceptance, refund, penalty outcome, or authority submission. Laws, guidance, and individual facts may change."],
  },
  {
    heading: "Dispute language",
    body: [LEGAL_CONFIG.disputeLanguage],
  },
];

const Disclaimer = () => <LegalPage title="Disclaimer" effectiveDate={LEGAL_CONFIG.effectiveDate} sections={sections} disclaimerTone="caution" />;

export default Disclaimer;
