

class HistoryObserver {
  constructor() {
    this.storageKey = 'freelanceFilter_history';
  }

  onEvaluationComplete(data) {
    try {
      const history = this.getHistory();
      
      const entry = {
        timestamp: new Date().toISOString(),
        projectSnippet: data.projectText?.substring(0, 60) || 'Manual Entry',
        decision: data.decision,
        score: data.score,
        reason: data.reason || '',
      };
      
      history.push(entry);
      localStorage.setItem(this.storageKey, JSON.stringify(history));
    } catch (error) {
      console.error('HistoryObserver error:', error);
    }
  }

  getHistory() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading history:', error);
      return [];
    }
  }

  clearHistory() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }
}

module.exports = HistoryObserver;
