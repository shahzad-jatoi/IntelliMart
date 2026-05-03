require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const config = require('./config');

const app = express();

// ----- Security headers -----
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ----- CORS configuration -----
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o))) {
      return callback(null, true);
    }
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ----- Body parsing middleware -----
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ----- Request logging -----
app.use((req, res, next) => {
  if (config.nodeEnv === 'development') {
    console.log(`${req.method} ${req.url}`);
  }
  next();
});

// ----- API Routes -----
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/contact', require('./routes/contact'));

// ----- Health check -----
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'Express',
    environment: config.nodeEnv,
    modelService: config.modelServiceUrl,
    timestamp: new Date().toISOString(),
  });
});

// ----- Root route (for Render health checks) -----
app.get('/', (req, res) => {
  res.json({ status: 'IntelliMart API is running' });
});

// ----- Error handling middleware -----
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.url}:`, err.message);
  res.status(err.status || 500).json({
    message: config.nodeEnv === 'development' ? err.message : 'Internal server error',
  });
});

// ----- Start server -----
const PORT = config.port;
const autoSeed = require('./config/autoSeed');
connectDB().then(async () => {
  await autoSeed();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n[IntelliMart] Server running on port ${PORT}`);
    console.log(`[IntelliMart] Model service at ${config.modelServiceUrl}`);
    console.log(`[IntelliMart] Environment: ${config.nodeEnv}\n`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
