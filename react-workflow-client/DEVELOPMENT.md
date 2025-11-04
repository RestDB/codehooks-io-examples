# Development Guide

## Testing Without Backend

While developing, you may want to test the frontend before the backend is ready. Here are some approaches:

### Option 1: Mock the Realtime Service

Create a mock version of the realtime service for testing:

```javascript
// src/services/realtimeService.mock.js
class MockRealtimeService {
  constructor() {
    this.messageHandlers = []
    this.statusHandlers = []
  }

  async connect(interests = {}) {
    console.log('Mock: Connected to realtime service')
    this._notifyStatusHandlers('connected')
    return 'mock-listener-id-123'
  }

  disconnect() {
    console.log('Mock: Disconnected')
    this._notifyStatusHandlers('disconnected')
  }

  onMessage(handler) {
    this.messageHandlers.push(handler)
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler)
    }
  }

  onStatusChange(handler) {
    this.statusHandlers.push(handler)
    return () => {
      this.statusHandlers = this.statusHandlers.filter(h => h !== handler)
    }
  }

  async sendAction(action, data) {
    console.log('Mock: Sending action', action, data)
    
    // Simulate server responses
    if (action === 'submit') {
      // Simulate approval after 3 seconds
      setTimeout(() => {
        this._notifyMessageHandlers({
          type: 'approval_granted',
          data: {},
          timestamp: new Date().toISOString()
        })
      }, 3000)
    }
    
    if (action === 'choice') {
      // Simulate final approval after 2 seconds
      setTimeout(() => {
        // Randomly approve or deny for testing
        const approved = Math.random() > 0.3
        this._notifyMessageHandlers({
          type: approved ? 'final_approval' : 'final_denial',
          data: approved ? {} : { reason: 'Budget constraints' },
          timestamp: new Date().toISOString()
        })
      }, 2000)
    }
    
    return { success: true }
  }

  _notifyMessageHandlers(data) {
    this.messageHandlers.forEach(handler => handler(data))
  }

  _notifyStatusHandlers(status) {
    this.statusHandlers.forEach(handler => handler(status))
  }
}

export default new MockRealtimeService()
```

Then in your Workflow component, import the mock service during development:

```javascript
// src/pages/Workflow.jsx
import realtimeService from '../services/realtimeService.mock' // Use mock
// import realtimeService from '../services/realtimeService' // Use real
```

### Option 2: Simple Mock Backend with Express

Create a simple Node.js server to simulate the backend:

```javascript
// mock-server.js
import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

const listeners = new Map()
const connections = new Map()

// Connect endpoint
app.post('/connect', (req, res) => {
  const listenerID = 'listener-' + Date.now()
  listeners.set(listenerID, req.body)
  res.json({ listenerID })
})

// SSE endpoint
app.get('/workflow/:listenerID', (req, res) => {
  const { listenerID } = req.params
  
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  
  connections.set(listenerID, res)
  
  req.on('close', () => {
    connections.delete(listenerID)
  })
})

// Submit application
app.post('/workflow/submit', (req, res) => {
  const { listenerID } = req.body
  
  // Simulate approval after 3 seconds
  setTimeout(() => {
    const connection = connections.get(listenerID)
    if (connection) {
      const event = {
        type: 'approval_granted',
        data: {},
        timestamp: new Date().toISOString()
      }
      connection.write(`data: ${JSON.stringify(event)}\n\n`)
    }
  }, 3000)
  
  res.json({ success: true })
})

// Submit choice
app.post('/workflow/choice', (req, res) => {
  const { listenerID } = req.body
  
  // Simulate final decision after 2 seconds
  setTimeout(() => {
    const connection = connections.get(listenerID)
    if (connection) {
      const approved = Math.random() > 0.3
      const event = {
        type: approved ? 'final_approval' : 'final_denial',
        data: approved ? {} : { reason: 'Budget constraints' },
        timestamp: new Date().toISOString()
      }
      connection.write(`data: ${JSON.stringify(event)}\n\n`)
    }
  }, 2000)
  
  res.json({ success: true })
})

app.listen(3001, () => {
  console.log('Mock server running on http://localhost:3001')
})
```

Install dependencies and run:

```bash
npm install express cors
node mock-server.js
```

### Option 3: Browser DevTools Console

You can also manually trigger events from the browser console for testing:

```javascript
// In browser console, trigger an approval event
const event = new MessageEvent('message', {
  data: JSON.stringify({
    type: 'approval_granted',
    data: {},
    timestamp: new Date().toISOString()
  })
})
// This requires access to the EventSource instance - 
// you may need to expose it globally for testing
```

## Workflow State Testing

To test different workflow states, you can modify the initial state in `Workflow.jsx`:

```javascript
// Start at user choice step
const [currentStep, setCurrentStep] = useState(WORKFLOW_STEPS.USER_CHOICE)

// Start with application data prefilled
const [applicationData, setApplicationData] = useState({
  item: 'laptop',
  justification: 'Test data',
  specifications: 'High performance',
  userChoice: 'professional',
})
```

## Environment Setup for Different Backends

Create multiple `.env` files for different environments:

**.env.development**
```
VITE_API_URL=http://localhost:3001
VITE_API_TOKEN=dev-token
```

**.env.staging**
```
VITE_API_URL=https://your-staging-backend.codehooks.io
VITE_API_TOKEN=staging-token
```

**.env.production**
```
VITE_API_URL=https://your-prod-backend.codehooks.io
VITE_API_TOKEN=prod-token
```

Then run with:
```bash
# Development
npm run dev

# With specific env file
npm run dev -- --mode staging
```

## Debugging Tips

### 1. Enable Verbose Logging

Add console logs in the realtime service:

```javascript
console.log('Connecting to:', this.baseURL)
console.log('Listener ID:', this.listenerID)
console.log('Message received:', data)
```

### 2. Monitor EventSource in DevTools

- Open Chrome DevTools
- Go to Network tab
- Filter by "EventSource" or "Other"
- You'll see the SSE connection and all events

### 3. Redux DevTools (Optional)

For complex state management, consider adding Redux or Zustand with DevTools support:

```bash
npm install zustand
```

### 4. React DevTools

Install React DevTools extension to inspect:
- Component state
- Context values
- Props flow
- Re-renders

## Common Issues

### Issue: "Network request failed"
**Solution:** Check that backend URL is correct in `.env`

### Issue: EventSource immediately closes
**Solution:** 
1. Verify backend CORS settings
2. Check that endpoint returns proper SSE headers
3. Ensure API token is valid

### Issue: State not updating
**Solution:**
1. Check React DevTools to verify state changes
2. Ensure event handlers are properly registered
3. Verify event data format matches expectations

### Issue: Multiple connections
**Solution:** Make sure useEffect cleanup is working:
```javascript
useEffect(() => {
  // ... connect logic
  return () => {
    realtimeService.disconnect() // Cleanup
  }
}, [])
```

## Performance Testing

### Simulate Slow Network

In Chrome DevTools:
1. Open Network tab
2. Click "No throttling" dropdown
3. Select "Slow 3G" or "Fast 3G"
4. Test workflow with delays

### Test Offline Behavior

1. Open DevTools
2. Go to Network tab
3. Check "Offline"
4. Verify app shows proper connection status

## UI Testing Checklist

- [ ] Login with valid credentials
- [ ] Login with demo button
- [ ] Logout functionality
- [ ] Submit application form
- [ ] Required field validation
- [ ] Connection status indicator
- [ ] Step progress visualization
- [ ] User choice selection
- [ ] Activity log updates
- [ ] Final approval screen
- [ ] Final denial screen
- [ ] Reset workflow
- [ ] Responsive design on mobile
- [ ] Theme switching (if implemented)
- [ ] Browser back/forward navigation

## Next Steps

Once you have the backend ready:

1. Update `.env` with real backend URL
2. Update API token
3. Test complete workflow end-to-end
4. Add error boundaries for production
5. Add analytics/monitoring
6. Add proper error handling
7. Add loading states
8. Add success/error notifications
9. Add accessibility features (ARIA labels, keyboard navigation)
10. Add unit tests and E2E tests

## Useful Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check for linting issues
npm run lint # (if ESLint is configured)

# Format code
npm run format # (if Prettier is configured)
```

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [daisyUI Documentation](https://daisyui.com/)
- [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

