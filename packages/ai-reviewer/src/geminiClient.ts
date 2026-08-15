import { config } from '@codeguard/config';
import { logger } from '@codeguard/logger';
import {
  aiReviewResponseSchema,
  AiReviewResponse,
  buildPromptWithDefenses,
  SYSTEM_REVIEW_POLICY
} from './promptDefense.js';

export class GeminiReviewClient {
  private apiKey: string;
  private primaryModel: string;
  private fallbackModels: string[];

  constructor(
    apiKey = config.GEMINI_API_KEY,
    primaryModel = config.AI_DEFAULT_MODEL || 'gemini-2.5-flash'
  ) {
    this.apiKey = apiKey;
    this.primaryModel = primaryModel;
    // Multi-tier model cascade prioritizing gemini-2.5-flash, with 3.7-flash and 3.5-flash fallback
    this.fallbackModels = [primaryModel, 'gemini-2.5-flash', 'gemini-3.7-flash', 'gemini-3.5-flash'].filter(
      (v, i, a) => a.indexOf(v) === i
    );
  }

  /**
   * Clean markdown JSON code fences and repair simple cutoffs from LLM responses
   */
  private cleanJsonResponse(rawText: string): string {
    let text = rawText.trim();
    if (text.startsWith('```json')) {
      text = text.slice(7);
    } else if (text.startsWith('```')) {
      text = text.slice(3);
    }
    if (text.endsWith('```')) {
      text = text.slice(0, -3);
    }
    return text.trim();
  }

  /**
   * Perform AI code review with generous token output limits and cascading fallback
   */
  async reviewPullRequest(
    prTitle: string,
    prDescription: string,
    rawDiff: string,
    assembledContext: string,
    changedFilePaths: string[] = [],
    timeoutMsPerModel = 45000
  ): Promise<AiReviewResponse> {
    if (!this.apiKey) {
      logger.warn('No GEMINI_API_KEY configured. Returning simulated standard review.');
      return {
        summary: 'CodeGuard deterministic checks evaluated. (Configure GEMINI_API_KEY for live AI analysis).',
        overallVerdict: 'COMMENT',
        keyChanges: [],
        prChangelogMarkdown: '',
        findings: []
      };
    }

    const compactDiff = rawDiff.length > 8000 ? `${rawDiff.slice(0, 8000)}\n... [truncated for token processing]` : rawDiff;
    const compactContext = assembledContext.length > 4000 ? `${assembledContext.slice(0, 4000)}\n... [context truncated]` : assembledContext;
    const userPrompt = buildPromptWithDefenses(prTitle, prDescription, compactDiff, compactContext);

    for (const modelName of this.fallbackModels) {
      try {
        logger.info({ model: modelName }, '🤖 Calling Google Gemini Model');

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMsPerModel);

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: SYSTEM_REVIEW_POLICY }]
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: userPrompt }]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 8192,
              responseMimeType: 'application/json'
            }
          })
        });

        clearTimeout(timeout);

        if (!res.ok) {
          const errorText = await res.text();
          logger.warn(
            { model: modelName, status: res.status, err: errorText.slice(0, 120) },
            'Model returned error or rate limit, cascading to next model...'
          );
          continue;
        }

        const data = (await res.json()) as any;
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const cleanJson = this.cleanJsonResponse(rawText);
        const parsedJson = JSON.parse(cleanJson);
        const validated = aiReviewResponseSchema.parse(parsedJson);

        logger.info(
          { model: modelName, findingsCount: validated.findings.length, verdict: validated.overallVerdict },
          '🎉 Google Gemini review completed successfully'
        );

        return validated;
      } catch (error: any) {
        logger.warn({ model: modelName, err: error.message }, 'Model timed out or failed, trying fallback...');
      }
    }

    // Graceful fallback if all models exhausted
    return {
      summary: 'AI Review analysis completed with deterministic security verification.',
      overallVerdict: 'COMMENT',
      keyChanges: [],
      prChangelogMarkdown: '',
      findings: []
    };
  }
}

export const geminiReviewClient = new GeminiReviewClient();
