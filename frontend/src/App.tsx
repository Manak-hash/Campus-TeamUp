import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import GuestRoute from './components/GuestRoute'
import AppLayout from './components/AppLayout'
import PublicLayout from './components/PublicLayout'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './context/ToastContext'
import { ToastContainer } from './components/Toast'

// Public Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ExploreProjectsPage from './pages/ExploreProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import PublicProfilePage from './pages/PublicProfilePage'
import NotFoundPage from './pages/NotFoundPage'

// Protected Pages
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import EditProfilePage from './pages/EditProfilePage'
import ProjectFormPage from './pages/ProjectFormPage'
import MyApplicationsPage from './pages/MyApplicationsPage'
import BookmarksPage from './pages/BookmarksPage'
import NotificationsPage from './pages/NotificationsPage'

// Admin Pages
import AdminDashboardPage from './pages/AdminDashboardPage'

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <ToastContainer />
              <Routes>
                {/* Guest-only Routes */}
                <Route path="/login" element={
                  <GuestRoute>
                    <PublicLayout>
                      <LoginPage />
                    </PublicLayout>
                  </GuestRoute>
                } />
                <Route path="/register" element={
                  <GuestRoute>
                    <PublicLayout>
                      <RegisterPage />
                    </PublicLayout>
                  </GuestRoute>
                } />

                {/* Public Routes */}
                <Route path="/" element={
                  <PublicLayout>
                    <LandingPage />
                  </PublicLayout>
                } />
                <Route path="/explore" element={
                  <PublicLayout>
                    <ExploreProjectsPage />
                  </PublicLayout>
                } />
                <Route path="/profile/:id" element={
                  <PublicLayout>
                    <PublicProfilePage />
                  </PublicLayout>
                } />

                {/* Protected Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <DashboardPage />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ProfilePage />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/profile/edit" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <EditProfilePage />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/projects/new" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ProjectFormPage />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/projects/:slug/edit" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ProjectFormPage />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/projects/:slug" element={
                  <PublicLayout>
                    <ProjectDetailPage />
                  </PublicLayout>
                } />
                <Route path="/applications" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <MyApplicationsPage />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/bookmarks" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <BookmarksPage />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/notifications" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <NotificationsPage />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path="/admin" element={
                  <AdminRoute>
                    <AppLayout>
                      <AdminDashboardPage />
                    </AppLayout>
                  </AdminRoute>
                } />

                {/* 404 */}
                <Route path="*" element={
                  <PublicLayout>
                    <NotFoundPage />
                  </PublicLayout>
                } />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
