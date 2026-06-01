

const BaseFilter = require('./BaseFilter');

class DeadlineFilter extends BaseFilter {
  constructor(minDeadline = 5) {
    super();
    this.MIN_DEADLINE_DAYS = minDeadline;
  }

  evaluate(request) {
    
    const ratio = request.deadline / this.MIN_DEADLINE_DAYS;
    const score = Math.min(ratio * 25, 25);
    const passed = request.deadline >= this.MIN_DEADLINE_DAYS;

    if (!passed) {
      return {
        passed: false,
        score,
        reason: `Deadline too tight (${request.deadline} < ${this.MIN_DEADLINE_DAYS} days)`,
      };
    }

    if (this.nextFilter) {
      return this.nextFilter.evaluate(request);
    }

    return { passed: true, score, reason: 'Deadline acceptable' };
  }
}

module.exports = DeadlineFilter;
