

export async function POST(request) {
  try {
    const { text, skills, deadline } = await request.json();

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

    const systemPrompt = `You are a project manager. Create a realistic project roadmap with milestones.

Return ONLY valid JSON with no markdown, no code blocks, no explanation:
[
  {
    "title": "string (milestone title)",
    "description": "string (what gets done)",
    "durationDays": number (how many days for this milestone),
    "percentage": number (payment percentage for this milestone, must be integer)
  }
]

Create 3-5 milestones. The sum of all percentages MUST equal 100. Durations must fit within the deadline.`;

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
            content: `Project: ${text}\n\nSkills: ${skills?.join(', ') || 'N/A'}\nDeadline: ${deadline || 0} days`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Groq API error:', error);
      return Response.json(
        { error: 'Failed to generate milestones' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    let result;
    try {
      result = JSON.parse(content);
      if (!Array.isArray(result)) {
        result = result.milestones || [];
      }
    } catch (e) {
      result = [];
    }

    return Response.json(result);
  } catch (error) {
    console.error('Milestones error:', error);
    return Response.json(
      { error: 'Failed to generate milestones: ' + error.message },
      { status: 500 }
    );
  }
}
