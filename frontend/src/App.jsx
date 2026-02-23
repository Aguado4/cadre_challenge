import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'
import Navbar from './components/Navbar'

// Temporary home placeholder — replaced in Phase 4 with FeedPage
function HomePage() {
  const { user } = useAuth()
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="flex flex-col items-center justify-center mt-20 gap-4">
        <p className="text-cadre-muted text-sm">
          Welcome back, <strong className="text-white">@{user?.username}</strong>
        </p>
        <p className="text-cadre-muted text-xs">Feed coming in Phase 4.</p>
      </div>
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
          <Route
            path="/profile/:username"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
