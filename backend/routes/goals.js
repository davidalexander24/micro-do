const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// GET /api/goals: Fetch all goals, sorted by newest first
router.get('/', async (req, res) => {
  try {
    const goals = await Goal.find().sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// POST /api/goals: Accepts { title }, prompts AI, extracts steps, saves to DB
router.post('/', async (req, res) => {
  try {
    const { title, useAI } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    let steps = [];

    if (useAI !== false) {
      try {
        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        // Dynamic prompt
        const prompt = `Analyze the goal '${title}' and break it down into very small, highly actionable, easy first steps. You decide the appropriate number of steps based on the complexity of the goal (e.g., a simple task might only need 2 steps, a complex one might need 5 or more). Return ONLY a valid JSON array of strings, like ["step 1", "step 2"]. No markdown, no intro.`;

        const result = await model.generateContent(prompt);
        let content = result.response.text();
        content = content.trim();

        // Remove markdown code fences
        if (content.startsWith("```json")) {
          content = content.substring(7);
        } else if (content.startsWith("```")) {
          content = content.substring(3);
        }
        if (content.endsWith("```")) {
          content = content.substring(0, content.length - 3);
        }
        content = content.trim();

        try {
          steps = JSON.parse(content);
        } catch (parseError) {
          // Fallback using regex matching if exact parsing fails
          const regex = /\[\s*"[\s\S]*?"\s*(?:,\s*"[\s\S]*?"\s*)*\]/g;
          const match = content.match(regex);
          if (match) {
            try {
              steps = JSON.parse(match[0]);
            } catch (innerErr) {
              steps = [
                `Analyze and begin: ${title}`,
                `Develop key milestones for ${title}`,
                `Execute and iterate on results`
              ];
            }
          } else {
            steps = [
              `Analyze and begin: ${title}`,
              `Develop key milestones for ${title}`,
              `Execute and iterate on results`
            ];
          }
        }
      } catch (aiError) {
        console.error('AI step generation failed, using fallbacks:', aiError);
        steps = [
          `Identify first micro-action for: ${title}`,
          `Execute and track progress`,
          `Review completion of ${title}`
        ];
      }
    } else {
      steps = [`Complete: ${title}`];
    }

    if (!Array.isArray(steps)) {
      steps = [
        `Identify first micro-action for: ${title}`,
        `Execute and track progress`,
        `Review completion of ${title}`
      ];
    }

    const formattedSteps = steps.map(s => ({
      title: typeof s === 'string' ? s : String(s),
      isCompleted: false
    }));

    const newGoal = new Goal({
      title: title.trim(),
      steps: formattedSteps
    });

    await newGoal.save();
    res.status(201).json(newGoal);
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// PATCH /api/goals/:goalId/steps/:stepId: Toggle isCompleted for a specific step
router.patch('/:goalId/steps/:stepId', async (req, res) => {
  try {
    const { goalId, stepId } = req.params;

    const goal = await Goal.findById(goalId);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const step = goal.steps.id(stepId);
    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }

    step.isCompleted = !step.isCompleted;
    await goal.save();

    res.json(goal);
  } catch (error) {
    console.error('Error updating step:', error);
    res.status(500).json({ error: 'Failed to update step' });
  }
});

// DELETE /api/goals/:id: Deletes a goal and its steps
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedGoal = await Goal.findByIdAndDelete(id);
    if (!deletedGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json({ message: 'Goal deleted successfully', id });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

module.exports = router;
