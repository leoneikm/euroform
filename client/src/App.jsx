import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CreateForm from './pages/CreateForm'
import FormManager from './pages/FormManager'
import AllSubmissions from './pages/AllSubmissions'
import Settings from './pages/Settings'
import EmbeddedForm from './pages/EmbeddedForm'
import FormPreview from './pages/FormPreview'
import Loading from './components/Loading'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loading />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Public Route Component (redirect to dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loading />
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Embedded Form Route (public, no background styling) */}
        <Route path="/form/:formId" element={<EmbeddedForm />} />
        
        {/* Form Preview Route (public, with proper styling) */}
        <Route path="/preview/:formId" element={<FormPreview />} />
        
        {/* All other routes with background styling */}
        <Route path="/*" element={
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public Routes */}
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                } 
              />
              
              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/forms/create" 
                element={
                  <ProtectedRoute>
                    <CreateForm />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/forms/:id" 
                element={
                  <ProtectedRoute>
                    <FormManager />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/submissions" 
                element={
                  <ProtectedRoute>
                    <AllSubmissions />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        } />
      </Routes>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App