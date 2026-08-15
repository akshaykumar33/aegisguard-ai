import { config } from '@codeguard/config';

async function testGemini(): Promise<void> {
  console.log('Testing Gemini API key:', config.GEMINI_API_KEY ? `${config.GEMINI_API_KEY.slice(0, 8)}...` : 'EMPTY');

  const models = ['gemini-3.7-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];

  for (const model of models) {
    console.log(`\nTesting model: ${model}...`);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.GEMINI_API_KEY}`;
      const start = Date.now();
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Respond with JSON: {"status": "ok"}' }] }]
        })
      });

      const data: unknown = await res.json();
      console.log(`Status ${res.status} (${Date.now() - start}ms):`, JSON.stringify(data).slice(0, 300));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error on ${model}:`, message);
    }
  }
}

testGemini();
