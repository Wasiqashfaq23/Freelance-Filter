

export async function POST(request) {
  try {
    const { text, skills, budget } = await request.json();

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

    const systemPrompt = `You are an expert project scope analyzer. Analyze the project description and estimate realistic hours, hourly rate, and determine if the budget is fair.

Return ONLY valid JSON with no markdown, no code blocks, no explanation:
{
  "estimatedHours": number (realistic hours to complete, round to nearest 5),
  "hourlyRate": number (suggested USD per hour based on skills required, round to nearest 5),
  "totalFairValue": number (estimatedHours * hourlyRate),
  "verdict": "Underpaid" | "Fair" | "Overpaid" (comparing fair value to submitted budget),
  "breakdown": "string (2-3 sentences explaining the estimate)",
  "marketRates": {
    "junior": { "min": number, "max": number },
    "midlevel": { "min": number, "max": number },
    "senior": { "min": number, "max": number }
  }
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
            content: `Project Description: ${text}\n\nSkills Required: ${skills?.join(', ') || 'N/A'}\nSubmitted Budget: $${budget || 0}`,
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
        { error: 'Failed to analyze scope' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    const result = JSON.parse(content);

    if (!result.marketRates) {
      const skillLevel = skills?.length > 0 ? skills.length > 3 ? 'senior' : 'midlevel' : 'junior';
      const baseRate = result.hourlyRate || 50;
      
      result.marketRates = {
        junior: { min: Math.max(20, baseRate - 30), max: Math.max(40, baseRate - 10) },
        midlevel: { min: baseRate - 10, max: baseRate + 20 },
        senior: { min: baseRate + 20, max: Math.min(200, baseRate + 50) },
      };
    }
    
    return Response.json(result);
  } catch (error) {
    console.error('Scope analysis error:', error);
    return Response.json(
      { error: 'Failed to analyze scope: ' + error.message },
      { status: 500 }
    );
  }
}
