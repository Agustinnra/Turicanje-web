'use client';

import { useState, useEffect } from 'react';
import './tab-analytics-web.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://turicanje-backend.onrender.com';

// ============================================================
// INTERFACES
// ============================================================
interface AnalyticsSummary {
  total_visitors: number;
  total_sessions: number;
  total_pageviews: number;
}

interface DailyData {
  date: string;
  unique_visitors: number;
  total_sessions: number;
  total_pageviews: number;
  new_visitors: number;
  avg_session_duration: number;
  avg_pages_per_session: number;
  bounce_rate: number;
  sessions_from_bot: number;
}

interface TopPage {
  page_path: string;
  page_type: string;
  place_id: string | null;
  views: number;
  unique_visitors: number;
  avg_time_seconds: number;
  avg_scroll_depth: number;
}

interface Source {
  source: string;
  pageviews: number;
  unique_visitors: number;
  sessions: number;
}

interface Device {
  device_type: string;
  count: number;
}

interface ClickSummary {
  destination_type: string;
  element_id: string;
  total_clicks: number;
  unique_clickers: number;
  places_affected: number;
}

interface BotConversion {
  date: string;
  bot_sessions: number;
  pageviews: number;
  clicks: number;
  whatsapp_clicks: number;
  phone_clicks: number;
  maps_clicks: number;
}

interface RealtimeData {
  active_visitors: number;
  active_sessions: number;
  pageviews_5min: number;
  current_pages: { page_path: string; visitors: number }[];
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function TabAnalyticsWeb() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  
  // Estados de datos
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [today, setToday] = useState<{ visitors: number; pageviews: number } | null>(null);
  const [yesterday, setYesterday] = useState<{ visitors: number; pageviews: number } | null>(null);
  const [daily, setDaily] = useState<DailyData[]>([]);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [clicks, setClicks] = useState<ClickSummary[]>([]);
  const [botConversion, setBotConversion] = useState<BotConversion[]>([]);
  const [realtime, setRealtime] = useState<RealtimeData | null>(null);

  // ============================================================
  // CARGAR DATOS
  // ============================================================
  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No autorizado');
      setLoading(false);
      return;
    }

    try {
      // Cargar summary
      const res = await fetch(`${API_URL}/api/analytics/summary?days=${days}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error('Error al cargar analytics');
      }
      
      const data = await res.json();
      
      setSummary(data.summary);
      setToday(data.today);
      setYesterday(data.yesterday);
      setDaily(data.daily || []);
      setTopPages(data.top_pages || []);
      setSources(data.sources || []);
      setDevices(data.devices || []);
      setClicks(data.clicks || []);
      setBotConversion(data.bot_conversion || []);
      
      // Cargar realtime
      const realtimeRes = await fetch(`${API_URL}/api/analytics/realtime`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (realtimeRes.ok) {
        const realtimeData = await realtimeRes.json();
        setRealtime(realtimeData);
      }
      
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // EXPORTAR CSV
  // ============================================================
  const exportarCSV = () => {
    if (daily.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    
    // Headers
    const headers = ['Fecha', 'Visitantes', 'Nuevos', 'Sesiones', 'Pageviews', 'Paginas/Sesion', 'Duracion Prom (seg)', 'Bounce Rate'];
    
    // Rows
    const rows = daily.map(row => [
      new Date(row.date).toLocaleDateString('es-MX'),
      row.unique_visitors,
      row.new_visitors,
      row.total_sessions,
      row.total_pageviews,
      Number(row.avg_pages_per_session || 0).toFixed(1),
      Math.round(row.avg_session_duration || 0),
      Number(row.bounce_rate || 0).toFixed(0) + '%'
    ]);
    
    // Build CSV
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-web-${days}dias-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    cargarDatos();
    
    // Actualizar realtime cada 30 segundos
    const interval = setInterval(async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        const res = await fetch(`${API_URL}/api/analytics/realtime`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRealtime(data);
        }
      } catch (err) {
        // Silenciar errores de realtime
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [days]);

  // ============================================================
  // HELPERS
  // ============================================================
  const getSourceIcon = (source: string) => {
    const icons: Record<string, string> = {
      'direct': '🔗',
      'google': '🔍',
      'facebook': '📘',
      'instagram': '📸',
      'whatsapp': '💬',
      'bot': '🤖',
      'twitter': '🐦',
      'internal': '🔄',
      'other': '🌐'
    };
    return icons[source] || '🌐';
  };

  const getDeviceIcon = (device: string) => {
    const icons: Record<string, string> = {
      'mobile': '📱',
      'desktop': '💻',
      'tablet': '📲'
    };
    return icons[device?.toLowerCase()] || '📱';
  };

  const getClickIcon = (type: string) => {
    const icons: Record<string, string> = {
      'whatsapp': '💬',
      'phone': '📞',
      'maps': '📍',
      'delivery': '🛵',
      'social': '📱',
      'menu': '📋',
      'internal': '🔄',
      'external': '🔗'
    };
    return icons[type] || '👆';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0s';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const calcChange = (today: number, yesterday: number) => {
    if (!yesterday || yesterday === 0) return null;
    const change = ((today - yesterday) / yesterday) * 100;
    return change;
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="analytics-web-loading">
        <div className="spinner"></div>
        <p>Cargando analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-web-error">
        <p>❌ {error}</p>
        <button onClick={cargarDatos}>🔄 Reintentar</button>
      </div>
    );
  }

  const visitorsChange = calcChange(today?.visitors || 0, yesterday?.visitors || 0);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="analytics-web-container">
      {/* Header con filtro de días */}
      <div className="analytics-web-header">
        <h2>🌐 Analytics Web</h2>
        <div className="analytics-web-filters">
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>Últimos 7 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={90}>Últimos 90 días</option>
          </select>
          <button onClick={cargarDatos} className="btn-refresh">🔄 Actualizar</button>
          <button onClick={exportarCSV} className="btn-export">📥 Exportar</button>
        </div>
      </div>

      {/* Realtime */}
      {realtime && (
        <div className="realtime-bar">
          <span className="realtime-dot"></span>
          <strong>{realtime.active_visitors}</strong> visitante{realtime.active_visitors !== 1 ? 's' : ''} ahora mismo
          {realtime.current_pages?.length > 0 && (
            <span className="realtime-pages">
              en: {realtime.current_pages.slice(0, 3).map(p => p.page_path).join(', ')}
            </span>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="analytics-web-stats">
        <div className="stat-card-web">
          <span className="stat-icon-web">👥</span>
          <div className="stat-info-web">
            <span className="stat-value-web">{formatNumber(today?.visitors || 0)}</span>
            <span className="stat-label-web">Visitantes Hoy</span>
            {visitorsChange !== null && (
              <span className={`stat-change ${visitorsChange >= 0 ? 'positive' : 'negative'}`}>
                {visitorsChange >= 0 ? '↑' : '↓'} {Math.abs(visitorsChange).toFixed(0)}%
              </span>
            )}
          </div>
        </div>
        
        <div className="stat-card-web">
          <span className="stat-icon-web">👁️</span>
          <div className="stat-info-web">
            <span className="stat-value-web">{formatNumber(today?.pageviews || 0)}</span>
            <span className="stat-label-web">Pageviews Hoy</span>
          </div>
        </div>
        
        <div className="stat-card-web">
          <span className="stat-icon-web">📊</span>
          <div className="stat-info-web">
            <span className="stat-value-web">{formatNumber(summary?.total_visitors || 0)}</span>
            <span className="stat-label-web">Visitantes ({days}d)</span>
          </div>
        </div>
        
        <div className="stat-card-web">
          <span className="stat-icon-web">📈</span>
          <div className="stat-info-web">
            <span className="stat-value-web">{formatNumber(summary?.total_pageviews || 0)}</span>
            <span className="stat-label-web">Pageviews ({days}d)</span>
          </div>
        </div>
      </div>

      {/* Grid de secciones */}
      <div className="analytics-web-grid">
        
        {/* Top Páginas */}
        <div className="analytics-web-card">
          <h3>📄 Top Páginas</h3>
          <div className="analytics-list">
            {topPages.length > 0 ? (
              topPages.slice(0, 10).map((page, i) => (
                <div key={i} className="analytics-list-item">
                  <span className="rank">#{i + 1}</span>
                  <div className="item-info">
                    <span className="item-name">{page.page_path}</span>
                    <span className="item-meta">
                      {page.unique_visitors} visitantes • {formatDuration(page.avg_time_seconds)} promedio
                    </span>
                  </div>
                  <span className="item-value">{formatNumber(page.views)}</span>
                </div>
              ))
            ) : (
              <p className="empty">Sin datos aún</p>
            )}
          </div>
        </div>

        {/* Orígenes de Tráfico */}
        <div className="analytics-web-card">
          <h3>🚦 Origen del Tráfico</h3>
          <div className="analytics-list">
            {sources.length > 0 ? (
              sources.map((source, i) => (
                <div key={i} className="analytics-list-item">
                  <span className="rank">{getSourceIcon(source.source)}</span>
                  <div className="item-info">
                    <span className="item-name">{source.source || 'directo'}</span>
                    <span className="item-meta">{source.sessions} sesiones</span>
                  </div>
                  <span className="item-value">{formatNumber(source.pageviews)}</span>
                </div>
              ))
            ) : (
              <p className="empty">Sin datos aún</p>
            )}
          </div>
        </div>

        {/* Dispositivos */}
        <div className="analytics-web-card">
          <h3>📱 Dispositivos</h3>
          <div className="analytics-list">
            {devices.length > 0 ? (
              devices.map((device, i) => {
                const total = devices.reduce((sum, d) => sum + (d.count || 0), 0);
                const percentage = total > 0 ? ((device.count || 0) / total * 100).toFixed(0) : 0;
                return (
                  <div key={i} className="analytics-list-item">
                    <span className="rank">{getDeviceIcon(device.device_type)}</span>
                    <div className="item-info">
                      <span className="item-name">{device.device_type || 'Desconocido'}</span>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                    <span className="item-value">{percentage}%</span>
                  </div>
                );
              })
            ) : (
              <p className="empty">Sin datos aún</p>
            )}
          </div>
        </div>

        {/* Clicks por Tipo */}
        <div className="analytics-web-card">
          <h3>👆 Clicks por Acción</h3>
          <div className="analytics-list">
            {clicks.length > 0 ? (
              clicks.slice(0, 10).map((click, i) => (
                <div key={i} className="analytics-list-item">
                  <span className="rank">{getClickIcon(click.destination_type)}</span>
                  <div className="item-info">
                    <span className="item-name">{click.destination_type || click.element_id}</span>
                    <span className="item-meta">{click.unique_clickers} usuarios</span>
                  </div>
                  <span className="item-value">{formatNumber(click.total_clicks)}</span>
                </div>
              ))
            ) : (
              <p className="empty">Sin clicks aún</p>
            )}
          </div>
        </div>
      </div>

      {/* Conversión Bot → Web */}
      {botConversion.length > 0 && (
        <div className="analytics-web-card full-width">
          <h3>🤖 Conversión Bot → Web</h3>
          <p className="card-subtitle">Usuarios que llegaron desde el bot de WhatsApp</p>
          <div className="table-container">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Sesiones del Bot</th>
                  <th>Pageviews</th>
                  <th>WhatsApp</th>
                  <th>Teléfono</th>
                  <th>Maps</th>
                  <th>Total Clicks</th>
                </tr>
              </thead>
              <tbody>
                {botConversion.slice(0, 14).map((row, i) => (
                  <tr key={i}>
                    <td>{new Date(row.date).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                    <td><strong>{row.bot_sessions}</strong></td>
                    <td>{row.pageviews}</td>
                    <td>{row.whatsapp_clicks || 0}</td>
                    <td>{row.phone_clicks || 0}</td>
                    <td>{row.maps_clicks || 0}</td>
                    <td className="highlight">{row.clicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actividad por día */}
      {daily.length > 0 && (
        <div className="analytics-web-card full-width">
          <h3>📅 Actividad Diaria</h3>
          <div className="table-container">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Visitantes</th>
                  <th>Nuevos</th>
                  <th>Sesiones</th>
                  <th>Pageviews</th>
                  <th>Páginas/Sesión</th>
                  <th>Duración Prom.</th>
                  <th>Bounce</th>
                </tr>
              </thead>
              <tbody>
                {daily.map((row, i) => (
                  <tr key={i}>
                    <td>{new Date(row.date).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                    <td><strong>{row.unique_visitors}</strong></td>
                    <td className="text-muted">{row.new_visitors}</td>
                    <td>{row.total_sessions}</td>
                    <td>{row.total_pageviews}</td>
                    <td>{Number(row.avg_pages_per_session || 0).toFixed(1)}</td>
                    <td>{formatDuration(row.avg_session_duration || 0)}</td>
                    <td className={Number(row.bounce_rate) > 70 ? 'text-danger' : ''}>{Number(row.bounce_rate || 0).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}