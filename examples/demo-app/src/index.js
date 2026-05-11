// Load environment variables from .env file
require('dotenv').config();

// Validate environment before app logic executes
const bootstrap = require('./bootstrap');
bootstrap();

// Application logic
const port = process.env.PORT || 3000;
const dbUrl = process.env.DATABASE_URL;

console.log('🚀 Demo App Starting...');
console.log(`📡 Listening on port ${port}`);
if (dbUrl) {
  console.log(`🗄️  Connected to ${dbUrl.replace(/:([^@]+)@/, ':****@')}`);
}

console.log('\n✅ App is running correctly!');
