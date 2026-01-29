'use client';

import { useState, useEffect } from 'react';
import './historial-ventas.css';

interface Venta {
  id: number;
  transaction_type: string;
  points: number;
  amount: number;
  description: string;
  created_at: string;
  usuario_nombre: string;
  usuario_telefono: string;
}

interface Estadisticas {
  total_transacciones: number;
  total_ventas: number;
  total_puntos_dados: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://turicanje-backend.onrender.com';

export default function HistorialVentas() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    cargarVentas();
  }, [pagina]);

  const cargarVentas = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/comercios/mis-ventas?page=${pagina}&limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Error al cargar ventas');
      }

      const data = await res.json();
      setVentas(data.ventas || []);
      setEstadisticas(data.estadisticas || null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto || 0);
  };

  if (loading) {
    return (
      <div className="historial-loading">
        <div className="spinner-grande"></div>
        <p>Cargando historial...</p>
      </div>
    );
  }

  return (
    <div className="historial-ventas-container">
      <div className="historial-header">
        <h2>📊 Mis Ventas</h2>
        <p>Historial de puntos otorgados a clientes</p>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="estadisticas-grid">
          <div className="stat-card">
            <span className="stat-icon">🛒</span>
            <div className="stat-info">
              <span className="stat-valor">{estadisticas.total_transacciones}</span>
              <span className="stat-label">Ventas registradas</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">💰</span>
            <div className="stat-info">
              <span className="stat-valor">{formatearMonto(estadisticas.total_ventas)}</span>
              <span className="stat-label">Total vendido</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🎁</span>
            <div className="stat-info">
              <span className="stat-valor">{estadisticas.total_puntos_dados.toLocaleString()}</span>
              <span className="stat-label">Puntos otorgados</span>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="historial-error">
          <span>⚠️</span> {error}
          <button onClick={cargarVentas}>Reintentar</button>
        </div>
      )}

      {/* Lista de ventas */}
      {ventas.length === 0 ? (
        <div className="historial-vacio">
          <span className="vacio-icon">📋</span>
          <h3>Sin ventas registradas</h3>
          <p>Cuando registres ventas con puntos, aparecerán aquí</p>
        </div>
      ) : (
        <div className="ventas-lista">
          <div className="ventas-tabla">
            <div className="tabla-header">
              <span>Cliente</span>
              <span>Monto</span>
              <span>Puntos</span>
              <span>Fecha</span>
            </div>
            {ventas.map((venta) => (
              <div key={venta.id} className="venta-row">
                <div className="venta-cliente">
                  <span className="cliente-nombre">{venta.usuario_nombre}</span>
                  <span className="cliente-tel">{venta.usuario_telefono}</span>
                </div>
                <div className="venta-monto">
                  {formatearMonto(venta.amount)}
                </div>
                <div className="venta-puntos">
                  <span className="puntos-badge">+{venta.points} pts</span>
                </div>
                <div className="venta-fecha">
                  {formatearFecha(venta.created_at)}
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          <div className="paginacion">
            <button 
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina === 1}
            >
              ← Anterior
            </button>
            <span>Página {pagina}</span>
            <button 
              onClick={() => setPagina(p => p + 1)}
              disabled={ventas.length < 20}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Botón refrescar */}
      <button className="btn-refrescar" onClick={cargarVentas}>
        🔄 Actualizar
      </button>
    </div>
  );
}