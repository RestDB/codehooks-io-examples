/**
 * Approval Workflow using Codehooks Workflow API
 * 
 * This workflow implements a multi-stage approval process:
 * 1. Initial approval (3-5 seconds delay)
 * 2. User makes a choice
 * 3. Final approval (2-4 seconds delay)
 */

import { Datastore, realtime } from 'codehooks-js'

/**
 * Send a realtime event to all listeners for a workflow
 */
async function publishWorkflowEvent(workflowId, eventType, eventData) {
  try {
    const event = {
      type: eventType,
      data: eventData,
      timestamp: new Date().toISOString()
    }
    
    // Publish to all listeners interested in this workflow
    // The query filters listeners based on their interests
    await realtime.publishEvent('/workflow', event, { workflowId })
    
    console.log(`📤 Event published: ${eventType} for workflow ${workflowId}`)
  } catch (error) {
    console.error(`❌ Failed to publish event ${eventType}:`, error)
  }
}

/**
 * Update workflow document in database
 */
async function updateWorkflowDoc(workflowId, updates) {
  try {
    const conn = await Datastore.open()
    await conn.updateOne('workflows', workflowId, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Failed to update workflow document:', error)
  }
}

/**
 * Add event to workflow history
 */
async function addToHistory(workflowId, eventType, eventData) {
  try {
    const conn = await Datastore.open()
    await conn.updateOne('workflows', workflowId, {
      '$push': {
        history: {
          type: eventType,
          timestamp: new Date().toISOString(),
          data: eventData
        }
      }
    })
  } catch (error) {
    console.error('❌ Failed to add to history:', error)
  }
}

/**
 * Initial Approval Step
 * Simulates management review with 3-5 second delay
 */
async function initialApprovalStep(state, goto, wait) {
  const { workflowId, applicationData, approvalChance } = state
  
  console.log('⏳ Step: Initial Approval - Processing...')
  console.log('   Workflow:', workflowId)
  console.log('   Item:', applicationData?.item)
  
  // Simulate processing time (3-5 seconds)
  const delay = 3000 + Math.random() * 2000
  await new Promise(resolve => setTimeout(resolve, delay))
  
  // Random approval decision
  const approved = Math.random() < approvalChance
  
  if (approved) {
    console.log('✅ Initial approval GRANTED')
    
    // Update workflow document
    await updateWorkflowDoc(workflowId, {
      status: 'approved_waiting_choice',
      currentStep: 'user_choice'
    })
    
    // Add to history
    await addToHistory(workflowId, 'approval_granted', {
      message: 'Your application has been approved by management',
      approvedBy: 'John Manager',
      approvalDate: new Date().toISOString()
    })
    
    // Send realtime event to client
    await publishWorkflowEvent(workflowId, 'approval_granted', {
      message: 'Your application has been approved by management',
      approvedBy: 'John Manager',
      approvalDate: new Date().toISOString()
    })
    
    // Go to waiting for user choice step
    goto('waitForUserChoice')
  } else {
    console.log('❌ Initial approval DENIED')
    
    const reason = 'Budget exceeded for this quarter'
    
    // Update workflow document
    await updateWorkflowDoc(workflowId, {
      status: 'denied',
      currentStep: 'completed',
      finalResult: { approved: false, reason }
    })
    
    // Add to history
    await addToHistory(workflowId, 'approval_denied', {
      reason,
      deniedBy: 'Jane Director',
      denialDate: new Date().toISOString()
    })
    
    // Send realtime event to client
    await publishWorkflowEvent(workflowId, 'approval_denied', {
      reason,
      deniedBy: 'Jane Director',
      denialDate: new Date().toISOString()
    })
    
    // End workflow
    goto('end')
  }
}

/**
 * Wait for User Choice Step
 * This step waits for the user to make a choice (handled externally via API)
 * The workflow is paused here until continue() is called
 */
async function waitForUserChoiceStep(state, goto, wait) {
  const { workflowId } = state
  
  console.log('⏸️  Step: Waiting for user choice')
  console.log('   Workflow:', workflowId)
  
  
  // After wait is resolved (via continue()), validate choice and proceed
  const { userChoice } = state
  
  if (userChoice) {
    console.log('✅ Valid choice received:', userChoice)
    goto('finalApproval')
  } else {
    // Explicitly wait for user to submit their choice
  // The workflow will be continued when user submits their choice
  // via the /workflow/:workflowId/choice endpoint which calls continue()
  wait({
    message: 'Waiting for user to select configuration',
    waitingFor: 'user_choice'
  })
  
  }
}

/**
 * Final Approval Step
 * Reviews user's choice and makes final decision
 */
async function finalApprovalStep(state, goto, wait) {
  const { workflowId, userChoice, approvalChance } = state
  
  console.log('⏳ Step: Final Approval - Processing...')
  console.log('   Workflow:', workflowId)
  console.log('   User choice:', userChoice)
  
  // Simulate processing time (2-4 seconds)
  const delay = 2000 + Math.random() * 2000
  await new Promise(resolve => setTimeout(resolve, delay))
  
  // Approval decision based on choice
  const approved = Math.random() < approvalChance
  
  if (approved) {
    console.log('✅ Final approval GRANTED')
    
    // Update workflow document
    await updateWorkflowDoc(workflowId, {
      status: 'approved',
      currentStep: 'completed',
      finalResult: { approved: true }
    })
    
    // Add to history
    await addToHistory(workflowId, 'final_approval', {
      message: `Your ${userChoice} configuration has been approved`,
      approvedBy: 'Sarah CFO',
      deliveryEstimate: '5-7 business days',
      approvalDate: new Date().toISOString()
    })
    
    // Send realtime event to client
    await publishWorkflowEvent(workflowId, 'final_approval', {
      message: `Your ${userChoice} configuration has been approved`,
      approvedBy: 'Sarah CFO',
      deliveryEstimate: '5-7 business days',
      approvalDate: new Date().toISOString()
    })
  } else {
    console.log('❌ Final approval DENIED')
    
    const reasons = {
      premium: 'Premium configuration exceeds approved budget',
      professional: 'Professional configuration not available',
      standard: 'Standard configuration out of stock'
    }
    const reason = reasons[userChoice] || 'Configuration not available'
    
    // Update workflow document
    await updateWorkflowDoc(workflowId, {
      status: 'denied_final',
      currentStep: 'completed',
      finalResult: { approved: false, reason }
    })
    
    // Add to history
    await addToHistory(workflowId, 'final_denial', {
      reason,
      deniedBy: 'Mark Procurement',
      denialDate: new Date().toISOString()
    })
    
    // Send realtime event to client
    await publishWorkflowEvent(workflowId, 'final_denial', {
      reason,
      deniedBy: 'Mark Procurement',
      denialDate: new Date().toISOString()
    })
  }
  
  // End workflow
  goto('end')
}

/**
 * Create and configure the approval workflow
 */
export function createApprovalWorkflow(app) {
  const workflow = app.createWorkflow(
    'approval-workflow',
    'Multi-stage equipment approval workflow',
    {
      initialApproval: initialApprovalStep,
      waitForUserChoice: waitForUserChoiceStep,
      finalApproval: finalApprovalStep,
      end: async (state, goto, wait) => {
        console.log('✅ Workflow completed:', state.workflowId)
        // End workflow
        goto(null, state)
      }
    }
  )
  
  // Listen to workflow events and log them
  workflow.on('workflowStarted', (data) => {
    console.log('🚀 Workflow started:', data.instanceId)
  })
  
  workflow.on('stepStarted', (data) => {
    console.log('▶️  Step started:', data.stepName, 'for', data.instanceId)
  })
  
  workflow.on('stateUpdated', (data) => {
    console.log('🔄 State updated for:', data.instanceId)
  })
  
  workflow.on('completed', (data) => {
    console.log('✅ Workflow completed:', data.instanceId)
  })
  
  workflow.on('error', (data) => {
    console.error('❌ Workflow error:', data.error, 'at step:', data.stepName)
  })
  
  // Configure workflow options
  workflow.configure({
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    timeout: 300000, // 5 minutes per step
    concurrency: 10 // Process up to 10 workflows simultaneously
  })
  
  return workflow
}

