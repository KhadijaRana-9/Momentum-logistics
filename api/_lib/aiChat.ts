import { env } from './env.ts';

/**
 * AI provider abstraction for the website chatbot.
 *
 * No provider is wired. `isConfigured` is false until AI_PROVIDER + AI_API_KEY
 * are set. When unconfigured, the chatbot falls back to a deterministic guided
 * qualification script (see chatFlow.ts) — it never fabricates an "AI" answer.
 */

export interface AiReplyInput {
  system: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  message: string;
}

export const aiChat = {
  get isConfigured(): boolean {
    return Boolean(env.ai.provider && env.ai.apiKey);
  },

  async reply(_input: AiReplyInput): Promise<{ text: string; provider: string } | null> {
    if (!this.isConfigured) return null;
    // Intentionally not implemented until a provider + key are configured.
    // A concrete implementation (e.g. Anthropic Messages API) plugs in here,
    // reading env.ai.provider / env.ai.apiKey / env.ai.model.
    console.warn(`[aiChat] provider "${env.ai.provider}" configured but no client implemented`);
    return null;
  },
};
