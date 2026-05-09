import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MapPage from './pages/MapPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import StatisticsPage from './pages/StatisticsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminAuditLogsPage from './pages/AdminAuditLogsPage';
import AlertsPage from './pages/AlertsPage';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import './App.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000, // Data is fresh for 5 seconds
      gcTime: 1000 * 60 * 5, // Cache garbage collection after 5 minutes
      retry: 1,
      retryDelay: 1000,
    },
  },
});

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes with Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <MapPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/statistics"
        element={
          <ProtectedRoute requiredRoles={['admin', 'operator']}>
            <Layout>
              <StatisticsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requiredRoles="admin">
            <Layout>
              <AdminUsersPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/audit-logs"
        element={
          <ProtectedRoute requiredRoles="admin">
            <Layout>
              <AdminAuditLogsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/alerts"
        element={
          <ProtectedRoute requiredRoles={['admin', 'operator']}>
            <Layout>
              <AlertsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
