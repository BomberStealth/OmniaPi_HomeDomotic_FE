import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ImpiantoProvider } from '@/contexts/ImpiantoContext';
import { Toaster } from 'sonner';
import { Login } from '@/pages/Auth/Login';
import { Register } from '@/pages/Auth/Register';
import { Dashboard } from '@/pages/Dashboard/Dashboard';
import { Impianti } from '@/pages/Impianti/Impianti';
import { ImpiantoDettaglio } from '@/pages/Impianti/ImpiantoDettaglio';
import { ImpiantoSettings } from '@/pages/Impianti/ImpiantoSettings';
import { Stanze } from '@/pages/Stanze/Stanze';
import { Dispositivi } from '@/pages/Dispositivi/Dispositivi';
import { Scene } from '@/pages/Scene/Scene';
import { Settings } from '@/pages/Settings/Settings';
import './i18n';

// ============================================
// MAIN APP COMPONENT
// ============================================

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuthStore();
  return token ? (
    <ImpiantoProvider>
      {children}
    </ImpiantoProvider>
  ) : (
    <Navigate to="/login" />
  );
};

function App() {
  const { loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <ThemeProvider>
      <Toaster position="top-right" richColors expand={false} />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/impianti"
          element={
            <ProtectedRoute>
              <Impianti />
            </ProtectedRoute>
          }
        />
        <Route
          path="/impianti/:id"
          element={
            <ProtectedRoute>
              <ImpiantoDettaglio />
            </ProtectedRoute>
          }
        />
        <Route
          path="/impianti/:id/settings"
          element={
            <ProtectedRoute>
              <ImpiantoSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stanze"
          element={
            <ProtectedRoute>
              <Stanze />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dispositivi"
          element={
            <ProtectedRoute>
              <Dispositivi />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scene"
          element={
            <ProtectedRoute>
              <Scene />
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
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
