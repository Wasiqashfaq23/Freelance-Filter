

class BaseFilter {
  constructor() {
    this.nextFilter = null;
  }

  setNext(filter) {
    this.nextFilter = filter;
    return filter;
  }

  evaluate(request) {
    
    if (this.nextFilter) {
      return this.nextFilter.evaluate(request);
    }
    return { passed: true, reason: '' };
  }
}

module.exports = BaseFilter;
