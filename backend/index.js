require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const goalsRouter = require('./routes/goals');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/goals', goalsRouter);

app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the MicroDo API' });
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('Successfully connected to MongoDB.'))
    .catch((err) => console.error('MongoDB connection error:', err));
} else {
  console.warn('Warning: MONGODB_URI environment variable is not defined.');
}

// Export for Vercel Serverless Functions
module.exports = app;

// Listen only when running locally (not in production)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
  });
}
