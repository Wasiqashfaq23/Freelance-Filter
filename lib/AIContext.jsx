

const GroqStrategy = require('./strategies/GroqStrategy');
const MockStrategy = require('./strategies/MockStrategy');

class AIContext {
  constructor() {
    this.strategy = null;
    this.useMockMode = false;
    this.initializeStrategy();
  }

  initializeStrategy() {
    const apiKey = process.env.GROQ_API_KEY;
    const mockMode = process.env.AI_MOCK_MODE === 'true';

    if (mockMode || !apiKey) {
      this.strategy = new MockStrategy();
      this.useMockMode = true;
    } else {
      this.strategy = new GroqStrategy(apiKey);
      this.useMockMode = false;
    }
  }

  setStrategy(strategy) {
    this.strategy = strategy;
    this.useMockMode = strategy.getName() === 'Demo Mode (Mock)';
  }

  async extract(text) {
    if (!this.strategy) {
      this.initializeStrategy();
    }
    return this.strategy.extract(text);
  }

  getCurrentStrategy() {
    return this.strategy?.getName() || 'Unknown';
  }

  setMockMode(useMock) {
    if (useMock) {
      this.strategy = new MockStrategy();
      this.useMockMode = true;
    } else {
      const apiKey = process.env.GROQ_API_KEY;
      if (apiKey) {
        this.strategy = new GroqStrategy(apiKey);
        this.useMockMode = false;
      } else {
        console.warn('Groq API key not available, staying in mock mode');
      }
    }
  }
}

const aiContext = new AIContext();
module.exports = aiContext;
