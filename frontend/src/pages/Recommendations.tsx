import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { firestoreService } from '../services/firestore';
import type { Recommendation } from '../types';
import Layout from '../components/Layout';

const Recommendations: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const loadRecommendations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userRecommendations = await firestoreService.getUserRecommendations(user.uid);
      setRecommendations(userRecommendations);
    } catch (error: any) {
      setError(error.message || t('generalError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [user]);

  const generateRecommendations = async () => {
    if (!user) return;

    try {
      setGenerating(true);
      setError('');
      const newRecommendations = await firestoreService.generateAndSaveRecommendations(user.uid, user);
      setRecommendations(prev => [...newRecommendations, ...prev]);
    } catch (error: any) {
      setError(error.message || t('generalError'));
    } finally {
      setGenerating(false);
    }
  };

  const updateRecommendationStatus = async (id: string, status: Recommendation['status']) => {
    try {
      await firestoreService.updateRecommendation(id, { status });
      setRecommendations(prev => 
        prev.map(rec => rec.id === id ? { ...rec, status } : rec)
      );
    } catch (error: any) {
      setError(error.message || t('generalError'));
    }
  };

  const deleteRecommendation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recommendation?')) return;

    try {
      await firestoreService.deleteRecommendation(id);
      setRecommendations(prev => prev.filter(rec => rec.id !== id));
    } catch (error: any) {
      setError(error.message || t('generalError'));
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">{t('loading')}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="md:flex md:items-center md:justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                {t('recommendationsTitle')}
              </h2>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                type="button"
                onClick={generateRecommendations}
                disabled={generating}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {generating ? t('loading') : t('generateRecommendations')}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {recommendations.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noRecommendations')}</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by generating your first set of personalized recommendations.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={generateRecommendations}
                  disabled={generating}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {generating ? t('loading') : t('generateRecommendations')}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((recommendation) => (
                <div key={recommendation.id} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          recommendation.status === 'completed' ? 'bg-green-100 text-green-800' :
                          recommendation.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {recommendation.status}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">Priority {recommendation.priority}</span>
                    </div>
                    
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {recommendation.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-4">
                      {recommendation.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span>{recommendation.category}</span>
                      <span>
                        {recommendation.createdAt && 
                          new Date(recommendation.createdAt.seconds * 1000).toLocaleDateString()
                        }
                      </span>
                    </div>

                    <div className="flex space-x-2">
                      <select
                        value={recommendation.status}
                        onChange={(e) => updateRecommendationStatus(recommendation.id, e.target.value as Recommendation['status'])}
                        className="text-xs border-gray-300 rounded-md"
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                      
                      <button
                        onClick={() => deleteRecommendation(recommendation.id)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        {t('delete')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Recommendations;