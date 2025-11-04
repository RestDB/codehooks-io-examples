import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Workflow from './pages/Workflow'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

function App() {
  const { user } = useAuth()
  
  return (
    <div className="min-h-screen bg-base-200">
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/workflow" replace /> : <Login />} 
        />
        <Route 
          path="/workflow" 
          element={
            <ProtectedRoute>
              <Workflow />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/workflow/:workflowId" 
          element={
            <ProtectedRoute>
              <Workflow />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/workflow" replace />} />
      </Routes>
    </div>
  )
}

export default App

