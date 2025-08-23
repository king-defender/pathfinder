import { test, expect } from '@playwright/test';

test.describe('New API Endpoints', () => {
  test('API health check endpoint returns correct status', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toMatchObject({
      status: 'OK',
      message: expect.any(String),
      timestamp: expect.any(String),
      version: expect.any(String),
      services: {
        pathfinding: 'available',
        advice: 'available',
        roadmap: 'available',
        chat: 'available'
      }
    });
  });

  test('advice endpoint works with valid input', async ({ request }) => {
    const response = await request.post('/api/advice', {
      data: {
        query: "How do I improve my programming skills?",
        context: "I'm a beginner developer"
      }
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toMatchObject({
      success: true,
      data: {
        advice: expect.any(String),
        metadata: {
          model: expect.any(String),
          timestamp: expect.any(String)
        }
      },
      timestamp: expect.any(String)
    });
  });

  test('advice endpoint validates input', async ({ request }) => {
    const response = await request.post('/api/advice', {
      data: {
        // Missing required 'query' field
        context: "test context"
      }
    });
    
    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data).toMatchObject({
      success: false,
      error: 'Validation failed'
    });
  });

  test('roadmap endpoint works with valid input', async ({ request }) => {
    const response = await request.post('/api/roadmap', {
      data: {
        goal: "Learn machine learning",
        timeframe: "6 months",
        skills: ["Python", "Mathematics"],
        experience: "beginner"
      }
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toMatchObject({
      success: true,
      data: {
        roadmap: {
          title: expect.any(String),
          overview: expect.any(String),
          estimatedDuration: expect.any(String),
          phases: expect.any(Array),
          finalOutcome: expect.any(String),
          nextSteps: expect.any(Array)
        },
        metadata: {
          model: expect.any(String),
          timestamp: expect.any(String)
        }
      },
      timestamp: expect.any(String)
    });
  });

  test('chat endpoint works with valid conversation', async ({ request }) => {
    const response = await request.post('/api/chat', {
      data: {
        messages: [
          { role: "user", content: "Hello, can you help me with pathfinding?" }
        ]
      }
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toMatchObject({
      success: true,
      data: {
        message: {
          role: 'assistant',
          content: expect.any(String),
          timestamp: expect.any(String)
        },
        suggestions: expect.any(Array),
        metadata: {
          model: expect.any(String),
          timestamp: expect.any(String)
        }
      },
      timestamp: expect.any(String)
    });
  });

  test('chat endpoint validates message format', async ({ request }) => {
    const response = await request.post('/api/chat', {
      data: {
        messages: [
          { role: "assistant", content: "This should fail - last message must be from user" }
        ]
      }
    });
    
    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data).toMatchObject({
      success: false,
      error: 'Last message must be from user'
    });
  });

  test('API root endpoint shows all new endpoints', async ({ request }) => {
    const response = await request.get('/api');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toMatchObject({
      message: 'Pathfinder API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        healthDetailed: '/health/detailed',
        apiHealth: '/api/health',
        pathfinding: '/api/path/*',
        advice: '/api/advice',
        roadmap: '/api/roadmap',
        chat: '/api/chat'
      }
    });
  });

  test('rate limiting is applied to AI endpoints', async ({ request }) => {
    // Make multiple rapid requests to test rate limiting
    const requests = Array.from({ length: 6 }, () => 
      request.post('/api/advice', {
        data: { query: "test query" }
      })
    );
    
    const responses = await Promise.all(requests);
    
    // At least one request should be rate limited (status 429)
    const rateLimitedResponses = responses.filter(r => r.status() === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });
});