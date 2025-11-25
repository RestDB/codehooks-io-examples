# Architecture Deep Dive

This document explains the technical architecture of the LLM workflow example.

## Overview

This example demonstrates a production-ready pattern for building AI workflows that need:

1. **Reliability** - Automatic retries, error handling, graceful degradation
2. **Cost efficiency** - Caching, token limits, smart model selection
3. **Observability** - Step tracking, logging, workflow monitoring
4. **Integration** - REST APIs, webhooks, scheduled jobs
5. **State management** - Persistent workflow state across multiple steps

## Workflow State Machine

### State Flow Diagram

```
┌─────────┐
│  start  │ - Validate input, initialize state
└────┬────┘
     │
     ▼
┌────────────┐
│ checkCache │ - Look for cached summary (MD5 hash key)
└─────┬──────┘
      │
      ├─── Cache hit ────────────────────┐
      │                                  │
      └─── Cache miss                    │
           │                             │
           ▼                             ▼
      ┌────────────┐              ┌────────┐
      │ callOpenAI │              │ finish │ (cached: true)
      └─────┬──────┘              └────────┘
            │
            ▼
      ┌──────────────┐
      │ cacheAndStore│ - Store in cache (60s TTL)
      └──────┬───────┘
             │
             ▼
      ┌───────┐
      │ store │ - Persist to database
      └───┬───┘
          │
          ▼
      ┌────────┐
      │ finish │ (cached: false)
      └────────┘
```

### State Object Structure

Each workflow step receives and modifies a state object:

```javascript
{
  _id: 'workflow-abc123',           // Workflow instance ID
  text: 'Original text...',         // Input text to summarize
  summary: 'Generated summary...',  // OpenAI-generated summary
  cached: false,                    // Whether result came from cache
  source: 'api',                    // Trigger source (api/webhook/github-issue-*)
  repository: 'owner/repo',         // GitHub repo (if webhook)
  steps: ['start', 'checkCache'],   // Execution trace
  createdAt: '2025-01-15T...',     // Timestamp
  completed: true                   // Final status
}
```

### Why a State Machine?

Traditional async/await code doesn't preserve state across failures:

```javascript
// ❌ Problem: If server crashes between steps, state is lost
async function summarize(text) {
  const cached = await checkCache(text);
  if (cached) return cached;

  const summary = await callOpenAI(text); // What if this fails?
  await store(summary);
  return summary;
}
```

With workflow state machine:

```javascript
// ✅ Solution: Each step is atomic, state persists
checkCache: async (state, goto) => {
  const cached = await db.get(key);
  if (cached) return goto('finish', { ...state, cached: true });
  goto('callOpenAI', state);
};
```

Benefits:

- State survives crashes and redeploys
- Can pause/resume workflows (e.g., wait for human approval)
- Full audit trail of execution
- Retry individual steps without restarting

## OpenAI Integration

### Retry Logic with Exponential Backoff

```javascript
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

      // Handle rate limiting (HTTP 429)
      if (response.status === 429) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue; // Retry
        }
      }

      if (!response.ok) {
        const error = await response.text().catch(() => 'Unknown error');
        throw new Error(`OpenAI API error ${response.status}: ${error}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
}
```

**Key features:**

- **3 retry attempts** - Handles transient network errors
- **Exponential backoff** - 2s, 4s, 8s delays for rate limits
- **Linear backoff** - 1s, 2s, 3s delays for other errors
- **Error propagation** - Throws after max retries for workflow error handling

### Cost Optimization

#### 1. Model Selection

```javascript
model: 'gpt-4o-mini'; // $0.15/1M input tokens vs GPT-4 $30/1M
```

#### 2. Token Limits

```javascript
max_tokens: 300; // Prevents runaway costs from verbose responses
```

#### 3. Temperature Control

```javascript
temperature: 0.3; // Lower = more focused, fewer wasted tokens
```

#### 4. Caching Strategy

```javascript
// Cache key: MD5 hash of input text (deterministic)
const key = `summary:${crypto
  .createHash('md5')
  .update(state.text)
  .digest('hex')}`;

// 60-second TTL (adjust based on use case)
await db.set(key, state.summary, { ttl: 60 * 1000 });
```

**Cache hit rate impact:**

- 50% hit rate = 50% cost reduction
- 80% hit rate = 80% cost reduction
- 95% hit rate = 95% cost reduction

## Webhook Security

### HMAC-SHA256 Signature Verification

GitHub signs webhooks with HMAC-SHA256. We verify this to prevent unauthorized requests:

```javascript
function verifyGitHubSignature(rawBody, signatureWithPrefix, secret) {
  if (!signatureWithPrefix || !secret) return false;
  if (!signatureWithPrefix.startsWith('sha256=')) return false;

  const signature = signatureWithPrefix.slice('sha256='.length);

  // Compute expected signature
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody) // MUST use raw body, not parsed JSON
    .digest('hex');

  // Timing-safe comparison prevents timing attacks
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

**Critical details:**

- Use `req.rawBody` (unparsed) not `req.body` (parsed)
- Use `crypto.timingSafeEqual()` to prevent timing attacks
- Return 401 for invalid signatures
- Log failed attempts for security monitoring

### Webhook Flow

```
GitHub Event
    │
    ├─ Signs payload with HMAC-SHA256
    │
    ▼
POST /webhook/summarize
    │
    ├─ Verify signature (req.rawBody)
    │     └─ Invalid → 401 Unauthorized
    │
    ├─ Extract text (issue.title + issue.body)
    │
    ├─ Start workflow
    │     └─ Returns workflow ID
    │
    ▼
Return 200 OK { status: 'processing', workflowId: '...' }
    │
    └─ Workflow runs asynchronously
```

## Database Design

### Collections

#### `summaries` Collection

Stores all generated summaries with metadata:

```javascript
{
  _id: 'doc-xyz789',              // Auto-generated
  text: 'Original text...',       // Input text
  summary: 'Generated summary...', // OpenAI output
  cached: false,                   // Cache hit indicator
  source: 'github-issue-42',       // Trigger source
  repository: 'owner/repo',        // GitHub repo (if applicable)
  createdAt: '2025-01-15T10:30:00.000Z'
}
```

**Indexes:**

- `createdAt` (descending) - For recent summaries query
- `source` - For filtering by trigger type
- `repository` - For per-repo analytics

#### Key-Value Store (Cache)

Temporary cache for deduplication:

```javascript
Key: summary:${md5(text)}
Value: "The generated summary text"
TTL: 60 seconds
```

**Why MD5?**

- Fast hashing (< 1ms for typical text)
- Consistent keys for identical text
- Small key size (32 hex chars)

**Note:** MD5 is fine for cache keys. Don't use for security.

## API Endpoints

### POST /summaries

**Purpose:** Direct API trigger for summarization

**Request:**

```json
{
  "text": "Text to summarize..."
}
```

**Response:**

```json
{
  "_id": "workflow-abc123",
  "summary": "The summary...",
  "cached": false,
  "steps": [
    "start",
    "checkCache",
    "callOpenAI",
    "cacheAndStore",
    "store",
    "finish"
  ],
  "completed": true
}
```

**Use cases:**

- User-initiated summarization
- API integrations
- Testing and development

### GET /summaries

**Purpose:** Retrieve stored summaries

**Query params:**

- `limit` (default 10, max 50)

**Response:**

```json
[
  {
    "_id": "doc-xyz789",
    "text": "Original...",
    "summary": "Summary...",
    "source": "api",
    "createdAt": "2025-01-15T..."
  }
]
```

**Use cases:**

- Dashboard displays
- Analytics
- Audit trail

### POST /webhook/summarize

**Purpose:** Event-driven webhook trigger

**Supports:**

- GitHub issues (`issue.title` + `issue.body`)
- GitHub comments (`comment.body`)
- Generic webhooks (`content`, `text`, or `message` field)

**Response:**

```json
{
  "status": "processing",
  "workflowId": "workflow-abc123"
}
```

**Use cases:**

- Auto-summarize GitHub issues
- Process Slack messages
- Handle Stripe events
- Any external system integration

## Extending the Workflow

### Add Sentiment Analysis

```javascript
const extendedWorkflow = app.createWorkflow('summarize-and-analyze', {
  // ... existing steps ...

  analyzeSentiment: async (state, goto) => {
    const sentiment = await callOpenAIWithRetry(
      [
        {
          role: 'system',
          content: 'Analyze sentiment: positive, negative, or neutral',
        },
        { role: 'user', content: state.summary },
      ],
      { max_tokens: 10 }
    );

    goto('store', { ...state, sentiment });
  },
});
```

### Add Classification

```javascript
classify: async (state, goto) => {
  const category = await callOpenAIWithRetry(
    [
      {
        role: 'system',
        content: 'Classify this text: bug, feature, question, or documentation',
      },
      { role: 'user', content: state.text },
    ],
    { max_tokens: 5 }
  );

  goto('checkCache', { ...state, category });
};
```

### Use Different LLM Providers

#### Claude (Anthropic)

```javascript
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

#### Google Gemini

```javascript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_API_KEY}`,
  {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: `Summarize: ${state.text}` }],
        },
      ],
    }),
  }
);
```

## Monitoring and Debugging

### Workflow Status

```bash
# Real-time workflow monitoring
coho workflow-status --follow

# List all workflows
coho workflow-list

# Get specific workflow
coho workflow-get <workflow-id>
```

### Application Logs

```bash
# Follow logs in real-time
coho logs --follow

# Filter logs
coho logs --filter "error"
```

### Step Tracing

Every workflow tracks its execution path:

```javascript
steps: [
  'start',
  'checkCache',
  'callOpenAI',
  'cacheAndStore',
  'store',
  'finish',
];
```

Use this to debug:

- Which steps executed?
- Did workflow complete?
- Where did it fail?

### Error Handling Pattern

```javascript
callOpenAI: async (state, goto) => {
  try {
    const summary = await callOpenAIWithRetry(messages, options);
    goto('cacheAndStore', { ...state, summary });
  } catch (error) {
    console.error('OpenAI failed:', error.message);
    goto(null, {
      ...state,
      error: error.message,
      steps: [...state.steps, 'error'],
    });
  }
};
```

**Best practices:**

- Log errors with context
- Include error in final state
- Track error step in execution trace
- Return gracefully (don't crash)

## Performance Characteristics

### Latency

| Operation            | Cold Start | Warm    |
| -------------------- | ---------- | ------- |
| Cache hit            | 50-100ms   | 20-50ms |
| OpenAI call          | 1-3s       | 1-3s    |
| Database write       | 50-100ms   | 20-50ms |
| Webhook verification | < 10ms     | < 10ms  |

### Throughput

- **Concurrent workflows:** 1000+ (limited by OpenAI rate limits)
- **Database writes:** 10,000+ per second
- **Cache reads:** 100,000+ per second

### Cost at Scale

Assuming 10,000 summaries/day:

| Component                  | Cost           |
| -------------------------- | -------------- |
| OpenAI API (80% cache hit) | ~$6/day        |
| Codehooks compute          | $0 (free tier) |
| Database storage           | $0 (free tier) |
| **Total**                  | **~$6/day**    |

## Security Checklist

- ✅ API keys stored encrypted (`--encrypted` flag)
- ✅ Webhook signatures verified (HMAC-SHA256)
- ✅ No secrets in code or logs
- ✅ HTTPS-only endpoints
- ✅ Rate limiting via OpenAI retry logic
- ✅ Input validation (text length, format)
- ✅ Error messages don't leak sensitive data

## References

- [Blog Post](https://codehooks.io/blog/building-llm-workflows-javascript)
- [Codehooks Workflow API](https://codehooks.io/docs/workflow-api)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [GitHub Webhook Security](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries)
