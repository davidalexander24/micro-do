const express = require('express');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { z } = require('zod');
const goals = require('../services/goals');

const router = express.Router();

// Nested view of a goal for the agent: ids for follow-up calls, completion and progress
const toView = (goal) => {
  const steps = goal.steps;
  const build = (parentId) =>
    steps
      .filter((s) => String(s.parentId) === String(parentId))
      .map((s) => {
        const substeps = build(s._id);
        return {
          id: String(s._id),
          title: s.title,
          done: s.isCompleted,
          ...(substeps.length > 0 && { substeps })
        };
      });

  const leaves = steps.filter((s) => !steps.some((c) => String(c.parentId) === String(s._id)));
  const done = leaves.filter((s) => s.isCompleted).length;

  return {
    id: String(goal._id),
    title: goal.title,
    progress: `${done}/${leaves.length} steps done`,
    steps: build(null)
  };
};

const reply = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] });

// Service errors (not found, depth limit, AI failure) go back to the agent as tool errors
const tool = (fn) => async (args) => {
  try {
    return await fn(args);
  } catch (error) {
    if (!(error instanceof goals.ServiceError)) {
      console.error('MCP tool failed:', error);
    }
    const message = error instanceof goals.ServiceError ? error.message : 'Something went wrong';
    return { content: [{ type: 'text', text: message }], isError: true };
  }
};

const buildServer = (ownerId) => {
  const server = new McpServer({ name: 'microdo', version: '1.0.0' });

  server.registerTool(
    'list_goals',
    {
      title: 'List goals',
      description: 'List every goal in this MicroDo list, newest first, with nested steps, their ids and completion.'
    },
    tool(async () => reply((await goals.listGoals(ownerId)).map(toView)))
  );

  server.registerTool(
    'create_goal',
    {
      title: 'Create goal',
      description: 'Create a goal. By default MicroDo AI breaks it into 3 to 6 actionable steps.',
      inputSchema: {
        title: z.string().min(1).max(300).describe('The goal, in plain language'),
        use_ai: z.boolean().optional().describe('Set to false to create the goal as a single step without AI')
      }
    },
    tool(async ({ title, use_ai }) => reply(toView(await goals.createGoal(ownerId, title, use_ai))))
  );

  server.registerTool(
    'break_down_step',
    {
      title: 'Break down step',
      description: 'Use MicroDo AI to split one step into 3 to 5 smaller sub-steps. Steps can be split at most twice deep.',
      inputSchema: {
        goal_id: z.string().describe('Goal id from list_goals'),
        step_id: z.string().describe('Id of the step to break down')
      }
    },
    tool(async ({ goal_id, step_id }) => reply(toView(await goals.breakDownStep(ownerId, goal_id, step_id))))
  );

  server.registerTool(
    'set_step_completed',
    {
      title: 'Complete or reopen step',
      description: 'Mark a step done or not done. Setting a parent step applies to all of its sub-steps.',
      inputSchema: {
        goal_id: z.string().describe('Goal id from list_goals'),
        step_id: z.string().describe('Id of the step'),
        completed: z.boolean().describe('true to mark done, false to reopen')
      }
    },
    tool(async ({ goal_id, step_id, completed }) =>
      reply(toView(await goals.setStepCompleted(ownerId, goal_id, step_id, completed))))
  );

  server.registerTool(
    'delete_goal',
    {
      title: 'Delete goal',
      description: 'Permanently delete a goal and all of its steps.',
      annotations: { destructiveHint: true },
      inputSchema: {
        goal_id: z.string().describe('Goal id from list_goals')
      }
    },
    tool(async ({ goal_id }) => {
      const goal = await goals.deleteGoal(ownerId, goal_id);
      return reply({ deleted: String(goal._id), title: goal.title });
    })
  );

  return server;
};

const rpcError = (res, status, code, message) =>
  res.status(status).json({ jsonrpc: '2.0', error: { code, message }, id: null });

// POST /api/mcp: stateless Streamable HTTP MCP endpoint, authenticated by the list key
router.post('/', async (req, res) => {
  const match = /^Bearer\s+(\S+)$/i.exec(req.get('Authorization') || '');
  if (!match || !goals.isValidClientId(match[1])) {
    return rpcError(res, 401, -32001, 'Missing or invalid MicroDo key. Copy the connect command from the app.');
  }

  // A fresh server per request: no session state to lose between serverless invocations
  const server = buildServer(match[1]);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });
  res.on('close', () => {
    transport.close();
    server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('MCP request failed:', error);
    if (!res.headersSent) {
      rpcError(res, 500, -32603, 'Internal server error');
    }
  }
});

router.all('/', (req, res) => {
  res.set('Allow', 'POST');
  rpcError(res, 405, -32000, 'Method not allowed. This MCP server is stateless and only accepts POST.');
});

module.exports = router;
