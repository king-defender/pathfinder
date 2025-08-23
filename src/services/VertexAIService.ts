import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AIResponse {
  content: string;
  metadata: {
    model: string;
    timestamp: string;
    usage: {
      inputTokens?: number;
      outputTokens?: number;
    };
  };
}

export interface AdviceRequest {
  query: string;
  context?: string;
  preferences?: Record<string, any>;
}

export interface RoadmapRequest {
  goal: string;
  timeframe?: string;
  skills?: string[];
  experience?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  context?: string;
}

export class VertexAIService {
  private genAI: GoogleGenerativeAI | null;
  private model: any;
  private mockMode: boolean;

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    this.mockMode = !apiKey || apiKey === 'mock_development_key' || process.env.MOCK_EXTERNAL_APIS === 'true';
    
    if (this.mockMode) {
      console.log('VertexAI Service running in mock mode for development');
      this.genAI = null;
      this.model = null;
    } else {
      if (!apiKey) {
        throw new Error('GOOGLE_AI_API_KEY environment variable is required');
      }
      
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }
  }

  async generateAdvice(request: AdviceRequest): Promise<AIResponse> {
    if (this.mockMode) {
      return this.generateMockAdvice(request);
    }
    
    try {
      const prompt = this.buildAdvicePrompt(request);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return {
        content: response.text(),
        metadata: {
          model: 'gemini-1.5-flash',
          timestamp: new Date().toISOString(),
          usage: {
            inputTokens: result.response.usageMetadata?.promptTokenCount,
            outputTokens: result.response.usageMetadata?.candidatesTokenCount,
          }
        }
      };
    } catch (error) {
      throw new Error(`AI service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateRoadmap(request: RoadmapRequest): Promise<AIResponse> {
    if (this.mockMode) {
      return this.generateMockRoadmap(request);
    }
    
    try {
      const prompt = this.buildRoadmapPrompt(request);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return {
        content: response.text(),
        metadata: {
          model: 'gemini-1.5-flash',
          timestamp: new Date().toISOString(),
          usage: {
            inputTokens: result.response.usageMetadata?.promptTokenCount,
            outputTokens: result.response.usageMetadata?.candidatesTokenCount,
          }
        }
      };
    } catch (error) {
      throw new Error(`AI service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateChatResponse(request: ChatRequest): Promise<AIResponse> {
    if (this.mockMode) {
      return this.generateMockChatResponse(request);
    }
    
    try {
      const prompt = this.buildChatPrompt(request);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return {
        content: response.text(),
        metadata: {
          model: 'gemini-1.5-flash',
          timestamp: new Date().toISOString(),
          usage: {
            inputTokens: result.response.usageMetadata?.promptTokenCount,
            outputTokens: result.response.usageMetadata?.candidatesTokenCount,
          }
        }
      };
    } catch (error) {
      throw new Error(`AI service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildAdvicePrompt(request: AdviceRequest): string {
    let prompt = `You are a knowledgeable assistant for the Pathfinder application. Provide helpful, accurate advice based on the user's query.

User Query: ${request.query}`;

    if (request.context) {
      prompt += `\n\nContext: ${request.context}`;
    }

    if (request.preferences && Object.keys(request.preferences).length > 0) {
      prompt += `\n\nUser Preferences: ${JSON.stringify(request.preferences)}`;
    }

    prompt += `\n\nPlease provide practical, actionable advice. Be concise but thorough. Format your response as JSON with the following structure:
{
  "advice": "Your main advice here",
  "reasoning": "Explanation of your reasoning",
  "actionItems": ["item1", "item2", "item3"],
  "additionalResources": ["resource1", "resource2"]
}`;

    return prompt;
  }

  private buildRoadmapPrompt(request: RoadmapRequest): string {
    let prompt = `You are an expert career and learning advisor for the Pathfinder application. Create a detailed roadmap to help the user achieve their goal.

Goal: ${request.goal}`;

    if (request.timeframe) {
      prompt += `\nTimeframe: ${request.timeframe}`;
    }

    if (request.skills && request.skills.length > 0) {
      prompt += `\nCurrent Skills: ${request.skills.join(', ')}`;
    }

    if (request.experience) {
      prompt += `\nExperience Level: ${request.experience}`;
    }

    prompt += `\n\nCreate a comprehensive roadmap with milestones, suggested timeline, and required skills. Format your response as JSON with the following structure:
{
  "roadmap": {
    "title": "Roadmap title",
    "overview": "Brief overview of the path",
    "estimatedDuration": "Duration estimate",
    "phases": [
      {
        "phase": 1,
        "title": "Phase title",
        "duration": "Phase duration",
        "description": "What to focus on in this phase",
        "skills": ["skill1", "skill2"],
        "milestones": ["milestone1", "milestone2"],
        "resources": ["resource1", "resource2"]
      }
    ],
    "finalOutcome": "What the user will achieve",
    "nextSteps": ["Next action items"]
  }
}`;

    return prompt;
  }

  private buildChatPrompt(request: ChatRequest): string {
    let prompt = `You are a helpful assistant for the Pathfinder application. You help users with navigation, pathfinding, career advice, and general questions.

Conversation History:`;

    // Include last 10 messages for context
    const recentMessages = request.messages.slice(-10);
    
    recentMessages.forEach(message => {
      prompt += `\n${message.role}: ${message.content}`;
    });

    if (request.context) {
      prompt += `\n\nAdditional Context: ${request.context}`;
    }

    prompt += `\n\nRespond helpfully and conversationally to the latest user message. Keep your response concise but informative. If the user is asking about pathfinding or navigation, provide practical guidance. If they're asking about career or learning paths, provide structured advice.

Format your response as JSON:
{
  "response": "Your conversational response here",
  "suggestions": ["Optional follow-up suggestion 1", "Optional follow-up suggestion 2"]
}`;

    return prompt;
  }

  // Mock methods for development
  private generateMockAdvice(request: AdviceRequest): AIResponse {
    const mockContent = JSON.stringify({
      advice: `Here's some helpful advice regarding: ${request.query}. This is a mock response for development.`,
      reasoning: "This advice is based on common best practices and general principles.",
      actionItems: [
        "Research the topic thoroughly",
        "Create a plan of action",
        "Start with small steps",
        "Monitor your progress"
      ],
      additionalResources: [
        "Online documentation",
        "Community forums",
        "Expert tutorials"
      ]
    });

    return {
      content: mockContent,
      metadata: {
        model: 'mock-gemini',
        timestamp: new Date().toISOString(),
        usage: {
          inputTokens: request.query.length,
          outputTokens: mockContent.length,
        }
      }
    };
  }

  private generateMockRoadmap(request: RoadmapRequest): AIResponse {
    const mockContent = JSON.stringify({
      roadmap: {
        title: `Roadmap to: ${request.goal}`,
        overview: `This is a mock roadmap to help you achieve your goal: ${request.goal}`,
        estimatedDuration: request.timeframe || "3-6 months",
        phases: [
          {
            phase: 1,
            title: "Foundation Phase",
            duration: "1-2 months",
            description: "Build fundamental knowledge and skills",
            skills: ["Basic concepts", "Core principles"],
            milestones: ["Complete basic training", "Understand fundamentals"],
            resources: ["Beginner tutorials", "Documentation"]
          },
          {
            phase: 2,
            title: "Practice Phase",
            duration: "2-3 months",
            description: "Apply knowledge through hands-on practice",
            skills: ["Practical application", "Problem solving"],
            milestones: ["Complete first project", "Build portfolio"],
            resources: ["Practice projects", "Mentorship"]
          },
          {
            phase: 3,
            title: "Mastery Phase",
            duration: "1-2 months",
            description: "Achieve proficiency and expertise",
            skills: ["Advanced techniques", "Best practices"],
            milestones: ["Complete advanced project", "Demonstrate expertise"],
            resources: ["Advanced courses", "Professional networks"]
          }
        ],
        finalOutcome: `You will have achieved proficiency in ${request.goal}`,
        nextSteps: ["Continue learning", "Stay updated", "Share knowledge"]
      }
    });

    return {
      content: mockContent,
      metadata: {
        model: 'mock-gemini',
        timestamp: new Date().toISOString(),
        usage: {
          inputTokens: request.goal.length,
          outputTokens: mockContent.length,
        }
      }
    };
  }

  private generateMockChatResponse(request: ChatRequest): AIResponse {
    const lastMessage = request.messages[request.messages.length - 1];
    const mockContent = JSON.stringify({
      response: `Thank you for your message: "${lastMessage.content}". This is a mock response for development. I understand you're asking about this topic, and I'm here to help with pathfinding, navigation, and general assistance.`,
      suggestions: [
        "Ask about pathfinding algorithms",
        "Get career roadmap advice",
        "Learn about navigation techniques"
      ]
    });

    return {
      content: mockContent,
      metadata: {
        model: 'mock-gemini',
        timestamp: new Date().toISOString(),
        usage: {
          inputTokens: lastMessage.content.length,
          outputTokens: mockContent.length,
        }
      }
    };
  }
}