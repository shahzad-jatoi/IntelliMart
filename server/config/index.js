require('dotenv').config();

const strip = (s) => (s || '').replace(/\/+$/, '');

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  modelServiceUrl: strip(process.env.MODEL_SERVICE_URL) || 'http://localhost:8000',
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: strip(process.env.FRONTEND_URL) || 'http://localhost:5173',
};
