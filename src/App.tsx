import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ThemeColorProvider } from '@/contexts/ThemeColorContext';
import { ImpiantoProvider } from '@/contexts/ImpiantoContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Toaster } from 'sonner';
import './i18n';

// ============================================
// MAIN APP COMPONENT
// Con Lazy Loading e Error Boundary
// ============================================

// Lazy load delle pagine per code splitting
const Login = lazy(() => import('@/pages/Auth/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('@/pages/Auth/Register').then(m => ({ default: m.Register })));
const VerifyEmail = lazy(() => import('@/pages/Auth/VerifyEmail').then(m => ({ default: m.VerifyEmail })));
const ForgotPassword = lazy(() => import('@/pages/Auth/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('@/pages/Auth/ResetPassword').then(m => ({ default: m.ResetPassword })));
const Dashboard = lazy(() => import('@/pages/Dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const Impianti = lazy(() => import('@/pages/Impianti/Impianti').then(m => ({ default: m.Impianti })));
const ImpiantoDettaglio = lazy(() => import('@/pages/Impianti/ImpiantoDettaglio').then(m => ({ default: m.ImpiantoDettaglio })));
const ImpiantoSettings = lazy(() => import('@/pages/Impianti/ImpiantoSettings').then(m => ({ default: m.ImpiantoSettings })));
const NuovoImpianto = lazy(() => import('@/pages/Impianti/NuovoImpianto').then(m => ({ default: m.NuovoImpianto })));
const Stanze = lazy(() => import('@/pages/Stanze/Stanze').then(m => ({ default: m.Stanze })));
const Dispositivi = lazy(() => import('@/pages/Dispositivi/Dispositivi').then(m => ({ default: m.Dispositivi })));
const Scene = lazy(() => import('@/pages/Scene/Scene').then(m => ({ default: m.Scene })));
const Settings = lazy(() => import('@/pages/Settings/Settings').then(m => ({ default: m.Settings })));
const Profilo = lazy(() => import('@/pages/Settings/Profilo').then(m => ({ default: m.Profilo })));
const DispositiviConnessi = lazy(() => import('@/pages/Settings/DispositiviConnessi').then(m => ({ default: m.DispositiviConnessi })));
const CambiaPassword = lazy(() => import('@/pages/Settings/CambiaPassword').then(m => ({ default: m.CambiaPassword })));
const Guida = lazy(() => import('@/pages/Settings/Guida').then(m => ({ default: m.Guida })));
const InfoApp = lazy(() => import('@/pages/Settings/InfoApp').then(m => ({ default: m.InfoApp })));
const TestAnimation = lazy(() => import('@/pages/Settings/TestAnimation').then(m => ({ default: m.TestAnimation })));
const SetupWizard = lazy(() => import('@/pages/Wizard/SetupWizard').then(m => ({ default: m.SetupWizard })));
const StylePreview = lazy(() => import('@/pages/StylePreview/StylePreview').then(m => ({ default: m.StylePreview })));
const PrivacyPolicy = lazy(() => import('@/pages/Legal').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import('@/pages/Legal').then(m => ({ default: m.TermsOfService })));
const Notifiche = lazy(() => import('@/pages/Notifiche').then(m => ({ default: m.Notifiche })));

// Loading fallback component
const PageLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#12110f',
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid rgba(106, 212, 160, 0.2)',
      borderTopColor: '#6ad4a0',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

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

    // Click-to-dismiss toasts - click anywhere on toast to close it
    const handleToastClick = (e: MouseEvent) => {
      const toastEl = (e.target as HTMLElement).closest('[data-sonner-toast]');
      if (toastEl) {
        // Sonner usa data-sonner-toast come attributo vuoto e data-id per l'ID
        const toastId = toastEl.getAttribute('data-id') || toastEl.getAttribute('data-sonner-toast');
        import('sonner').then(({ toast }) => {
          if (toastId) {
            toast.dismiss(toastId);
          } else {
            // Fallback: chiudi tutti i toast
            toast.dismiss();
          }
        });
      }
    };
    document.addEventListener('click', handleToastClick, true);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleToastClick);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ThemeColorProvider>
          <Toaster
            position="top-center"
            expand={false}
            visibleToasts={1}
            toastOptions={{
              duration: 500,
              style: {
                cursor: 'pointer',
                background: 'var(--toast-bg, #1a1918)',
                color: 'var(--toast-color, #fff)',
                border: '1px solid var(--accent-color, #6ad4a0)',
              },
              classNames: {
                error: 'toast-error',
              },
            }}
          />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/style-preview" element={<StylePreview />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/impianti" element={<ProtectedRoute><Impianti /></ProtectedRoute>} />
                <Route path="/impianti/nuovo" element={<ProtectedRoute><NuovoImpianto /></ProtectedRoute>} />
                <Route path="/impianti/:id" element={<ProtectedRoute><ImpiantoDettaglio /></ProtectedRoute>} />
                <Route path="/impianti/:id/settings" element={<ProtectedRoute><ImpiantoSettings /></ProtectedRoute>} />
                <Route path="/stanze" element={<ProtectedRoute><Stanze /></ProtectedRoute>} />
                <Route path="/dispositivi" element={<ProtectedRoute><Dispositivi /></ProtectedRoute>} />
                <Route path="/scene" element={<ProtectedRoute><Scene /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/settings/profilo" element={<ProtectedRoute><Profilo /></ProtectedRoute>} />
                <Route path="/settings/dispositivi-connessi" element={<ProtectedRoute><DispositiviConnessi /></ProtectedRoute>} />
                <Route path="/settings/password" element={<ProtectedRoute><CambiaPassword /></ProtectedRoute>} />
                <Route path="/settings/guida" element={<ProtectedRoute><Guida /></ProtectedRoute>} />
                <Route path="/settings/info" element={<ProtectedRoute><InfoApp /></ProtectedRoute>} />
                <Route path="/settings/test-animation" element={<ProtectedRoute><TestAnimation /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifiche /></ProtectedRoute>} />
                <Route path="/setup" element={<ProtectedRoute><SetupWizard /></ProtectedRoute>} />
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ThemeColorProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
