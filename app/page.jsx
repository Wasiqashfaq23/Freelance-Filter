'use client';

import { useState, useEffect } from 'react';

class EventEmitter {
  constructor() {
    this.events = {};
  }
  on(eventName, callback) {
    if (!this.events[eventName]) this.events[eventName] = [];
    this.events[eventName].push(callback);
  }
  emit(eventName, data) {
    if (!this.events[eventName]) return;
    this.events[eventName].forEach(cb => {
      try {
        cb(data);
      } catch (error) {
        console.error(`Error in event listener for ${eventName}:`, error);
      }
    });
  }
}

class HistoryObserver {
  onEvaluationComplete(data) {
    try {
      const history = JSON.parse(localStorage.getItem('freelanceFilter_history') || '[]');
      history.push({
        timestamp: new Date().toISOString(),
        projectSnippet: data.projectText?.substring(0, 60) || 'Evaluation',
        decision: data.decision,
        score: data.score,
        reason: data.reason || '',
      });
      localStorage.setItem('freelanceFilter_history', JSON.stringify(history));
    } catch (error) {
      console.error('HistoryObserver error:', error);
    }
  }
}

class StatsObserver {
  onEvaluationComplete(data) {
    try {
      const stats = JSON.parse(localStorage.getItem('freelanceFilter_stats') || '{"totalEvaluations":0,"acceptedCount":0,"averageScore":0,"scores":[]}');
      stats.totalEvaluations = (stats.totalEvaluations || 0) + 1;
      stats.acceptedCount = (stats.acceptedCount || 0) + (data.decision === 'ACCEPTED' ? 1 : 0);
      stats.scores = [...(stats.scores || []), data.score].slice(-100);
      const sum = stats.scores.reduce((a, b) => a + b, 0);
      stats.averageScore = Math.round((sum / stats.scores.length) * 10) / 10;
      stats.lastUpdated = new Date().toISOString();
      localStorage.setItem('freelanceFilter_stats', JSON.stringify(stats));
    } catch (error) {
      console.error('StatsObserver error:', error);
    }
  }
}

const DEFAULT_FREELANCER_SKILLS = ['React', 'Node.js', 'Next.js', 'MongoDB', 'JavaScript'];
const DEFAULT_THRESHOLDS = {
  minBudget: 300,
  minDeadline: 5,
  minRating: 3.5,
};

export default function Home() {
  const [observers] = useState(() => {
    const emitter = new EventEmitter();
    const historyObserver = new HistoryObserver();
    const statsObserver = new StatsObserver();
    emitter.on('evaluation:complete', (data) => {
      historyObserver.onEvaluationComplete(data);
      statsObserver.onEvaluationComplete(data);
    });
    return { emitter, historyObserver, statsObserver };
  });

  const [inputTab, setInputTab] = useState('smart-paste');
  const [smartPasteText, setSmartPasteText] = useState('');
  const [manualData, setManualData] = useState({ budget: '', skills: '', deadline: '', clientRating: '' });
  const [extractionLoading, setExtractionLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [useMockMode, setUseMockMode] = useState(false);
  const [freelancerSkills, setFreelancerSkills] = useState(DEFAULT_FREELANCER_SKILLS);
  const [newSkill, setNewSkill] = useState('');
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [hasEvaluated, setHasEvaluated] = useState(false);

  const [scopeAnalysis, setScopeAnalysis] = useState(null);
  const [ambiguities, setAmbiguities] = useState([]);
  const [clientScore, setClientScore] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loadingStates, setLoadingStates] = useState({
    scope: false,
    ambiguity: false,
    client: false,
    milestones: false,
  });

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ totalEvaluations: 0, acceptedCount: 0, averageScore: 0 });

  useEffect(() => {
    const saved = localStorage.getItem('freelanceFilter');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.skills) setFreelancerSkills(parsed.skills);
      if (parsed.thresholds) setThresholds(parsed.thresholds);
    }

    const savedMockMode = localStorage.getItem('freelanceFilter_mockMode');
    if (savedMockMode) setUseMockMode(JSON.parse(savedMockMode));

    setTimeout(() => {
      const historyData = JSON.parse(localStorage.getItem('freelanceFilter_history') || '[]');
      setHistory(historyData);
      const statsData = JSON.parse(localStorage.getItem('freelanceFilter_stats') || '{"totalEvaluations":0,"acceptedCount":0,"averageScore":0}');
      setStats(statsData);
    }, 100);
  }, []);

  const handleAddSkill = () => {
    if (newSkill.trim() && !freelancerSkills.includes(newSkill.trim())) {
      const updated = [...freelancerSkills, newSkill.trim()];
      setFreelancerSkills(updated);
      localStorage.setItem('freelanceFilter', JSON.stringify({ skills: updated, thresholds }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    const updated = freelancerSkills.filter(s => s !== skillToRemove);
    setFreelancerSkills(updated);
    localStorage.setItem('freelanceFilter', JSON.stringify({ skills: updated, thresholds }));
  };

  const handleThresholdChange = (key, value) => {
    const updated = { ...thresholds, [key]: parseFloat(value) || 0 };
    setThresholds(updated);
    localStorage.setItem('freelanceFilter', JSON.stringify({ skills: freelancerSkills, thresholds: updated }));
  };

  const handleExtractAndEvaluate = async () => {
    if (!smartPasteText.trim()) {
      alert('Please paste a project description');
      return;
    }

    setExtractionLoading(true);
    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: smartPasteText, useMockMode }),
      });

      if (!response.ok) {
        const errData = await response.json();
        console.error('Extract API error:', errData);
        throw new Error(errData.error || 'Extraction failed');
      }

      const extracted = await response.json();
      await evaluateProject({
        budget: extracted.budget,
        skills: extracted.skills,
        deadline: extracted.deadline,
        clientRating: extracted.clientRating,
      });
    } catch (error) {
      console.error('Extraction error:', error);
      alert('Failed to extract data. Please check and try again.');
    } finally {
      setExtractionLoading(false);
    }
  };

  const handleManualEvaluate = async () => {
    if (!manualData.budget || !manualData.skills || !manualData.deadline || !manualData.clientRating) {
      alert('Please fill in all fields');
      return;
    }
    await evaluateProject({
      budget: parseFloat(manualData.budget),
      skills: manualData.skills.split(',').map(s => s.trim()).filter(s => s),
      deadline: parseFloat(manualData.deadline),
      clientRating: parseFloat(manualData.clientRating),
    });
  };

  const evaluateProject = async (projectData) => {
    setLoading(true);
    setScopeAnalysis(null);
    setAmbiguities([]);
    setClientScore(null);
    setMilestones([]);

    try {
      const payload = {
        budget: projectData.budget,
        skills: projectData.skills,
        deadline: projectData.deadline,
        clientRating: projectData.clientRating,
        freelancerSkills,
        thresholds,
      };

      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setResult(data);
      setHasEvaluated(true);

      const projectText = inputTab === 'smart-paste' ? smartPasteText : manualData.skills;

      observers.emitter.emit('evaluation:complete', {
        projectText,
        decision: data.decision,
        score: data.score,
        reason: data.reason,
      });

      setLoadingStates(prev => ({ ...prev, scope: true }));
      try {
        const scopeRes = await fetch('/api/scope', {
          method: 'POST',
          body: JSON.stringify({
            text: projectText,
            skills: payload.skills,
            budget: payload.budget,
          }),
        });
        if (scopeRes.ok) {
          const scope = await scopeRes.json();
          setScopeAnalysis(scope);
        }
      } catch (err) {
        console.error('Scope error:', err);
      } finally {
        setLoadingStates(prev => ({ ...prev, scope: false }));
      }

      setLoadingStates(prev => ({ ...prev, ambiguity: true }));
      try {
        const ambigRes = await fetch('/api/ambiguity', {
          method: 'POST',
          body: JSON.stringify({ text: projectText }),
        });
        if (ambigRes.ok) {
          const ambig = await ambigRes.json();
          setAmbiguities(Array.isArray(ambig) ? ambig : []);
        }
      } catch (err) {
        console.error('Ambiguity error:', err);
      } finally {
        setLoadingStates(prev => ({ ...prev, ambiguity: false }));
      }

      setLoadingStates(prev => ({ ...prev, client: true }));
      try {
        const clientRes = await fetch('/api/clientscore', {
          method: 'POST',
          body: JSON.stringify({ text: projectText }),
        });
        if (clientRes.ok) {
          const client = await clientRes.json();
          setClientScore(client);
        }
      } catch (err) {
        console.error('Client score error:', err);
      } finally {
        setLoadingStates(prev => ({ ...prev, client: false }));
      }

      if (data.decision === 'ACCEPTED') {
        setLoadingStates(prev => ({ ...prev, milestones: true }));
        try {
          const milesRes = await fetch('/api/milestones', {
            method: 'POST',
            body: JSON.stringify({
              text: projectText,
              skills: payload.skills,
              deadline: payload.deadline,
            }),
          });
          if (milesRes.ok) {
            const miles = await milesRes.json();
            setMilestones(Array.isArray(miles) ? miles : []);
          }
        } catch (err) {
          console.error('Milestones error:', err);
        } finally {
          setLoadingStates(prev => ({ ...prev, milestones: false }));
        }
      }
    } catch (error) {
      console.error('Evaluation error:', error);
      setResult({
        steps: [],
        decision: 'ERROR',
        error: 'Failed to evaluate project. Please try again.',
      });
      setHasEvaluated(true);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSmartPasteText('');
    setManualData({ budget: '', skills: '', deadline: '', clientRating: '' });
    setResult(null);
    setHasEvaluated(false);
    setScopeAnalysis(null);
    setAmbiguities([]);
    setClientScore(null);
    setMilestones([]);
  };

  const handleClearHistory = () => {
    if (confirm('Clear all evaluation history?')) {
      localStorage.removeItem('freelanceFilter_history');
      localStorage.removeItem('freelanceFilter_stats');
      setHistory([]);
      setStats({ totalEvaluations: 0, acceptedCount: 0, averageScore: 0 });
    }
  };

  const acceptanceRate = stats.totalEvaluations === 0 ? 0 : Math.round((stats.acceptedCount / stats.totalEvaluations) * 100);

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Settings Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowSettings(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition shadow-soft"
          >
            <span className="text-lg">⚙️</span>
            Settings
          </button>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Sidebar - Input Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-soft sticky top-24">
              {/* Input Tabs */}
              <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                  onClick={() => setInputTab('smart-paste')}
                  className={`px-4 py-2 text-sm font-semibold transition-all ${inputTab === 'smart-paste'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Smart Paste
                </button>
                <button
                  onClick={() => setInputTab('manual')}
                  className={`px-4 py-2 text-sm font-semibold transition-all ${inputTab === 'manual'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Manual
                </button>
              </div>

              {inputTab === 'smart-paste' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Project Description</label>
                    <textarea
                      value={smartPasteText}
                      onChange={(e) => setSmartPasteText(e.target.value)}
                      placeholder="Paste the project details here..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 font-mono text-sm resize-none h-40"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleExtractAndEvaluate}
                      disabled={extractionLoading || loading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors shadow-soft"
                    >
                      {extractionLoading || loading ? 'Processing...' : 'Extract & Evaluate'}
                    </button>
                    <button
                      onClick={handleReset}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-lg transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">💰 Budget</label>
                    <input
                      type="number"
                      value={manualData.budget}
                      onChange={(e) => setManualData({ ...manualData, budget: e.target.value })}
                      placeholder="e.g., 2000"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                    <p className="text-xs text-gray-600 mt-1">In USD</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">🏷️ Required Skills</label>
                    <input
                      type="text"
                      value={manualData.skills}
                      onChange={(e) => setManualData({ ...manualData, skills: e.target.value })}
                      placeholder="e.g., React, Node.js"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                    <p className="text-xs text-gray-600 mt-1">Comma-separated</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">📅 Deadline (days)</label>
                    <input
                      type="number"
                      value={manualData.deadline}
                      onChange={(e) => setManualData({ ...manualData, deadline: e.target.value })}
                      placeholder="e.g., 14"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                    <p className="text-xs text-gray-600 mt-1">Number of days</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">⭐ Client Rating</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={manualData.clientRating}
                      onChange={(e) => setManualData({ ...manualData, clientRating: e.target.value })}
                      placeholder="e.g., 4.5"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                    <p className="text-xs text-gray-600 mt-1">0-5 stars</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleManualEvaluate}
                      disabled={loading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors shadow-soft"
                    >
                      {loading ? 'Evaluating...' : 'Evaluate'}
                    </button>
                    <button
                      onClick={handleReset}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-lg transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}

              {/* Freelancer Profile */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-sm font-bold uppercase text-gray-700 mb-4 tracking-wide">Your Profile</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {freelancerSkills.map(skill => (
                        <span key={skill} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-gray-600 text-xs font-semibold">Min Budget</p>
                      <p className="font-bold text-gray-900 text-sm mt-1">${thresholds.minBudget}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-gray-600 text-xs font-semibold">Min Days</p>
                      <p className="font-bold text-gray-900 text-sm mt-1">{thresholds.minDeadline}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-gray-600 text-xs font-semibold">Min Rating</p>
                      <p className="font-bold text-gray-900 text-sm mt-1">⭐ {thresholds.minRating}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="w-full mt-2 text-sm text-blue-600 hover:text-blue-700 font-semibold transition"
                  >
                    Edit Settings →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {!hasEvaluated ? (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-12 border border-blue-100 flex flex-col items-center justify-center text-center min-h-96">
                <div className="text-6xl mb-6">📊</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Get Started</h3>
                <p className="text-gray-600 max-w-sm">Use Smart Paste to auto-extract project details or fill in the Manual Input form to evaluate opportunities.</p>
              </div>
            ) : result?.error ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800">
                <p className="font-semibold mb-2">⚠️ Evaluation Error</p>
                <p className="text-sm">{result.error}</p>
              </div>
            ) : (
              <>
                {/* Pipeline */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-4">Evaluation Pipeline</p>
                  <div className="flex flex-col gap-3">
                    {result.steps &&
                      result.steps.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className={`flex-1 px-4 py-3 rounded-lg font-semibold text-center transition-all border ${step.status === 'passed'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                            {step.filter}
                          </div>
                          <div className="text-center min-w-16 bg-gray-50 p-2 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-600 font-semibold">Score</p>
                            <p className="font-bold text-gray-900 text-sm">{step.score || 0}/25</p>
                          </div>
                          {idx < (result.steps.length - 1) && <div className="text-gray-400 text-lg">↓</div>}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Main Score Card */}
                <div className={`bg-gradient-to-br rounded-2xl p-8 border-2 text-center shadow-soft ${result.decision === 'ACCEPTED'
                    ? 'from-green-50 to-emerald-50 border-green-200'
                    : 'from-red-50 to-rose-50 border-red-200'
                  }`}>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Confidence Score</p>
                  <p className="text-6xl font-black mb-3" style={{
                    color: result.score >= 80 ? '#059669' : result.score >= 60 ? '#d97706' : '#dc2626',
                  }}>
                    {result.score}
                  </p>
                  <p className="text-xl font-bold mb-4 text-gray-900">
                    {result.score >= 80 ? '💪 Strong Opportunity' : result.score >= 60 ? '👍 Good Fit' : result.score >= 40 ? '⚠️ Risky' : '❌ Skip This'}
                  </p>
                  <div className="flex gap-2 text-xs font-semibold flex-wrap justify-center">
                    {result.steps && result.steps.map((step, idx) => (
                      <div key={idx} className="bg-white bg-opacity-60 px-3 py-1 rounded-full border border-gray-200">
                        <p className="text-gray-700">{step.filter.replace('Filter', '')}</p>
                        <p className="text-gray-600">{step.score}/25</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Decision Card */}
                <div className={`bg-gradient-to-br rounded-2xl p-8 border-2 text-center shadow-soft ${result.decision === 'ACCEPTED'
                    ? 'from-green-50 to-emerald-50 border-green-200'
                    : 'from-red-50 to-rose-50 border-red-200'
                  }`}>
                  <p className="text-2xl mb-2">{result.decision === 'ACCEPTED' ? '✅' : '❌'}</p>
                  <p className="text-3xl font-black mb-3 text-gray-900">{result.decision}</p>
                  {result.reason && <p className="text-gray-700 text-sm leading-relaxed">{result.reason}</p>}
                </div>

                {/* Client Profile */}
                {clientScore && !loadingStates.client && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-4">Client Assessment</p>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-700 text-sm font-semibold">Communication Quality</span>
                          <span className="font-bold text-gray-900">{clientScore.score}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-blue-500 h-3 rounded-full transition-all"
                            style={{ width: `${clientScore.score}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${clientScore.tone === 'Professional' ? 'bg-green-50 text-green-700 border-green-200' :
                            clientScore.tone === 'Casual' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              clientScore.tone === 'Demanding' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                clientScore.tone === 'Vague' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                  'bg-red-50 text-red-700 border-red-200'
                          }`}>
                          {clientScore.tone}
                        </span>
                      </div>
                      {clientScore.communicationTips && clientScore.communicationTips.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-gray-900 mb-2">💡 Tips:</p>
                          <ul className="space-y-1">
                            {clientScore.communicationTips.map((tip, i) => (
                              <li key={i} className="text-xs text-gray-700">• {tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Scope Analysis */}
                {scopeAnalysis && !loadingStates.scope && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-4">Scope Analysis</p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 font-semibold mb-2">Estimated Hours</p>
                        <p className="text-2xl font-bold text-gray-900">{scopeAnalysis.estimatedHours}h</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 font-semibold mb-2">Hourly Rate</p>
                        <p className="text-2xl font-bold text-gray-900">${scopeAnalysis.hourlyRate}</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 col-span-2">
                        <p className="text-xs text-gray-600 font-semibold mb-2">Fair Total Value</p>
                        <p className="text-2xl font-bold text-blue-600">${scopeAnalysis.totalFairValue}</p>
                      </div>
                    </div>
                    {scopeAnalysis.verdict && (
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">{scopeAnalysis.verdict}</p>
                    )}
                  </div>
                )}

                {/* Ambiguities */}
                {ambiguities && ambiguities.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-4">Questions to Ask</p>
                    <div className="space-y-3">
                      {ambiguities.map((item, i) => (
                        <div key={i} className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                          <p className="text-sm text-amber-900 font-semibold mb-2">"{item.text}"</p>
                          <p className="text-sm text-amber-800">💭 {item.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Milestones */}
                {milestones && milestones.length > 0 && result.decision === 'ACCEPTED' && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-soft">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-6">Project Roadmap</p>
                    <div className="space-y-4">
                      {milestones.map((m, i) => (
                        <div key={i} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">{i + 1}</div>
                            {i < milestones.length - 1 && <div className="w-0.5 h-12 bg-indigo-200 mt-2"></div>}
                          </div>
                          <div className="flex-1 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <p className="font-semibold text-gray-900">{m.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{m.description}</p>
                            <div className="flex gap-2 mt-3">
                              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-semibold">{m.durationDays} days</span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold">{m.percentage}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* History Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-soft">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex justify-between items-center p-6 hover:bg-gray-50 transition rounded-2xl"
          >
            <h2 className="text-lg font-bold text-gray-900">📊 Evaluation History</h2>
            <span className="text-2xl text-gray-600">{showHistory ? '▼' : '▶'}</span>
          </button>

          {showHistory && (
            <div className="px-6 pb-6 border-t border-gray-200 space-y-4">
              {history.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-sm">No evaluations yet. Start by evaluating a project above.</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-200">
                      <p className="text-gray-600 text-xs font-bold mb-1 uppercase tracking-wide">Total</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalEvaluations}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
                      <p className="text-green-700 text-xs font-bold mb-1 uppercase tracking-wide">Accepted</p>
                      <p className="text-2xl font-bold text-green-700">{stats.acceptedCount}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-200">
                      <p className="text-blue-700 text-xs font-bold mb-1 uppercase tracking-wide">Rate</p>
                      <p className="text-2xl font-bold text-blue-700">{acceptanceRate}%</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-200">
                      <p className="text-purple-700 text-xs font-bold mb-1 uppercase tracking-wide">Avg Score</p>
                      <p className="text-2xl font-bold text-purple-700">{stats.averageScore}</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left px-4 py-3 text-gray-600 font-bold">Date</th>
                          <th className="text-left px-4 py-3 text-gray-600 font-bold">Project</th>
                          <th className="text-center px-4 py-3 text-gray-600 font-bold">Score</th>
                          <th className="text-center px-4 py-3 text-gray-600 font-bold">Decision</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((item, i) => (
                          <tr key={i} className="border-b border-gray-200 hover:bg-gray-50 transition">
                            <td className="px-4 py-3 text-gray-600 text-xs">{new Date(item.timestamp).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-gray-800 truncate text-sm">{item.projectSnippet}</td>
                            <td className="px-4 py-3 text-center font-bold text-gray-900">{item.score}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.decision === 'ACCEPTED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {item.decision}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={handleClearHistory}
                    className="w-full mt-4 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-bold transition border border-red-200"
                  >
                    Clear History
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-end z-50">
          <div className="bg-white w-full max-w-md rounded-t-2xl p-6 border-t border-gray-200 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-2xl text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <div className="mb-8 pb-8 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Freelancer Skills</h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                    placeholder="Add new skill..."
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-sm"
                  />
                  <button onClick={handleAddSkill} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {freelancerSkills.map(skill => (
                    <div key={skill} className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200">
                      {skill}
                      <button onClick={() => handleRemoveSkill(skill)} className="font-bold hover:text-blue-900">×</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Filter Thresholds</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Minimum Budget ($)</label>
                  <input
                    type="number"
                    value={thresholds.minBudget}
                    onChange={(e) => handleThresholdChange('minBudget', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Minimum Deadline (days)</label>
                  <input
                    type="number"
                    value={thresholds.minDeadline}
                    onChange={(e) => handleThresholdChange('minDeadline', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Minimum Client Rating (0-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={thresholds.minRating}
                    onChange={(e) => handleThresholdChange('minRating', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>
            </div>

            <div className="mb-8 pb-8 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">AI Provider</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useMockMode}
                  onChange={(e) => {
                    setUseMockMode(e.target.checked);
                    localStorage.setItem('freelanceFilter_mockMode', JSON.stringify(e.target.checked));
                  }}
                  className="w-4 h-4 rounded border-gray-300 accent-blue-600"
                />
                <div>
                  <p className="text-gray-900 font-semibold">Use Demo Mode</p>
                  <p className="text-xs text-gray-600">Works offline with keyword detection</p>
                </div>
              </label>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
