const Usage = require('../models/Usage');

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const PER_LIST_PER_HOUR = Number(process.env.AI_LIMIT_PER_HOUR) || 20;
const GLOBAL_PER_DAY = Number(process.env.AI_LIMIT_PER_DAY) || 500;

// Fixed-window counter stored in MongoDB, so the limit holds across serverless instances
const consume = async (name, windowMs) => {
  const bucket = Math.floor(Date.now() / windowMs);
  const update = () =>
    Usage.findOneAndUpdate(
      { key: `${name}:${bucket}` },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 1) * windowMs) } },
      { upsert: true, new: true }
    );

  try {
    return (await update()).count;
  } catch (error) {
    // Two first requests in the same window can race on the upsert; the retry finds the counter
    if (error.code === 11000) {
      return (await update()).count;
    }
    throw error;
  }
};

// Resolves to null when the AI call may go ahead, or to a reason it may not
const checkAiQuota = async (ownerId) => {
  if ((await consume(`ai:list:${ownerId}`, HOUR)) > PER_LIST_PER_HOUR) {
    return `You've reached the limit of ${PER_LIST_PER_HOUR} AI requests per hour. Please try again later.`;
  }
  if ((await consume('ai:global', DAY)) > GLOBAL_PER_DAY) {
    return 'MicroDo AI has reached its daily limit. Please try again tomorrow.';
  }
  return null;
};

module.exports = { checkAiQuota };
