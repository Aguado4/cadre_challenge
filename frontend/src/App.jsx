import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import NotFoundPage from './pages/NotFoundPage'

// Temporary home placeholder — replaced in Phase 4 with FeedPage
function HomePage() {
  const { user, logout } = useAuth()
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">
        Cadre<span className="text-cadre-red">Book</span>
      </h1>
      <p className="text-cadre-muted text-sm">
        Welcome back, <strong className="text-white">@{user?.username}</strong>
      </p>
      <button
        onClick={logout}
        className="border border-cadre-red text-cadre-red px-4 py-1 rounded text-sm hover:bg-cadre-red hover:text-white transition"
      >
        Log out
      </button>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
