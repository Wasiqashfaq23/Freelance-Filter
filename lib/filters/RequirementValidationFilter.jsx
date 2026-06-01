class RequirementValidationFilter {
  constructor() {
    this.name = 'RequirementValidationFilter';
    this.nextFilter = null;
  }

  setNext(filter) {
    this.nextFilter = filter;
    return filter;
  }

  evaluate(request) {
    // Check if skills array is provided and has valid items
    if (!request.skills || !Array.isArray(request.skills) || request.skills.length === 0) {
      return {
        passed: false,
        score: 0,
        reason: 'No specific skills/requirements provided. Please clarify what technologies are needed.',
      };
    }

    // Check if skills are valid (not empty strings, not duplicates)
    const validSkills = request.skills
      .filter(skill => skill && typeof skill === 'string' && skill.trim().length > 0)
      .map(skill => skill.trim());

    if (validSkills.length === 0) {
      return {
        passed: false,
        score: 0,
        reason: 'Skills provided are empty or invalid. Please provide specific technology requirements.',
      };
    }

    // Check if budget is provided
    if (typeof request.budget !== 'number' || request.budget <= 0) {
      return {
        passed: false,
        score: 0,
        reason: 'No valid budget provided. Project budget must be a positive number.',
      };
    }

    // Check if deadline is provided
    if (typeof request.deadline !== 'number' || request.deadline <= 0) {
      return {
        passed: false,
        score: 0,
        reason: 'No valid deadline provided. Deadline must be specified in days.',
      };
    }

    // Check if client rating is provided
    if (typeof request.clientRating !== 'number' || request.clientRating < 0 || request.clientRating > 5) {
      return {
        passed: false,
        score: 0,
        reason: 'Invalid client rating. Must be between 0 and 5 stars.',
      };
    }

    // All validations passed
    return {
      passed: true,
      score: 25, // Full marks for valid requirements
      reason: 'All required project details provided and valid',
    };
  }
}

module.exports = RequirementValidationFilter;
