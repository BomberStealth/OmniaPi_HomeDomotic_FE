import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ThemeColorProvider } from '@/contexts/ThemeColorContext';
import { ImpiantoProvider } from '@/contexts/ImpiantoContext';
import { Toaster } from 'sonner';
import { Login } from '@/pages/Auth/Login';
import { Register } from '@/pages/Auth/Register';
import { Dashboard } from '@/pages/Dashboard/Dashboard';
import { Impianti } from '@/pages/Impianti/Impianti';
import { ImpiantoDettaglio } from '@/pages/Impianti/ImpiantoDettaglio';
import { ImpiantoSettings } from '@/pages/Impianti/ImpiantoSettings';
import { NuovoImpianto } from '@/pages/Impianti/NuovoImpianto';
import { Stanze } from '@/pages/Stanze/Stanze';
import { Dispositivi } from '@/pages/Dispositivi/Dispositivi';
import { Scene } from '@/pages/Scene/Scene';
import { Settings } from '@/pages/Settings/Settings';
import { StylePreview } from '@/pages/StylePreview/StylePreview';
import { PrivacyPolicy, TermsOfService } from '@/pages/Legal';
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

  // Disable native context menu app-wide (except in dev mode for debugging)
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Allow context menu only on input elements for text editing
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  return (
    <ThemeProvider>
      <ThemeColorProvider>
        <Toaster position="top-right" richColors expand={false} />
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/style-preview" element={<StylePreview />} />
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
          path="/impianti/nuovo"
          element={
            <ProtectedRoute>
              <NuovoImpianto />
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
      </ThemeColorProvider>
    </ThemeProvider>
  );
}

export default App;
