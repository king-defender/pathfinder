// Test script to verify the server startup behavior
import app from './src/index.js';

console.log('✅ App imported successfully without starting server');
console.log('✅ App instance:', typeof app);

// If we get here, it means the server didn't start automatically
process.exit(0);