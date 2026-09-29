export type SupportRequestKind = 'education' | 'account_status' | 'refusal';
export type SupportRequestClassification = { kind: SupportRequestKind };

const REFUSAL_PATTERNS = [
  /\b(?:system|developer|hidden|internal)\s+(?:prompt|instructions?|messages?|rules?|workflows?|steps?|tools?|schemas?|routing|procedures?|scoring)\b/,
  /\b(?:your|filesmart(?:'s)?)\s+(?:internal\s+)?(?:prompts?|instructions?|tools?|schemas?|routing|workflows?|architecture|source code|business logic|product details?)\b/,
  /\bfilesmart\b.{0,80}\b(?:prepares?|handles?|calculates?|reviews?|verifies?|decides?|routes?|routing|internally|workflows?|process(?:es)?|tools?|schemas?|operational)\b/,
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
];

const ACCOUNT_STATUS_PATTERNS = [
  /\b(?:status|progress)\b.{0,50}\b(?:my|our)\b.{0,40}\b(?:declaration|submission|return|filing|account)\b/,
  /\b(?:my|our)\b.{0,40}\b(?:declaration|submission|return|filing|account)\b.{0,40}\b(?:status|progress)\b/,
  /\b(?:how many|count|number of)\b.{0,60}\b(?:documents?|attachments?)\b.{0,40}\b(?:my|uploaded|attached|submission|declaration)\b/,
  /\b(?:my|our)\b.{0,40}\b(?:documents?|attachments?)\b.{0,40}\b(?:count|how many|number)\b/,
  /\b(?:unread|new)\b.{0,40}\b(?:support\s+)?messages?\b/,
  /\b(?:my|our)\b.{0,30}\bprofile\b.{0,30}\b(?:complete|completion|status|missing)\b/,
];

export function classifySupportRequest(message: string): SupportRequestClassification {
  const normalized = message.normalize('NFKC')
    .replace(/[\s\u200B-\u200D\uFEFF]+/gu, ' ')
    .trim()
    .toLowerCase();

  if (normalized.length > 2_000) return { kind: 'refusal' };

  if (REFUSAL_PATTERNS.some((pattern) => pattern.test(normalized))) return { kind: 'refusal' };
  if (ACCOUNT_STATUS_PATTERNS.some((pattern) => pattern.test(normalized))) return { kind: 'account_status' };
  return { kind: 'education' };
}
