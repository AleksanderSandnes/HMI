#!/usr/bin/env node

/**
 * Production Setup Helper
 * Helps generate secure credentials for production deployment
 */

const crypto = require('crypto');

console.log('🚀 HMI Production Setup Helper\n');

// Generate JWT Secret (32+ characters)
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('📝 Generated JWT Secret (copy to Render.com):');
console.log(`JWT_SECRET=${jwtSecret}\n`);

// Generate Encryption Key (exactly 32 characters)
const encryptionKey = crypto.randomBytes(16).toString('hex');
console.log('🔐 Generated Encryption Key (copy to Render.com):');
console.log(`ENCRYPTION_KEY=${encryptionKey}\n`);

console.log('📋 Complete Environment Variables for Render.com:\n');
console.log('=== Node.js Weather API (hmi-backend) ===');
console.log('NODE_ENV=production');
console.log('PORT=5000');
console.log('DB_USERNAME=your_mongodb_atlas_username');
console.log('DB_PASSWORD=your_mongodb_atlas_password');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`ENCRYPTION_KEY=${encryptionKey}`);
console.log('FRONTEND_URL=https://hmi-frontend.vercel.app');

console.log('\n=== Java Growatt API (hmi-java-api) ===');
console.log('SERVER_PORT=8080');
console.log('SPRING_PROFILES_ACTIVE=production');
console.log('GROWATT_ACCOUNT=your_growatt_email@domain.com');
console.log('GROWATT_PASSWORD=your_growatt_password');
console.log('FRONTEND_URL=https://hmi-frontend.vercel.app');

console.log('\n📱 Frontend Environment Variables (Vercel):');
console.log('EXPO_PUBLIC_DATA_MODE=production');
console.log('EXPO_PUBLIC_PRODUCTION_API=https://hmi-backend.onrender.com/api');
console.log('EXPO_PUBLIC_WEATHER_API_PRODUCTION=https://hmi-backend.onrender.com');
console.log('EXPO_PUBLIC_GROWATT_API_PRODUCTION=https://hmi-java-api.onrender.com/api');

console.log('\n🔧 Next Steps:');
console.log('1. Copy environment variables to Render.com dashboard');
console.log('2. Update MongoDB Atlas connection string');
console.log('3. Deploy both backend services to Render.com');
console.log('4. Deploy frontend to Vercel');
console.log('5. Test health endpoints');
console.log('6. Configure user credentials in app settings');

console.log('\n💡 Remember:');
console.log('- Users should configure their own API credentials in the app');
console.log('- Environment variables serve as fallback only');
console.log('- Keep these credentials secure and don\'t commit them to Git');
console.log('\n🎉 Ready for production deployment!');
