# Usage Examples

Real-world examples of using this LLM workflow.

## Basic Summarization

### Short Text

```bash
curl -X POST https://your-project.api.codehooks.io/dev/summaries \
  -H "Content-Type: application/json" \
  -H "x-apikey: your-api-key" \
  -d '{
    "text": "JavaScript is a versatile programming language used for web development."
  }'
```

Response:
```json
{
  "_id": "workflow-abc123",
  "summary": "JavaScript is a versatile language primarily used for web development.",
  "cached": false,
  "steps": ["start", "checkCache", "callOpenAI", "cacheAndStore", "store", "finish"]
}
```

### Long Article

```bash
curl -X POST https://your-project.api.codehooks.io/dev/summaries \
  -H "Content-Type: application/json" \
  -H "x-apikey: your-api-key" \
  -d '{
    "text": "The history of computing spans over two centuries, from mechanical calculators to modern quantum computers. Charles Babbage designed the first mechanical computer in the 1830s, though it was never fully built. The ENIAC, built in 1945, was one of the first electronic general-purpose computers. The invention of the transistor in 1947 revolutionized computing, making machines smaller and more reliable. The microprocessor, introduced in 1971, enabled personal computers to become affordable and accessible. Today, computing power continues to grow exponentially, with developments in artificial intelligence, quantum computing, and distributed systems shaping the future of technology."
  }'
```

Response:
```json
{
  "_id": "workflow-def456",
  "summary": "Computing has evolved from Babbage's mechanical designs in the 1830s through ENIAC (1945), the transistor (1947), and the microprocessor (1971), making computers smaller and more accessible. Modern developments in AI, quantum computing, and distributed systems continue to drive exponential growth in computing power.",
  "cached": false,
  "completed": true
}
```

## GitHub Webhook Examples

### Issue Created Event

```bash
curl -X POST https://your-project.api.codehooks.io/dev/webhook/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "action": "opened",
    "issue": {
      "number": 123,
      "title": "Memory leak in dashboard component",
      "body": "After running the dashboard for several hours, the browser tab becomes unresponsive. Memory profiling shows that event listeners are not being cleaned up properly when components unmount. This affects Chrome, Firefox, and Safari. Steps to reproduce: 1) Open dashboard 2) Navigate between pages repeatedly 3) After ~2 hours, tab freezes."
    },
    "repository": {
      "full_name": "mycompany/webapp"
    }
  }'
```

Response:
```json
{
  "status": "processing",
  "workflowId": "workflow-ghi789"
}
```

The summary will be stored as:
```json
{
  "text": "Memory leak in dashboard component\n\nAfter running the dashboard...",
  "summary": "A memory leak in the dashboard component causes browser tabs to freeze after ~2 hours due to event listeners not being cleaned up on component unmount. The issue affects all major browsers and is reproducible by navigating between pages repeatedly.",
  "source": "github-issue-123",
  "repository": "mycompany/webapp"
}
```

### Issue Comment Event

```bash
curl -X POST https://your-project.api.codehooks.io/dev/webhook/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "action": "created",
    "comment": {
      "id": 9876,
      "body": "I found the root cause. The problem is in the useEffect hook on line 245 of Dashboard.jsx. The cleanup function is missing a return statement, so addEventListener is called but removeEventListener never runs. Fix: Change `useEffect(() => { ... })` to `useEffect(() => { ... return () => cleanup() })`"
    },
    "issue": {
      "number": 123
    },
    "repository": {
      "full_name": "mycompany/webapp"
    }
  }'
```

Response:
```json
{
  "status": "processing",
  "workflowId": "workflow-jkl012"
}
```

## Testing Cache Behavior

### First Request (Cache Miss)

```bash
time curl -X POST https://your-project.api.codehooks.io/dev/summaries \
  -H "Content-Type: application/json" \
  -H "x-apikey: your-api-key" \
  -d '{"text": "React hooks changed the way we write React components."}'
```

Response (1-3 seconds):
```json
{
  "summary": "React hooks revolutionized component development in React.",
  "cached": false
}
```

### Second Request (Cache Hit)

Run immediately after first request:

```bash
time curl -X POST https://your-project.api.codehooks.io/dev/summaries \
  -H "Content-Type: application/json" \
  -H "x-apikey: your-api-key" \
  -d '{"text": "React hooks changed the way we write React components."}'
```

Response (< 100ms):
```json
{
  "summary": "React hooks revolutionized component development in React.",
  "cached": true
}
```

Notice:
- Same summary text
- `cached: true` instead of `false`
- Much faster response time

## Fetching Stored Summaries

### Get Recent Summaries

```bash
curl https://your-project.api.codehooks.io/dev/summaries \
  -H "x-apikey: your-api-key"
```

Response:
```json
[
  {
    "_id": "doc-1",
    "text": "Original text 1...",
    "summary": "Summary 1...",
    "source": "api",
    "cached": false,
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  {
    "_id": "doc-2",
    "text": "Original text 2...",
    "summary": "Summary 2...",
    "source": "github-issue-42",
    "repository": "owner/repo",
    "cached": false,
    "createdAt": "2025-01-15T10:25:00.000Z"
  }
]
```

### Limit Results

```bash
curl https://your-project.api.codehooks.io/dev/summaries?limit=3 \
  -H "x-apikey: your-api-key"
```

Returns only 3 most recent summaries.

## Error Handling Examples

### Missing Text Field

```bash
curl -X POST https://your-project.api.codehooks.io/dev/summaries \
  -H "Content-Type: application/json" \
  -H "x-apikey: your-api-key" \
  -d '{}'
```

Response (400 Bad Request):
```json
{
  "error": "Missing required field: text"
}
```

### Invalid API Key

```bash
curl https://your-project.api.codehooks.io/dev/summaries \
  -H "x-apikey: wrong-key"
```

Response (401 Unauthorized):
```json
{
  "error": "Unauthorized"
}
```

### Empty Webhook Payload

```bash
curl -X POST https://your-project.api.codehooks.io/dev/webhook/summarize \
  -H "Content-Type: application/json" \
  -d '{}'
```

Response (400 Bad Request):
```json
{
  "error": "No text content found in webhook payload"
}
```

## Advanced Use Cases

### Slack Integration

Send Slack messages for summarization:

```bash
curl -X POST https://your-project.api.codehooks.io/dev/webhook/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hey team, we need to discuss the Q4 roadmap. I think we should prioritize the mobile app redesign and the API v2 migration. Let me know your thoughts.",
    "source": "slack-message-id-123"
  }'
```

### Email Processing

Summarize email content:

```bash
curl -X POST https://your-project.api.codehooks.io/dev/summaries \
  -H "Content-Type: application/json" \
  -H "x-apikey: your-api-key" \
  -d '{
    "text": "Subject: Q4 Budget Proposal\n\nDear Team,\n\nI wanted to share our preliminary Q4 budget proposal. We are requesting an increase of 15% over Q3 to account for three new hires in engineering, expanded marketing campaigns, and infrastructure upgrades. The detailed breakdown is attached.\n\nPlease review and provide feedback by Friday.\n\nBest,\nJane"
  }'
```

### RSS Feed Items

Summarize blog posts or articles:

```bash
curl -X POST https://your-project.api.codehooks.io/dev/summaries \
  -H "Content-Type: application/json" \
  -H "x-apikey: your-api-key" \
  -d '{
    "text": "Title: The Future of Web Development\n\nWeb development is evolving rapidly with new frameworks, tools, and paradigms emerging constantly. Server components in React, edge computing with Cloudflare Workers, and real-time collaboration features are reshaping how we build web applications. This article explores these trends and what they mean for developers in 2025."
  }'
```

## Monitoring Examples

### Check Workflow Status

```bash
# List all workflows
coho workflow-list

# Get specific workflow
coho workflow-get workflow-abc123

# Follow workflow execution
coho workflow-status --follow
```

### View Logs

```bash
# Follow application logs
coho logs --follow

# Filter for errors
coho logs --filter "error"

# Filter for specific workflow
coho logs --filter "workflow-abc123"
```

## Testing Script

Save this as `test.sh`:

```bash
#!/bin/bash

API_URL="https://your-project.api.codehooks.io/dev"
API_KEY="your-api-key"

echo "Test 1: Basic summarization"
curl -X POST "$API_URL/summaries" \
  -H "Content-Type: application/json" \
  -H "x-apikey: $API_KEY" \
  -d '{"text": "Test content for summarization"}'

echo "\n\nTest 2: Fetch summaries"
curl "$API_URL/summaries?limit=5" \
  -H "x-apikey: $API_KEY"

echo "\n\nTest 3: Webhook trigger"
curl -X POST "$API_URL/webhook/summarize" \
  -H "Content-Type: application/json" \
  -d '{"text": "Webhook test content"}'
```

Run with:
```bash
chmod +x test.sh
./test.sh
```

## Integration Examples

### Node.js Client

```javascript
const API_URL = 'https://your-project.api.codehooks.io/dev';
const API_KEY = 'your-api-key';

async function summarizeText(text) {
  const response = await fetch(`${API_URL}/summaries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-apikey': API_KEY,
    },
    body: JSON.stringify({ text }),
  });

  return await response.json();
}

// Usage
const result = await summarizeText('Your text here');
console.log(result.summary);
```

### Python Client

```python
import requests

API_URL = 'https://your-project.api.codehooks.io/dev'
API_KEY = 'your-api-key'

def summarize_text(text):
    response = requests.post(
        f'{API_URL}/summaries',
        headers={
            'Content-Type': 'application/json',
            'x-apikey': API_KEY,
        },
        json={'text': text}
    )
    return response.json()

# Usage
result = summarize_text('Your text here')
print(result['summary'])
```

### React Frontend

```jsx
import { useState } from 'react';

function SummarizeForm() {
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        'https://your-project.api.codehooks.io/dev/summaries',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-apikey': 'your-api-key',
          },
          body: JSON.stringify({ text }),
        }
      );

      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to summarize..."
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Summarizing...' : 'Summarize'}
      </button>
      {summary && <p>Summary: {summary}</p>}
    </form>
  );
}
```
