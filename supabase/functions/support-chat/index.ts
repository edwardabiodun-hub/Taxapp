import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.1';
import { createSupportChatHandler, validateSupportAppOrigin } from './handler.ts';
import { createOpenAiAnswerProvider } from './provider.ts';
import { createTaxSearchProvider } from './retrieval.ts';

type DenoRuntime = {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Promise<Response>): void;
};

const runtime = (globalThis as typeof globalThis & { Deno?: DenoRuntime }).Deno;

if (runtime) {
  const required = [
    'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'RATE_LIMIT_SALT',
    'APP_ORIGIN', 'LLM_API_URL', 'LLM_API_KEY', 'LLM_MODEL', 'LLM_ALLOWED_HOSTS',
  ] as const;
  const values = Object.fromEntries(required.map((name) => [name, runtime.env.get(name)?.trim()]));
  if (required.some((name) => !values[name])) throw new Error('Support chat configuration is incomplete');

  const supabaseUrl = values.SUPABASE_URL;
  const anonKey = values.SUPABASE_ANON_KEY;
  const serviceRoleKey = values.SUPABASE_SERVICE_ROLE_KEY;
  const appOrigin = validateSupportAppOrigin(values.APP_ORIGIN);
  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const handler = createSupportChatHandler({
    appOrigin,
    rateLimitSalt: values.RATE_LIMIT_SALT,
    rateLimitClient: { rpc: async (name, args) => await serviceClient.rpc(name, args) },
    knowledgeClient: { rpc: async (name, args) => await serviceClient.rpc(name, args) },
    createUserClient: (authorization) => {
      const client = createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: authorization } },
      });
      return {
        auth: { getUser: async (jwt) => await client.auth.getUser(jwt) },
        rpc: async (name, args) => await client.rpc(name, args),
      };
    },
    provider: createOpenAiAnswerProvider({
      apiUrl: values.LLM_API_URL,
      apiKey: values.LLM_API_KEY,
      model: values.LLM_MODEL,
      allowedHosts: values.LLM_ALLOWED_HOSTS,
    }),
    ...(runtime.env.get('SEARCH_API_URL') && runtime.env.get('SEARCH_API_KEY') && runtime.env.get('SEARCH_ALLOWED_DOMAINS')
      ? {
          searchProvider: createTaxSearchProvider({
            apiUrl: runtime.env.get('SEARCH_API_URL')!.trim(),
            apiKey: runtime.env.get('SEARCH_API_KEY')!.trim(),
            apiAllowedHosts: (runtime.env.get('SEARCH_API_ALLOWED_HOSTS') ?? '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean),
            allowedDomains: runtime.env.get('SEARCH_ALLOWED_DOMAINS')!.split(',').map((value) => value.trim().toLowerCase()).filter(Boolean),
            maxResults: 5,
            maxBytes: 100_000,
            timeoutMs: 5_000,
          }),
          searchConfig: {
            apiUrl: runtime.env.get('SEARCH_API_URL')!.trim(),
            apiKey: runtime.env.get('SEARCH_API_KEY')!.trim(),
            apiAllowedHosts: (runtime.env.get('SEARCH_API_ALLOWED_HOSTS') ?? '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean),
            allowedDomains: runtime.env.get('SEARCH_ALLOWED_DOMAINS')!.split(',').map((value) => value.trim().toLowerCase()).filter(Boolean),
            maxResults: 5,
            maxBytes: 100_000,
            timeoutMs: 5_000,
          },
        }
      : {}),
  });

  runtime.serve(handler);
}
