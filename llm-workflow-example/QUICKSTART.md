# Quick Start Guide

Get this example running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))
- Codehooks CLI installed: `npm install -g codehooks`

## Step-by-Step Setup

### 1. Create Project

```bash
# Create new Codehooks project
coho create llm-workflow
cd llm-workflow

# Install dependencies
npm install codehooks-js node-fetch
```

### 2. Copy Code

Copy [`index.js`](https://github.com/RestDB/codehooks-io-examples/blob/main/llm-workflow-example/index.js) from this example to your project directory.

### 3. Configure Environment

```bash
# Set your OpenAI API key (encrypted storage)
coho set-env OPENAI_API_KEY "sk-your-actual-key-here" --encrypted

# Optional: Set GitHub webhook secret
coho set-env GITHUB_WEBHOOK_SECRET "your-webhook-secret" --encrypted
```

### 4. Deploy

```bash
# Deploy to Codehooks.io
coho deploy

# Get your API URL and key
coho info --examples
```

You'll see output like:

```
Project URL: https://llm-workflow-4cqe.api.codehooks.io
API Key: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Space: dev
```

### 5. Test It

Replace `YOUR-PROJECT-URL` and `YOUR-API-KEY` with values from step 4:

```bash
# Test summarization
curl -X POST https://YOUR-PROJECT-URL/dev/summaries \
  -H "Content-Type: application/json" \
  -H "x-apikey: YOUR-API-KEY" \
  -d '{
    "text": "Artificial intelligence is transforming software development. Large language models like GPT-4 can now write code, debug errors, and explain complex algorithms. However, production AI applications require careful orchestration of API calls, state management, error handling, and cost optimization. This example demonstrates how to build reliable AI workflows without heavyweight infrastructure."
  }'
```

Expected response:

```json
{
  "_id": "workflow-abc123",
  "text": "Artificial intelligence is transforming...",
  "summary": "AI is revolutionizing software development through large language models like GPT-4, which can code, debug, and explain algorithms. Production AI applications need proper orchestration, state management, and cost optimization. This example shows how to build reliable AI workflows efficiently.",
  "cached": false,
  "source": "api",
  "steps": [
    "start",
    "checkCache",
    "callOpenAI",
    "cacheAndStore",
    "store",
    "finish"
  ],
  "completed": true,
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

### 6. Fetch Stored Summaries

```bash
curl https://YOUR-PROJECT-URL/dev/summaries \
  -H "x-apikey: YOUR-API-KEY"
```

### 7. Monitor Workflows

```bash
# Watch workflow execution in real-time
coho workflow-status --follow

# View application logs
coho logs --follow
```

## Testing the Cache

Run the same request twice - the second request should be instant and return `"cached": true`:

```bash
# First request - calls OpenAI
curl -X POST https://YOUR-PROJECT-URL/dev/summaries \
  -H "Content-Type: application/json" \
  -H "x-apikey: YOUR-API-KEY" \
  -d '{"text": "Hello world"}'

# Second request (within 60 seconds) - uses cache
curl -X POST https://YOUR-PROJECT-URL/dev/summaries \
  -H "Content-Type: application/json" \
  -H "x-apikey: YOUR-API-KEY" \
  -d '{"text": "Hello world"}'
```

## Setting Up GitHub Webhook (Optional)

1. Go to your GitHub repository → Settings → Webhooks
2. Click "Add webhook"
3. Configure:
   - **Payload URL**: `https://YOUR-PROJECT-URL/dev/webhook/summarize`
   - **Content type**: `application/json`
   - **Secret**: Same value as your `GITHUB_WEBHOOK_SECRET`
   - **Events**: Select "Issues" and/or "Issue comments"
4. Click "Add webhook"

Now when someone creates an issue, it will be automatically summarized!

## Troubleshooting

### Error: "OpenAI API error 401"

Your API key is incorrect. Check with:

```bash
coho get-env OPENAI_API_KEY
```

### Error: "Missing text input"

You forgot to include the `text` field in your request body.

### Webhook returns "Invalid signature"

Your GitHub webhook secret doesn't match. Update with:

```bash
coho set-env GITHUB_WEBHOOK_SECRET "correct-secret" --encrypted
coho deploy
```

### Workflow not completing

Check the logs for errors:

```bash
coho logs --follow
```

## Next Steps

- Read the full [README.md](README.md) for architecture details
- Check the [blog post](https://codehooks.io/blog/building-llm-workflows-javascript) for in-depth explanations
- Extend the workflow with sentiment analysis or classification
- Try other LLM providers (Claude, Gemini)
- Add scheduled jobs for periodic processing

## Cost Optimization

This example uses `gpt-4o-mini` which is very affordable (as of 2025-11-25):

- ~$0.15 per 1M input tokens
- ~$0.60 per 1M output tokens

At 300 max tokens per summary:

- 1,000 summaries ≈ $0.30
- 10,000 summaries ≈ $3.00

The 60-second cache further reduces costs for duplicate requests.

## Questions?

- **Docs**: https://codehooks.io/docs
- **Blog**: https://codehooks.io/blog/building-llm-workflows-javascript
- **Support**: GitHub Issues on this repository
