

export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return Response.json(
        { error: 'Invalid request body. Required: text' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: 'GROQ_API_KEY not configured' },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a red flag detector for freelance projects. Analyze the project description and identify potential red flags.

Return ONLY a JSON array of red flag objects, no markdown, no code blocks, no explanation.
Format: [{"message": "string", "severity": "warning" or "critical"}, ...]

Check for:
- Unrealistic deadlines (less than 1-2 days for complex work)
- Vague or undefined scope (no clear deliverables)
- Payment red flags (payment after completion, no upfront, no escrow mention)
- Lowball budget signals (extremely low pay for the work described)
- Scam patterns (requests to work off-platform, urgency tactics, too good to be true)
- No budget mentioned
- No timeline mentioned
- Pressuring language`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `Analyze this project description for red flags:\n\n${text}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status, response.statusText);
      return Response.json(
        { flags: [] }, 
        { status: 200 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';

    let flags = [];
    try {
      const jsonStr = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      flags = JSON.parse(jsonStr);

      if (!Array.isArray(flags)) {
        flags = [];
      }
      flags = flags.filter(
        f => f.message && (f.severity === 'warning' || f.severity === 'critical')
      );
    } catch (err) {
      console.error('Error parsing Groq response:', err, 'Content:', content);
      flags = [];
    }

    return Response.json({ flags });
  } catch (error) {
    console.error('Red flags detection error:', error);
    return Response.json(
      { flags: [] },
      { status: 200 }
    );
  }
}
