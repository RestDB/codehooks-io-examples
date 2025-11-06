import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import realtimeService from '../services/realtimeService'

// Workflow step definitions
const WORKFLOW_STEPS = {
  REGISTRATION: 'registration',
  PENDING_APPROVAL: 'pending_approval',
  USER_CHOICE: 'user_choice',
  PENDING_FINAL: 'pending_final',
  COMPLETED: 'completed',
}

function Workflow() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { workflowId } = useParams()
  
  // Workflow state
  const [currentStep, setCurrentStep] = useState(WORKFLOW_STEPS.REGISTRATION)
  const [applicationData, setApplicationData] = useState({
    item: 'laptop',
    justification: '',
    specifications: '',
    userChoice: '',
  })
  const [workflowHistory, setWorkflowHistory] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(false)
  const [workflowNotFound, setWorkflowNotFound] = useState(false)
  const [finalResult, setFinalResult] = useState(null)

  // Load workflow and connect to realtime service
  useEffect(() => {
    const initializeWorkflow = async () => {
      // If we have a workflowId in the URL, load the workflow state
      if (workflowId) {
        setIsLoadingWorkflow(true)
        setWorkflowNotFound(false)
        
        try {
          // Fetch workflow state from server
          const workflow = await realtimeService.getWorkflowState(workflowId)
          
          if (!workflow) {
            setWorkflowNotFound(true)
            setIsLoadingWorkflow(false)
            return
          }
          
          // Restore workflow state
          console.log('Restoring workflow state:', workflow)
          setCurrentStep(workflow.currentStep)
          
          if (workflow.applicationData) {
            setApplicationData(prev => ({
              ...prev,
              ...workflow.applicationData,
              userChoice: workflow.userChoice || ''
            }))
          }
          
          if (workflow.finalResult) {
            setFinalResult(workflow.finalResult)
          }
          
          if (workflow.history) {
            setWorkflowHistory(workflow.history)
          }
          
          setIsLoadingWorkflow(false)
          
          // Only connect to SSE if workflow has already been submitted (not at registration step)
          // This prevents unnecessary SSE connection for fresh workflows
          if (workflow.currentStep !== 'registration') {
            // Now connect to realtime for updates
            setIsConnecting(true)
            await realtimeService.connect(workflowId, { userId: user?.id })
            console.log('Connected to realtime service for workflow:', workflowId)
            setIsConnecting(false)
            
            // IMPORTANT: Re-fetch workflow state after connecting to SSE
            // This catches any events that happened while we were disconnected (during refresh)
            setTimeout(async () => {
              try {
                const updatedWorkflow = await realtimeService.getWorkflowState(workflowId)
                if (updatedWorkflow && updatedWorkflow.currentStep !== workflow.currentStep) {
                  console.log('Workflow state changed while connecting, syncing...', {
                    old: workflow.currentStep,
                    new: updatedWorkflow.currentStep
                  })
                  
                  // Update to latest state
                  setCurrentStep(updatedWorkflow.currentStep)
                  
                  if (updatedWorkflow.finalResult) {
                    setFinalResult(updatedWorkflow.finalResult)
                  }
                  
                  if (updatedWorkflow.history) {
                    setWorkflowHistory(updatedWorkflow.history)
                  }
                  
                  if (updatedWorkflow.applicationData) {
                    setApplicationData(prev => ({
                      ...prev,
                      ...updatedWorkflow.applicationData,
                      userChoice: updatedWorkflow.userChoice || ''
                    }))
                  }
                }
              } catch (error) {
                console.error('Failed to sync workflow state after connecting:', error)
              }
            }, 1000) // Check 1 second after connecting
          } else {
            console.log('Workflow at registration step, SSE connection will be established after submission')
          }
          
        } catch (error) {
          console.error('Failed to load workflow or connect:', error)
          setIsLoadingWorkflow(false)
          setIsConnecting(false)
        }
      } else {
        // No workflowId in URL - create one immediately
        // This ensures workflow ID exists BEFORE user submits anything
        console.log('No workflow ID - creating new workflow immediately...')
        setIsLoadingWorkflow(true)
        
        try {
          const result = await realtimeService.createWorkflow(user.id, user.name)
          const newWorkflowId = result.workflowId
          
          console.log('New workflow created:', newWorkflowId)
          
          // Navigate to the new workflow URL immediately
          navigate(`/workflow/${newWorkflowId}`, { replace: true })
          // Note: This will trigger useEffect again with the workflowId
          
        } catch (error) {
          console.error('Failed to create workflow:', error)
          setIsLoadingWorkflow(false)
          alert('Failed to initialize workflow. Please try again.')
        }
      }
    }

    initializeWorkflow()

    // Set up message handler
    const removeMessageHandler = realtimeService.onMessage((data) => {
      console.log('Received workflow event:', data)
      handleWorkflowEvent(data)
    })

    // Set up status handler
    const removeStatusHandler = realtimeService.onStatusChange((status) => {
      console.log('Connection status:', status)
      setConnectionStatus(status)
    })

    // Cleanup on unmount
    return () => {
      removeMessageHandler()
      removeStatusHandler()
      realtimeService.disconnect()
    }
  }, [workflowId, user])

  // Handle incoming workflow events from server
  const handleWorkflowEvent = (event) => {
    const { type, data, timestamp } = event

    // Add to history (skip "connected" events - they're just for logging)
    if (type !== 'connected') {
      setWorkflowHistory(prev => [...prev, { 
        type, 
        data, 
        timestamp: timestamp || new Date().toISOString() 
      }])
    }

    switch (type) {
      case 'approval_granted':
        setCurrentStep(WORKFLOW_STEPS.USER_CHOICE)
        break
      case 'approval_denied':
        setCurrentStep(WORKFLOW_STEPS.COMPLETED)
        setFinalResult({ approved: false, reason: data.reason })
        break
      case 'final_approval':
        setCurrentStep(WORKFLOW_STEPS.COMPLETED)
        setFinalResult({ approved: true })
        break
      case 'final_denial':
        setCurrentStep(WORKFLOW_STEPS.COMPLETED)
        setFinalResult({ approved: false, reason: data.reason })
        break
      case 'connected':
        // Connection confirmation event - no action needed
        console.log('Connection confirmed:', data)
        break
      default:
        console.log('Unknown event type:', type)
    }
  }

  // Submit initial application
  const handleSubmitApplication = async (e) => {
    e.preventDefault()
    
    if (!applicationData.justification) {
      alert('Please provide justification for your request')
      return
    }

    try {
      // Connect to SSE BEFORE submitting (if not already connected)
      if (!realtimeService.eventSource) {
        console.log('Connecting to SSE before submission...')
        setIsConnecting(true)
        await realtimeService.connect(workflowId, { userId: user.id })
        setIsConnecting(false)
        console.log('Connected to realtime service')
      }
      
      // Submit the application data
      await realtimeService.sendAction('submit', {
        userId: user.id,
        userName: user.name,
        ...applicationData,
      })
      
      setWorkflowHistory(prev => [...prev, {
        type: 'application_submitted',
        data: applicationData,
        timestamp: new Date().toISOString(),
      }])
      
      setCurrentStep(WORKFLOW_STEPS.PENDING_APPROVAL)
    } catch (error) {
      console.error('Failed to submit application:', error)
      alert('Failed to submit application. Please try again.')
    }
  }

  // Submit user choice
  const handleSubmitChoice = async (e) => {
    e.preventDefault()
    
    if (!applicationData.userChoice) {
      alert('Please make a selection')
      return
    }

    try {
      await realtimeService.sendAction('choice', {
        userId: user.id,
        choice: applicationData.userChoice,
      })
      
      setWorkflowHistory(prev => [...prev, {
        type: 'user_choice_submitted',
        data: { choice: applicationData.userChoice },
        timestamp: new Date().toISOString(),
      }])
      
      setCurrentStep(WORKFLOW_STEPS.PENDING_FINAL)
    } catch (error) {
      console.error('Failed to submit choice:', error)
      alert('Failed to submit choice. Please try again.')
    }
  }

  // Reset workflow
  const handleReset = () => {
    realtimeService.reset()
    setCurrentStep(WORKFLOW_STEPS.REGISTRATION)
    setApplicationData({
      item: 'laptop',
      justification: '',
      specifications: '',
      userChoice: '',
    })
    setWorkflowHistory([])
    setFinalResult(null)
    setWorkflowNotFound(false)
    
    // Navigate back to /workflow (no ID)
    navigate('/workflow', { replace: true })
  }

  const handleLogout = () => {
    realtimeService.disconnect()
    logout()
    navigate('/login')
  }

  // Get step number for styling
  const getStepStatus = (step) => {
    const stepOrder = [
      WORKFLOW_STEPS.REGISTRATION,
      WORKFLOW_STEPS.PENDING_APPROVAL,
      WORKFLOW_STEPS.USER_CHOICE,
      WORKFLOW_STEPS.PENDING_FINAL,
      WORKFLOW_STEPS.COMPLETED,
    ]
    
    const currentIndex = stepOrder.indexOf(currentStep)
    const stepIndex = stepOrder.indexOf(step)
    
    if (stepIndex < currentIndex) return 'step-primary'
    if (stepIndex === currentIndex) return 'step-primary'
    return ''
  }

  // Show loading state while fetching workflow
  if (isLoadingWorkflow) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-lg">Loading workflow...</p>
        </div>
      </div>
    )
  }

  // Show error if workflow not found
  if (workflowNotFound) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="card bg-base-100 shadow-xl max-w-md">
          <div className="card-body text-center">
            <h2 className="card-title text-error justify-center text-2xl mb-4">
              Workflow Not Found
            </h2>
            <p className="mb-6">
              The workflow you're looking for doesn't exist or has been deleted.
            </p>
            <div className="card-actions justify-center">
              <button onClick={handleReset} className="btn btn-primary">
                Start New Workflow
              </button>
              <button onClick={handleLogout} className="btn btn-ghost">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-200 p-4">
      {/* Header */}
      <div className="navbar bg-base-100 rounded-box shadow-lg mb-6">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">Workflow Application System (Codehooks.io Demo)</a>
        </div>
        <div className="flex-none gap-2">
          <div className="flex items-center gap-2 mr-4">
            <div className="badge" 
              style={{ 
                backgroundColor: connectionStatus === 'connected' ? '#22c55e' : '#ef4444' 
              }}
            >
              {connectionStatus === 'connected' ? 'Live' : 'Offline'}
            </div>
          </div>
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar placeholder">
              <div className="bg-neutral text-neutral-content rounded-full w-10">
                <span className="text-xl">{user?.name?.[0] || 'U'}</span>
              </div>
            </div>
            <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
              <li className="menu-title">
                <span>{user?.name}</span>
              </li>
              <li><a>{user?.email}</a></li>
              <li><a onClick={handleLogout}>Logout</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto">
        {/* Steps Progress */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-6">Application Progress</h2>
            
            <ul className="steps steps-vertical lg:steps-horizontal w-full">
              <li className={`step ${getStepStatus(WORKFLOW_STEPS.REGISTRATION)}`}>
                <div className="text-left">
                  <div className="font-semibold">Registration</div>
                  <div className="text-xs opacity-70">Submit application</div>
                </div>
              </li>
              <li className={`step ${getStepStatus(WORKFLOW_STEPS.PENDING_APPROVAL)}`}>
                <div className="text-left">
                  <div className="font-semibold">Initial Approval</div>
                  <div className="text-xs opacity-70">Waiting for company</div>
                </div>
              </li>
              <li className={`step ${getStepStatus(WORKFLOW_STEPS.USER_CHOICE)}`}>
                <div className="text-left">
                  <div className="font-semibold">Your Choice</div>
                  <div className="text-xs opacity-70">Make a selection</div>
                </div>
              </li>
              <li className={`step ${getStepStatus(WORKFLOW_STEPS.PENDING_FINAL)}`}>
                <div className="text-left">
                  <div className="font-semibold">Final Approval</div>
                  <div className="text-xs opacity-70">Final review</div>
                </div>
              </li>
              <li className={`step ${getStepStatus(WORKFLOW_STEPS.COMPLETED)}`}>
                <div className="text-left">
                  <div className="font-semibold">Completed</div>
                  <div className="text-xs opacity-70">Result ready</div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Step Content */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            {/* Registration Step */}
            {currentStep === WORKFLOW_STEPS.REGISTRATION && (
              <div>
                <h3 className="text-2xl font-bold mb-4">
                  Request New Equipment
                </h3>
                <p className="text-base-content/70 mb-6">
                  Fill out the form below to request new equipment for your work.
                </p>
                
                <form onSubmit={handleSubmitApplication} className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Equipment Type</span>
                    </label>
                    <select 
                      className="select select-bordered"
                      value={applicationData.item}
                      onChange={(e) => setApplicationData({ 
                        ...applicationData, 
                        item: e.target.value 
                      })}
                    >
                      <option value="laptop">Laptop Computer</option>
                      <option value="desktop">Desktop Computer</option>
                      <option value="monitor">Monitor</option>
                      <option value="phone">Mobile Phone</option>
                      <option value="tablet">Tablet</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Justification *</span>
                    </label>
                    <textarea 
                      className="textarea textarea-bordered h-24"
                      placeholder="Why do you need this equipment?"
                      value={applicationData.justification}
                      onChange={(e) => setApplicationData({ 
                        ...applicationData, 
                        justification: e.target.value 
                      })}
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Specifications (Optional)</span>
                    </label>
                    <textarea 
                      className="textarea textarea-bordered h-24"
                      placeholder="Any specific requirements or preferences?"
                      value={applicationData.specifications}
                      onChange={(e) => setApplicationData({ 
                        ...applicationData, 
                        specifications: e.target.value 
                      })}
                    />
                  </div>

                  <div className="card-actions justify-end mt-6">
                    <button type="submit" className="btn btn-primary btn-lg">
                      Submit Application
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Pending Approval Step */}
            {currentStep === WORKFLOW_STEPS.PENDING_APPROVAL && (
              <div className="text-center py-8">
                <div className="flex justify-center mb-6">
                  <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
                <h3 className="text-2xl font-bold mb-4">
                  Awaiting Company Approval
                </h3>
                <p className="text-base-content/70 mb-6">
                  Your application has been submitted and is being reviewed by the management team.
                </p>
                <div className="alert alert-info max-w-md mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>You will be notified when a decision is made.</span>
                </div>
              </div>
            )}

            {/* User Choice Step */}
            {currentStep === WORKFLOW_STEPS.USER_CHOICE && (
              <div>
                <div className="alert alert-success mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Good news! Your application has been approved.</span>
                </div>

                <h3 className="text-2xl font-bold mb-4">
                  Choose Your Configuration
                </h3>
                <p className="text-base-content/70 mb-6">
                  Your request has been approved. Now please select your preferred configuration.
                </p>

                <form onSubmit={handleSubmitChoice} className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Select Configuration</span>
                    </label>
                    <div className="space-y-3">
                      <label className="label cursor-pointer border rounded-lg p-4 hover:bg-base-200">
                        <span className="label-text">
                          <div className="font-semibold">Standard Configuration</div>
                          <div className="text-sm opacity-70">8GB RAM, 256GB SSD</div>
                        </span>
                        <input 
                          type="radio" 
                          name="choice" 
                          className="radio radio-primary"
                          value="standard"
                          checked={applicationData.userChoice === 'standard'}
                          onChange={(e) => setApplicationData({ 
                            ...applicationData, 
                            userChoice: e.target.value 
                          })}
                        />
                      </label>

                      <label className="label cursor-pointer border rounded-lg p-4 hover:bg-base-200">
                        <span className="label-text">
                          <div className="font-semibold">Professional Configuration</div>
                          <div className="text-sm opacity-70">16GB RAM, 512GB SSD</div>
                        </span>
                        <input 
                          type="radio" 
                          name="choice" 
                          className="radio radio-primary"
                          value="professional"
                          checked={applicationData.userChoice === 'professional'}
                          onChange={(e) => setApplicationData({ 
                            ...applicationData, 
                            userChoice: e.target.value 
                          })}
                        />
                      </label>

                      <label className="label cursor-pointer border rounded-lg p-4 hover:bg-base-200">
                        <span className="label-text">
                          <div className="font-semibold">Premium Configuration</div>
                          <div className="text-sm opacity-70">32GB RAM, 1TB SSD</div>
                        </span>
                        <input 
                          type="radio" 
                          name="choice" 
                          className="radio radio-primary"
                          value="premium"
                          checked={applicationData.userChoice === 'premium'}
                          onChange={(e) => setApplicationData({ 
                            ...applicationData, 
                            userChoice: e.target.value 
                          })}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="card-actions justify-end mt-6">
                    <button type="submit" className="btn btn-primary btn-lg">
                      Submit Choice
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Pending Final Approval */}
            {currentStep === WORKFLOW_STEPS.PENDING_FINAL && (
              <div className="text-center py-8">
                <div className="flex justify-center mb-6">
                  <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
                <h3 className="text-2xl font-bold mb-4">
                  Final Review in Progress
                </h3>
                <p className="text-base-content/70 mb-6">
                  Your configuration choice is being reviewed for final approval.
                </p>
                <div className="alert alert-info max-w-md mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>This usually takes just a few moments...</span>
                </div>
              </div>
            )}

            {/* Completed */}
            {currentStep === WORKFLOW_STEPS.COMPLETED && (
              <div className="text-center py-8">
                {finalResult?.approved ? (
                  <>
                    <div className="flex justify-center mb-6">
                      <div className="rounded-full bg-success/20 p-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold mb-4 text-success">
                      Application Approved!
                    </h3>
                    <p className="text-base-content/70 mb-6">
                      Congratulations! Your equipment request has been fully approved.
                    </p>
                    <div className="alert alert-success max-w-md mx-auto mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>You will receive your equipment within 5-7 business days.</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-center mb-6">
                      <div className="rounded-full bg-error/20 p-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold mb-4 text-error">
                      Application Denied
                    </h3>
                    <p className="text-base-content/70 mb-6">
                      Unfortunately, your equipment request could not be approved at this time.
                    </p>
                    {finalResult?.reason && (
                      <div className="alert alert-warning max-w-md mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>Reason: {finalResult.reason}</span>
                      </div>
                    )}
                  </>
                )}
                
                <button onClick={handleReset} className="btn btn-primary btn-lg">
                  Start New Application
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Activity Log */}
        {workflowHistory.length > 0 && (
          <div className="card bg-base-100 shadow-xl mt-6">
            <div className="card-body">
              <h3 className="card-title">Activity Log</h3>
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Event</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workflowHistory.map((event, index) => (
                      <tr key={index}>
                        <td className="text-xs">
                          {new Date(event.timestamp).toLocaleString()}
                        </td>
                        <td>
                          <div className="badge">
                            {event.type.replace(/_/g, ' ')}
                          </div>
                        </td>
                        <td className="text-xs opacity-70">
                          {(() => {
                            const dataStr = JSON.stringify(event.data || {}, null, 2)
                            return dataStr.substring(0, 100) + (dataStr.length > 100 ? '...' : '')
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Workflow

