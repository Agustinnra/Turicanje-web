'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import './suscripcion.css';

// Planes de comercio
const PLANES = {
  mensual: { id: 'mensual', nombre: 'Plan Mensual', precio: 999, meses: 1 },
  anual: { id: 'anual', nombre: 'Plan Anual', precio: 10989, meses: 12, ahorro: 1999, popular: true }
};

// Comisiones por método de pago
const COMISIONES = {
  tarjeta: { porcentaje: 3.6, fijo: 3 },
  oxxo: { porcentaje: 0, fijo: 15 },
  spei: { porcentaje: 0, fijo: 10 },
};

const calcularComision = (precio: number, metodo: 'tarjeta' | 'oxxo' | 'spei') => {
  const comision = COMISIONES[metodo];
  return Math.ceil((precio * comision.porcentaje / 100) + comision.fijo);
};

const CONEKTA_PUBLIC_KEY = process.env.NEXT_PUBLIC_CONEKTA_PUBLIC_KEY || '';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://turicanje-backend.onrender.com';

declare global {
  interface Window { Conekta: any; }
}

export default function SuscripcionComercioPage() {
  const router = useRouter();
  const [comercio, setComercio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [planSeleccionado, setPlanSeleccionado] = useState<'mensual' | 'anual'>('anual');
  const [procesando, setProcesando] = useState(false);
  const [metodoPago, setMetodoPago] = useState<'tarjeta' | 'oxxo' | 'spei'>('tarjeta');
  const [conektaReady, setConektaReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [datosPago, setDatosPago] = useState<any>(null);
  
  const [cardData, setCardData] = useState({ numero: '', nombre: '', expiracion: '', cvv: '' });

  // Cálculos dinámicos
  const planActual = PLANES[planSeleccionado];
  const comisionActual = calcularComision(planActual.precio, metodoPago);
  const totalActual = planActual.precio + comisionActual;

  useEffect(() => {
    cargarComercio();
  }, []);

  const cargarComercio = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login-comercio'); return; }

      const res = await fetch(`${API_URL}/api/comercios/mi-negocio`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setComercio(data.negocio || data);
      } else {
        router.push('/login-comercio');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConektaLoad = () => {
    if (window.Conekta) {
      window.Conekta.setPublicKey(CONEKTA_PUBLIC_KEY);
      setConektaReady(true);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 16);
    const parts = [];
    for (let i = 0; i < v.length; i += 4) parts.push(v.slice(i, i + 4));
    return parts.join(' ');
  };

  const formatExpiration = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 4);
    return v.length >= 2 ? v.slice(0, 2) + '/' + v.slice(2) : v;
  };

  const tokenizarTarjeta = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const [mes, año] = cardData.expiracion.split('/');
      window.Conekta.Token.create({
        card: {
          number: cardData.numero.replace(/\s/g, ''),
          name: cardData.nombre,
          exp_year: '20' + año,
          exp_month: mes,
          cvc: cardData.cvv
        }
      }, 
        (token: any) => resolve(token.id),
        (err: any) => reject(new Error(err.message_to_purchaser || 'Error en tarjeta'))
      );
    });
  };

  const handleComprar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setProcesando(true);

    try {
      const token = localStorage.getItem('token');
      
      // Verificar que hay token antes de continuar
      if (!token) {
        setError('Sesión expirada. Por favor recarga la página.');
        setProcesando(false);
        return;
      }

      if (metodoPago === 'tarjeta') {
        const cardToken = await tokenizarTarjeta();
        
        const res = await fetch(`${API_URL}/api/pagos/suscripcion-comercio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ 
            plan: planSeleccionado, 
            token_tarjeta: cardToken, 
            metodo: 'tarjeta',
            total_con_comision: totalActual
          })
        });

        const data = await res.json();

        if (res.status === 401) {
          setError('Sesión expirada. Por favor recarga la página e inicia sesión nuevamente.');
        } else if (res.ok) {
          setExito(true);
        } else {
          setError(data.error || 'Error al procesar pago');
        }
      } else if (metodoPago === 'oxxo') {
        const res = await fetch(`${API_URL}/api/pagos/suscripcion-comercio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ 
            plan: planSeleccionado, 
            metodo: 'oxxo',
            total_con_comision: totalActual
          })
        });

        const data = await res.json();

        if (res.status === 401) {
          setError('Sesión expirada. Por favor recarga la página e inicia sesión nuevamente.');
        } else if (res.ok) {
          setDatosPago({ tipo: 'oxxo', referencia: data.referencia, monto: totalActual });
        } else {
          setError(data.error || 'Error al generar referencia');
        }
      } else if (metodoPago === 'spei') {
        const res = await fetch(`${API_URL}/api/pagos/suscripcion-comercio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ 
            plan: planSeleccionado, 
            metodo: 'spei',
            total_con_comision: totalActual
          })
        });

        const data = await res.json();

        if (res.status === 401) {
          setError('Sesión expirada. Por favor recarga la página e inicia sesión nuevamente.');
        } else if (res.ok) {
          setDatosPago({ tipo: 'spei', clabe: data.clabe, banco: data.banco, monto: totalActual });
        } else {
          setError(data.error || 'Error al generar CLABE');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setProcesando(false);
    }
  };

  if (loading) return <div className="suscripcion-loading"><div className="spinner"></div><p>Cargando...</p></div>;

  // Pantalla de datos de pago OXXO/SPEI
  if (datosPago) {
    return (
      <div className="suscripcion-container">
        <div className="suscripcion-exito pago-pendiente">
          <div className="exito-icon">{datosPago.tipo === 'oxxo' ? '🏪' : '🏦'}</div>
          <h1>¡Casi listo!</h1>
          <p className="subtitulo">Realiza tu pago para activar tu suscripción</p>
          
          {datosPago.tipo === 'oxxo' ? (
            <div className="datos-pago">
              <div className="dato-destacado">
                <span className="dato-label">Referencia OXXO</span>
                <span className="dato-valor">{datosPago.referencia}</span>
                <button className="btn-copiar" onClick={() => navigator.clipboard.writeText(datosPago.referencia)}>📋 Copiar</button>
              </div>
              <div className="dato-row"><span>Plan:</span><strong>{planActual.nombre}</strong></div>
              <div className="dato-row"><span>Monto a pagar:</span><strong>${datosPago.monto.toLocaleString()} MXN</strong></div>
              <div className="dato-row vencimiento"><span>⏰ Vence en:</span><strong>72 horas</strong></div>
            </div>
          ) : (
            <div className="datos-pago">
              <div className="dato-destacado">
                <span className="dato-label">CLABE Interbancaria</span>
                <span className="dato-valor clabe">{datosPago.clabe}</span>
                <button className="btn-copiar" onClick={() => navigator.clipboard.writeText(datosPago.clabe)}>📋 Copiar</button>
              </div>
              <div className="dato-row"><span>Banco:</span><strong>{datosPago.banco || 'STP'}</strong></div>
              <div className="dato-row"><span>Beneficiario:</span><strong>Turicanje</strong></div>
              <div className="dato-row"><span>Plan:</span><strong>{planActual.nombre}</strong></div>
              <div className="dato-row"><span>Monto exacto:</span><strong>${datosPago.monto.toLocaleString()} MXN</strong></div>
            </div>
          )}

          <p className="nota-activacion">✅ Tu suscripción se activa automáticamente al confirmar el pago</p>
          
          <div className="conekta-notice">
            <p>📧 Recibirás confirmaciones de <strong>Turicanje</strong> y de <strong>Conekta</strong> (nuestro procesador de pagos). Ambos correos son legítimos.</p>
          </div>

          <Link href="/comercios/dashboard" className="btn-volver">Volver al Dashboard</Link>
        </div>
      </div>
    );
  }

  if (exito) {
    return (
      <div className="suscripcion-container">
        <div className="suscripcion-exito">
          <div className="exito-icon">🎉</div>
          <h1>¡Suscripción Activa!</h1>
          <p className="exito-mensaje">Tu negocio ahora aparece en las primeras posiciones de búsqueda.</p>
          <div className="beneficios-activos">
            <div className="beneficio">✓ Posición prioritaria en búsquedas</div>
            <div className="beneficio">✓ Badge de verificado</div>
            <div className="beneficio">✓ Estadísticas avanzadas</div>
          </div>
          <Link href="/comercios/dashboard" className="btn-volver">Ir al Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="suscripcion-container">
      <Script src="https://cdn.conekta.io/js/latest/conekta.js" onLoad={handleConektaLoad} />

      <header className="suscripcion-header">
        <Link href="/comercios/dashboard" className="back-btn">← Volver al Dashboard</Link>
        <h1>🏪 Suscripción Comercio</h1>
      </header>

      <main className="suscripcion-main">
        <section className="planes-section">
          <h2>Selecciona tu plan</h2>
          <div className="planes-grid">
            <div 
              className={`plan-card ${planSeleccionado === 'mensual' ? 'selected' : ''}`}
              onClick={() => setPlanSeleccionado('mensual')}
            >
              <h3>Plan Mensual</h3>
              <div className="plan-precio">
                <span className="precio">${PLANES.mensual.precio.toLocaleString()}</span>
                <span className="periodo">MXN / mes</span>
              </div>
              <ul className="plan-features">
                <li>✓ Visibilidad prioritaria</li>
                <li>✓ Badge de verificado</li>
                <li>✓ Estadísticas básicas</li>
              </ul>
            </div>

            <div 
              className={`plan-card popular ${planSeleccionado === 'anual' ? 'selected' : ''}`}
              onClick={() => setPlanSeleccionado('anual')}
            >
              <span className="plan-badge">Más popular</span>
              <h3>Plan Anual</h3>
              <div className="plan-precio">
                <span className="precio">${PLANES.anual.precio.toLocaleString()}</span>
                <span className="periodo">MXN / año</span>
              </div>
              <div className="plan-ahorro">Ahorras ${PLANES.anual.ahorro?.toLocaleString()} MXN</div>
              <ul className="plan-features">
                <li>✓ Todo del plan mensual</li>
                <li>✓ Estadísticas avanzadas</li>
                <li>✓ Soporte prioritario</li>
                <li>✓ 2 meses gratis</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="payment-section">
          <h2>Método de pago</h2>

          {error && <div className="suscripcion-error">⚠️ {error}</div>}

          <div className="metodos-pago">
            <button type="button" className={`metodo-btn ${metodoPago === 'tarjeta' ? 'active' : ''}`} onClick={() => setMetodoPago('tarjeta')}>
              <span className="metodo-icon">💳</span>
              <div className="metodo-info">
                <span className="metodo-nombre">Tarjeta</span>
                <span className="metodo-desc">Inmediato</span>
              </div>
              <span className="metodo-comision">+${calcularComision(planActual.precio, 'tarjeta')}</span>
            </button>
            <button type="button" className={`metodo-btn ${metodoPago === 'oxxo' ? 'active' : ''}`} onClick={() => setMetodoPago('oxxo')}>
              <span className="metodo-icon">🏪</span>
              <div className="metodo-info">
                <span className="metodo-nombre">OXXO</span>
                <span className="metodo-desc">Efectivo</span>
              </div>
              <span className="metodo-comision">+$15</span>
            </button>
            <button type="button" className={`metodo-btn ${metodoPago === 'spei' ? 'active' : ''}`} onClick={() => setMetodoPago('spei')}>
              <span className="metodo-icon">🏦</span>
              <div className="metodo-info">
                <span className="metodo-nombre">SPEI</span>
                <span className="metodo-desc">Transferencia</span>
              </div>
              <span className="metodo-comision">+$10</span>
            </button>
          </div>

          <form onSubmit={handleComprar} className="payment-form">
            {metodoPago === 'tarjeta' ? (
              <>
                <div className="form-group">
                  <label>Número de tarjeta</label>
                  <input type="text" placeholder="1234 5678 9012 3456" value={cardData.numero} onChange={(e) => setCardData({...cardData, numero: formatCardNumber(e.target.value)})} maxLength={19} required />
                </div>
                <div className="form-group">
                  <label>Nombre en la tarjeta</label>
                  <input type="text" placeholder="NOMBRE APELLIDO" value={cardData.nombre} onChange={(e) => setCardData({...cardData, nombre: e.target.value.toUpperCase()})} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Vencimiento</label>
                    <input type="text" placeholder="MM/AA" value={cardData.expiracion} onChange={(e) => setCardData({...cardData, expiracion: formatExpiration(e.target.value)})} maxLength={5} required />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input type="text" placeholder="123" value={cardData.cvv} onChange={(e) => setCardData({...cardData, cvv: e.target.value.replace(/\D/g, '')})} maxLength={4} required />
                  </div>
                </div>
              </>
            ) : (
              <div className="metodo-alterno-info">
                <div className="metodo-alterno-icon">{metodoPago === 'oxxo' ? '🏪' : '🏦'}</div>
                <h3>Pago con {metodoPago === 'oxxo' ? 'OXXO' : 'Transferencia SPEI'}</h3>
                <p>Al continuar, te generaremos {metodoPago === 'oxxo' ? 'una referencia para pagar en OXXO' : 'una CLABE para transferir'}.</p>
                <ul className="metodo-beneficios">
                  {metodoPago === 'oxxo' ? (
                    <>
                      <li>✓ Paga en efectivo en cualquier OXXO</li>
                      <li>✓ Tienes 72 horas para pagar</li>
                    </>
                  ) : (
                    <>
                      <li>✓ Transfiere desde cualquier banco</li>
                      <li>✓ Se refleja en minutos</li>
                    </>
                  )}
                  <li>✓ Tu suscripción se activa automáticamente</li>
                </ul>
              </div>
            )}

            <div className="resumen-compra">
              <div className="resumen-row">
                <span>Plan:</span>
                <span>{planActual.nombre}</span>
              </div>
              <div className="resumen-row">
                <span>Subtotal:</span>
                <span>${planActual.precio.toLocaleString()} MXN</span>
              </div>
              <div className="resumen-row comision">
                <span>Comisión por pago:</span>
                <span>+${comisionActual.toLocaleString()} MXN</span>
              </div>
              <div className="resumen-row total">
                <span>Total a pagar:</span>
                <span>${totalActual.toLocaleString()} MXN</span>
              </div>
            </div>

            <button type="submit" className="btn-comprar" disabled={procesando || (metodoPago === 'tarjeta' && !conektaReady)}>
              {procesando ? <><span className="spinner-small"></span>Procesando...</> : 
                metodoPago === 'tarjeta' ? `🔒 Pagar $${totalActual.toLocaleString()} MXN` : 
                metodoPago === 'oxxo' ? `🏪 Generar referencia por $${totalActual.toLocaleString()}` : 
                `🏦 Generar CLABE por $${totalActual.toLocaleString()}`}
            </button>

            {/* Sección de confianza Conekta */}
            <div className="conekta-trust">
              <div className="trust-header">
                <span className="trust-icon">🔒</span>
                <span>Pago seguro procesado por <strong>Conekta</strong></span>
              </div>
              <div className="trust-features">
                <div className="trust-item">
                  <span className="trust-badge">3D Secure</span>
                  <span>Autenticación bancaria</span>
                </div>
                <div className="trust-item">
                  <span className="trust-badge">PCI DSS</span>
                  <span>Datos encriptados</span>
                </div>
                <div className="trust-item">
                  <span className="trust-badge">SSL</span>
                  <span>Conexión segura</span>
                </div>
              </div>
              <p className="trust-note">
                📧 Recibirás confirmaciones de <strong>Turicanje</strong> y de <strong>Conekta</strong> (nuestro procesador de pagos certificado). Ambos correos son legítimos.
              </p>
            </div>
          </form>
        </section>
      </main>

      <footer className="suscripcion-footer">
        <p>¿Necesitas factura? <Link href="/contacto">Contáctanos</Link></p>
      </footer>
    </div>
  );
}