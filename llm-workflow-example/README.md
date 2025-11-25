# Building Webhook-Enabled LLM Workflows in JavaScript

A complete, production-ready example demonstrating how to build reliable AI workflows with state management, retries, caching, and webhook integration using Codehooks.io.

**Live Blog Post**: https://codehooks.io/blog/building-llm-workflows-javascript

## Why This Matters

Building production AI applications involves more than just calling OpenAI's API. You need:

1. **State management** - Track data across multiple LLM calls
2. **Retries and idempotency** - Handle transient failures gracefully
3. **Rate limiting** - Deal with OpenAI's 429 errors
4. **Caching** - Avoid redundant API calls and control costs
5. **Persistence** - Store inputs, outputs, and results
6. **Webhooks** - Trigger workflows from external events
7. **Scheduling** - Support time-based and event-driven execution

This example shows how to solve all these problems without heavyweight orchestration platforms like Airflow or Prefect.

## What This Example Does

A **text summarization workflow** that:

- ✅ Accepts text via REST API or GitHub webhooks
- ✅ Checks cache before calling OpenAI (60-second TTL)
- ✅ Calls OpenAI with exponential backoff for rate limits
- ✅ Stores results in a database with metadata
- ✅ Verifies GitHub webhook signatures (HMAC-SHA256)
- ✅ Tracks workflow execution steps for debugging
- ✅ Handles errors gracefully with retries

**Workflow Steps**: start → checkCache → callOpenAI (if needed) → cacheAndStore → store → finish

## Quick Start

### 1. Installation

```bash
# Install Codehooks CLI
npm install -g codehooks

# Create new project
coho create llm-workflow
cd llm-workflow

# Install dependencies
npm install codehooks-js node-fetch
```

### 2. Set Environment Variables

```bash
# Required: OpenAI API key (encrypted storage)
coho set-env OPENAI_API_KEY 'sk-your-key-here' --encrypted

# Optional: GitHub webhook secret for signature verification
coho set-env GITHUB_WEBHOOK_SECRET 'your-webhook-secret' --encrypted
```

### 3. Deploy

```bash
# Copy index.js from this example to your project
# Get it here: https://github.com/RestDB/codehooks-io-examples/blob/main/llm-workflow-example/index.js

coho deploy

# Get your API URL and key
coho info --examples
```

### 4. Test It

```bash
# Start a summarization
curl -X POST https://YOUR-PROJECT.api.codehooks.io/dev/summaries \
  -H "Content-Type: application/json" \
  -H "x-apikey: YOUR-API-KEY" \
  -d '{
    "text": "Artificial intelligence is transforming software development. Large language models like GPT-4 can now write code, debug errors, and explain complex algorithms. However, production AI applications require careful orchestration of API calls, state management, error handling, and cost optimization."
  }'

# Fetch stored summaries
curl https://YOUR-PROJECT.api.codehooks.io/dev/summaries \
  -H "x-apikey: YOUR-API-KEY"

# Monitor workflow status
coho workflow-status --follow
```

## Architecture Highlights

### Reusable OpenAI Helper

The core of this example is a reusable helper function that handles:

- **Automatic retries** (3 attempts by default)
- **Exponential backoff** for HTTP 429 rate limits
- **Configurable options** (model, temperature, max_tokens)
- **Proper error propagation**

```javascript
async function callOpenAIWithRetry(messages, options = {}, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
      });

      // Handle rate limiting with exponential backoff
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
```

### Workflow Definition

The workflow uses Codehooks' state machine pattern:

```javascript
const summarizeWorkflow = app.createWorkflow(
  'summarize',
  'Summarize text using OpenAI and store the result',
  {
    start: async (state, goto) => {
      if (!state?.text) return goto(null, { error: 'Missing text input' });
      goto('checkCache', { ...state, steps: ['start'] });
    },

    checkCache: async (state, goto) => {
      // Check cache using MD5 hash of input text
      const db = await Datastore.open();
      const key = `summary:${crypto.createHash('md5').update(state.text).digest('hex')}`;
      const cached = await db.get(key);

      if (cached) {
        return goto('finish', { ...state, summary: cached, cached: true });
      }
      goto('callOpenAI', state);
    },

    callOpenAI: async (state, goto) => {
      const summary = await callOpenAIWithRetry(
        [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: `Summarize this: ${state.text}` },
        ],
        { model: 'gpt-4o-mini', temperature: 0.3, max_tokens: 300 }
      );
      goto('cacheAndStore', { ...state, summary });
    },

    // ... additional steps
  }
);
```

### Webhook Integration

Secure webhook endpoint with GitHub signature verification:

```javascript
app.post('/webhook/summarize', async (req, res) => {
  // Verify GitHub webhook signature
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

  // Extract text from GitHub issue or comment
  let text = '';
  if (req.body.issue) {
    text = `${req.body.issue.title} ${req.body.issue.body || ''}`;
  } else if (req.body.comment) {
    text = req.body.comment.body;
  }

  // Start workflow
  const result = await summarizeWorkflow.start({
    text: text.trim(),
    source: `github-issue-${req.body.issue?.number}`,
    repository: req.body.repository?.full_name,
  });

  res.json({ status: 'processing', workflowId: result._id });
});
```

## Cost Optimization Tips

1. **Use gpt-4o-mini** - Significantly cheaper than GPT-4 for most tasks
2. **Set max_tokens** - Control output size and costs
3. **Cache aggressively** - This example caches for 60 seconds with MD5 hashing
4. **Monitor usage** - Check OpenAI dashboard regularly

## GitHub Webhook Setup

To trigger this workflow from GitHub issues:

1. Go to your repository settings → Webhooks
2. Add webhook URL: `https://YOUR-PROJECT.api.codehooks.io/dev/webhook/summarize`
3. Content type: `application/json`
4. Secret: Same value as your `GITHUB_WEBHOOK_SECRET` env var
5. Events: Choose "Issues" and/or "Issue comments"
6. Save webhook

Now whenever someone creates an issue, your workflow will automatically generate a summary!

## Extending This Example

### Add Sentiment Analysis

Add a new step after `callOpenAI`:

```javascript
analyzeSentiment: async (state, goto) => {
  const sentiment = await callOpenAIWithRetry(
    [
      { role: 'system', content: 'You are a sentiment analyzer.' },
      { role: 'user', content: `Analyze sentiment: ${state.summary}` },
    ],
    { model: 'gpt-4o-mini', max_tokens: 50 }
  );
  goto('cacheAndStore', { ...state, sentiment });
},
```

### Use Claude or Gemini Instead

Replace the OpenAI fetch call with:

```javascript
// Claude (Anthropic)
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-3-haiku-20240307',
    max_tokens: 300,
    messages: [{ role: 'user', content: `Summarize: ${state.text}` }],
  }),
});
```

### Schedule Periodic Summaries

Add a cron job to summarize data daily:

```javascript
app.job('0 9 * * *', async (req, res) => {
  const db = await Datastore.open();
  const items = await db.getMany('items', { processed: false }).toArray();

  for (const item of items) {
    await summarizeWorkflow.start({ text: item.content });
  }

  res.end();
});
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/summaries` | Start summarization workflow |
| GET | `/summaries` | Fetch stored summaries (last 10) |
| POST | `/webhook/summarize` | GitHub webhook trigger |

## Workflow Monitoring

```bash
# Follow workflow execution in real-time
coho workflow-status --follow

# List all workflows
coho workflow-list

# Get specific workflow details
coho workflow-get <workflow-id>
```

## Key Differences from LangChain/LlamaIndex

This approach focuses on **operational orchestration** rather than prompt engineering:

- ✅ **State management** - Persist data between steps
- ✅ **Retries** - Automatic retry with exponential backoff
- ✅ **Scheduling** - Cron jobs and event triggers
- ✅ **Persistence** - Built-in database for caching and storage
- ✅ **No infrastructure** - Serverless deployment, no Docker/K8s

LangChain and LlamaIndex are better for complex prompt chains and RAG (retrieval-augmented generation). Use this when you need reliable production workflows.

## Production Considerations

### Error Handling
- All workflow steps include try-catch blocks
- Failed workflows are logged with step traces
- Use `coho logs` to debug issues

### Security
- API keys stored encrypted via `--encrypted` flag
- Webhook signatures verified with HMAC-SHA256
- Use `req.rawBody` for signature verification (not `req.body`)

### Idempotency
- Cache prevents duplicate OpenAI calls for same input
- Webhook IDs can be stored to prevent reprocessing
- Database unique constraints prevent duplicate storage

### Rate Limiting
- Exponential backoff handles OpenAI 429 errors
- Configurable retry attempts (default 3)
- Delays: 2s, 4s, 8s on subsequent retries

## Troubleshooting

### "OpenAI API error 401"
Check your API key: `coho get-env OPENAI_API_KEY`

### "Invalid signature" on webhooks
Ensure GitHub webhook secret matches: `coho get-env GITHUB_WEBHOOK_SECRET`

### Workflow not progressing
Check logs: `coho logs --follow`

### High costs
- Reduce `max_tokens` in options
- Increase cache TTL
- Use `gpt-4o-mini` instead of `gpt-4`

## Learn More

- **Blog Post**: https://codehooks.io/blog/building-llm-workflows-javascript
- **Codehooks Docs**: https://codehooks.io/docs
- **Workflow API**: https://codehooks.io/docs/workflow-api
- **OpenAI API Reference**: https://platform.openai.com/docs/api-reference

## License

MIT

## Contributing

Issues and pull requests welcome! This is an example repository to demonstrate production-ready LLM workflow patterns.
