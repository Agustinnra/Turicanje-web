'use client';

// Componente para mostrar cuando la suscripción está vencida
export function SuscripcionVencidaBanner({ onRenovar }: { onRenovar?: () => void }) {
  return (
    <div className="suscripcion-vencida-banner">
      <div className="banner-content">
        <span className="banner-icon">⚠️</span>
        <div className="banner-text">
          <strong>Tu suscripción ha vencido</strong>
          <p>Renueva tu plan para poder editar tu negocio y recibir clientes.</p>
        </div>
        <button className="btn-renovar" onClick={onRenovar}>
          Renovar ahora
        </button>
      </div>
    </div>
  );
}

// Hook para verificar si puede editar
export function usePuedeEditar(suscripcionActiva: boolean) {
  return {
    puedeEditar: suscripcionActiva,
    mensaje: suscripcionActiva ? null : 'Renueva tu suscripción para editar'
  };
}

// CSS para agregar al dashboard.css
export const softBlockingCSS = `
/* ============================================================
   SOFT BLOCKING - SUSCRIPCIÓN VENCIDA
   ============================================================ */
.suscripcion-vencida-banner {
  background: linear-gradient(135deg, #ff6b6b 0%, #c0392b 100%);
  padding: 1rem 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 15px rgba(192, 57, 43, 0.3);
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.banner-icon {
  font-size: 2rem;
}

.banner-text {
  flex: 1;
  min-width: 200px;
}

.banner-text strong {
  display: block;
  font-size: 1.1rem;
  color: white;
  margin-bottom: 0.25rem;
}

.banner-text p {
  margin: 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
}

.btn-renovar {
  padding: 0.75rem 1.5rem;
  background: white;
  color: #c0392b;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-renovar:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Elementos deshabilitados cuando no puede editar */
.no-puede-editar {
  pointer-events: none;
  opacity: 0.5;
  position: relative;
}

.no-puede-editar::after {
  content: '🔒';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 2rem;
}

/* Botones deshabilitados */
.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

@media (max-width: 768px) {
  .banner-content {
    flex-direction: column;
    text-align: center;
  }
  
  .btn-renovar {
    width: 100%;
  }
}
`;