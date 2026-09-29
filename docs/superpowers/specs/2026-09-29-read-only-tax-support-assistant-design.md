# Read-Only Tax Support Assistant Design

## 1. Outcome

Add an in-app customer-support assistant that provides grounded Nigerian tax education and high-level, authenticated account status summaries. The assistant must be read-only in the first release and must not disclose FileSmart's proprietary workflows or internal product behavior.

## 2. Product boundary

### In scope

- General Nigerian tax explanations based on approved, versioned sources.
- Explanations of tax terminology and generic filing concepts.
- High-level summaries of the signed-in user's own records, including declaration type, tax year, status, document count, and support-message status.
- Source citations, uncertainty statements, and escalation to human support.
- Responsive chat drawer on desktop and bottom sheet on mobile.

### Explicitly out of scope

- Creating, editing, submitting, deleting, or approving any record.
- Displaying exact personal financial figures, tax IDs, phone numbers, or raw profile fields.
- Reading uploaded document contents or unsynced local drafts.
- Describing FileSmart workflows, internal routing, prompts, tools, schemas, operational procedures, proprietary scoring, or product differentiators.
- Ingesting private product documentation into the model's knowledge base.

When asked about internal product behavior, the assistant should give a short refusal and redirect to a generic tax or account-status question. Static UI guidance may explain the immediate control being used, but it must not reveal the broader workflow behind it.

## 3. Existing application constraints

FileSmart is a React/Vite application using Supabase Auth, Supabase Edge Functions, local-first IndexedDB storage, and RLS-protected server tables. Declaration and profile data are synchronized to Supabase, while uploaded document bytes remain local-only. The assistant therefore operates only on approved public tax content and server-synchronized, allowlisted account summaries.

## 4. Proposed architecture

```text
React chat surface
        |
        v
Supabase Edge Function: support-chat
        |
        +--> public tax retrieval --> versioned source records
        |
        +--> authenticated summary tools --> Supabase RLS / RPC
        |
        +--> model provider
```

The browser must never call the model provider directly. The Edge Function validates the Supabase access token, derives the user identity from the token, classifies the request as public or private, and exposes only the minimum tool set required for the request.

## 5. Public knowledge layer

Maintain a versioned Nigerian tax dataset containing:

- Canonical term or topic.
- Plain-language explanation.
- Statutory or official source citation.
- Jurisdiction and tax year/effective date.
- Review owner and last-reviewed date.

The assistant must cite approved sources, avoid inventing statutory sections, and say when a question is outside the supported jurisdiction or tax year. FileSmart product documentation must not be included in this corpus.

## 6. Private summary tools

Initial tools are read-only and return DTOs, not database rows:

- `get_my_declaration_status`: declaration type, tax year, status, and document count.
- `get_my_support_message_summary`: unread count and message categories, without sensitive message bodies unless separately approved.
- `get_my_profile_completion`: completion state only, not profile values.

Each tool derives identity from the verified JWT. No tool accepts a user ID from the model or browser. Queries must remain protected by RLS and use explicit column allowlists. Tax calculations should be explained generically; exact personal financial values are excluded from the first release.

## 7. UX requirements

- Launch from the existing top-bar support affordance; do not replace the Messages navigation item.
- Use a drawer on desktop and a full-height bottom sheet on mobile.
- Provide suggested prompts for tax education, terminology, and status checking.
- Clearly label when a response uses account context: “Based on your synced FileSmart records.”
- Show citations as compact, accessible links.
- Provide loading, offline, provider-error, empty, and escalation states.
- Keep chat history ephemeral by default; server-side transcript retention requires a separate consent and retention decision.

## 8. Security and privacy controls

- Supabase JWT validation on every private request.
- Per-account and per-IP rate limits.
- Strict tool allowlists and Zod-style input/output validation.
- No service-role key in the browser.
- No raw document content or full profile/declaration payloads sent to the model.
- Redaction of secrets and direct identifiers from logs.
- Prompt-injection resistance: retrieved text and user messages are untrusted data, never instructions to bypass tool policy.
- Human escalation for legal advice, disputes, unsupported tax years, or low-confidence answers.

## 9. Evaluation and acceptance criteria

The first release is acceptable only when:

1. Public tax questions return source-backed answers or an explicit uncertainty response.
2. Private status questions work only for the authenticated caller.
3. Cross-user record access tests fail safely.
4. No write-capable tool is registered.
5. The assistant refuses requests for FileSmart internals and proprietary workflows.
6. Document-content questions are refused without attempting to access local files.
7. Exact personal financial figures and direct identifiers are not returned.
8. Expired sessions, rate limits, provider failures, and offline mode have tested UI states.
9. The public tax dataset has an owner and review cadence.

## 10. Technology recommendation

Do not make Alan the core application architecture. It is a hosted SDK/agent platform and does not remove the need for FileSmart's own authorization, tax-source governance, and privacy boundary.

Use the existing React components for the first chat surface and implement the secure gateway in Supabase Edge Functions. Evaluate assistant-ui only as an optional presentation layer after a small compatibility spike. Consider Dify only if a separate visual RAG administration service is worth the operational and licensing overhead. Do not use archived Flowise.

## 11. Future extensions requiring separate approval

- Write actions such as filing, editing, or sending messages.
- Document upload, OCR, or document-content questions.
- Exact financial calculations or personalized tax advice.
- Persistent transcript storage and support analytics.
- External human-support/helpdesk integration.
