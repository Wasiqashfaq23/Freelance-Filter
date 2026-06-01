

import { runChain } from '@/lib/chain';

export async function POST(request) {
  try {
    const body = await request.json();

    if (
      typeof body.budget !== 'number' ||
      !Array.isArray(body.skills) ||
      typeof body.deadline !== 'number' ||
      typeof body.clientRating !== 'number'
    ) {
      return Response.json(
        { error: 'Invalid request body. Required: budget, skills, deadline, clientRating' },
        { status: 400 }
      );
    }

    const config = {
      freelancerSkills: body.freelancerSkills,
      thresholds: body.thresholds,
    };

    const evaluationRequest = {
      budget: body.budget,
      skills: body.skills,
      deadline: body.deadline,
      clientRating: body.clientRating,
    };

    const result =await runChain(evaluationRequest, config);

    return Response.json(result);
  } catch (error) {
    console.error('Evaluation error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
