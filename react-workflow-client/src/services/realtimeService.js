import { EventSourcePolyfill } from 'event-source-polyfill'

class RealtimeService {
  constructor() {
    this.eventSource = null
    this.listenerID = null
    this.workflowId = null
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    this.apiToken = import.meta.env.VITE_API_TOKEN || 'your-api-token'
    this.messageHandlers = []
    this.statusHandlers = []
  }

  // Create a new workflow
  async createWorkflow(userId, userName) {
    try {
      const response = await fetch(`${this.baseURL}/workflow/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-apikey': this.apiToken,
        },
        body: JSON.stringify({ userId, userName }),
      })

      if (!response.ok) {
        throw new Error('Failed to create workflow')
      }

      const result = await response.json()
      this.workflowId = result.workflowId
      return result
    } catch (error) {
      console.error('Error creating workflow:', error)
      throw error
    }
  }

  // Get workflow state
  async getWorkflowState(workflowId) {
    try {
      const response = await fetch(`${this.baseURL}/workflow/${workflowId}/state`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-apikey': this.apiToken,
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null // Workflow not found
        }
        throw new Error('Failed to fetch workflow state')
      }

      const result = await response.json()
      return result.workflow
    } catch (error) {
      console.error('Error fetching workflow state:', error)
      throw error
    }
  }

  // Connect to the realtime channel
  async connect(workflowId, interests = {}) {
    try {
      this.workflowId = workflowId

      // First, get a listener ID from the server
      // Pass workflowId in interests so listener is filtered to only this workflow
      const response = await fetch(`${this.baseURL}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-apikey': this.apiToken,
        },
        body: JSON.stringify({ ...interests, workflowId }),
      })

      if (!response.ok) {
        throw new Error('Failed to connect to realtime service')
      }

      const result = await response.json()
      this.listenerID = result.listenerID

      // Now connect to the EventSource stream using Codehooks format: /<channel>/<listenerID>
      this.eventSource = new EventSourcePolyfill(
        `${this.baseURL}/workflow/${this.listenerID}`,
        {
          headers: {
            'x-apikey': this.apiToken,
          },
        }
      )

      // Set up event listeners
      this.eventSource.onopen = (event) => {
        console.log('Realtime connection opened', event)
        this._notifyStatusHandlers('connected')
      }

      this.eventSource.onmessage = (event) => {
        console.log('Realtime message received:', event.data)
        try {
          const data = JSON.parse(event.data)
          this._notifyMessageHandlers(data)
        } catch (error) {
          console.error('Failed to parse message:', error)
        }
      }

      this.eventSource.onerror = (event) => {
        console.error('Realtime connection error:', event)
        this._notifyStatusHandlers('error')
        
        if (this.eventSource?.readyState === EventSource.CLOSED) {
          console.log('Connection closed')
          this._notifyStatusHandlers('closed')
        }
      }

      return this.listenerID
    } catch (error) {
      console.error('Error connecting to realtime service:', error)
      this._notifyStatusHandlers('error')
      throw error
    }
  }

  // Disconnect from the realtime channel
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
      this.listenerID = null
      this._notifyStatusHandlers('disconnected')
    }
  }

  // Reset service (clears workflow ID)
  reset() {
    this.disconnect()
    this.workflowId = null
  }

  // Add a message handler
  onMessage(handler) {
    this.messageHandlers.push(handler)
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler)
    }
  }

  // Add a status handler
  onStatusChange(handler) {
    this.statusHandlers.push(handler)
    return () => {
      this.statusHandlers = this.statusHandlers.filter(h => h !== handler)
    }
  }

  // Notify all message handlers
  _notifyMessageHandlers(data) {
    this.messageHandlers.forEach(handler => {
      try {
        handler(data)
      } catch (error) {
        console.error('Error in message handler:', error)
      }
    })
  }

  // Notify all status handlers
  _notifyStatusHandlers(status) {
    this.statusHandlers.forEach(handler => {
      try {
        handler(status)
      } catch (error) {
        console.error('Error in status handler:', error)
      }
    })
  }

  // Send an action/message to the server (via REST API, not SSE)
  async sendAction(action, data) {
    if (!this.workflowId) {
      throw new Error('No workflow ID set. Create or load a workflow first.')
    }

    try {
      const response = await fetch(`${this.baseURL}/workflow/${this.workflowId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-apikey': this.apiToken,
        },
        body: JSON.stringify({
          listenerID: this.listenerID,
          ...data,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to send action: ${action}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error sending action:', error)
      throw error
    }
  }
}

// Create a singleton instance
const realtimeService = new RealtimeService()

export default realtimeService

