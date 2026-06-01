

export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return Response.json(
        { error: 'Invalid request. Required: text' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a project scope analyst. Find vague or ambiguous phrases in the project description that need clarification.

Return ONLY valid JSON with no markdown, no code blocks, no explanation:
[
  {
    "text": "string (the vague phrase found in the description)",
    "suggestion": "string (a clarification question to ask the client)"
  }
]

Return an empty array if no ambiguities found. Return maximum 5 items.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
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
        temperature: 0.3,
        max_tokens: 400,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Groq API error:', error);
      return Response.json(
        { error: 'Failed to detect ambiguities' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    let result;
    try {
      result = JSON.parse(content);
      if (!Array.isArray(result)) {
        
        result = result.ambiguities || [];
      }
    } catch (e) {
      result = [];
    }

    return Response.json(result);
  } catch (error) {
    console.error('Ambiguity detection error:', error);
    return Response.json(
      { error: 'Failed to detect ambiguities: ' + error.message },
      { status: 500 }
    );
  }
}
