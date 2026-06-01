

export async function POST(request) {
  try {
    const body = await request.json();
    const { budget, deadline, skills, clientRating, projectDescription } = body;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: 'GROQ_API_KEY not configured' },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a professional freelancer composing a compelling bid response. Generate a three-paragraph bid message that:

Paragraph 1: Introduce yourself briefly and show understanding of the project
Paragraph 2: Explain your relevant experience and why you're a great fit
Paragraph 3: Close with your proposed timeline, availability, and next steps

Keep it professional, concise, and personable. Be confident but humble.

Return ONLY the bid response message (3 paragraphs), no markdown, no code blocks, no quotes.`;

    const projectDetails = `
Project Details:
- Budget: $${budget}
- Deadline: ${deadline} days
- Skills Required: ${skills?.join(', ') || 'Not specified'}
- Client Rating: ${clientRating} stars
- Description: ${projectDescription || 'Not provided'}`;

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
            content: `Write a professional bid response for this project:${projectDetails}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status, response.statusText);
      return Response.json(
        { message: 'Unable to generate bid response. Please try again.' },
        { status: 200 }
      );
    }

    const data = await response.json();
    let message = data.choices?.[0]?.message?.content || 'Unable to generate bid response.';

    message = message
      .replace(/```.*?\n?/g, '')
      .replace(/^["']|["']$/g, '')
      .trim();

    return Response.json({ message });
  } catch (error) {
    console.error('Bid response generation error:', error);
    return Response.json(
      { message: 'Unable to generate bid response. Please try again.' },
      { status: 200 }
    );
  }
}
