# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository contains example applications demonstrating various capabilities of the Codehooks.io serverless backend platform. Each subdirectory is a standalone example showcasing different features like CRUD APIs, real-time communication, file handling, authentication, and integrations with external services.

## Codehooks.io Architecture Fundamentals

### Core Pattern

Every Codehooks.io backend follows this essential structure:

```javascript
import { app } from 'codehooks-js'

// Define routes
app.get('/path', async (req, res) => { /* ... */ })
app.post('/path', async (req, res) => { /* ... */ })

// MANDATORY: bind to serverless runtime
export default app.init()
```

**Critical**: All backend files MUST end with `export default app.init()` to bind to the serverless runtime.

### Common Imports and Features

- `app` - HTTP server instance (Express-like API)
- `Datastore` - NoSQL database for persistent storage
- `realtime` - Server-Sent Events (SSE) for real-time client communication
- `crudlify` - Auto-generates REST CRUD endpoints from schemas

Example with all features:
```javascript
import { app, Datastore, realtime } from 'codehooks-js'
import crudlify from 'codehooks-crudlify'
```

### Database (Datastore) Pattern

```javascript
const conn = await Datastore.open()

// Insert
const result = await conn.insertOne('collection', { field: 'value' })

// Query
const doc = await conn.getOne('collection', documentId)
const docs = await conn.getMany('collection', { query }, { sort, limit }).toArray()

// Update
await conn.updateOne('collection', documentId, {
  '$set': { field: 'newValue' },
  '$push': { arrayField: item }
})
```

### Real-time (SSE) Pattern

```javascript
// Server: Create channel and listener
realtime.createChannel('/channelName')

app.post('/connect', async (req, res) => {
  const listenerData = await realtime.createListener('/channelName', interests)
  res.json({ listenerID: listenerData._id })
})

// Server: Publish events to all listeners
await realtime.publishEvent('/channelName', { type: 'event', data: {...} })

// Client connects to: GET /channelName/:listenerID
// Receives events via EventSource
```

### CRUD Auto-generation

```javascript
import crudlify from 'codehooks-crudlify'

// Creates full REST API (GET, POST, PUT, DELETE) for each collection
crudlify(app, { customers, products })

// Optionally with Yup schema validation (see crud/schema.js)
```

### Static File Serving

```javascript
// Serve static files from /public directory
app.static({
  route: '/public',
  directory: '/public'
})

// Serve SPA with client-side routing
app.static({
  route: '/app',
  directory: '/dist',
  default: 'index.html',
  notFound: '/index.html'  // Essential for React Router, etc.
})
```

### Authentication Middleware

```javascript
// Apply to all routes
app.auth('/*', (req, res, next) => {
  // Validation logic
  next()  // or res.status(403).end()
})

// Apply to specific routes
app.auth('/admin/*', (req, res, next) => { /* ... */ })
```

### Cron Jobs

```javascript
// Run scheduled tasks (cron format: minute hour day month weekday)
app.job('0 2 * * *', async (req, res) => {
  // Runs daily at 2:00 AM
  console.log('Running scheduled task')
  res.end()  // Signal completion
})
```

## Project Types

### Backend-Only Examples
- `crud/` - Auto-CRUD with Yup schema validation
- `realtime-chat/` - SSE-based chat
- `aws-s3/` - Binary file streaming to/from S3
- `binary-streams/` - Direct binary stream handling
- `mailgun/`, `mailgunexample/` - Email integration
- `mongodb-external/` - External MongoDB connection
- `chatgpt-rest-api/` - OpenAI API integration

### Full-Stack Examples
- `react-workflow-client/` - React frontend + Codehooks backend with Workflow API and SSE
- `nextjs-todo/` - Next.js app consuming Codehooks CRUD API
- `react-backend-example/` - React with custom backend
- `svelte-todo/` - Svelte consuming backend API
- `alpinejs-dataadmin/` - Alpine.js admin interface
- `alpinejs-players/` - Alpine.js with backend

### Static/Client Examples
- `dynamicweb/` - Server-side template rendering
- `bsgenerator/` - Static site deployment
- `static/` - Pure static file serving

## Common Development Commands

### Deploy Codehooks Backend
```bash
# Initialize new Codehooks project (one-time)
coho init

# Deploy code
coho deploy

# Deploy with file upload
coho deploy --upload

# Get project info (URL, token)
coho info
```

### Upload Static Files
```bash
# Upload directory to backend
coho upload --src './public' --target '/public'
coho file-upload --src './app' --target '/app'
```

### Frontend Development (where applicable)
```bash
# React/Next.js/Svelte projects
npm install
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

### Full-Stack Deployment Pattern
```bash
# 1. Build frontend
npm run build

# 2. Deploy backend with built assets
cd codehooks-server  # or backend directory
coho deploy --upload
```

## Working with Examples

### Testing a Backend Example
1. Navigate to example directory
2. Check for `package.json` dependencies
3. Install: `npm install`
4. Initialize: `coho init` (if needed)
5. Deploy: `coho deploy`
6. Get URL: `coho info`

### Testing a Full-Stack Example
1. Review README.md for specific setup
2. Check for `.env.example` or environment variables needed
3. Build frontend: `npm run build`
4. Deploy backend (see example's package.json scripts)
5. For local development:
   - Frontend: `npm run dev` (usually port 3000)
   - Backend: deploy to Codehooks.io or use mock service

### Environment Configuration
Full-stack examples typically need:
```bash
# .env or .env.local
VITE_API_URL=https://your-project.codehooks.io
VITE_API_TOKEN=your-api-token
# or for Next.js:
SERVER_URL=https://your-project.codehooks.io
API_TOKEN=your-api-token
```

Get these values from: `coho info`

## Important Patterns and Conventions

### File Structure
```
example-project/
├── index.js              # Backend entry point
├── package.json          # Dependencies
├── schema.js            # Data schemas (if using crudlify)
├── middleware.js        # Custom middleware (if needed)
├── public/ or dist/     # Static files (if full-stack)
└── README.md
```

### Error Handling
```javascript
app.get('/endpoint', async (req, res) => {
  try {
    // Logic
    res.json({ success: true, data })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({
      error: 'Description',
      message: error.message
    })
  }
})
```

### Binary Stream Handling
When working with files (see `aws-s3/` or `binary-streams/`):
```javascript
import { PassThrough } from 'stream'

// Receiving upload
req.pipe(destinationStream)

// Sending download
res.set('content-type', contentType)
sourceStream.pipe(res.writable)
```

### Workflow API Pattern (Advanced)
The `react-workflow-client/` example demonstrates the Workflow API for stateful, step-based processes:
```javascript
import { workflow } from 'codehooks-js'

const myWorkflow = workflow.create('workflowName')
  .step('stepName', async (state) => {
    // Step logic
    return { ...state, updatedField: value }
  })
  .waitFor('userInput')  // Pause for external event
  .step('nextStep', async (state) => { /* ... */ })

// Start workflow
const instance = await myWorkflow.start(initialState)

// Continue after wait
await myWorkflow.updateState(instanceId, newData, { continue: true })
```

## Key Differences from Traditional Node.js

1. **No server.listen()** - Use `app.init()` instead
2. **Stateless** - Each request is independent; use Datastore for persistence
3. **Environment variables** - Set via Codehooks dashboard or CLI
4. **File system** - Limited; use Datastore, external storage (S3), or static uploads
5. **CORS** - Built-in by default, no additional middleware needed

## Reference Links

- Main documentation: https://codehooks.io/docs
- CRUD library: https://www.npmjs.com/package/codehooks-crudlify
- Real-time API: https://codehooks.io/docs/realtimeapi
- Workflow API: https://codehooks.io/docs/workflow-api
- CLI reference: https://codehooks.io/docs/cli
