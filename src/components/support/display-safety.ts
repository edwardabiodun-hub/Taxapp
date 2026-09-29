const fallback = "I can help with general Nigerian tax information and high-level account status. Please contact human support for other needs.";

const sensitivePatterns = [
  /(?:[₦$£€]|\b(?:NGN|USD|naira)\b)\s*\d[\d,]*(?:\.\d+)?/i,
  /\b\d[\d,]*(?:\.\d+)?\s*(?:naira|NGN|USD|million|billion)\b/i,
  /\b(?:income|salary|amount|refund|balance|tax(?:able)?\s+(?:due|paid|income)|earnings|revenue|total)\b\s*(?::|=|is|was|of|at)\s*(?:[₦$£€]|NGN\s*)?\d/i,
  /\b(?:income|salary|amount|refund|balance|earnings|revenue)\b\s+(?:of\s+)?\d{1,3}(?:,\d{3})+(?:\.\d+)?/i,
  /\b(?:income|salary|amount|refund|balance|earnings|revenue)\b.{0,30}\b\d[\d,]*(?:\.\d+)?\s*(?:thousand|million|billion)\b/i,
  /\b(?:my|your|our)\b.{0,60}\b\d{1,3}(?:,\d{3})+(?:\.\d+)?/i,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /(?:\+?234|0)[\s.-]?(?:\d[\s.-]?){9,10}\b/,
  /\b\d{9,15}\b/,
  /\b(?:tax\s*(?:identification\s*)?(?:id|number)|TIN|BVN|NIN)\b.{0,25}\d/i,
  /^\s*(?:name|full name|address|dob|date of birth|email|phone|bank account|account number|bvn|nin)\s*[:=]/i,
  /\b(?:my|your)\s+(?:full\s+)?(?:name|address|date of birth|bank account)\s+(?:is|was|:)\s+/i,
  /\b(?:document\s+(?:contents?|text|body)|(?:uploaded|attached|scanned)\s+(?:document|file|pdf)\s+(?:contents?|text|body)|ocr\s+(?:output|text)|form[_ ]data|payslip\s+contents?)\b/i,
  /\b(?:document|pdf|file)\s+(?:says|reads|contains|states)\b/i,
  /\b(?:internal\s+(?:workflow|routing|prompt|tool|schema|procedure|steps?|logic|queue)|system\s+(?:prompt|instructions?)|developer\s+(?:prompt|instructions?)|service[_ .-]?role|indexeddb|get_my_[a-z_]+|database\s+schema|private\s+queue)\b/i,
  /\b(?:support_knowledge|auth\.uid|rpc\s*[:=(]|tool\s*[:=])\b/i,
];

export function safeSupportDisplayText(text: string): string {
  const safe = text.split(/\r?\n/)
    .filter((line) => !sensitivePatterns.some((pattern) => pattern.test(line)))
    .join("\n")
    .trim();
  return safe || fallback;
}
