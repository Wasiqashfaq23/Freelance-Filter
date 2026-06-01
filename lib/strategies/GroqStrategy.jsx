

const AIStrategy = require('./AIStrategy');

class GroqStrategy extends AIStrategy {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
  }

  async extract(text) {
    if (!this.apiKey) {
      throw new Error('Groq API key not configured');
    }

    const systemPrompt = `Extract the following fields from this freelance project description and return ONLY a valid JSON object (no markdown, no code blocks):
{ "budget": number (USD, 0 if not found), "skills": string[] (technologies mentioned), "deadline": number (days, 0 if not found), "clientRating": number (0-5, 0 if not found) }`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0].message.content.trim();

    let jsonStr = extractedText;
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.split('```json')[1].split('```')[0];
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.split('```')[1].split('```')[0];
    }
    jsonStr = jsonStr.trim();

    const extracted = JSON.parse(jsonStr);

    return {
      budget: typeof extracted.budget === 'number' ? extracted.budget : 0,
      skills: Array.isArray(extracted.skills) ? extracted.skills : [],
      deadline: typeof extracted.deadline === 'number' ? extracted.deadline : 0,
      clientRating: typeof extracted.clientRating === 'number' ? extracted.clientRating : 0,
    };
  }

  getName() {
    return 'Groq';
  }
}

module.exports = GroqStrategy;
