

class AIStrategy {
  
  async extract(text) {
    throw new Error('extract() must be implemented by subclass');
  }

  getName() {
    throw new Error('getName() must be implemented by subclass');
  }
}

module.exports = AIStrategy;
