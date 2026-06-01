

const BaseFilter = require('./BaseFilter');

class SkillFilter extends BaseFilter {
  constructor(freelancerSkills = ['React', 'Node.js', 'Next.js', 'MongoDB', 'JavaScript']) {
    super();
    
    this.freelancerSkills = freelancerSkills;
  }

  evaluate(request) {
    const requiredSkills = request.skills || [];
    const matchedSkills = requiredSkills.filter(
      skill => this.freelancerSkills.includes(skill)
    );
    const missingSkills = requiredSkills.filter(
      skill => !this.freelancerSkills.includes(skill)
    );

    const matchPercentage = requiredSkills.length > 0 ? matchedSkills.length / requiredSkills.length : 1;
    const score = matchPercentage * 25;
    const passed = missingSkills.length === 0;

    if (!passed) {
      return {
        passed: false,
        score,
        reason: `Skills not matched: ${missingSkills.join(', ')}`,
      };
    }

    if (this.nextFilter) {
      return this.nextFilter.evaluate(request);
    }

    return { passed: true, score, reason: 'Skills matched' };
  }
}

module.exports = SkillFilter;
