

class StatsObserver {
  constructor() {
    this.storageKey = 'freelanceFilter_stats';
  }

  onEvaluationComplete(data) {
    try {
      const stats = this.getStats();
      
      stats.totalEvaluations = (stats.totalEvaluations || 0) + 1;
      stats.acceptedCount = (stats.acceptedCount || 0) + (data.decision === 'ACCEPTED' ? 1 : 0);
      stats.averageScore = this.calculateAverageScore(stats.scores || [], data.score);

      stats.scores = [...(stats.scores || []), data.score].slice(-100);
      
      stats.lastUpdated = new Date().toISOString();
      
      localStorage.setItem(this.storageKey, JSON.stringify(stats));
    } catch (error) {
      console.error('StatsObserver error:', error);
    }
  }

  calculateAverageScore(previousScores, newScore) {
    const allScores = [...previousScores, newScore];
    const sum = allScores.reduce((acc, score) => acc + score, 0);
    return Math.round((sum / allScores.length) * 10) / 10;
  }

  getStats() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {
        totalEvaluations: 0,
        acceptedCount: 0,
        averageScore: 0,
        scores: [],
      };
    } catch (error) {
      console.error('Error reading stats:', error);
      return {
        totalEvaluations: 0,
        acceptedCount: 0,
        averageScore: 0,
        scores: [],
      };
    }
  }

  getAcceptanceRate() {
    const stats = this.getStats();
    if (stats.totalEvaluations === 0) return 0;
    return Math.round((stats.acceptedCount / stats.totalEvaluations) * 100);
  }

  resetStats() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Error resetting stats:', error);
    }
  }
}

module.exports = StatsObserver;
