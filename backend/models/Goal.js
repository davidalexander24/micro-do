const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  title: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
  parentId: { type: mongoose.Schema.Types.ObjectId, default: null },
  depth: { type: Number, default: 0 }
});

const goalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  steps: [stepSchema]
});

module.exports = mongoose.model('Goal', goalSchema);
