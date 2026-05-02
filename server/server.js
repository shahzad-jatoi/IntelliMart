require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const config = require('./config');

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/contact', require('./routes/contact'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'Express',
    modelService: config.modelServiceUrl,
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: config.nodeEnv === 'development' ? err.message : 'Internal server error',
  });
});

// Connect to DB, seed if empty, then start server
const PORT = config.port;
const autoSeed = require('./config/autoSeed');
connectDB().then(async () => {
  await autoSeed();
  app.listen(PORT, () => {
    console.log(`\n[IntelliMart] Server running on http://localhost:${PORT}`);
    console.log(`[IntelliMart] Model service expected at ${config.modelServiceUrl}`);
    console.log(`[IntelliMart] Environment: ${config.nodeEnv}\n`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
