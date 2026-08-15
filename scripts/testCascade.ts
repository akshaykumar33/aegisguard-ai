import { config } from '@codeguard/config';

interface GeminiCandidatePart {
  text?: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiCandidatePart[];
    };
  }>;
}

async function testCascade(): Promise<void> {
  const models = ['gemini-3.7-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];
  console.log('Testing Intelligent Gemini Model Cascade:', models.join(' -> '));

  for (const model of models) {
    console.log(`\nTrying ${model}...`);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.GEMINI_API_KEY}`;
      const start = Date.now();
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Respond with JSON: {"status": "ok", "model": "' + model + '"}' }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
        })
      });

      if (!res.ok) {
        const err = await res.text();
        console.warn(`⚠️ ${model} returned HTTP ${res.status}: ${err.slice(0, 120)}... falling back to next model`);
        continue;
      }

      const data = (await res.json()) as GeminiResponse;
      console.log(`✅ Success with ${model} in ${Date.now() - start}ms:`, JSON.stringify(data.candidates?.[0]?.content?.parts?.[0]?.text));
      break;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`⚠️ ${model} error: ${message}... falling back`);
    }
  }
}

testCascade();
