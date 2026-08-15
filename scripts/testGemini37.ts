import { config } from '@codeguard/config';

async function testGemini37(): Promise<void> {
  console.log('Testing gemini-3.7-flash...');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${config.GEMINI_API_KEY}`;
  
  const start = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: 'Provide a brief code review in JSON format for: const x = eval(userInput);' }]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    })
  });

  const data: unknown = await res.json();
  console.log(`Response in ${Date.now() - start}ms (HTTP ${res.status}):`);
  console.log(JSON.stringify(data, null, 2));
}

testGemini37();
