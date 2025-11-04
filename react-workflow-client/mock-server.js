/**
 * Simple mock server for testing the React Workflow Client
 * without a real codehooks.io backend
 * 
 * Usage:
 *   node mock-server.js
 * 
 * The server will run on http://localhost:3001
 */

import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// Store active SSE connections
const connections = new Map()
const listeners = new Map()

// Store workflow instances
const workflows = new Map()

// Helper function to send event to all active connections for a workflowId
function sendEventToWorkflow(workflowId, event) {
  let sentCount = 0
  for (const [listenerID, connection] of connections.entries()) {
    if (connection.workflowId === workflowId) {
      try {
        connection.res.write(`data: ${JSON.stringify(event)}\n\n`)
        sentCount++
        console.log(`   📤 Event sent to listener: ${listenerID}`)
      } catch (error) {
        console.error(`   ❌ Failed to send to ${listenerID}:`, error.message)
      }
    }
  }
  return sentCount
}

console.log('🚀 Starting Mock Workflow Server...\n')

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Mock Workflow Server',
    status: 'running',
    endpoints: {
      connect: 'POST /connect',
      create: 'POST /workflow/create',
      getState: 'GET /workflow/:workflowId/state',
      stream: 'GET /workflow/:workflowId/stream/:listenerID',
      submit: 'POST /workflow/:workflowId/submit',
      choice: 'POST /workflow/:workflowId/choice'
    }
  })
})

// Create a new listener (client connection setup)
app.post('/connect', (req, res) => {
  const listenerID = `listener-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const interests = req.body || {}
  
  listeners.set(listenerID, {
    id: listenerID,
    interests,
    createdAt: new Date().toISOString()
  })
  
  console.log(`✅ New listener created: ${listenerID}`)
  console.log(`   Interests:`, interests)
  
  res.json({ listenerID })
})

// Create a new workflow
app.post('/workflow/create', (req, res) => {
  const workflowId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const { userId, userName } = req.body || {}
  
  const workflow = {
    id: workflowId,
    userId,
    userName,
    status: 'created',
    currentStep: 'registration',
    applicationData: null,
    userChoice: null,
    finalResult: null,
    history: [{
      type: 'workflow_created',
      timestamp: new Date().toISOString(),
      data: { userId, userName }
    }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  workflows.set(workflowId, workflow)
  
  console.log(`✨ New workflow created: ${workflowId}`)
  console.log(`   User: ${userName} (${userId})`)
  
  res.json({ 
    workflowId,
    workflow 
  })
})

// Get workflow state
app.get('/workflow/:workflowId/state', (req, res) => {
  const { workflowId } = req.params
  
  const workflow = workflows.get(workflowId)
  
  if (!workflow) {
    console.log(`⚠️  Workflow not found: ${workflowId}`)
    return res.status(404).json({ 
      error: 'Workflow not found',
      workflowId 
    })
  }
  
  console.log(`📖 Fetching state for workflow: ${workflowId}`)
  res.json({ workflow })
})

// Server-Sent Events endpoint
app.get('/workflow/:workflowId/stream/:listenerID', (req, res) => {
  const { workflowId, listenerID } = req.params
  
  // Verify workflow exists
  const workflow = workflows.get(workflowId)
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' })
  }
  
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  
  // Store connection with workflowId reference
  connections.set(listenerID, { res, workflowId })
  
  console.log(`📡 SSE connection established for workflow: ${workflowId}, listener: ${listenerID}`)
  
  // Send initial connection confirmation
  res.write(`data: ${JSON.stringify({ 
    type: 'connected', 
    message: 'Connected to workflow stream',
    workflowId,
    currentStep: workflow.currentStep,
    timestamp: new Date().toISOString()
  })}\n\n`)
  
  // IMPORTANT: If workflow has already progressed beyond registration,
  // send the appropriate event to sync the client (in case they missed it during refresh)
  setTimeout(() => {
    if (workflow.currentStep === 'user_choice' && workflow.status === 'approved_waiting_choice') {
      // User missed the approval event, resend it
      console.log(`🔄 Resending approval_granted event for reconnected client: ${listenerID}`)
      res.write(`data: ${JSON.stringify({
        type: 'approval_granted',
        data: {
          message: 'Your application has been approved by management',
          reconnected: true
        },
        timestamp: new Date().toISOString()
      })}\n\n`)
    } else if (workflow.currentStep === 'completed' && workflow.finalResult) {
      // User missed the final result, resend it
      console.log(`🔄 Resending final result event for reconnected client: ${listenerID}`)
      const eventType = workflow.finalResult.approved ? 'final_approval' : 'final_denial'
      res.write(`data: ${JSON.stringify({
        type: eventType,
        data: workflow.finalResult.approved ? {
          message: 'Your configuration has been approved',
          reconnected: true
        } : {
          reason: workflow.finalResult.reason,
          reconnected: true
        },
        timestamp: new Date().toISOString()
      })}\n\n`)
    }
  }, 500) // Send sync event 500ms after connection
  
  // Handle client disconnect
  req.on('close', () => {
    connections.delete(listenerID)
    console.log(`❌ SSE connection closed for: ${listenerID}`)
  })
})

// Submit application
app.post('/workflow/:workflowId/submit', (req, res) => {
  const { workflowId } = req.params
  const { listenerID, userId, userName, item, justification, specifications } = req.body
  
  const workflow = workflows.get(workflowId)
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' })
  }
  
  console.log(`📝 Application submitted for workflow: ${workflowId}`)
  console.log(`   User: ${userName} (${userId})`)
  console.log(`   Item: ${item}`)
  console.log(`   Justification: ${justification}`)
  console.log(`   Listener ID: ${listenerID}`)
  
  // Update workflow state
  workflow.status = 'pending_approval'
  workflow.currentStep = 'pending_approval'
  workflow.applicationData = { item, justification, specifications }
  workflow.updatedAt = new Date().toISOString()
  workflow.history.push({
    type: 'application_submitted',
    timestamp: new Date().toISOString(),
    data: { item, justification, specifications }
  })
  
  workflows.set(workflowId, workflow)
  
  // Simulate processing time and approval
  const approvalTime = 3000 + Math.random() * 2000 // 3-5 seconds
  
  setTimeout(() => {
    // 80% chance of approval
    const approved = Math.random() > 0.2
    
    if (approved) {
      const event = {
        type: 'approval_granted',
        data: {
          message: 'Your application has been approved by management',
          approvedBy: 'John Manager',
          approvalDate: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      }
      
      // Update workflow state
      workflow.status = 'approved_waiting_choice'
      workflow.currentStep = 'user_choice'
      workflow.updatedAt = new Date().toISOString()
      workflow.history.push({
        type: 'approval_granted',
        timestamp: event.timestamp,
        data: event.data
      })
      workflows.set(workflowId, workflow)
      
      console.log(`✅ Application approved for workflow: ${workflowId}`)
      const sent = sendEventToWorkflow(workflowId, event)
      if (sent === 0) {
        console.log(`⚠️  No active connections for workflow: ${workflowId}`)
      }
    } else {
      const reasons = [
        'Budget exceeded for this quarter',
        'Similar equipment recently purchased',
        'Insufficient justification provided'
      ]
      const reason = reasons[Math.floor(Math.random() * reasons.length)]
      const event = {
        type: 'approval_denied',
        data: {
          reason,
          deniedBy: 'Jane Director',
          denialDate: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      }
      
      // Update workflow state
      workflow.status = 'denied'
      workflow.currentStep = 'completed'
      workflow.finalResult = { approved: false, reason }
      workflow.updatedAt = new Date().toISOString()
      workflow.history.push({
        type: 'approval_denied',
        timestamp: event.timestamp,
        data: event.data
      })
      workflows.set(workflowId, workflow)
      
      console.log(`❌ Application denied for workflow: ${workflowId}`)
      console.log(`   Reason: ${reason}`)
      const sent = sendEventToWorkflow(workflowId, event)
      if (sent === 0) {
        console.log(`⚠️  No active connections for workflow: ${workflowId}`)
      }
    }
  }, approvalTime)
  
  res.json({ 
    success: true, 
    message: 'Application received and being processed',
    estimatedWaitTime: Math.floor(approvalTime / 1000) + ' seconds'
  })
})

// Submit user choice
app.post('/workflow/:workflowId/choice', (req, res) => {
  const { workflowId } = req.params
  const { listenerID, userId, choice } = req.body
  
  const workflow = workflows.get(workflowId)
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' })
  }
  
  console.log(`🎯 User choice submitted for workflow: ${workflowId}`)
  console.log(`   Choice: ${choice}`)
  console.log(`   User ID: ${userId}`)
  console.log(`   Listener ID: ${listenerID}`)
  
  // Update workflow state
  workflow.status = 'pending_final'
  workflow.currentStep = 'pending_final'
  workflow.userChoice = choice
  workflow.updatedAt = new Date().toISOString()
  workflow.history.push({
    type: 'user_choice_submitted',
    timestamp: new Date().toISOString(),
    data: { choice }
  })
  
  workflows.set(workflowId, workflow)
  
  // Simulate processing time for final approval
  const reviewTime = 2000 + Math.random() * 2000 // 2-4 seconds
  
  setTimeout(() => {
    // Different approval rates based on choice
    let approvalChance = 0.9 // Default 90%
    
    if (choice === 'premium') {
      approvalChance = 0.6 // Premium has lower approval rate
    } else if (choice === 'standard') {
      approvalChance = 0.95 // Standard has higher approval rate
    }
    
    const approved = Math.random() < approvalChance
    
    if (approved) {
      const event = {
        type: 'final_approval',
        data: {
          message: `Your ${choice} configuration has been approved`,
          approvedBy: 'Sarah CFO',
          deliveryEstimate: '5-7 business days',
          approvalDate: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      }
      
      // Update workflow state
      workflow.status = 'approved'
      workflow.currentStep = 'completed'
      workflow.finalResult = { approved: true }
      workflow.updatedAt = new Date().toISOString()
      workflow.history.push({
        type: 'final_approval',
        timestamp: event.timestamp,
        data: event.data
      })
      workflows.set(workflowId, workflow)
      
      console.log(`✅ Final approval granted for workflow: ${workflowId}`)
      console.log(`   Configuration: ${choice}`)
      const sent = sendEventToWorkflow(workflowId, event)
      if (sent === 0) {
        console.log(`⚠️  No active connections for workflow: ${workflowId}`)
      }
    } else {
      const reasons = {
        premium: 'Premium configuration exceeds approved budget',
        professional: 'Professional configuration not available',
        standard: 'Standard configuration out of stock'
      }
      const reason = reasons[choice] || 'Configuration not available'
      
      const event = {
        type: 'final_denial',
        data: {
          reason,
          deniedBy: 'Mark Procurement',
          denialDate: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      }
      
      // Update workflow state
      workflow.status = 'denied_final'
      workflow.currentStep = 'completed'
      workflow.finalResult = { approved: false, reason }
      workflow.updatedAt = new Date().toISOString()
      workflow.history.push({
        type: 'final_denial',
        timestamp: event.timestamp,
        data: event.data
      })
      workflows.set(workflowId, workflow)
      
      console.log(`❌ Final approval denied for workflow: ${workflowId}`)
      console.log(`   Reason: ${reason}`)
      const sent = sendEventToWorkflow(workflowId, event)
      if (sent === 0) {
        console.log(`⚠️  No active connections for workflow: ${workflowId}`)
      }
    }
  }, reviewTime)
  
  res.json({ 
    success: true, 
    message: 'Choice received and being reviewed',
    estimatedWaitTime: Math.floor(reviewTime / 1000) + ' seconds'
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`✅ Mock Workflow Server is running!`)
  console.log(``)
  console.log(`   🌐 Server URL: http://localhost:${PORT}`)
  console.log(`   📡 SSE endpoint: http://localhost:${PORT}/workflow/:listenerID`)
  console.log(``)
  console.log(`💡 Configure your React app's .env file:`)
  console.log(`   VITE_API_URL=http://localhost:${PORT}`)
  console.log(`   VITE_API_TOKEN=demo-token`)
  console.log(``)
  console.log(`📝 Press Ctrl+C to stop the server`)
  console.log(``)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n\n👋 Shutting down mock server...`)
  console.log(`   Closing ${connections.size} active connection(s)`)
  
  connections.forEach((connection) => {
    connection.end()
  })
  
  process.exit(0)
})

