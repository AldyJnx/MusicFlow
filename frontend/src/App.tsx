import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

// Client pages (to be implemented)
const LibraryPage = () => <div className="p-8"><h1 className="text-2xl font-bold">Biblioteca</h1></div>
const PlaylistsPage = () => <div className="p-8"><h1 className="text-2xl font-bold">Playlists</h1></div>
const NowPlayingPage = () => <div className="p-8"><h1 className="text-2xl font-bold">Reproduciendo</h1></div>
const SettingsPage = () => <div className="p-8"><h1 className="text-2xl font-bold">Configuracion</h1></div>
const LoginPage = () => <div className="p-8"><h1 className="text-2xl font-bold">Login</h1></div>

// Admin pages (to be implemented)
const DashboardPage = () => <div className="p-8"><h1 className="text-2xl font-bold">Dashboard Admin</h1></div>
const UsersPage = () => <div className="p-8"><h1 className="text-2xl font-bold">Usuarios</h1></div>

// Layout components (to be implemented)
const ClientLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background text-foreground">
    <nav className="h-16 border-b flex items-center px-4">
      <span className="text-xl font-bold">MusicFlow</span>
    </nav>
    <main>{children}</main>
  </div>
)

const AdminLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background text-foreground">
    <nav className="h-16 border-b flex items-center px-4 bg-primary/10">
      <span className="text-xl font-bold">MusicFlow Admin</span>
    </nav>
    <main>{children}</main>
  </div>
)

// Protected route component
const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) => {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/app" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Client routes */}
      <Route path="/app" element={
        <ProtectedRoute>
          <ClientLayout>
            <LibraryPage />
          </ClientLayout>
        </ProtectedRoute>
      } />
      <Route path="/app/library" element={
        <ProtectedRoute>
          <ClientLayout>
            <LibraryPage />
          </ClientLayout>
        </ProtectedRoute>
      } />
      <Route path="/app/playlists" element={
        <ProtectedRoute>
          <ClientLayout>
            <PlaylistsPage />
          </ClientLayout>
        </ProtectedRoute>
      } />
      <Route path="/app/now-playing" element={
        <ProtectedRoute>
          <ClientLayout>
            <NowPlayingPage />
          </ClientLayout>
        </ProtectedRoute>
      } />
      <Route path="/app/settings" element={
        <ProtectedRoute>
          <ClientLayout>
            <SettingsPage />
          </ClientLayout>
        </ProtectedRoute>
      } />

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute adminOnly>
          <AdminLayout>
            <DashboardPage />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute adminOnly>
          <AdminLayout>
            <UsersPage />
          </AdminLayout>
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}

export default App
