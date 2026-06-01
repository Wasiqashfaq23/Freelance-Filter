

const RequirementValidationFilter = require('./filters/RequirementValidationFilter');
const BudgetFilter = require('./filters/BudgetFilter');
const SkillFilter = require('./filters/SkillFilter');
const DeadlineFilter = require('./filters/DeadlineFilter');
const ClientReputationFilter = require('./filters/ClientReputationFilter');

function buildChain(config = {}) {
  const {
    freelancerSkills = ['React', 'Node.js', 'Next.js', 'MongoDB', 'JavaScript'],
    thresholds = { minBudget: 300, minDeadline: 5, minRating: 3.5 },
  } = config;

  const requirementValidationFilter = new RequirementValidationFilter();
  const budgetFilter = new BudgetFilter(thresholds.minBudget);
  const skillFilter = new SkillFilter(freelancerSkills);
  const deadlineFilter = new DeadlineFilter(thresholds.minDeadline);
  const clientReputationFilter = new ClientReputationFilter(thresholds.minRating);

  requirementValidationFilter
    .setNext(budgetFilter)
    .setNext(skillFilter)
    .setNext(deadlineFilter)
    .setNext(clientReputationFilter);

  return {
    firstFilter: requirementValidationFilter,
    filters: [requirementValidationFilter, budgetFilter, skillFilter, deadlineFilter, clientReputationFilter],
  };
}

function runChain(request, config = {}) {
  const { firstFilter, filters } = buildChain(config);

  const steps = [];
  let totalScore = 0;
  let confidenceScore = 0;
  let currentRequest = { ...request };
  let finalDecision = 'ACCEPTED';
  let finalReason = '';

  for (const filter of filters) {
    const filterName = filter.constructor.name;
    const result = filter.evaluate(currentRequest);

    const score = result.score || 0;
    totalScore += score;

    if (result.passed) {
      steps.push({
        filter: filterName,
        status: 'passed',
        score: Math.round(score),
        reason: result.reason || '',
      });
    } else {
      steps.push({
        filter: filterName,
        status: 'rejected',
        score: Math.round(score),
        reason: result.reason,
      });
      
      if (finalDecision === 'ACCEPTED') {
        finalDecision = 'REJECTED';
        finalReason = result.reason;
      }
    }
  }

  confidenceScore = Math.round(totalScore);

  if (confidenceScore < 60) {
    finalDecision = 'REJECTED';
    if (!finalReason) {
      finalReason = `Confidence score too low (${confidenceScore}/100)`;
    }
  }

  return {
    steps,
    decision: finalDecision,
    reason: finalReason,
    score: confidenceScore,
  };
}

module.exports = { runChain, buildChain };
