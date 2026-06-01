

const BaseFilter = require('./BaseFilter');

class BudgetFilter extends BaseFilter {
  constructor(minBudget = 300) {
    super();
    this.MIN_BUDGET = minBudget;
  }

  evaluate(request) {
    
    const ratio = request.budget / this.MIN_BUDGET;
    const score = Math.min(ratio * 25, 25);
    const passed = request.budget >= this.MIN_BUDGET;

    if (!passed) {
      return {
        passed: false,
        score,
        reason: `Budget too low ($${request.budget} < $${this.MIN_BUDGET})`,
      };
    }

    if (this.nextFilter) {
      return this.nextFilter.evaluate(request);
    }

    return { passed: true, score, reason: 'Budget acceptable' };
  }
}

module.exports = BudgetFilter;
