const fallback = "I can help with general Nigerian tax information and high-level account status. Please contact human support for other needs.";

export type SupportDisplayRole = "user" | "assistant";

const userAmountPatterns = [
  /(?:[₦$£€]|\b(?:NGN|USD|naira)\b)\s*\d[\d,]*(?:\.\d+)?/i,
  /\b\d[\d,]*(?:\.\d+)?\s*(?:naira|NGN|USD|million|billion)\b/i,
  /\b(?:income|salary|amount|refund|balance|tax\s+liability|tax(?:able)?\s+(?:due|paid|income)|earnings|revenue|total)\b\s*(?::|=|is|was|of|at)\s*(?:[₦$£€]|NGN\s*)?\d/i,
  /\b(?:income|salary|amount|refund|balance|tax\s+liability|earnings|revenue)\b\s+(?:of\s+)?\d{1,3}(?:,\d{3})+(?:\.\d+)?/i,
  /\b(?:income|salary|amount|refund|balance|earnings|revenue)\b.{0,30}\b\d[\d,]*(?:\.\d+)?\s*(?:thousand|million|billion)\b/i,
  /\b(?:my|your|our)\b.{0,60}\b\d{1,3}(?:,\d{3})+(?:\.\d+)?/i,
  /\b(?:my|your|our)\b.{0,40}\b(?:income|salary|tax\s+(?:liability|bill|due)|earnings|refund|balance)\b\s+\d[\d,]*(?:\.\d+)?\b/i,
];

const assistantPersonalAmountPatterns = [
  /^\s*(?:income|salary|amount|refund(?:\s+amount)?|balance|tax\s+liability|tax\s+due|tax\s+paid|taxable\s+income|earnings|revenue)\b\s*(?::|=|is|was|of|at)?\s*(?:[₦$£€]|NGN|USD|naira)?\s*\d[\d,]*(?:\.\d+)?/i,
  /\b(?:my|your|our)\b.{0,80}\b(?:income|salary|tax\s+liability|tax\s+bill|tax\s+due|tax\s+paid|taxable\s+income|earnings|revenue|refund|balance|amount)\b.{0,80}\b(?:is|was|equals?|amounts?\s+to|of|:)\s*(?:[₦$£€]|NGN|USD|naira)?\s*\d/i,
  /\b(?:you|i|we)\b.{0,20}\b(?:owe|earned|received|paid|refunded)\b.{0,40}(?:[₦$£€]|NGN|USD|naira)?\s*\d/i,
  /^\s*(?:[₦$£€]|NGN|USD|naira)\s*\d[\d,]*(?:\.\d+)?\s*\.?$/i,
];

const accountAmountPatterns = [
  /\b(?:my|your|our)\s+(?:account|balance|income|salary|tax\s+(?:bill|liability|due|paid)|amount|earnings|refund)\b[\s\S]{0,100}?(?:[₦$£€]\s*|(?:NGN|USD|GBP|naira)\s*)?\d[\d,]*(?:\.\d+)?\b/i,
  /(?:[₦$£€]\s*|(?:NGN|USD|GBP|naira)\s*)?\d[\d,]*(?:\.\d+)?\b[\s\S]{0,100}?\b(?:my|your|our)\s+(?:account|balance|income|salary|tax\s+(?:bill|liability|due|paid)|amount|earnings|refund)\b/i,
];

const documentReferences = /\b(?:upload(?:ed|s)?|attach(?:ed|ment|ments?)|scann(?:ed|s)?)?\s*(?:documents?|files?|pdfs?|attachments?)\b/i;
const documentHandling = /\b(?:stor(?:e|ed|es|ing)|kept|keep(?:s|ing)?|sav(?:e|ed|es|ing)|process(?:es|ed|ing)?|handl(?:e|ed|es|ing)|retention|retain(?:s|ed|ing)?|share(?:s|d|ing)?|send(?:s|ing)?|forward(?:s|ed|ing)?|route(?:s|d|ing)?|destination|go|what\s+happens?|do\s+with)\b/i;
const labeledPersonalField = /(?:^|\b)(?:account holder|full\s+name|name|(?:postal\s+)?address|email|phone|bank\s+account)\s*[:=]/i;
const sharedSensitivePatterns = [
  /\b(?:amount|balance|tax\s+(?:bill|liability|due|paid))\b.{0,40}\b(?:my|your|our)\s+account\b.{0,30}\b(?:NGN\s*|₦\s*)?\d[\d,]*(?:\.\d+)?\b/i,
  /(?<![\p{L}\p{N}\p{M}_/])[\p{L}\p{N}_][\p{L}\p{N}\p{M}_.() -]{0,100}\.(?:pdf|docx?|xlsx?|csv|txt|png|jpe?g|heic|odt)\b/iu,
  /^\s*(?:full\s+name|name|(?:postal\s+)?address)\s*[:=]/i,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /(?:\+?234|0)[\s.-]?(?:\d[\s.-]?){9,10}\b/,
  /\b\d{9,15}\b/,
  /\b(?:tax\s*(?:identification\s*)?(?:id|number)|TIN|BVN|NIN)\b.{0,25}\d/i,
  /^\s*(?:dob|date of birth|email|phone|bank account|account number|bvn|nin)\s*[:=]/i,
  /\b(?:my|your)\s+(?:full\s+)?(?:name|address|date of birth|bank account)\s+(?:is|was|:)\s+/i,
  /\b(?:document\s+(?:contents?|text|body)|(?:uploaded|attached|scanned)\s+(?:document|file|pdf)\s+(?:contents?|text|body)|ocr\s+(?:output|text)|form[_ ]data|payslip\s+contents?)\b/i,
  /\b(?:document|pdf|file)\s+(?:says|reads|contains|states)\b/i,
  /\b(?:internal\s+(?:workflow|routing|prompt|tool|schema|procedure|steps?|logic|queue)|system\s+(?:prompt|instructions?)|developer\s+(?:prompt|instructions?)|service[_ .-]?role|indexeddb|get_my_[a-z_]+|database\s+schema|private\s+queue)\b/i,
  /\b(?:FileSmart(?:'s)?|our)\b.{0,120}\b(?:sends?|routes?|forwards?|handles?|moves?|dispatches?|stores?|submits?|process(?:es)?|prepares?|reviews?|verifies?|approves?|calculates?|scores?|queues?|workflows?|operational|proprietary|private\s+database|triage\s+team)\b/i,
  /\b(?:FileSmart(?:'s)?|our)\b.{0,120}\buses?\b.{0,80}\b(?:triage|teams?|private\s+database|queues?|workflows?|routing|internal)\b/i,
  /\b(?:compliance|processing|approval|review)\s+queues?\b/i,
  /\b(?:support_knowledge|auth\.uid|rpc\s*[:=(]|tool\s*[:=])\b/i,
];

export function safeSupportDisplayText(text: string, role: SupportDisplayRole): string {
  const normalized = text.normalize("NFKC").replace(/[\s\u200B-\u200D\uFEFF]+/gu, " ").trim();
  const containsForbidden = accountAmountPatterns.some((pattern) => pattern.test(normalized))
    || (documentReferences.test(normalized) && documentHandling.test(normalized))
    || labeledPersonalField.test(normalized)
    || sharedSensitivePatterns.some((pattern) => pattern.test(normalized))
    || assistantPersonalAmountPatterns.some((pattern) => pattern.test(normalized))
    || (role === "user" && userAmountPatterns.some((pattern) => pattern.test(normalized)));
  return containsForbidden || !normalized ? fallback : text.trim();
}
