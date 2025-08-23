export interface User {
  uid: string;
  email: string;
  role: string;
  displayName?: string;
  createdAt?: any;
  lastLoginAt?: any;
  preferences?: Record<string, any>;
}

export interface Recommendation {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  priority: number;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: any;
  updatedAt: any;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface RoadmapPhase {
  title: string;
  description: string;
  duration: string;
  skills: string[];
}

export interface Roadmap {
  title: string;
  overview: string;
  estimatedDuration: string;
  phases: RoadmapPhase[];
  finalOutcome: string;
  nextSteps: string[];
}

export interface Language {
  code: 'en' | 'hi';
  name: string;
  flag: string;
}