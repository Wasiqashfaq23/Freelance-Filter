

const BaseFilter = require('./BaseFilter');

class ClientReputationFilter extends BaseFilter {
  constructor(minRating = 3.5) {
    super();
    this.MIN_CLIENT_RATING = minRating;
  }

  evaluate(request) {
    
    const score = (request.clientRating / 5.0) * 25;
    const passed = request.clientRating >= this.MIN_CLIENT_RATING;

    if (!passed) {
      return {
        passed: false,
        score,
        reason: `Client rating too low (${request.clientRating} < ${this.MIN_CLIENT_RATING})`,
      };
    }

    if (this.nextFilter) {
      return this.nextFilter.evaluate(request);
    }

    return { passed: true, score, reason: 'Client rating acceptable' };
  }
}

module.exports = ClientReputationFilter;
