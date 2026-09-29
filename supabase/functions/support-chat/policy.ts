export type SupportRequestKind = 'education' | 'account_status' | 'refusal';
export type SupportRequestClassification = { kind: SupportRequestKind };

const PERSONAL_ACCOUNT_TERMS = '(?:account|balance|income|salary|tax\\s+(?:bill|liability|due|paid)|amount|earnings|refund)';
const FINANCIAL_AMOUNT = '(?:[₦$£€]\\s*|(?:NGN|USD|GBP|naira)\\s*)?(?:\\d{1,3}(?:,\\d{3})+|\\d{4,})(?:\\.\\d+)?';
const PERSONAL_AMOUNT_PATTERNS = [
  new RegExp(`\\b(?:my|your|our)\\s+${PERSONAL_ACCOUNT_TERMS}\\b[\\s\\S]{0,100}?${FINANCIAL_AMOUNT}\\b`, 'i'),
  new RegExp(`${FINANCIAL_AMOUNT}\\b[\\s\\S]{0,100}?\\b(?:my|your|our)\\s+${PERSONAL_ACCOUNT_TERMS}\\b`, 'i'),
];

const REFUSAL_PATTERNS = [
  ...PERSONAL_AMOUNT_PATTERNS,
  /\b(?:system|developer|hidden|internal)\s+(?:prompt|instructions?|messages?|rules?|workflows?|steps?|tools?|schemas?|routing|procedures?|scoring)\b/,
  /\b(?:your|filesmart(?:'s)?)\s+(?:internal\s+)?(?:prompts?|instructions?|tools?|schemas?|routing|workflows?|architecture|source code|business logic|product details?)\b/,
  /\bfilesmart\b.{0,80}\b(?:prepares?|handles?|calculates?|reviews?|verifies?|decides?|routes?|routing|internally|workflows?|process(?:es)?|tools?|schemas?|operational)\b/,
  /\b(?:what|how|where|when)\b.{0,90}\bfilesmart\b.{0,90}\b(?:do with|happens? to|after|uploads?|uploaded|documents?|process(?:es|ed)?|handles?|stores?|keeps?|shares?|deletes?|retains?)\b/,
  /\b(?:what|how|where|when)\b.{0,90}\b(?:uploads?|uploaded|documents?|files?)\b.{0,90}\bfilesmart\b/,
  /\b(?:show|reveal|print|dump|expose|list|describe|map|inspect)\b.{0,80}\b(?:prompts?|instructions?|tools?|schemas?|rpcs?|internal|workflows?|routing|source code)\b/,
  /\b(?:ignore|override|bypass|forget)\b.{0,70}\b(?:instructions?|rules?|policy|system|developer)\b/,
  /\b(?:competitor|rival|competitive intelligence|reconnaissance|reverse.engineer|differentiators?|trade secrets?)\b/,
  /\b(?:read|open|summari[sz]e|extract|quote|analy[sz]e|transcribe)\b.{0,90}\b(?:uploaded|attached|my|this|the)\b.{0,50}\b(?:pdf|documents?|files?|receipts?|attachments?|scans?)\b/,
  /\b(?:contents?|text|inside|says|written)\b.{0,70}\b(?:uploaded|attached|my|this|the)\b.{0,50}\b(?:pdf|documents?|files?|receipts?|attachments?)\b/,
  /\bwhat(?:'s| is)\b.{0,25}\b(?:in|inside)\b.{0,50}\b(?:my|uploaded|attached)\b.{0,30}\b(?:pdf|document|file|receipt)\b/,
  /\b(?:tell me what|what does|what is in|show me what)\b.{0,90}\b(?:my|uploaded|attached)\b.{0,50}\b(?:pdf|document|file|receipt)\b/,
  /^(?:please\s+)?(?:submit|file|send|delete|remove|approve|create|edit|update|change|modify|upload|sign)\b.{0,90}\b(?:my|this|the)\b.{0,40}\b(?:declaration|return|submission|record|draft|profile|message|document|file|account)\b/,
  /^(?:please\s+)?(?:submit|file|send|delete|remove|approve|create|edit|update|change|modify|upload|sign)\b.{0,90}\b(?:a|an)\b.{0,40}\b(?:declaration|return|submission|record|draft|profile|message|document|file|account)\b/,
  /\b(?:can|could|would|will)\s+you\s+(?:submit|file|send|delete|remove|approve|create|edit|update|change|modify|upload|sign)\b/,
  /\b(?:want|need|would like)\s+(?:you|the assistant|filesmart)\s+to\s+(?:submit|file|send|delete|remove|approve|create|edit|update|change|modify|upload|sign)\b/,
  /\b(?:my|mine|me)\b.{0,60}\b(?:tax id|tin|phone number|email address|exact (?:income|salary|tax|amount|balance|financial figures?))\b/,
  /\b(?:my|your|our)\b.{0,80}\b(?:income|salary|tax\s+(?:bill|liability|due|paid)|earnings|refund|balance|amount)\b.{0,50}\b(?:NGN\s*|naira\s*|₦\s*)?\d[\d,]*(?:\.\d+)?\b/,
  /\b(?:amount|balance|tax\s+(?:bill|liability|due|paid))\b.{0,40}\b(?:my|your|our)\s+account\b.{0,30}\b(?:NGN\s*|naira\s*|₦\s*)?\d[\d,]*(?:\.\d+)?\b/,
  /\b(?:the\s+)?(?:amount\s+on\s+)?(?:my|your|our)\s+account\b.{0,80}?\b(?:contains?|has|holds?|includes?|shows?|lists?|reflects?|is|was|equals?|comes?\s+to|amounts?\s+to)\b.{0,40}?(?:[₦$£€]\s*|(?:NGN|USD|naira)\s*)?\d[\d,]*(?:\.\d+)?\b/,
];

const ACCOUNT_STATUS_PATTERNS = [
  /\b(?:status|progress)\b.{0,50}\b(?:my|our)\b.{0,40}\b(?:declaration|submission|return|filing|account)\b/,
  /\b(?:my|our)\b.{0,40}\b(?:declaration|submission|return|filing|account)\b.{0,40}\b(?:status|progress)\b/,
  /\b(?:how many|count|number of)\b.{0,60}\b(?:documents?|attachments?)\b.{0,40}\b(?:my|uploaded|attached|submission|declaration)\b/,
  /\b(?:my|our)\b.{0,40}\b(?:documents?|attachments?)\b.{0,40}\b(?:count|how many|number)\b/,
  /\b(?:unread|new)\b.{0,40}\b(?:support\s+)?messages?\b/,
  /\b(?:my|our)\b.{0,30}\bprofile\b.{0,30}\b(?:complete|completion|status|missing)\b/,
];

const DOCUMENT_WORKFLOW_PATTERNS = [
  /\bwhat\s+happens?\b.{0,120}\b(?:my\s+)?(?:uploaded?|documents?|files?)\b/,
  /\b(?:how|where|when)\b.{0,120}\b(?:my\s+)?(?:uploaded?|documents?|files?)\b.{0,80}\b(?:stor(?:e|ed|es|ing)|retain(?:s|ed|ing)?|process(?:es|ed|ing)?|handle(?:s|d|ing)?|keep(?:s|ing)?|save(?:s|d|ing)?)\b/,
  /\bwhat\s+does\b.{0,120}\b(?:uploaded?|documents?|files?)\b.{0,80}\b(?:do|with|after|stor(?:e|ed|es|ing)|retain(?:s|ed|ing)?|process(?:es|ed|ing)?|handle(?:s|d|ing)?)\b/,
  /\bwhat\s+do\s+you\s+do\s+with\b.{0,120}\b(?:uploaded?|documents?|files?)\b/,
  /\b(?:where|what|how|when)\b.{0,120}\b(?:uploaded?|documents?|files?)\b.{0,80}\b(?:go|destination|stor(?:e|ed|es|ing)|retain(?:s|ed|ing)?|retention|process(?:es|ed|ing)?|handle(?:s|d|ing)?|keep(?:s|ing)?|save(?:s|d|ing)?)\b/,
  /\b(?:where|what|how|when)\b.{0,100}\b(?:go|destination|stor(?:e|ed|es|ing)|retain(?:s|ed|ing)?|retention|process(?:es|ed|ing)?|handle(?:s|d|ing)?|keep(?:s|ing)?|save(?:s|d|ing)?)\b.{0,120}\b(?:uploaded?|documents?|files?)\b/,
];

export function classifySupportRequest(message: string): SupportRequestClassification {
  const normalized = message.normalize('NFKC')
    .replace(/[\s\u200B-\u200D\uFEFF]+/gu, ' ')
    .trim()
    .toLowerCase();

  if (normalized.length > 2_000) return { kind: 'refusal' };

  if (REFUSAL_PATTERNS.some((pattern) => pattern.test(normalized))) return { kind: 'refusal' };
  if (DOCUMENT_WORKFLOW_PATTERNS.some((pattern) => pattern.test(normalized))) return { kind: 'refusal' };
  const isAccountStatus = ACCOUNT_STATUS_PATTERNS.some((pattern) => pattern.test(normalized));
  if (isAccountStatus) return { kind: 'account_status' };
  return { kind: 'education' };
}
