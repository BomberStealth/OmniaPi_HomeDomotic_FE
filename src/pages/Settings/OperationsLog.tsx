import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { useViewTransitionNavigate } from '@/hooks/useViewTransition';
import { omniapiApi } from '@/services/omniapiApi';
import {
  RiArrowLeftLine,
  RiLoader4Line,
  RiFilterLine,
  RiFileListLine,
} from 'react-icons/ri';

// ============================================
// OPERATIONS LOG PAGE
// Tabella operazioni critiche (admin/installatore)
// ============================================

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
}

const TIPO_LABELS: Record<string, string> = {
  commission: 'Commission',
  delete_node: 'Elimina nodo',
  ota_gateway: 'OTA Gateway',
  ota_node: 'OTA Nodo',
  scan: 'Scan',
  factory_reset: 'Factory Reset',
  delete_impianto: 'Elimina impianto',
  reconciliation: 'Riconciliazione',
};

const RISULTATO_COLORS: Record<string, string> = {
  success: '#22c55e',
  error: '#ef4444',
  timeout: '#f59e0b',
  skipped: '#94a3b8',
};

export const OperationsLog = () => {
  const { colors: themeColors, modeColors } = useThemeColor();
  const { impiantoCorrente } = useImpiantoContext();
  const navigate = useViewTransitionNavigate();

  const [operations, setOperations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState<string>('');

  const colors = {
    ...modeColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    accentDark: themeColors.accentDark,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
  };

  const cardStyle = {
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: '20px',
    boxShadow: colors.cardShadow,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  };

  useEffect(() => {
    loadOperations();
  }, [filterTipo, impiantoCorrente]);

  const loadOperations = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 200 };
      if (filterTipo) params.tipo = filterTipo;
      if (impiantoCorrente?.id) params.impianto_id = impiantoCorrente.id;
      const data = await omniapiApi.getOperations(params);
      setOperations(data.operations || []);
    } catch (err) {
      console.error('Errore caricamento operazioni:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDetails = (dettagli: any): string => {
    if (!dettagli) return '-';
    if (typeof dettagli === 'string') {
      try { dettagli = JSON.parse(dettagli); } catch { return dettagli; }
    }
    // Show concise key=value pairs
    return Object.entries(dettagli)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  };

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '10px',
              borderRadius: '12px',
              background: colors.bgCard,
              border: `1px solid ${colors.border}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <RiArrowLeftLine size={20} color={colors.textSecondary} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
              Log Operazioni
            </h1>
            <p style={{ fontSize: '12px', color: colors.textMuted, margin: '2px 0 0 0' }}>
              {impiantoCorrente?.nome || 'Tutte'}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div style={{ ...cardStyle, padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <RiFilterLine size={16} style={{ color: colors.textMuted, flexShrink: 0 }} />
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '10px',
              background: colors.bgCard,
              border: `1px solid ${colors.border}`,
              color: colors.textPrimary,
              fontSize: '13px',
              outline: 'none',
            }}
          >
            <option value="">Tutti i tipi</option>
            {Object.entries(TIPO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <RiLoader4Line size={28} style={{ color: colors.accent, animation: 'spin 1s linear infinite' }} />
          </div>
        ) : operations.length === 0 ? (
          <div style={{ ...cardStyle, padding: '32px', textAlign: 'center' }}>
            <RiFileListLine size={36} style={{ color: colors.textMuted, opacity: 0.5 }} />
            <p style={{ fontSize: '14px', color: colors.textMuted, margin: '8px 0 0 0' }}>
              Nessuna operazione trovata
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {operations.map((op) => (
              <div key={op.id} style={{ ...cardStyle, padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {/* Tipo badge */}
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: `${colors.accent}20`,
                        color: colors.accent,
                        whiteSpace: 'nowrap',
                      }}>
                        {TIPO_LABELS[op.tipo] || op.tipo}
                      </span>
                      {/* Risultato badge */}
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: `${RISULTATO_COLORS[op.risultato] || '#666'}20`,
                        color: RISULTATO_COLORS[op.risultato] || '#666',
                        whiteSpace: 'nowrap',
                      }}>
                        {op.risultato}
                      </span>
                    </div>
                    {/* Details */}
                    <p style={{
                      fontSize: '12px',
                      color: colors.textSecondary,
                      margin: '6px 0 0 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {formatDetails(op.dettagli)}
                    </p>
                  </div>
                  {/* Timestamp */}
                  <span style={{
                    fontSize: '11px',
                    color: colors.textMuted,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {formatDate(op.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );
};

export default OperationsLog;
