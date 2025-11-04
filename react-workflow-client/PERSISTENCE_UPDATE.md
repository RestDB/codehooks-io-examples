# Workflow Persistence Update

## Overview

The workflow system has been updated to support **persistent workflows with unique IDs**. Users can now:

- ✅ Create workflows that persist across browser refreshes
- ✅ Share workflow URLs with others
- ✅ Resume workflows at any stage
- ✅ See workflow history and state restoration

## Changes Made

### 1. Backend (mock-server.js)

**New Features:**
- Workflow state storage in memory (`workflows` Map)
- Unique workflow IDs generated on creation
- Workflow state includes: status, currentStep, applicationData, userChoice, finalResult, history

**New Endpoints:**

```javascript
POST /workflow/create
// Creates a new workflow, returns workflowId
// Body: { userId, userName }
// Response: { workflowId, workflow }

GET /workflow/:workflowId/state
// Retrieves current workflow state
// Response: { workflow }

GET /workflow/:workflowId/stream/:listenerID
// SSE stream for a specific workflow (was just /:listenerID)

POST /workflow/:workflowId/submit
// Submit application for specific workflow (was /workflow/submit)

POST /workflow/:workflowId/choice
// Submit choice for specific workflow (was /workflow/choice)
```

**State Updates:**
- All workflow events now update the workflow state in the Map
- Workflow history is automatically tracked
- Current step is maintained server-side

### 2. Frontend - Realtime Service (src/services/realtimeService.js)

**New Methods:**

```javascript
createWorkflow(userId, userName)
// Creates a new workflow on the server

getWorkflowState(workflowId)
// Fetches workflow state from server

connect(workflowId, interests)
// Now requires workflowId parameter

reset()
// Clears workflow ID and disconnects
```

**Updated Methods:**
- `sendAction(action, data)` - Now uses `workflowId` in URL path
- `connect()` - Updated SSE stream URL to include workflowId

### 3. Frontend - Routing (src/App.jsx)

**New Route:**
```javascript
/workflow/:workflowId
// Allows accessing specific workflow by ID
```

**Routes Structure:**
- `/` → redirects to `/workflow`
- `/login` → Login page
- `/workflow` → New workflow (no ID yet)
- `/workflow/:workflowId` → Specific workflow (with state)

### 4. Frontend - Workflow Component (src/pages/Workflow.jsx)

**New State Variables:**
```javascript
const { workflowId } = useParams() // Get workflowId from URL
const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(false)
const [workflowNotFound, setWorkflowNotFound] = useState(false)
```

**Updated Flow:**

**On Mount:**
1. Check if `workflowId` exists in URL
2. If yes:
   - Fetch workflow state from server
   - Restore: currentStep, applicationData, finalResult, history
   - Connect to realtime with workflowId
3. If no:
   - Show registration form
   - Wait for user to submit

**On Submit Application:**
1. If no workflowId:
   - Create new workflow → get workflowId
   - Navigate to `/workflow/:workflowId`
   - Connect to realtime
2. Submit application data
3. Wait for server events

**On Reset:**
- Clear all state
- Disconnect from realtime
- Navigate back to `/workflow` (no ID)

**New UI States:**
- Loading spinner while fetching workflow
- "Workflow Not Found" error page with actions
- All existing workflow steps work as before

## How It Works

### Creating a New Workflow

```
1. User logs in → navigates to /workflow
2. Frontend IMMEDIATELY creates workflow:
   POST /workflow/create → { workflowId: "workflow-xxx" }
3. Frontend navigates to /workflow/workflow-xxx
4. User fills form and clicks "Submit Application"
5. Frontend connects SSE: GET /workflow/workflow-xxx/stream/listener-yyy
6. Frontend submits application: POST /workflow/workflow-xxx/submit
7. Server processes and updates workflow state
8. Server sends approval/denial event via SSE (to correct workflowId)
9. Workflow progresses through steps

IMPORTANT: 
- Workflow ID is created BEFORE user submits (prevents race conditions)
- SSE connection is established ONLY AFTER user clicks Submit
- This prevents unnecessary connections for workflows that are never started
```

### Resuming an Existing Workflow

```
1. User opens URL: http://localhost:3000/workflow/workflow-xxx
2. Frontend detects workflowId in URL
3. Frontend fetches state: GET /workflow/workflow-xxx/state
4. Frontend restores:
   - currentStep (e.g., "user_choice")
   - applicationData (e.g., item, justification)
   - finalResult (if completed)
   - history (all events)
5. Frontend connects SSE for live updates
6. User sees current state and can continue
```

### Refreshing the Page

```
1. User is at /workflow/workflow-xxx (any step)
2. User presses F5 (refresh)
3. React app reloads
4. useEffect runs → detects workflowId
5. Fetches and restores workflow state
6. Reconnects to SSE stream
7. User sees same state as before refresh
```

## Testing Guide

### Test 1: New Workflow Creation

```bash
1. npm run mock-server  # Terminal 1
2. npm run dev          # Terminal 2
3. Open http://localhost:3000
4. Login (demo login)
5. Fill out application form
6. Click "Submit Application"
7. ✅ URL should change to /workflow/workflow-{id}
8. ✅ Should see "Awaiting Company Approval"
9. ✅ After 3-5s, should progress to "User Choice"
```

### Test 2: Refresh During Workflow

```bash
1. Continue from Test 1 (at "User Choice" step)
2. Press F5 to refresh browser
3. ✅ Should show "Loading workflow..." briefly
4. ✅ Should restore to "User Choice" step
5. ✅ Should still show "Live" connection status
6. ✅ Form data should be preserved
7. Make a choice and submit
8. ✅ Should wait for final approval
9. ✅ Should show final result
```

### Test 3: Copy and Paste URL

```bash
1. Create a workflow (Test 1)
2. Copy the URL: http://localhost:3000/workflow/workflow-xxx
3. Open a new browser window/tab
4. Paste the URL
5. Login if needed
6. ✅ Should load the workflow at current step
7. ✅ Should show all history
8. ✅ Should connect to live updates
```

### Test 4: Workflow Not Found

```bash
1. Navigate to: http://localhost:3000/workflow/invalid-id
2. ✅ Should show "Workflow Not Found" error
3. ✅ Should have "Start New Workflow" button
4. ✅ Should have "Logout" button
5. Click "Start New Workflow"
6. ✅ Should navigate to /workflow
7. ✅ Should show empty registration form
```

### Test 5: Multiple Workflows

```bash
1. Create workflow 1 → get URL 1
2. Complete or leave at any step
3. Click "Start New Application" or navigate to /workflow
4. Create workflow 2 → get URL 2
5. ✅ URL 1 and URL 2 should be different
6. Open URL 1 in tab 1
7. Open URL 2 in tab 2
8. ✅ Both should show correct independent states
9. ✅ Both should receive their own events
```

### Test 6: Workflow Completion and Reset

```bash
1. Complete a workflow (approved or denied)
2. ✅ Should show final result
3. ✅ URL should still be /workflow/workflow-xxx
4. Click "Start New Application"
5. ✅ Should navigate to /workflow (briefly)
6. ✅ Should immediately create new workflow and redirect
7. ✅ Form should be empty
8. ✅ Should be disconnected from old workflow
9. ✅ Should get new workflow ID in URL
```

### Test 7: Race Condition Prevention (Critical!)

```bash
1. Navigate to /workflow
2. ✅ Should immediately get redirected to /workflow/workflow-xxx
3. Note the workflow ID in URL
4. Fill out the form
5. Click "Submit Application"
6. IMMEDIATELY press F5 (within 3 seconds, before approval arrives)
7. ✅ Should show same workflow ID in URL
8. ✅ Should show "Awaiting Company Approval" (not reset to form)
9. Wait for approval event
10. ✅ Should receive the event and progress to next step
11. ✅ No duplicate workflows created

BEFORE FIX: Would create new workflow on refresh, lose original event
AFTER FIX: Restores same workflow, receives original event
```

## Critical Race Condition & Event Loss Fixes

### Problem 1: Workflow ID Race Condition

**Problem:** Original implementation created workflow ID only after user submitted the form. If user refreshed the browser while waiting for server response (e.g., during the 3-5 second approval delay), they would create a NEW workflow and never receive the event for the original submission.

**Solution:** Workflow ID is now created **immediately** when user lands on `/workflow`. This ensures:
- ✅ Workflow ID exists before any submission
- ✅ SSE events always go to the correct workflow
- ✅ Refreshing during processing doesn't break the flow
- ✅ One workflow = one application (1:1 mapping)

**Flow:**
```
User lands on /workflow 
  → Instantly create workflow ID
  → Navigate to /workflow/{id}
  → Connect SSE
  → User fills form (ID already exists)
  → Submit uses existing ID
  → Refresh safe at any point
```

### Problem 2: Lost SSE Events on Refresh

**Problem:** SSE (Server-Sent Events) is a real-time protocol. The CRITICAL issue was that the server stored events by `listenerID`. When a user refreshed:

```
1. User submits → Server starts setTimeout (3-5s delay)
2. setTimeout captures the listenerID: "listener-123"
3. User refreshes → Old connection closes, NEW connection gets "listener-456"
4. setTimeout fires → Looks up "listener-123" (doesn't exist or closed)
5. Event is LOST ❌
6. User stuck waiting forever
```

**Root Cause:** The setTimeout callback used the OLD listenerID from when the request was submitted. If user refreshed and got a new listenerID, the event couldn't find the connection.

**Solution:** Three-layer approach:

**Layer 1 - Send to WorkflowId, Not ListenerId (CRITICAL FIX):**
Created `sendEventToWorkflow(workflowId, event)` helper function:
- Iterates through ALL active connections
- Finds connections matching the workflowId (not listenerID)
- Sends event to ALL matching connections
- If user refreshed → new connection has same workflowId → receives event ✅

```javascript
// BEFORE (BROKEN):
const connection = connections.get(listenerID) // Old, wrong ID
connection.res.write(event)

// AFTER (FIXED):
function sendEventToWorkflow(workflowId, event) {
  for (const [id, conn] of connections.entries()) {
    if (conn.workflowId === workflowId) {  // Match by workflow, not listener
      conn.res.write(event)
    }
  }
}
```

**Layer 2 - Server-Side Event Replay on Connect:**
When SSE connects, server checks workflow state and resends missed events:
- If workflow at `user_choice` → Resend `approval_granted`
- If workflow at `completed` → Resend final result
- Acts as backup if event was sent before new connection established

**Layer 3 - Client-Side State Sync:**
After connecting, client re-fetches workflow state after 1 second:
- Compares UI state vs server state
- Syncs if different
- Final safety net

**Complete Flow (Now Working):**
```
1. User submits → Server starts setTimeout with workflowId
2. User refreshes during 3-5s wait
3. Old connection (listener-123) closes
4. New connection (listener-456) established with SAME workflowId
5. setTimeout fires → calls sendEventToWorkflow(workflowId, event)
6. Function finds NEW connection by workflowId match
7. Sends event to new connection ✅
8. Client receives event → workflow progresses
9. Backup layers ensure reliability
```

**Benefits:**
- ✅ Events ALWAYS reach the correct workflow
- ✅ Works even if multiple connections exist
- ✅ Survives any number of refreshes
- ✅ Three redundant layers for bulletproof reliability

## SSE Connection Strategy

### When SSE Connects

**Fresh Workflow (registration step):**
- Workflow ID created immediately
- SSE connection **NOT** established yet
- User fills form at their leisure
- SSE connects when user clicks "Submit Application"
- Prevents unnecessary server resources

**Existing Workflow (any other step):**
- Workflow ID loaded from URL
- SSE connection established immediately
- Receives events if workflow progresses
- User can resume where they left off

### Why This Matters

**Problem if SSE connects too early:**
```
1. Land on /workflow → create workflow + connect SSE
2. User never submits (closes tab, navigates away)
3. Server keeps SSE connection open unnecessarily
4. Wastes resources for workflows that never start
```

**Solution - Lazy SSE Connection:**
```
1. Land on /workflow → create workflow ID only
2. User fills form (no SSE yet)
3. User clicks Submit → NOW connect SSE
4. Receive events as workflow progresses
5. If user never submits → no SSE connection created
```

**Benefits:**
- ✅ No SSE events before user commits to workflow
- ✅ Cleaner experience - events only when needed
- ✅ Server resources saved on abandoned workflows
- ✅ Still maintains workflow ID for persistence

## Benefits

### For Users
- 📌 **Bookmark workflows** - Save URLs for later
- 🔄 **Resume anytime** - Refresh without losing progress
- 🔗 **Share workflows** - Send URLs to colleagues
- 📊 **Track history** - See all events and timeline

### For Developers
- 🎯 **Clear state management** - Server-side state of truth
- 🐛 **Easier debugging** - Inspect workflows by ID
- 📈 **Better monitoring** - Track workflow metrics
- 🔧 **Testable** - Mock different workflow states

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Browser                         │
│                                                  │
│  URL: /workflow/workflow-123                    │
│  ┌────────────────────────────────────────┐    │
│  │  React Component                        │    │
│  │  - useParams() → workflowId            │    │
│  │  - Fetch state on mount                │    │
│  │  - Restore UI from state               │    │
│  │  - Connect SSE                          │    │
│  └────────────────────────────────────────┘    │
│              ↕                                   │
│  ┌────────────────────────────────────────┐    │
│  │  Realtime Service                       │    │
│  │  - createWorkflow()                     │    │
│  │  - getWorkflowState(id)                │    │
│  │  - connect(id)                          │    │
│  │  - sendAction(action)                   │    │
│  └────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
              ↕ HTTP + SSE
┌─────────────────────────────────────────────────┐
│              Mock Server                         │
│                                                  │
│  ┌────────────────────────────────────────┐    │
│  │  workflows = new Map()                  │    │
│  │  {                                       │    │
│  │    'workflow-123': {                    │    │
│  │      id, status, currentStep,          │    │
│  │      applicationData, userChoice,       │    │
│  │      finalResult, history,              │    │
│  │      createdAt, updatedAt               │    │
│  │    }                                     │    │
│  │  }                                       │    │
│  └────────────────────────────────────────┘    │
│                                                  │
│  API Endpoints:                                 │
│  POST   /workflow/create                        │
│  GET    /workflow/:id/state                     │
│  GET    /workflow/:id/stream/:listenerID       │
│  POST   /workflow/:id/submit                    │
│  POST   /workflow/:id/choice                    │
└─────────────────────────────────────────────────┘
```

## Notes

### Limitations

1. **In-Memory Storage**: Workflows are stored in memory. Restarting the mock server will clear all workflows.
   - For production: Use a database (MongoDB, PostgreSQL, etc.)

2. **No Authentication on Workflows**: Anyone with the URL can access any workflow.
   - For production: Add authentication checks (userId matching)

3. **No Expiration**: Workflows never expire.
   - For production: Add TTL/expiration logic

4. **No Pagination**: All history is loaded at once.
   - For production: Paginate history for large workflows

### Production Considerations

For a real codehooks.io backend:

1. **Use Database**:
   ```javascript
   const db = await Datastore.open()
   await db.insertOne('workflows', workflowData)
   ```

2. **Add Authentication**:
   ```javascript
   if (workflow.userId !== req.token.userId) {
     return res.status(403).json({ error: 'Forbidden' })
   }
   ```

3. **Add Indexes**:
   ```javascript
   await db.createIndex('workflows', { userId: 1, createdAt: -1 })
   ```

4. **Add Cleanup**:
   ```javascript
   // Delete workflows older than 30 days
   const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
   await db.deleteMany('workflows', { createdAt: { $lt: cutoff } })
   ```

## Migration from Old System

If you have an existing deployment without persistence:

1. Deploy new backend code
2. Deploy new frontend code
3. Existing users on `/workflow` will continue to work
4. New submissions will create persistent workflows
5. Old workflows (no ID) can't be resumed after refresh
6. Users will need to start new workflows

No breaking changes - fully backward compatible!

## Summary

The workflow system now supports **full persistence** with:
- ✅ Unique workflow IDs
- ✅ State restoration on refresh
- ✅ URL-based workflow access
- ✅ Complete history tracking
- ✅ Multi-workflow support
- ✅ Error handling for missing workflows

**Everything is ready to test!** 🎉

---

*Last updated: November 2, 2025*

