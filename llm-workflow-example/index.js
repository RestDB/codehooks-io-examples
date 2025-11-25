import { app, Datastore } from 'codehooks-js';
import fetch from 'node-fetch';
import crypto from 'crypto';

// Reusable OpenAI helper with retries and exponential backoff
async function callOpenAIWithRetry(messages, options = {}, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: options.model || 'gpt-4o-mini',
            messages,
            temperature: options.temperature ?? 0.3,
            max_tokens: options.max_tokens ?? 300,
          }),
        }
      );

      if (response.status === 429) {
        const delay = Math.pow(2, attempt) * 1000;
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }

      if (!response.ok) {
        const error = await response.text().catch(() => 'Unknown error');
        throw new Error(`OpenAI API error ${response.status}: ${error}`);
      }

      const data = await response.json();
      return data?.choices?.[0]?.message?.content?.trim() || '';
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// GitHub webhook signature verification
function verifyGitHubSignature(rawBody, signatureWithPrefix, secret) {
  if (!signatureWithPrefix || !secret) return false;
  if (!signatureWithPrefix.startsWith('sha256=')) return false;

  const signature = signatureWithPrefix.slice('sha256='.length);
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// Workflow definition
const summarizeWorkflow = app.createWorkflow(
  'summarize',
  'Summarize text using OpenAI and store the result',
  {
    start: async (state, goto) => {
      if (!state?.text) return goto(null, { error: 'Missing text input' });
      goto('checkCache', { ...state, steps: ['start'] });
    },

    checkCache: async (state, goto) => {
      const db = await Datastore.open();
      const key = `summary:${crypto
        .createHash('md5')
        .update(state.text)
        .digest('hex')}`;

      const cached = await db.get(key);
      const newState = {
        ...state,
        steps: [...(state.steps || []), 'checkCache'],
      };

      if (cached) {
        return goto('finish', {
          ...newState,
          summary: cached,
          cached: true,
        });
      }
      goto('callOpenAI', newState);
    },

    callOpenAI: async (state, goto) => {
      const newState = {
        ...state,
        steps: [...(state.steps || []), 'callOpenAI'],
      };

      const summary = await callOpenAIWithRetry(
        [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: `Summarize this:${state.text}` },
        ],
        {
          model: 'gpt-4o-mini',
          temperature: 0.3,
          max_tokens: 300,
        }
      );

      goto('cacheAndStore', { ...newState, summary });
    },

    cacheAndStore: async (state, goto) => {
      const db = await Datastore.open();
      const key = `summary:${crypto
        .createHash('md5')
        .update(state.text)
        .digest('hex')}`;

      await db.set(key, state.summary, { ttl: 60 * 1000 });

      goto('store', {
        ...state,
        steps: [...(state.steps || []), 'cacheAndStore'],
      });
    },

    store: async (state, goto) => {
      const db = await Datastore.open();
      const doc = await db.insertOne('summaries', {
        text: state.text,
        summary: state.summary,
        cached: !!state.cached,
        source: state.source || 'api',
        repository: state.repository || null,
        createdAt: new Date().toISOString(),
      });

      goto('finish', {
        ...state,
        ...doc,
        steps: [...(state.steps || []), 'store'],
      });
    },

    finish: async (state, goto) => {
      const steps = [...(state.steps || []), 'finish'];
      console.log('Workflow finished');
      console.log('WorkflowId:', state._id || 'N/A');
      console.log('Steps executed:', steps.join(' → '));
      goto(null, { ...state, steps });
    },
  }
);

// HTTP Endpoints

// Direct API trigger for summarization
app.post('/summaries', async (req, res) => {
  const result = await summarizeWorkflow.start({ text: req.body?.text });
  res.json(result);
});

// Fetch stored summaries
app.get('/summaries', async (req, res) => {
  const db = await Datastore.open();
  const items = await db
    .getMany('summaries', {}, { sort: { createdAt: -1 }, limit: 10 })
    .toArray();
  res.json(items);
});

// Webhook endpoint for GitHub issues
app.post('/webhook/summarize', async (req, res) => {
  if (process.env.GITHUB_WEBHOOK_SECRET) {
    const signature = req.headers['x-hub-signature-256'];
    const ok = verifyGitHubSignature(
      req.rawBody,
      signature,
      process.env.GITHUB_WEBHOOK_SECRET
    );
    if (!ok) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  let text = '';
  let source = 'webhook';

  if (req.body.issue) {
    text = `${req.body.issue.title}${req.body.issue.body || ''}`;
    source = `github-issue-${req.body.issue.number}`;
  } else if (req.body.comment) {
    text = req.body.comment.body;
    source = `github-comment-${req.body.comment.id}`;
  } else {
    text = req.body?.content || req.body?.text || req.body?.message || '';
  }

  if (!text || text.trim().length === 0) {
    return res
      .status(400)
      .json({ error: 'No text content in webhook payload' });
  }

  const result = await summarizeWorkflow.start({
    text: text.trim(),
    source,
    repository: req.body.repository?.full_name || 'unknown',
  });

  res.json({ status: 'processing', workflowId: result._id });
});

export default app.init();
