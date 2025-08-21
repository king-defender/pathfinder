import { beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

beforeAll(async () => {
  // Setup test environment
  process.env.NODE_ENV = 'test';
  process.env.PORT = '0'; // Use random port for testing
});

afterAll(async () => {
  // Cleanup after tests
});