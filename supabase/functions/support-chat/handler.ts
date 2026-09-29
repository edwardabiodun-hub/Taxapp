import { enforceDualLimit, getTrustedClientIp, type DualLimitInput, type RateLimitClient } from '../_shared/rate-limit.ts';
import { selectKnowledgeEntries, type KnowledgeRow } from './knowledge.ts';
import { classifySupportRequest } from './policy.ts';
import { buildSupportSystemPrompt, sanitizeAssistantText, type AccountSummaryDto } from './prompt.ts';
import type { AnswerProvider, ChatTurn } from './provider.ts';

type RpcResult = { data: unknown; error: unknown };
type RpcClient = { rpc: (name: string, args?: Record<string, unknown>) => Promise<RpcResult> };
type UserClient = RpcClient & {
  auth: { getUser: (jwt: string) => Promise<{ data: { user?: { id?: string } } | null; error: unknown }> };
};

export interface SupportChatDependencies {
  appOrigin: string;
  rateLimitSalt: string;
  createUserClient: (authorization: string) => UserClient;
  knowledgeClient: RpcClient;
  rateLimitClient: RateLimitClient;
  provider: AnswerProvider;
  enforceLimit?: (client: RateLimitClient, input: DualLimitInput) => Promise<{ allowed: boolean }>;
  now?: () => Date;
}

type SupportChatRequest = { message: string; history: ChatTurn[] };
const allowedCorsHeaders = new Set(['authorization', 'apikey', 'content-type']);
const allowedCategories = new Set(['refund_status', 'document_request', 'general']);
const allowedStatuses = new Set(['draft', 'submitted', 'processing', 'audit_request', 'approved']);
const refusal = 'I cannot help with that request. I can provide general Nigerian tax information or high-level account status; please contact human support for other needs.';

export function validateSupportAppOrigin(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash
    || url.hostname === 'localhost' || url.hostname.endsWith('.localhost') || url.hostname === '127.0.0.1' || url.hostname === '[::1]' || url.hostname === '::1') {
    throw new Error('APP_ORIGIN must be a trusted HTTPS origin');
  }
  return url.origin;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, names: string[]): boolean {
  return Object.keys(value).length === names.length && names.every((name) => Object.hasOwn(value, name));
}

function parseBody(value: unknown): SupportChatRequest | null {
  if (!isRecord(value) || !hasExactKeys(value, ['message', 'history'])
    || typeof value.message !== 'string' || !value.message.trim() || value.message.length > 2_000
    || !Array.isArray(value.history) || value.history.length > 12 || value.history.length % 2 !== 0) return null;
  const history: ChatTurn[] = [];
  for (const [index, turn] of value.history.entries()) {
    if (!isRecord(turn) || !hasExactKeys(turn, ['role', 'content'])
      || turn.role !== (index % 2 === 0 ? 'user' : 'assistant')
      || typeof turn.content !== 'string' || !turn.content.trim() || turn.content.length > 2_000) return null;
    history.push({ role: turn.role as ChatTurn['role'], content: turn.content });
  }
  return { message: value.message, history };
}

async function readBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Invalid body');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 32_768) {
      await reader.cancel();
      throw new Error('Invalid body');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

function isAllowedOrigin(request: Request, appOrigin: string): boolean {
  return request.headers.get('origin') === appOrigin;
}

function response(request: Request, appOrigin: string, status: number, body?: Record<string, unknown>): Response {
  const headers = new Headers({ 'Cache-Control': 'no-store', Vary: 'Origin' });
  if (isAllowedOrigin(request, appOrigin)) {
    headers.set('Access-Control-Allow-Origin', appOrigin);
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'authorization, apikey, content-type');
  }
  if (body) headers.set('Content-Type', 'application/json');
  return new Response(body ? JSON.stringify(body) : null, { status, headers });
}

function preflightAllowed(request: Request, appOrigin: string): boolean {
  if (!isAllowedOrigin(request, appOrigin) || request.headers.get('access-control-request-method') !== 'POST') return false;
  const raw = request.headers.get('access-control-request-headers');
  if (!raw) return true;
  const headers = raw.split(',').map((header) => header.trim().toLowerCase());
  return headers.every((header) => allowedCorsHeaders.has(header));
}

function safeCount(value: unknown): number | null {
  const numeric = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  return typeof numeric === 'number' && Number.isSafeInteger(numeric) && numeric >= 0 && numeric <= 10_000 ? numeric : null;
}

function oneRow(value: unknown): Record<string, unknown> {
  if (!Array.isArray(value) || value.length !== 1 || !isRecord(value[0])) throw new Error('Invalid summary');
  return value[0];
}

function projectAccountSummary(declarationsData: unknown, messagesData: unknown, profileData: unknown): AccountSummaryDto {
  if (!Array.isArray(declarationsData) || declarationsData.length > 20) throw new Error('Invalid summary');
  const declarations: AccountSummaryDto['declarations'] = declarationsData.map((row) => {
    if (!isRecord(row) || typeof row.tax_year !== 'string' || !/^(?:19|20)\d{2}$/.test(row.tax_year)
      || typeof row.declaration_type !== 'string' || !/^[a-z][a-z0-9_-]{0,31}$/i.test(row.declaration_type)
      || typeof row.status !== 'string' || !allowedStatuses.has(row.status)) throw new Error('Invalid summary');
    const documentCount = safeCount(row.document_count);
    if (documentCount === null) throw new Error('Invalid summary');
    return { taxYear: row.tax_year, type: row.declaration_type, status: row.status, documentCount };
  });
  const messages = oneRow(messagesData);
  const unreadMessageCount = safeCount(messages.unread_count);
  if (unreadMessageCount === null || !Array.isArray(messages.categories)) throw new Error('Invalid summary');
  const messageCategories = [...new Set(messages.categories.filter((value): value is string =>
    typeof value === 'string' && allowedCategories.has(value)))];
  const profile = oneRow(profileData);
  if (typeof profile.is_complete !== 'boolean') throw new Error('Invalid summary');
  return { declarations, unreadMessageCount, messageCategories, profileComplete: profile.is_complete };
}

function projectKnowledge(value: unknown, asOf: string): KnowledgeRow[] {
  if (!Array.isArray(value)) throw new Error('Invalid knowledge');
  const rows = value.filter((row): row is Record<string, unknown> => isRecord(row)
    && typeof row.id === 'string' && typeof row.term === 'string'
    && Array.isArray(row.aliases) && row.aliases.every((alias: unknown) => typeof alias === 'string')
    && typeof row.definition === 'string' && typeof row.statutory_reference === 'string'
    && typeof row.source_url === 'string' && /^https:\/\//i.test(row.source_url)
    && typeof row.jurisdiction === 'string' && typeof row.effective_from === 'string'
    && (row.effective_to === null || typeof row.effective_to === 'string')
    && typeof row.last_verified === 'string'
    && (row.review_status === undefined || row.review_status === 'verified'))
    .map((row): KnowledgeRow => ({
      id: row.id as string,
      term: row.term as string,
      aliases: row.aliases as string[],
      definition: row.definition as string,
      statutory_reference: row.statutory_reference as string,
      source_url: row.source_url as string,
      jurisdiction: row.jurisdiction as string,
      effective_from: row.effective_from as string,
      effective_to: row.effective_to as string | null,
      last_verified: row.last_verified as string,
      review_owner: '',
      review_status: 'verified',
    }));
  return selectKnowledgeEntries(rows, asOf);
}

async function getSummary(userClient: UserClient): Promise<AccountSummaryDto> {
  const declarations = await userClient.rpc('get_my_declaration_status');
  const messages = await userClient.rpc('get_my_support_message_summary');
  const profile = await userClient.rpc('get_my_profile_completion');
  if (declarations.error || messages.error || profile.error) throw new Error('Summary unavailable');
  return projectAccountSummary(declarations.data, messages.data, profile.data);
}

export function createSupportChatHandler(dependencies: SupportChatDependencies): (request: Request) => Promise<Response> {
  const appOrigin = validateSupportAppOrigin(dependencies.appOrigin);
  if (!dependencies.rateLimitSalt) throw new Error('RATE_LIMIT_SALT is required');

  return async (request) => {
    if (request.method === 'OPTIONS') {
      return preflightAllowed(request, appOrigin)
        ? response(request, appOrigin, 204)
        : new Response(null, { status: 403, headers: { 'Cache-Control': 'no-store', Vary: 'Origin' } });
    }
    if (request.method !== 'POST') return response(request, appOrigin, 405, { error: { message: 'Method not allowed' } });
    if (request.headers.has('origin') && !isAllowedOrigin(request, appOrigin)) return response(request, appOrigin, 403, { error: { message: 'Origin not allowed' } });
    if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('content-type') ?? '')) {
      return response(request, appOrigin, 400, { error: { message: 'Invalid request' } });
    }

    let body: SupportChatRequest | null;
    try { body = parseBody(await readBody(request)); } catch { body = null; }
    if (!body) return response(request, appOrigin, 400, { error: { message: 'Invalid request' } });

    const authorization = request.headers.get('authorization') ?? '';
    if (!/^Bearer [A-Za-z0-9._~-]+$/i.test(authorization)) {
      return response(request, appOrigin, 401, { error: { message: 'Authentication required' } });
    }

    let userClient: UserClient;
    let userId: string | undefined;
    try {
      userClient = dependencies.createUserClient(authorization);
      const result = await userClient.auth.getUser(authorization.slice(7));
      if (result.error) return response(request, appOrigin, 401, { error: { message: 'Authentication required' } });
      userId = result.data?.user?.id;
    } catch {
      return response(request, appOrigin, 401, { error: { message: 'Authentication required' } });
    }
    if (!userId) return response(request, appOrigin, 401, { error: { message: 'Authentication required' } });

    try {
      const limit = await (dependencies.enforceLimit ?? enforceDualLimit)(dependencies.rateLimitClient, {
        accountKey: `user:${userId}`,
        ipKey: getTrustedClientIp(request),
        accountLimit: 30,
        ipLimit: 60,
        windowSeconds: 900,
        salt: dependencies.rateLimitSalt,
      });
      if (!limit.allowed) return response(request, appOrigin, 429, { error: { message: 'Too many requests. Try again later.' } });
    } catch {
      return response(request, appOrigin, 503, { error: { message: 'Support assistant unavailable' } });
    }

    const classification = classifySupportRequest(body.message);
    if (classification.kind === 'refusal' || body.history.some((turn) => classifySupportRequest(turn.content).kind === 'refusal')) {
      return response(request, appOrigin, 200, { answer: refusal, citations: [] });
    }

    const asOf = (dependencies.now ?? (() => new Date()))().toISOString().slice(0, 10);
    let knowledgeEntries: KnowledgeRow[] = [];
    let accountSummary: AccountSummaryDto | undefined;
    try {
      if (classification.kind === 'education') {
        const result = await dependencies.knowledgeClient.rpc('search_support_knowledge', { p_query: body.message, p_as_of: asOf, p_limit: 5 });
        if (result.error) throw new Error('Knowledge unavailable');
        knowledgeEntries = projectKnowledge(result.data, asOf);
        if (!knowledgeEntries.length) return response(request, appOrigin, 200, {
          answer: 'I cannot confirm an answer from the approved Nigerian tax sources for this question. Please contact human support for guidance.', citations: [],
        });
      } else {
        accountSummary = await getSummary(userClient);
      }
    } catch {
      return response(request, appOrigin, 503, { error: { message: 'Support assistant unavailable' } });
    }

    try {
      const answer = await dependencies.provider.generateAnswer({
        system: buildSupportSystemPrompt({ asOf, knowledgeEntries, accountSummary }),
        history: body.history,
        userMessage: body.message,
      });
      const safeAnswer = sanitizeAssistantText(answer);
      const citations = knowledgeEntries.map((entry) => ({ title: entry.term, url: entry.source_url, statutoryReference: entry.statutory_reference }));
      return response(request, appOrigin, 200, {
        answer: accountSummary ? `Based on your synced FileSmart records. ${safeAnswer}` : safeAnswer,
        citations,
      });
    } catch {
      return response(request, appOrigin, 502, { error: { message: 'Answer service unavailable' } });
    }
  };
}
