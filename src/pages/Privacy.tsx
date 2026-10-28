import { useEffect } from "react";
import LegalPage, { LEGAL_CONFIG, type LegalSection } from "./LegalPage";
import { setPageMetadata } from "@/lib/seo";

const sections: LegalSection[] = [
  {
    heading: "1. Who this notice applies to",
    body: ["This draft privacy notice explains how FileSmart BridgeIQ LTD (\"FileSmart\", \"we\", \"us\", or \"our\") may collect, use, disclose, retain, and protect information when you visit our public website, create an account, join a waitlist, use a calculator, prepare tax information, contact support, or otherwise use the service.", "FileSmart is intended for adults and businesses using the service for lawful tax education and preparation. This notice is written for review under Nigerian privacy requirements, including the Nigeria Data Protection Act 2023 and applicable guidance. It is not a substitute for advice from a qualified privacy professional."],
  },
  {
    heading: "2. Information we may collect",
    body: ["Depending on the features you use, we may collect account and contact details such as your name, email address, phone number, state or jurisdiction, authentication details, support messages, waitlist preferences, and communication consent.", "If you use tax preparation or estimation features, you may provide income, deductions, employment, filing, and other tax-related information. If you choose to upload a receipt or supporting document, that document and any information extracted from it may be processed to provide the requested feature.", "We may also receive technical and security information such as device and browser details, approximate location derived from network information, event logs, error reports, and records of consent or requests. We do not require you to place tax or identity documents in a public contact form."],
   },
   {
    heading: "3. Why we use information",
    body: ["We may use information to provide, maintain, secure, and improve FileSmart; save your preparation; calculate or explain estimates; respond to support requests; manage waitlists and requested notifications; prevent fraud and abuse; troubleshoot reliability issues; measure product performance in a privacy-conscious way; meet legal obligations; and establish, exercise, or defend legal claims.", "Where applicable, processing may rely on performing a requested service or contract, complying with a legal obligation, your consent for optional communications or other optional processing, or a legitimate interest that is balanced against your rights. You may withdraw consent for optional processing by contacting us, without affecting processing already carried out lawfully before withdrawal."],
   },
   {
    heading: "4. Sharing and service providers",
    body: ["We may use carefully selected providers that process information on our instructions, such as hosting, database and authentication, email delivery, monitoring, security, and operations providers where enabled. We expect providers to use appropriate safeguards and to process information only for authorized purposes.", "We may disclose information when you direct us to do so, when needed to provide a requested service, when required by law or a lawful authority, or when necessary to protect users, the service, or legal rights. We do not sell personal information. The final vendor and transfer register should be confirmed before launch and updated when providers change."],
   },
   {
    heading: "5. Retention schedule",
    body: ["We retain information only for as long as reasonably necessary for the purpose collected, service operation, security, legal compliance, dispute handling, and legitimate recordkeeping. Our draft operational schedule is:", "• Account and profile information: while the account is active; after a verified deletion request or account closure, removal or anonymisation is targeted within 30 days unless a longer period is required for law, security, fraud prevention, dispute handling, or a legal hold.\n• Tax preparation records and supporting documents: up to seven years from the relevant tax year or account closure, whichever is later, only where needed for tax, legal, audit, or dispute purposes.\n• Waitlist and contact submissions: 24 months after the last meaningful interaction, unless a shorter period is requested or a longer period is required for a documented purpose.\n• Security and audit logs: 12 months, unless required longer for an active incident, investigation, or legal obligation.\n• Consent and preference records: up to three years after withdrawal or last meaningful interaction, or longer where needed to demonstrate compliance.", "These periods are draft operational choices, not a statement that Nigerian law requires each exact period. A statutory obligation, tax record requirement, legal claim, security investigation, or legal hold may override deletion or anonymisation. We will review and publish the final schedule before launch."],
   },
   {
    heading: "6. Your privacy rights and deletion requests",
    body: ["Subject to applicable law and reasonable identity verification, you may ask for information about our processing, access to your personal data, correction of inaccurate data, deletion or erasure, restriction of processing, objection to processing, portability where applicable, withdrawal of optional consent, and human intervention where a solely automated decision has a legal or similarly significant effect.", "Send a request to hello@filesmartnaija.com with enough information for us to understand the request. We may request additional information to verify identity and protect the account. We aim to respond within 30 days, subject to verification, complexity, applicable law, and any lawful extension or exception. If you believe your rights have not been addressed, you may complain to the Nigeria Data Protection Commission."],
   },
   {
    heading: "7. User-generated content and documents",
    body: ["You remain responsible for ensuring that you have the authority to provide any information, receipt, document, note, or other content you submit. FileSmart may process that content only to provide the requested service, maintain security, support the user experience, meet legal obligations, or otherwise as described in this notice.", "Do not upload another person's information unless you have a lawful basis and permission to do so. Do not include tax identification numbers, identity documents, passwords, payment credentials, or other sensitive information in a general contact message."],
   },
   {
    heading: "8. Security and data incidents",
    body: ["We use reasonable technical and organisational safeguards appropriate to the nature of the information, including access controls, secure configuration, logging, and service-provider controls where available. No internet service can promise absolute security, and you should protect your credentials and notify us promptly of suspected unauthorized access.", "If a personal-data incident occurs, we will assess and handle it in accordance with applicable Nigerian data-protection requirements, including any required notifications to the Commission or affected individuals. We will not use a security claim or badge as a guarantee of a particular outcome."],
   },
   {
    heading: "9. International processing and third-party links",
    body: ["Some service providers may process information outside Nigeria. Where this occurs, the transfer and the provider safeguards must be reviewed and documented in line with applicable law. We will update this notice or related disclosures when material processing arrangements change.", "The website may link to tax authorities, payment providers, or other third parties. Their privacy practices are separate from FileSmart's and should be reviewed before you provide information to them."],
   },
   {
    heading: "10. Changes and contact",
    body: ["We may update this notice when the service, law, or data practices change. The effective date above identifies the current draft version. Material changes should be highlighted before the updated notice is relied on.", "For privacy questions, complaints, access requests, correction requests, deletion requests, or consent changes, contact hello@filesmartnaija.com. The operator is FileSmart BridgeIQ LTD at Estate 10, Jordan Lane, Redemption City, Ogun State, Nigeria."],
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
