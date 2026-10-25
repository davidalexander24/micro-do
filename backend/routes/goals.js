const express = require('express');
const router = express.Router();
const goals = require('../services/goals');

// Every request is scoped to the browser's private list
router.use((req, res, next) => {
  const clientId = req.get('X-Client-Id');
  if (!goals.isValidClientId(clientId)) {
    return res.status(400).json({ error: 'Missing or invalid X-Client-Id header' });
  }
  req.ownerId = clientId;
  next();
});

// Sends known service errors with their status, anything else as a 500
const handle = (fn, failMessage) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error instanceof goals.ServiceError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error(`${failMessage}:`, error);
    res.status(500).json({ error: failMessage });
  }
};

// GET /api/goals: Fetch all goals, sorted by newest first
router.get('/', handle(async (req, res) => {
  res.json(await goals.listGoals(req.ownerId));
}, 'Failed to fetch goals'));

// POST /api/goals: Accepts { title, useAI }, prompts AI for steps, saves to DB
router.post('/', handle(async (req, res) => {
  const { title, useAI } = req.body;
  res.status(201).json(await goals.createGoal(req.ownerId, title, useAI));
}, 'Failed to create goal'));

// POST /api/goals/:goalId/steps/:stepId/breakdown: AI splits one step into sub-steps
router.post('/:goalId/steps/:stepId/breakdown', handle(async (req, res) => {
  const { goalId, stepId } = req.params;
  res.status(201).json(await goals.breakDownStep(req.ownerId, goalId, stepId));
}, 'Failed to break down step'));

// PATCH /api/goals/:goalId/steps/:stepId: Set { completed } on a step, or toggle it without a body
router.patch('/:goalId/steps/:stepId', handle(async (req, res) => {
  const { goalId, stepId } = req.params;
  const completed = req.body && typeof req.body.completed === 'boolean' ? req.body.completed : undefined;
  res.json(await goals.setStepCompleted(req.ownerId, goalId, stepId, completed));
}, 'Failed to update step'));

// DELETE /api/goals/:id: Deletes a goal and its steps
router.delete('/:id', handle(async (req, res) => {
  const { id } = req.params;
  await goals.deleteGoal(req.ownerId, id);
  res.json({ message: 'Goal deleted successfully', id });
}, 'Failed to delete goal'));

module.exports = router;
