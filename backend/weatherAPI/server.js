require('dotenv').config();
const express = require('express');
const weatherRoutes = require('./routes/weatherRoutes.js');
const userRoutes = require('./routes/user.js');
const apiSettingsRoutes = require('./routes/apiSettings.js');
const cors = require('cors');
const { default: mongoose } = require('mongoose');
const errorHandler = require('./middleware/errorHandler.js');

const app = express();
const PORT = process.env.PORT || 5000;

const db_username = process.env.DB_USERNAME;
const db_password = process.env.DB_PASSWORD;
const environment = process.env.NODE_ENV || 'development';

// Use local MongoDB in development, production cluster in production
let uri;
if (environment === 'development') {
  uri = process.env.MONGODB_LOCAL_URI || 'mongodb://localhost:27017/hmi-dev';
  console.log('🟡 [MongoDB] Using local development database:', uri);
} else {
  uri = `mongodb+srv://${db_username}:${db_password}@hmi.g7qbf6h.mongodb.net/HMI?retryWrites=true&w=majority&appName=HMI`;
  console.log('🟢 [MongoDB] Using production cluster (HMI database)');
}

mongoose
  .connect(uri)
  .then(() => console.log(`✅ Database connected (${environment} mode)`))
  .catch((err) => console.log('❌ Database connection error:', err));

// Enable CORS for all routes
app.use(
  cors({
    origin: [
      'http://localhost:8081',
      'http://localhost:19006',
      'http://localhost:3000',
      'https://hmi-git-main-apsandnes-projects.vercel.app', // Old Vercel frontend domain
      'https://hmi-seven.vercel.app', // New Vercel frontend domain
      'https://weatherapi-sbwb.onrender.com', // Your Render backend domain
      process.env.FRONTEND_URL, // Environment variable for production frontend URL
    ].filter(Boolean), // Remove undefined values
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    environment: environment,
    database: environment === 'development' ? 'local' : 'production',
    timestamp: new Date().toISOString(),
  });
});

// Routes - Node.js backend handles authentication and weather data only
// Solar data is handled directly by the Java API (localhost:8080)
app.use('/api/weather', weatherRoutes);
app.use('/api/user', userRoutes);
app.use('/api/settings', apiSettingsRoutes);

app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
