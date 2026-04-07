import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import PromptsPage from './pages/PromptsPage'
import ComparePage from './pages/ComparePage'
import AIConfigsPage from './pages/AIConfigsPage'
import KnowledgePage from './pages/KnowledgePage'
import ConversationsPage from './pages/ConversationsPage'
import CategoriesPage from './pages/CategoriesPage'
import SettingsPage from './pages/SettingsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-brutal-yellow flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-brutal-pink animate-spin mx-auto mb-4" />
          <p className="font-black text-xl">LOADING...</p>
        </div>
      </div>
    )
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-brutal-yellow flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-black border-t-brutal-pink animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/prompts" /> : <LoginPage />} />
      <Route path="/prompts" element={<ProtectedRoute><Layout><PromptsPage /></Layout></ProtectedRoute>} />
      <Route path="/compare" element={<ProtectedRoute><Layout><ComparePage /></Layout></ProtectedRoute>} />
      <Route path="/ai-configs" element={<ProtectedRoute><Layout><AIConfigsPage /></Layout></ProtectedRoute>} />
      <Route path="/knowledge" element={<ProtectedRoute><Layout><KnowledgePage /></Layout></ProtectedRoute>} />
      <Route path="/conversations" element={<ProtectedRoute><Layout><ConversationsPage /></Layout></ProtectedRoute>} />
      <Route path="/categories" element={<ProtectedRoute><Layout><CategoriesPage /></Layout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/prompts" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              border: '2px solid black',
              borderRadius: '0',
              boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
              fontFamily: 'monospace',
              fontWeight: 900,
            },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
