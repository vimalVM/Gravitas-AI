import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AuthProvider from './context/AuthProvider';
import ToastProvider from './context/ToastProvider';
import { RoleProtectedRoute } from './components/auth/RouteGuards';
import { LoadingState } from './components/common/States';
import { useAuth } from './hooks/useAuth';
import AppLayout from './layouts/AppLayout';
import PublicLandingPage from './pages/PublicLandingPage';
import UserLoginPage from './pages/UserLoginPage';
import UserRegisterPage from './pages/UserRegisterPage';
import OperatorLoginPage from './pages/OperatorLoginPage';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import ProjectsPage from './pages/ProjectsPage';
import ProfilePage from './pages/ProfilePage';
import OperatorDashboard from './pages/OperatorDashboard';
import NotFoundPage from './pages/NotFoundPage';

function AppRoutes() {
  const { initializing } = useAuth();
  if (initializing) return <LoadingState fullScreen label="Starting Gravitas AI..." />;

  return (
    <Routes>
      <Route path="/" element={<PublicLandingPage />} />
      <Route path="/login" element={<Navigate to="/login/user" replace />} />
      <Route path="/login/user" element={<UserLoginPage />} />
      <Route path="/login/ai" element={<OperatorLoginPage />} />
      <Route path="/register" element={<UserRegisterPage />} />

      <Route
        element={
          <RoleProtectedRoute role="user">
            <AppLayout />
          </RoleProtectedRoute>
        }
      >
        <Route path="/home" element={<HomePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route
        path="/ai/dashboard/:conversationId?"
        element={
          <RoleProtectedRoute role="ai_operator">
            <OperatorDashboard />
          </RoleProtectedRoute>
        }
      />
      <Route path="/ai" element={<Navigate to="/ai/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
