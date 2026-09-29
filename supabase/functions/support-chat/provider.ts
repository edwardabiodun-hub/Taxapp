export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface GenerateAnswerInput {
  system: string;
  history: ChatTurn[];
  userMessage: string;
}

export interface AnswerProvider {
  generateAnswer(input: GenerateAnswerInput): Promise<string>;
}

export interface ProviderConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}

export function createOpenAiAnswerProvider(config: ProviderConfig): AnswerProvider {
  let endpoint: URL;
  try { endpoint = new URL(config.apiUrl); } catch { throw new Error('Invalid provider configuration'); }
  const hostname = endpoint.hostname.toLowerCase().replace(/\.$/, '');
  const internalSuffix = /\.(?:localhost|local|internal|lan|home|corp|intranet|localdomain)$/;
  const ipLiteral = /^\[|^[0-9.]+$/;
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || !config.apiKey || !config.model
    || !hostname.includes('.') || internalSuffix.test(hostname) || ipLiteral.test(hostname)) {
    throw new Error('Invalid provider configuration');
  }

  return {
    async generateAnswer(input) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), config.timeoutMs ?? 15_000);
      try {
        const response = await (config.fetcher ?? fetch)(endpoint.href, {
          method: 'POST',
          redirect: 'error',
          headers: { authorization: `Bearer ${config.apiKey}`, 'content-type': 'application/json' },
          body: JSON.stringify({
            model: config.model,
            temperature: 0.1,
            max_tokens: 500,
            messages: [{ role: 'system', content: input.system }, ...input.history, { role: 'user', content: input.userMessage }],
          }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Provider unavailable');
        const payload: unknown = await response.json();
        const choices = payload && typeof payload === 'object' && 'choices' in payload ? payload.choices : null;
        const first = Array.isArray(choices) ? choices[0] : null;
        const message = first && typeof first === 'object' && 'message' in first ? first.message : null;
        const content = message && typeof message === 'object' && 'content' in message ? message.content : null;
        if (typeof content !== 'string' || !content.trim()) throw new Error('Provider unavailable');
        return content;
      } catch {
        throw new Error('Provider unavailable');
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
