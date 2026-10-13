const NUMBER_WORD = '(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)';
const MAGNITUDE_WORD = '(?:hundred|thousand|million|billion|trillion)';
const NUMBER_WORD_AMOUNT = '(?:' + NUMBER_WORD + '(?:\\s+' + NUMBER_WORD + ')*\\s+' + MAGNITUDE_WORD + ')';
const NUMERIC_AMOUNT = '(?:\\d[\\d,]*(?:\\.\\d+)?(?:e[+-]?\\d+)?|\\d+(?:\\.\\d+)?[kmb])';
const AMOUNT = '(?:(?:[₦$£€]\\s*|(?:NGN|USD|GBP|naira)\\s+)?(?:' + NUMERIC_AMOUNT + '|' + NUMBER_WORD_AMOUNT + ')(?:\\s+(?:naira|NGN|USD|GBP))?)';
const AMOUNT_TOKEN = '(?<![\\p{L}\\p{N}_])' + AMOUNT + '(?![\\p{L}\\p{N}_])';
const PERSONAL_ACCOUNT_TERM = '(?:account|balance|income|salary|tax\\s+(?:bill|liability|due|paid)|amount|earnings|refund)';

const PERSONAL_AMOUNT_PATTERNS = [
  new RegExp('\\b(?:my|your|our)\\s+' + PERSONAL_ACCOUNT_TERM + '\\b[\\s\\S]{0,100}?' + AMOUNT_TOKEN, 'iu'),
  new RegExp(AMOUNT_TOKEN + '[\\s\\S]{0,100}?\\b(?:my|your|our)\\s+' + PERSONAL_ACCOUNT_TERM + '\\b', 'iu'),
];

const LABELED_PERSONAL_FIELD = /\b(?:account holder|full\s+name|name|(?:postal\s+)?address|email|phone|bank\s+account|date\s+of\s+birth|birth\s+date|dob)\s*[:=]/i;
const EMAIL_ADDRESS = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE_NUMBER = /(?:\+?234|0)[\s.-]?(?:\d[\s.-]?){9,10}\b/;
const TAX_IDENTIFIER = /\b(?:tax\s*(?:identification\s*)?(?:id|number)|TIN|BVN|NIN)\b[\s:=]*(?:is[\s:=]*)?(?:\d[\s-]?){8,15}\b/i;
const PERSONAL_FIELD_PROSE = /\b(?:my|your)\s+(?:full\s+)?(?:name|address|date of birth|bank account)\s+(?:is|was|:)\s+/i;

const DOCUMENT_REFERENCES = /\b(?:upload(?:ed|s)?|attach(?:ed|ment|ments?)|scann(?:ed|s)?|documents?|files?|pdfs?|attachments?)\b/i;
const DOCUMENT_CONTENT_OR_HANDLING = /\b(?:review(?:ed|s|ing)?|read|open|summari[sz](?:e|ed|es|ing)|extract|quote|analy[sz](?:e|ed|es|ing)|transcrib(?:e|ed|es|ing)|inspect|look\s+at|check|safe|secure|stor(?:e|ed|es|ing)|kept|keep(?:s|ing)?|sav(?:e|ed|es|ing)|process(?:es|ed|ing)?|handl(?:e|ed|es|ing)|upload(?:ed|s)?|download(?:ed|s)?|portal|access|view|see|where|destination|go|retention|retain(?:s|ed|ing)?|share(?:s|d|ing)?|send(?:s|ing)?|forward(?:s|ed|ing)?|route(?:s|d|ing)?|what\s+happens?|do\s+with|what\s+(?:is|'s)\s+(?:in|inside|on|written|contained))\b/i;
const HTTP_URL = /https?:\/\/[^\s<>"'\x60\])}]+/giu;

export function normalizeSupportText(text: string): string {
  return text.normalize('NFKC').replace(/[\s\u200B-\u200D\uFEFF]+/gu, ' ').trim();
}

export function stripHttpUrls(text: string): string {
  return text.replace(HTTP_URL, ' ');
}

export function hasPersonalAmount(text: string): boolean {
  return PERSONAL_AMOUNT_PATTERNS.some((pattern) => pattern.test(text));
}

export function hasSensitivePii(text: string): boolean {
  return LABELED_PERSONAL_FIELD.test(text)
    || EMAIL_ADDRESS.test(text)
    || PHONE_NUMBER.test(text)
    || TAX_IDENTIFIER.test(text)
    || PERSONAL_FIELD_PROSE.test(text);
}

export function hasForbiddenDocumentContent(text: string): boolean {
  const documentSafeText = stripHttpUrls(text);
  return DOCUMENT_REFERENCES.test(documentSafeText) && DOCUMENT_CONTENT_OR_HANDLING.test(documentSafeText);
}
const INSTRUCTION_PATTERNS = [
  /\b(?:ignore|override|bypass|discard|disregard|forget|delete)\b.{0,80}\b(?:previous|prior|above|system|developer|safety|policy|rules?|instructions?)\b/i,
  /\b(?:system|developer|hidden|internal)\s+(?:prompts?|instructions?|messages?|rules?)\b/i,
  /\b(?:reveal|show|print|dump|expose|send|leak|provide|give|share)\b.{0,80}\b(?:prompts?|instructions?|secrets?|passwords?|api\s*keys?|tokens?|credentials?)\b/i,
  /\b(?:call|invoke|execute|activate|run|use)\b.{0,60}\b(?:tools?|functions?|apis?|rpcs?|shell|commands?)\b/i,
  /\b(?:tools?|functions?|apis?|rpcs?)\b.{0,40}\b(?:call|invoke|execute|activate|run)\b/i,
  /\b(?:you are now|new instructions?|act as (?:system|developer)|priority override)\b/i,
  /\b(?:api[\s_-]*keys?|secrets?|passwords?|access[\s_-]*tokens?|private[\s_-]*keys?|credentials?)\b/i,
];

export function hasInstructionInjection(text: string): boolean {
  const normalized = normalizeSupportText(text);
  return INSTRUCTION_PATTERNS.some((pattern) => pattern.test(normalized));
}
