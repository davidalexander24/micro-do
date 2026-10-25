const mongoose = require('mongoose');

// One counter per rate-limit window; MongoDB's TTL index removes it once the window ends
const usageSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true }
});

usageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Usage', usageSchema);
