const { MongoMemoryServer } = require('mongodb-memory-server-core');
const mongoose = require('mongoose');
const request = require('supertest');

// Gemini is mocked: each test queues the step titles the "AI" returns
jest.mock('@google/generative-ai', () => {
  const generateContent = jest.fn();
  const getGenerativeModel = jest.fn(() => ({ generateContent }));
  return {
    SchemaType: { ARRAY: 'array', STRING: 'string' },
    GoogleGenerativeAI: jest.fn(() => ({ getGenerativeModel })),
    generateContent,
    getGenerativeModel
  };
});

const { generateContent, getGenerativeModel } = require('@google/generative-ai');

const modelsCalled = () => getGenerativeModel.mock.calls.map(([params]) => params.model);

const quotaError = (retryDelay) =>
  Object.assign(new Error('429 Too Many Requests'), {
    status: 429,
    errorDetails: retryDelay ? [{ retryDelay }] : []
  });

const aiReturns = (...lists) =>
  lists.forEach((steps) =>
    generateContent.mockResolvedValueOnce({ response: { text: () => JSON.stringify(steps) } })
  );

const A = 'test-list-aaaaaaaaaaaa';
const B = 'test-list-bbbbbbbbbbbb';

let mongo;
let app;

const as = (clientId) => ({
  get: (path) => request(app).get(path).set('X-Client-Id', clientId),
  post: (path, body) => request(app).post(path).set('X-Client-Id', clientId).send(body),
  patch: (path) => request(app).patch(path).set('X-Client-Id', clientId),
  delete: (path) => request(app).delete(path).set('X-Client-Id', clientId)
});

const mcp = (clientId, method, params) =>
  request(app)
    .post('/api/mcp')
    .set('Authorization', `Bearer ${clientId}`)
    .set('Accept', 'application/json, text/event-stream')
    .send({ jsonrpc: '2.0', id: 1, method, params });

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri('microdo-test');
  process.env.AI_LIMIT_PER_HOUR = '5';
  app = require('../index');
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  generateContent.mockReset();
  getGenerativeModel.mockClear();
  if (mongoose.connection.readyState === 1) {
    await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
  }
});

describe('goals API', () => {
  test('rejects requests without a list key', async () => {
    const res = await request(app).get('/api/goals');
    expect(res.status).toBe(400);
  });

  test('creates a goal with AI steps, capped at six', async () => {
    aiReturns(['1', '2', '3', '4', '5', '6', '7', '8']);
    const res = await as(A).post('/api/goals', { title: 'Run a 5k' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Run a 5k');
    expect(res.body.steps.map((s) => s.title)).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  test('falls back to the next model when the first one fails', async () => {
    generateContent.mockRejectedValueOnce(quotaError());
    aiReturns(['From the second model']);
    const res = await as(A).post('/api/goals', { title: 'Run a 5k' });

    expect(res.status).toBe(201);
    expect(res.body.steps.map((s) => s.title)).toEqual(['From the second model']);
    expect(modelsCalled()).toEqual(['gemini-2.5-flash-lite', 'gemini-3.5-flash-lite']);
  });

  test('skips a model during its quota cooldown, then uses it again', async () => {
    generateContent.mockRejectedValueOnce(quotaError('0.3s'));
    aiReturns(['a'], ['b'], ['c']);

    await as(A).post('/api/goals', { title: 'First' });
    await as(A).post('/api/goals', { title: 'During cooldown' });
    expect(modelsCalled()).toEqual(['gemini-2.5-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.5-flash-lite']);

    await new Promise((resolve) => setTimeout(resolve, 350));
    await as(A).post('/api/goals', { title: 'After cooldown' });
    expect(modelsCalled()[3]).toBe('gemini-2.5-flash-lite');
  });

  test('answers 503 instead of fake steps when every model fails', async () => {
    generateContent.mockRejectedValue(new Error('Gemini down'));
    const res = await as(A).post('/api/goals', { title: 'Run a 5k' });

    expect(res.status).toBe(503);
    expect(res.body.error).toMatch(/MicroDo AI is busy/);
    expect((await as(A).get('/api/goals')).body).toHaveLength(0);
  });

  test('validates the title', async () => {
    expect((await as(A).post('/api/goals', { title: '   ' })).status).toBe(400);
    expect((await as(A).post('/api/goals', { title: 'x'.repeat(301) })).status).toBe(400);
  });

  test('keeps each list private', async () => {
    const goal = (await as(A).post('/api/goals', { title: 'Mine', useAI: false })).body;

    expect((await as(B).get('/api/goals')).body).toHaveLength(0);
    expect((await as(B).delete(`/api/goals/${goal._id}`)).status).toBe(404);
    expect((await as(A).get('/api/goals')).body).toHaveLength(1);
  });

  test('returns 404 for malformed ids instead of crashing', async () => {
    expect((await as(A).delete('/api/goals/not-an-id')).status).toBe(404);
  });
});

describe('breaking steps down', () => {
  const createGoal = async () => {
    aiReturns(['Step one', 'Step two']);
    return (await as(A).post('/api/goals', { title: 'Learn to juggle' })).body;
  };

  test('nests sub-steps right after their parent', async () => {
    const goal = await createGoal();
    const [one, two] = goal.steps;
    aiReturns(['a', 'b', 'c']);

    const res = await as(A).post(`/api/goals/${goal._id}/steps/${one._id}/breakdown`);

    expect(res.status).toBe(201);
    expect(res.body.steps.map((s) => s.title)).toEqual(['Step one', 'a', 'b', 'c', 'Step two']);
    const subSteps = res.body.steps.slice(1, 4);
    expect(subSteps.every((s) => s.parentId === one._id && s.depth === 1)).toBe(true);
    expect(res.body.steps[4]._id).toBe(two._id);
  });

  test('refuses to break a step down twice or past the depth limit', async () => {
    const goal = await createGoal();
    const one = goal.steps[0];

    aiReturns(['a', 'b']);
    const level1 = (await as(A).post(`/api/goals/${goal._id}/steps/${one._id}/breakdown`)).body;
    expect((await as(A).post(`/api/goals/${goal._id}/steps/${one._id}/breakdown`)).status).toBe(409);

    const a = level1.steps.find((s) => s.title === 'a');
    aiReturns(['x', 'y']);
    const level2 = (await as(A).post(`/api/goals/${goal._id}/steps/${a._id}/breakdown`)).body;

    const x = level2.steps.find((s) => s.title === 'x');
    expect(x.depth).toBe(2);
    expect((await as(A).post(`/api/goals/${goal._id}/steps/${x._id}/breakdown`)).status).toBe(400);
  });

  test('ticking a parent ticks its subtree, and completion rolls up', async () => {
    const goal = await createGoal();
    const one = goal.steps[0];
    aiReturns(['a', 'b']);
    await as(A).post(`/api/goals/${goal._id}/steps/${one._id}/breakdown`);

    const ticked = (await as(A).patch(`/api/goals/${goal._id}/steps/${one._id}`)).body;
    const byTitle = (g, t) => g.steps.find((s) => s.title === t);
    expect(['Step one', 'a', 'b'].every((t) => byTitle(ticked, t).isCompleted)).toBe(true);

    const reopened = (await as(A).patch(`/api/goals/${goal._id}/steps/${byTitle(ticked, 'a')._id}`)).body;
    expect(byTitle(reopened, 'a').isCompleted).toBe(false);
    expect(byTitle(reopened, 'Step one').isCompleted).toBe(false);
    expect(byTitle(reopened, 'b').isCompleted).toBe(true);
  });

  test('setting a target state is idempotent, so repeated requests cannot flip it back', async () => {
    const goal = await createGoal();
    const path = `/api/goals/${goal._id}/steps/${goal.steps[0]._id}`;

    await as(A).patch(path).send({ completed: true });
    const again = (await as(A).patch(path).send({ completed: true })).body;
    expect(again.steps[0].isCompleted).toBe(true);
  });
});

describe('AI rate limit', () => {
  test('caps AI requests per list per hour, without touching other lists or non-AI goals', async () => {
    for (let i = 0; i < 5; i++) {
      aiReturns(['step']);
      expect((await as(A).post('/api/goals', { title: `Goal ${i}` })).status).toBe(201);
    }

    const limited = await as(A).post('/api/goals', { title: 'One too many' });
    expect(limited.status).toBe(429);
    expect(generateContent).toHaveBeenCalledTimes(5);

    expect((await as(A).post('/api/goals', { title: 'No AI', useAI: false })).status).toBe(201);
    aiReturns(['step']);
    expect((await as(B).post('/api/goals', { title: 'Other list' })).status).toBe(201);
  });
});

describe('MCP server', () => {
  test('requires the list key as a bearer token', async () => {
    const res = await request(app).post('/api/mcp').send({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
    expect(res.status).toBe(401);
  });

  test('lists the five goal tools', async () => {
    const res = await mcp(A, 'tools/list');
    expect(res.body.result.tools.map((t) => t.name).sort()).toEqual(
      ['break_down_step', 'create_goal', 'delete_goal', 'list_goals', 'set_step_completed']
    );
  });

  test('creates a goal in the caller\'s list and completes a step idempotently', async () => {
    aiReturns(['First', 'Second']);
    const created = await mcp(A, 'tools/call', { name: 'create_goal', arguments: { title: 'Plan a trip' } });
    const goal = JSON.parse(created.body.result.content[0].text);

    expect(goal.progress).toBe('0/2 steps done');
    expect((await as(A).get('/api/goals')).body).toHaveLength(1);
    expect((await as(B).get('/api/goals')).body).toHaveLength(0);

    const args = { goal_id: goal.id, step_id: goal.steps[0].id, completed: true };
    await mcp(A, 'tools/call', { name: 'set_step_completed', arguments: args });
    const again = await mcp(A, 'tools/call', { name: 'set_step_completed', arguments: args });
    expect(JSON.parse(again.body.result.content[0].text).progress).toBe('1/2 steps done');
  });

  test('reports a missing goal as a tool error', async () => {
    const res = await mcp(A, 'tools/call', {
      name: 'delete_goal',
      arguments: { goal_id: '000000000000000000000000' }
    });
    expect(res.body.result.isError).toBe(true);
    expect(res.body.result.content[0].text).toBe('Goal not found');
  });
});

test('health check runs a database query', async () => {
  const res = await request(app).get('/api/health');
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ status: 'ok' });
});
