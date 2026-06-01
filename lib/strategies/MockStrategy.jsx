

const AIStrategy = require('./AIStrategy');

class MockStrategy extends AIStrategy {
  
  async extract(text) {
    
    await new Promise(resolve => setTimeout(resolve, 300));

    const lowerText = text.toLowerCase();

    const skillKeywords = {
      'react': 'React',
      'vue': 'Vue',
      'angular': 'Angular',
      'node': 'Node.js',
      'python': 'Python',
      'java': 'Java',
      'php': 'PHP',
      'django': 'Django',
      'flask': 'Flask',
      'mongodb': 'MongoDB',
      'postgresql': 'PostgreSQL',
      'mysql': 'MySQL',
      'aws': 'AWS',
      'docker': 'Docker',
    };

    const skills = [];
    for (const [keyword, skillName] of Object.entries(skillKeywords)) {
      if (lowerText.includes(keyword)) {
        skills.push(skillName);
      }
    }

    const budgetMatch = text.match(/\$([0-9,]+)/);
    const budget = budgetMatch ? parseInt(budgetMatch[1].replace(',', '')) : 1500;

    const daysMatch = text.match(/(\d+)\s*days?/i);
    const weeksMatch = text.match(/(\d+)\s*weeks?/i);
    let deadline = 7;
    if (daysMatch) deadline = parseInt(daysMatch[1]);
    if (weeksMatch) deadline = parseInt(weeksMatch[1]) * 7;

    const ratingMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:star|rating|\/5)/i);
    const clientRating = ratingMatch ? parseFloat(ratingMatch[1]) : 4.0;

    return {
      budget,
      skills: skills.length > 0 ? skills : ['React', 'Node.js'],
      deadline,
      clientRating,
    };
  }

  getName() {
    return 'Demo Mode (Mock)';
  }
}

module.exports = MockStrategy;
