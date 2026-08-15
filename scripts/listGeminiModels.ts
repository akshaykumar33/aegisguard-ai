import { config } from '@codeguard/config';

interface GeminiModelItem {
  name: string;
  displayName?: string;
  inputTokenLimit?: number;
  supportedGenerationMethods?: string[];
}

interface ListModelsResponse {
  models?: GeminiModelItem[];
}

async function listGeminiModels(): Promise<void> {
  console.log('Querying available models with API key...');
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${config.GEMINI_API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`Failed to list models: HTTP ${res.status} ${res.statusText}`);
      const err = await res.text();
      console.log(err);
      return;
    }
    const data = (await res.json()) as ListModelsResponse;
    console.log(`Found ${data.models?.length || 0} models:`);
    for (const m of data.models || []) {
      if (m.supportedGenerationMethods?.includes('generateContent')) {
        console.log(`- ${m.name.replace('models/', '')} (${m.displayName}) - inputTokenLimit: ${m.inputTokenLimit}`);
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error querying models:', message);
  }
}

listGeminiModels();
