

export async function POST(request) {
  try {
    const body = await request.json();
    const { budget, deadline, skills, clientRating, rejectionReason } = body;

    if (!rejectionReason) {
      return Response.json(
        { error: 'Invalid request body. Required: rejectionReason' },
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

    const systemPrompt = `You are a professional freelance negotiator. Generate a short, courteous counter offer message (2-3 sentences max) that a freelancer can send to a client when declining a project or requesting better terms.

The message should:
- Be professional and polite
- Explain the issue briefly without being judgmental
- Suggest how the client can improve (e.g., increase budget, extend deadline)
- Leave the door open for future collaboration

Return ONLY the counter offer message text, no markdown, no code blocks, no quotes.`;

    const projectDetails = `
Project Details:
- Budget: $${budget}
- Deadline: ${deadline} days
- Skills Required: ${skills?.join(', ') || 'Not specified'}
- Client Rating: ${clientRating} stars
- Rejection Reason: ${rejectionReason}`;

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
            content: `Generate a counter offer message for this project:${projectDetails}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status, response.statusText);
      return Response.json(
        { message: 'Unable to generate counter offer. Please try again.' },
        { status: 200 }
      );
    }

    const data = await response.json();
    let message = data.choices?.[0]?.message?.content || 'Unable to generate counter offer.';

    message = message
      .replace(/```.*?\n?/g, '')
      .replace(/^["']|["']$/g, '')
      .trim();

    return Response.json({ message });
  } catch (error) {
    console.error('Counter offer generation error:', error);
    return Response.json(
      { message: 'Unable to generate counter offer. Please try again.' },
      { status: 200 }
    );
  }
}
