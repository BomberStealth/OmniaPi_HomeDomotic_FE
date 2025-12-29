import { Component, ErrorInfo, ReactNode } from 'react';
import { RiAlertLine, RiRefreshLine, RiHome2Line } from 'react-icons/ri';

// ============================================
// ERROR BOUNDARY - Previene crash totale app
// ============================================

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Colori fissi (non usa tema per evitare errori circolari)
const colors = {
  bg: '#12110f',
  card: '#1e1c18',
  accent: '#ef4444',
  text: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  border: 'rgba(239, 68, 68, 0.3)',
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log errore per debugging (solo in development)
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // In produzione, potremmo inviare a un servizio di monitoring
    // es. Sentry, LogRocket, etc.
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Fallback custom se fornito
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback di default
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: colors.bg,
            fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '400px',
              width: '100%',
              padding: '32px',
              background: colors.card,
              borderRadius: '24px',
              border: `1px solid ${colors.border}`,
              textAlign: 'center',
            }}
          >
            {/* Icona errore */}
            <div
              style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 24px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RiAlertLine size={32} color={colors.accent} />
            </div>

            {/* Titolo */}
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: colors.text,
                marginBottom: '8px',
              }}
            >
              Qualcosa è andato storto
            </h1>

            {/* Descrizione */}
            <p
              style={{
                fontSize: '14px',
                color: colors.textMuted,
                marginBottom: '24px',
                lineHeight: 1.5,
              }}
            >
              Si è verificato un errore imprevisto. Prova a ricaricare la pagina o torna alla dashboard.
            </p>

            {/* Dettagli errore (solo in dev) */}
            {import.meta.env.DEV && this.state.error && (
              <div
                style={{
                  marginBottom: '24px',
                  padding: '12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '12px',
                  textAlign: 'left',
                  overflow: 'auto',
                  maxHeight: '150px',
                }}
              >
                <code
                  style={{
                    fontSize: '11px',
                    color: colors.accent,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </code>
              </div>
            )}

            {/* Bottoni azione */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleRetry}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: `1px solid ${colors.border}`,
                  background: 'transparent',
                  color: colors.text,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <RiRefreshLine size={18} />
                Riprova
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: colors.accent,
                  color: colors.text,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <RiHome2Line size={18} />
                Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
