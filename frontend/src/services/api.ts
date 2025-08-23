import type { User, Recommendation, Roadmap, ChatMessage } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

class ApiService {
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Network request failed');
    }

    return response.json();
  }

  // Auth methods
  async createUserProfile(idToken: string, additionalData = {}): Promise<void> {
    await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ idToken, additionalData }),
    });
  }

  async getUserProfile(idToken: string): Promise<User> {
    const response = await this.request('/api/auth/profile', {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });
    return response.user;
  }

  async updateUserProfile(idToken: string, data: Partial<User>): Promise<void> {
    await this.request('/api/auth/profile', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(data),
    });
  }

  // Recommendations
  async getRecommendations(_idToken: string): Promise<Recommendation[]> {
    // This will be implemented with Firestore queries
    // For now, return empty array
    return [];
  }

  async generateAdvice(query: string, context: string = ''): Promise<any> {
    return this.request('/api/advice', {
      method: 'POST',
      body: JSON.stringify({ query, context }),
    });
  }

  // Roadmap
  async generateRoadmap(goal: string, currentLevel: string, timeframe: string): Promise<Roadmap> {
    const response = await this.request('/api/roadmap', {
      method: 'POST',
      body: JSON.stringify({ goal, currentLevel, timeframe }),
    });
    return response.data.roadmap;
  }

  // Chat
  async sendChatMessage(messages: ChatMessage[]): Promise<any> {
    return this.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    });
  }

  // Health check
  async healthCheck(): Promise<any> {
    return this.request('/api/health');
  }
}

export const apiService = new ApiService();