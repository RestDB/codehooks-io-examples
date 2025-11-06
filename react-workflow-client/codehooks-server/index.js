/**
 * Codehooks.io Workflow Application Server
 * 
 * This server uses:
 * - Realtime API for SSE communication with clients
 * - Workflow API for stateful approval workflows
 * - Datastore for persistent workflow state
 */

import { app, Datastore, realtime } from 'codehooks-js'
import { createApprovalWorkflow } from './workflows/approvalWorkflow.js'

// Create realtime channel for workflow events
realtime.createChannel('/workflow')

console.log('🚀 Workflow Application Server starting...')

// Initialize the approval workflow
const approvalWorkflow = createApprovalWorkflow(app)

/**
 * Health check endpoint
 */
app.get('/info', async (req, res) => {
  console.log('🔄 Health check endpoint hit')
  res.json({
    name: 'Workflow Application Server',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: 'GET /',
      connect: 'POST /connect',
      createWorkflow: 'POST /workflow/create',
      getState: 'GET /workflow/:workflowId/state',
      submit: 'POST /workflow/:workflowId/submit',
      choice: 'POST /workflow/:workflowId/choice',
    }
  })
})

/**
 * Create a new listener for realtime events
 * This is called by the client to get a listenerID for SSE
 */
app.post('/connect', async (req, res) => {
  try {
    const interests = req.body || {}
    
    // Create a listener on the workflow channel
    const listenerData = await realtime.createListener('/workflow', interests)
    
    console.log('✅ New listener created:', listenerData._id)
    
    res.json({ 
      listenerID: listenerData._id,
      success: true 
    })
  } catch (error) {
    console.error('❌ Error creating listener:', error)
    res.status(500).json({ 
      error: 'Failed to create listener',
      message: error.message 
    })
  }
})

/**
 * Create a new workflow instance
 */
app.post('/workflow/create', async (req, res) => {
  try {
    const { userId, userName } = req.body
    
    if (!userId || !userName) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, userName' 
      })
    }
    
    const conn = await Datastore.open()
    
    // Create workflow document
    const workflowDoc = {
      userId,
      userName,
      status: 'created',
      currentStep: 'registration',
      applicationData: null,
      userChoice: null,
      finalResult: null,
      workflowInstanceId: null, // Will be set when workflow starts
      history: [{
        type: 'workflow_created',
        timestamp: new Date().toISOString(),
        data: { userId, userName }
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const result = await conn.insertOne('workflows', workflowDoc)
    const workflowId = result._id
    
    console.log('✨ New workflow created:', workflowId)
    console.log('   User:', userName, '(', userId, ')')
    
    res.json({
      workflowId,
      workflow: { ...workflowDoc, _id: workflowId }
    })
    
  } catch (error) {
    console.error('❌ Error creating workflow:', error)
    res.status(500).json({ 
      error: 'Failed to create workflow',
      message: error.message 
    })
  }
})

/**
 * Get workflow state
 */
app.get('/workflow/:workflowId/state', async (req, res) => {
  try {
    const { workflowId } = req.params
    
    const conn = await Datastore.open()
    const workflow = await conn.getOne('workflows', workflowId)
    
    if (!workflow) {
      return res.status(404).json({ 
        error: 'Workflow not found',
        workflowId 
      })
    }
    
    console.log('📖 Fetching state for workflow:', workflowId)
    
    res.json({ workflow })
    
  } catch (error) {
    console.error('❌ Error fetching workflow:', error)
    res.status(500).json({ 
      error: 'Failed to fetch workflow',
      message: error.message 
    })
  }
})

/**
 * Submit application - starts the approval workflow
 */
app.post('/workflow/:workflowId/submit', async (req, res) => {
  try {
    const { workflowId } = req.params
    const { listenerID, userId, userName, item, justification, specifications } = req.body
    
    const conn = await Datastore.open()
    const workflow = await conn.getOne('workflows', workflowId)
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' })
    }
    
    console.log('📝 Application submitted for workflow:', workflowId)
    console.log('   User:', userName, '(', userId, ')')
    console.log('   Item:', item)
    console.log('   Listener:', listenerID)
    
    // Update workflow document with application data
    const applicationData = { item, justification, specifications }
    
    await conn.updateOne('workflows', workflowId, {
      '$set': {
        status: 'pending_approval',
        currentStep: 'pending_approval',
        applicationData,
        updatedAt: new Date().toISOString()
      },
      '$push': {
        history: {
          type: 'application_submitted',
          timestamp: new Date().toISOString(),
          data: applicationData
        }
      }
    })
    
    // Verify update
    const updatedWorkflow = await conn.getOne('workflows', workflowId)
    console.log('✅ Workflow updated with applicationData:', updatedWorkflow.applicationData)
    
    // Start the approval workflow
    const initialState = {
      workflowId,
      userId,
      userName,
      listenerID,
      applicationData,
      approvalChance: 0.8 // 80% approval rate
    }
    // start the workflow
    const workflowInstance = await approvalWorkflow.start(initialState)
    
    // Store workflow instance ID
    await conn.updateOne('workflows', workflowId, {
      workflowInstanceId: workflowInstance._id
    })
    
    console.log('🔄 Approval workflow started:', workflowInstance._id)
    
    res.json({ 
      success: true,
      message: 'Application submitted and workflow started',
      workflowInstanceId: workflowInstance._id
    })
    
  } catch (error) {
    console.error('❌ Error submitting application:', error)
    res.status(500).json({ 
      error: 'Failed to submit application',
      message: error.message 
    })
  }
})

/**
 * Submit user choice - continues the workflow
 */
app.post('/workflow/:workflowId/choice', async (req, res) => {
  try {
    const { workflowId } = req.params
    const { listenerID, userId, choice } = req.body
    
    const conn = await Datastore.open()
    const workflow = await conn.getOne('workflows', workflowId)
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' })
    }
    
    if (!workflow.workflowInstanceId) {
      return res.status(400).json({ error: 'Workflow not started' })
    }
    
    console.log('🎯 User choice submitted for workflow:', workflowId)
    console.log('   Choice:', choice)
    console.log('   User:', userId)
    
    // Update workflow document with choice
    await conn.updateOne('workflows', workflowId, {
      '$set': {
        status: 'pending_final',
        currentStep: 'pending_final',
        userChoice: choice,
        updatedAt: new Date().toISOString()
      },
      '$push': {
        history: {
          type: 'user_choice_submitted',
          timestamp: new Date().toISOString(),
          data: { choice }
        }
      }
    })
    
    // Verify update
    const updatedWorkflow = await conn.getOne('workflows', workflowId)
    console.log('✅ Workflow updated with userChoice:', updatedWorkflow.userChoice)
    
    // Update workflow state and continue in one operation
    await approvalWorkflow.updateState(workflow.workflowInstanceId, {
      userChoice: choice,
      listenerID, // Update listener in case it changed
      approvalChance: choice === 'standard' ? 0.95 : choice === 'premium' ? 0.6 : 0.9
    }, { continue: true })
    
    console.log('🔄 Workflow continued for final approval')
    
    res.json({ 
      success: true,
      message: 'Choice submitted and workflow continued'
    })
    
  } catch (error) {
    console.error('❌ Error submitting choice:', error)
    res.status(500).json({ 
      error: 'Failed to submit choice',
      message: error.message 
    })
  }
})

/**
 * List all workflows (for debugging/admin)
 */
app.get('/api/workflows', async (req, res) => {
  try {
    const conn = await Datastore.open()
    const workflows = await conn.getMany('workflows', {}, 
      {sort: { createdAt: -1 },limit: 50}).toArray()
    
    res.json(workflows)
    
  } catch (error) {
    console.error('❌ Error listing workflows:', error)
    res.status(500).json({ 
      error: 'Failed to list workflows',
      message: error.message 
    })
  }
})



/**
 * Redirect root to /home
 */
app.auth('/', async (req, res, next) => {
  next()
})
app.get('/', async (req, res) => {
  res.redirect('/home')
})

/**
 * Serve static files for the React frontend
 * This should be defined AFTER all API routes
 */
app.static({
  route: '/home',
  directory: '/dist',
  default: 'index.html',
  notFound: '/index.html' // Essential for client-side routing (SPA)
}, (req, res, next) => {
  // Optional: Set cache headers for static assets
  //const ONE_DAY = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
  //res.set('Cache-Control', `public, max-age=${ONE_DAY}`)
  next()
})

/**
 * Cron job to check for timed-out workflow steps
 * Runs every 5 minutes
 */
app.job('0 2 * * *', async (req, res) => {
  try {
    console.log('⏰ Checking for timed-out workflows...')
    const timedOut = await approvalWorkflow.findTimedOutSteps()
    
    if (timedOut.length > 0) {
      console.log(`Found ${timedOut.length} timed-out steps, continuing them...`)
      await approvalWorkflow.continueAllTimedOut()
    }
  } catch (error) {
    console.error('❌ Error in timeout check:', error)
  }
  res.end() // Signal job completion
})

// Export the app
export default app.init()

