import { useEffect } from "react";
import LegalPage, { LEGAL_CONFIG, type LegalSection } from "./LegalPage";
import { setPageMetadata } from "@/lib/seo";

const sections: LegalSection[] = [
  {
    heading: "1. Agreement and eligibility",
    body: ["These draft Terms of Use govern access to FileSmart's public website, calculators, educational content, waitlist, account features, and tax-preparation tools. By using the service, you agree to follow these terms and the Privacy Policy. If you do not agree, do not use the service.", "You must provide information that is accurate and current, and you must be legally able to enter into these terms. You are responsible for activity carried out through your account."],
  },
  {
    heading: "2. What FileSmart provides",
    body: ["FileSmart provides general tax education, guided preparation support, calculators, summaries, and other tools described in the relevant product experience. A public estimate is an illustration based on the information entered; it is not a tax assessment or professional advice.", "Unless FileSmart expressly states otherwise for a particular feature, FileSmart does not submit a return, pay a tax authority, guarantee acceptance, or act as your tax adviser. You remain responsible for reviewing outputs, meeting deadlines, choosing the correct filing route, and obtaining professional advice where your circumstances require it."],
  },
  {
    heading: "3. Accounts and security",
    body: ["If an account is required for a feature, keep your credentials confidential and notify us promptly of suspected unauthorized use. We may require verification, suspend access, or limit a feature where reasonably necessary to protect users, the service, or personal data."],
  },
  {
    heading: "4. Information, documents, and user-generated content",
    body: ["You are responsible for the accuracy, legality, and completeness of information, notes, receipts, documents, and other content you submit. You must have the rights and permissions needed to provide it and must not upload unlawful, malicious, misleading, or harmful material.", "You grant FileSmart the limited permission needed to host, process, display, transmit, and secure that content to provide the requested feature, comply with law, prevent abuse, and maintain the service. You retain ownership of your content, subject to that limited operational permission."],
  },
  {
    heading: "5. Review and tax responsibility",
    body: ["Tax laws, guidance, authority portals, deadlines, and individual circumstances can change. You must review calculations and documents before relying on them, confirm current requirements with the relevant authority or qualified adviser, and retain your own records. FileSmart is not responsible for an outcome caused by inaccurate or incomplete information, a changed law, an authority decision, an unavailable third-party portal, or a missed deadline."],
   },
   {
    heading: "6. Acceptable use",
    body: ["You must not use FileSmart to violate law, infringe another person's rights, bypass access controls, probe or attack the service, upload malware or executable content, impersonate another person, interfere with another user's data, or use automated access in a way that harms availability or security."],
   },
   {
    heading: "7. Intellectual property and third-party services",
    body: ["FileSmart and its software, design, branding, educational materials, and other original content belong to FileSmart BridgeIQ LTD or its licensors. We give you a limited, revocable, non-exclusive permission to use the service for its intended purpose. You may not copy, resell, reverse engineer, or commercially exploit the service except as allowed by law.", "The service may depend on third-party hosting, authentication, email, payment, tax-authority, or other services. Their terms, availability, and privacy practices may apply separately."],
   },
   {
    heading: "8. Pricing and paid features",
    body: ["Any price, eligibility rule, or feature shown in the product is an invitation to review the current offer, not a charge by itself. A fee is due only when the applicable checkout or order flow clearly identifies the amount and you confirm the purchase. Displayed pricing may exclude taxes, third-party charges, or authority fees where clearly stated."],
   },
   {
    heading: "9. Availability, suspension, and termination",
    body: ["We may change, pause, or discontinue a feature, including during a launch or waitlist phase. We may suspend or terminate access where reasonably necessary for security, legal compliance, non-payment, misuse, or protection of users and the service. Where practical, we will provide notice and an opportunity to resolve the issue.", "On termination, rights that by their nature should continue—including provisions concerning content, privacy, liability, disputes, and applicable law—will continue. Data deletion is handled under the Privacy Policy and any applicable retention obligation."],
   },
   {
    heading: "10. Disclaimers and limits",
    body: ["To the extent permitted by law, FileSmart is provided on an availability basis without a guarantee that it will be uninterrupted, error-free, or suitable for every tax situation. We do not guarantee a particular tax position, refund, penalty outcome, filing acceptance, or authority submission.", "Nothing in these terms excludes or limits liability, consumer protection, privacy rights, or other remedies that cannot lawfully be excluded or limited under Nigerian law."],
  },
  {
    heading: "11. Governing law and disputes",
    body: [LEGAL_CONFIG.disputeLanguage],
  },
  {
    heading: "12. Changes and contact",
    body: ["We may update these terms when the service, law, or business arrangements change. Material changes should be highlighted before they apply to future use. Questions about these terms may be sent to hello@filesmartnaija.com.", "The operator is FileSmart BridgeIQ LTD, Estate 10, Jordan Lane, Redemption City, Ogun State, Nigeria."],
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
