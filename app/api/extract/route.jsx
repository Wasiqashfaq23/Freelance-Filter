

function extractJSON(text) {
  // Try to find and parse JSON from the text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('Failed to parse extracted JSON:', e);
    }
  }
  
  // If no valid JSON found, throw error
  throw new Error('No valid JSON found in response');
}

export async function POST(request) {
  try {
    const { text, useMockMode } = await request.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return Response.json(
        { error: 'Invalid request body. Required: text (string)' },
        { status: 400 }
      );
    }

    // Mock mode for testing without API keys
    if (useMockMode) {
      const mockResult = {
        budget: Math.floor(Math.random() * 5000) + 500,
        skills: ['React', 'Node.js'],
        deadline: Math.floor(Math.random() * 30) + 5,
        clientRating: Math.random() * 2 + 3,
      };
      return Response.json(mockResult);
    }

    const groqKey = process.env.GROQ_API_KEY;
    const googleKey = process.env.GOOGLE_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    // Auto-fallback to mock mode if no API keys configured
    if (!groqKey && !googleKey && !anthropicKey) {
      console.log('No API keys found - using mock mode');
      const mockResult = {
        budget: Math.floor(Math.random() * 5000) + 500,
        skills: ['React', 'Node.js', 'Next.js'],
        deadline: Math.floor(Math.random() * 30) + 5,
        clientRating: Math.round((Math.random() * 2 + 3) * 10) / 10,
      };
      return Response.json(mockResult);
    }

    const systemPrompt = `Extract the following fields from this freelance project description and return ONLY a valid JSON object (no markdown, no code blocks, no explanations, no extra text):
{ "budget": number (USD, 0 if not found), "skills": string[] (technologies mentioned), "deadline": number (days, 0 if not found), "clientRating": number (0-5, 0 if not found) }

IMPORTANT: Return ONLY the JSON object. No other text.`;

    if (groqKey) {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
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
          temperature: 0.1,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Groq API error:', error);
        return Response.json(
          { error: 'Failed to extract data from text (Groq error)' },
          { status: response.status }
        );
      }

      const data = await response.json();
      const extractedText = data.choices[0].message.content.trim();

      try {
        const extracted = extractJSON(extractedText);
        const result = {
          budget: typeof extracted.budget === 'number' ? extracted.budget : 0,
          skills: Array.isArray(extracted.skills) ? extracted.skills : [],
          deadline: typeof extracted.deadline === 'number' ? extracted.deadline : 0,
          clientRating: typeof extracted.clientRating === 'number' ? extracted.clientRating : 0,
        };
        return Response.json(result);
      } catch (e) {
        console.error('JSON extraction failed:', e, 'Response:', extractedText);
        return Response.json(
          { error: 'Failed to parse extracted data. Response was not valid JSON.' },
          { status: 400 }
        );
      }
    }

    if (googleKey) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${googleKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${systemPrompt}\n\nProject description: ${text}`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 500,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Google Gemini API error:', error);
        return Response.json(
          { error: 'Failed to extract data from text (Google error)' },
          { status: response.status }
        );
      }

      const data = await response.json();
      const extractedText = data.candidates[0].content.parts[0].text.trim();

      try {
        const extracted = extractJSON(extractedText);
        const result = {
          budget: typeof extracted.budget === 'number' ? extracted.budget : 0,
          skills: Array.isArray(extracted.skills) ? extracted.skills : [],
          deadline: typeof extracted.deadline === 'number' ? extracted.deadline : 0,
          clientRating: typeof extracted.clientRating === 'number' ? extracted.clientRating : 0,
        };
        return Response.json(result);
      } catch (e) {
        console.error('JSON extraction failed:', e, 'Response:', extractedText);
        return Response.json(
          { error: 'Failed to parse extracted data. Response was not valid JSON.' },
          { status: 400 }
        );
      }
    }

    if (anthropicKey) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: text,
            },
          ],
          system: systemPrompt,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Claude API error:', error);
        return Response.json(
          { error: 'Failed to extract data from text (Claude error)' },
          { status: response.status }
        );
      }

      const data = await response.json();
      const extractedText = data.content[0].text.trim();

      try {
        const extracted = extractJSON(extractedText);
        const result = {
          budget: typeof extracted.budget === 'number' ? extracted.budget : 0,
          skills: Array.isArray(extracted.skills) ? extracted.skills : [],
          deadline: typeof extracted.deadline === 'number' ? extracted.deadline : 0,
          clientRating: typeof extracted.clientRating === 'number' ? extracted.clientRating : 0,
        };
        return Response.json(result);
      } catch (e) {
        console.error('JSON extraction failed:', e, 'Response:', extractedText);
        return Response.json(
          { error: 'Failed to parse extracted data. Response was not valid JSON.' },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    console.error('Extraction error:', error);
    return Response.json(
      { error: 'Failed to extract data: ' + error.message },
      { status: 500 }
    );
  }
}
