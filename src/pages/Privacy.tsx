import { useEffect } from "react";
import LegalPage, { LEGAL_CONFIG, type LegalSection } from "./LegalPage";
import { setPageMetadata } from "@/lib/seo";

const sections: LegalSection[] = [
  {
    heading: "Scope",
    body: ["This draft privacy notice describes how FileSmart may handle information provided while visitors learn about Nigerian personal income tax or prepare information in the product."],
  },
  {
    heading: "Information and data handling",
    body: ["The final notice will identify the categories of information collected, the purposes for using them, retention periods, service providers, and applicable rights. Those details remain subject to operator approval."],
  },
  {
    heading: "User responsibilities",
    body: ["Users should provide information they are authorized to share, keep account credentials private, and review entries before relying on them for a tax decision."],
  },
  {
    heading: "User-generated content",
    body: ["Information, notes, and documents entered by a user may be treated as user-generated content for product operation. FileSmart should not be used to upload information the user lacks permission to provide."],
  },
  {
    heading: "Limitations",
    body: ["This draft does not promise a particular security, retention, availability, or authority-submission outcome. The approved notice must state those limits accurately."],
  },
  {
    heading: "Privacy questions",
    body: [LEGAL_CONFIG.privacyContactLabel + ". The approved privacy contact and response process will be published before launch."],
  },
];

const Privacy = () => {
  useEffect(
    () =>
      setPageMetadata({
        title: "Privacy policy | FileSmart",
        description: "Read the FileSmart draft privacy notice for its Nigerian tax preparation and education experience.",
        path: "/privacy",
      }),
    [],
  );

  return <LegalPage title="Privacy policy" effectiveDate={LEGAL_CONFIG.effectiveDate} sections={sections} />;
};

export default Privacy;
