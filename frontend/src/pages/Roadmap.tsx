import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { apiService } from '../services/api';
import type { Roadmap as RoadmapType } from '../types';
import Layout from '../components/Layout';

const Roadmap: React.FC = () => {
  const { t } = useLanguage();
  const [roadmap, setRoadmap] = useState<RoadmapType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    goal: '',
    currentLevel: 'beginner',
    timeframe: '3-6 months'
  });

  const generateRoadmap = async () => {
    if (!formData.goal.trim()) {
      setError('Please enter your learning goal');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const generatedRoadmap = await apiService.generateRoadmap(
        formData.goal,
        formData.currentLevel,
        formData.timeframe
      );
      setRoadmap(generatedRoadmap);
    } catch (error: any) {
      setError(error.message || t('generalError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="md:flex md:items-center md:justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                {t('roadmapTitle')}
              </h2>
            </div>
          </div>

          {/* Roadmap Generation Form */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Your Learning Roadmap</h3>
            
            {error && (
              <div className="rounded-md bg-red-50 p-4 mb-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label htmlFor="goal" className="block text-sm font-medium text-gray-700">
                  Learning Goal *
                </label>
                <input
                  type="text"
                  id="goal"
                  value={formData.goal}
                  onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                  placeholder="e.g., Learn React and become a frontend developer"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="currentLevel" className="block text-sm font-medium text-gray-700">
                  Current Level
                </label>
                <select
                  id="currentLevel"
                  value={formData.currentLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentLevel: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700">
                  Timeframe
                </label>
                <select
                  id="timeframe"
                  value={formData.timeframe}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeframe: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="1-3 months">1-3 months</option>
                  <option value="3-6 months">3-6 months</option>
                  <option value="6-12 months">6-12 months</option>
                  <option value="1+ years">1+ years</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={generateRoadmap}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? t('loading') : t('generateRoadmap')}
              </button>
            </div>
          </div>

          {/* Generated Roadmap */}
          {roadmap && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{roadmap.title}</h3>
              
              <div className="prose max-w-none mb-6">
                <p className="text-gray-600">{roadmap.overview}</p>
                <p className="text-sm text-gray-500 mt-2">
                  <strong>Estimated Duration:</strong> {roadmap.estimatedDuration}
                </p>
              </div>

              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900">Learning Phases</h4>
                
                {roadmap.phases.map((phase, index) => (
                  <div key={index} className="border-l-4 border-indigo-500 pl-4">
                    <div className="flex items-center mb-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-sm font-medium mr-3">
                        {index + 1}
                      </span>
                      <h5 className="text-md font-medium text-gray-900">{phase.title}</h5>
                      <span className="ml-auto text-sm text-gray-500">{phase.duration}</span>
                    </div>
                    <p className="text-gray-600 mb-3">{phase.description}</p>
                    
                    {phase.skills && phase.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {phase.skills.map((skill, skillIndex) => (
                          <span
                            key={skillIndex}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-green-50 rounded-lg">
                <h5 className="text-md font-medium text-green-900 mb-2">Final Outcome</h5>
                <p className="text-green-700">{roadmap.finalOutcome}</p>
              </div>

              {roadmap.nextSteps && roadmap.nextSteps.length > 0 && (
                <div className="mt-6">
                  <h5 className="text-md font-medium text-gray-900 mb-2">Next Steps</h5>
                  <ul className="list-disc list-inside space-y-1">
                    {roadmap.nextSteps.map((step, index) => (
                      <li key={index} className="text-gray-600">{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Roadmap;