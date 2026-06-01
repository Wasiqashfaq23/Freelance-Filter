

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

    const systemPrompt = `You are an expert in assessing professional communication. Analyze how the client communicated this project request.

Return ONLY valid JSON with no markdown, no code blocks, no explanation:
{
  "score": number (0-100, professionalism and clarity of client communication),
  "tone": "Professional" | "Casual" | "Demanding" | "Vague" | "Aggressive",
  "communicationTips": ["string", "string", "string"] (2-3 tips for how to communicate with this client based on their style)
}`;

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
        max_tokens: 300,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Groq API error:', error);
      return Response.json(
        { error: 'Failed to analyze client communication' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    const result = JSON.parse(content);
    return Response.json(result);
  } catch (error) {
    console.error('Client score error:', error);
    return Response.json(
      { error: 'Failed to analyze client: ' + error.message },
      { status: 500 }
    );
  }
}
