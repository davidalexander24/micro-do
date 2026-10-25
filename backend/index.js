require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const goalsRouter = require('./routes/goals');
const mcpRouter = require('./routes/mcp');
const Goal = require('./models/Goal');

const app = express();

// Database connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn('Warning: MONGODB_URI environment variable is not defined.');
}

// Connect on first use and retry after a failure, so one failed cold start
// can't leave a serverless instance without a database until it is recycled
let connection = null;

const connectDB = () => {
  if (!connection) {
    connection = mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
      .then(() => console.log('Successfully connected to MongoDB.'))
      .catch((err) => {
        connection = null;
        throw err;
      });
  }
  return connection;
};

const requireDB = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    res.status(503).json({ error: 'Database unavailable' });
  }
};

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/goals', requireDB, goalsRouter);
app.use('/api/mcp', requireDB, mcpRouter);

app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the MicroDo API' });
});

// Health check, called daily by the Vercel cron in vercel.json so the
// free Atlas cluster always sees activity and is never paused as idle
app.get('/api/health', requireDB, async (req, res) => {
  try {
    await Goal.countDocuments();
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(500).json({ status: 'error' });
  }
});

// Export for Vercel Serverless Functions
module.exports = app;

// Listen only when run directly (node index.js), not when Vercel or the tests import the app
if (require.main === module) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
  });
}
