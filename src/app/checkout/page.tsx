'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import './checkout.css';

// ============================================================
// PLANES DE USUARIO - Mensual y Anual
// ============================================================
const PLANES: { [key: string]: { nombre: string; precio: number; meses: number; periodo: string } } = {
  mensual: {
    nombre: 'Membresía Mensual',
    precio: 99,
    meses: 1,
    periodo: 'MXN / mes'
  },
  anual: {
    nombre: 'Membresía Anual',
    precio: 999,
    meses: 12,
    periodo: 'MXN / año'
  }
};

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

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // ✅ Leer plan de la URL (?plan=mensual o ?plan=anual)
  const planParam = searchParams.get('plan') || 'anual';
  const planSeleccionado = PLANES[planParam] ? planParam : 'anual';
  const PLAN = PLANES[planSeleccionado];
  
  const [usuario, setUsuario] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [metodoPago, setMetodoPago] = useState<'tarjeta' | 'oxxo' | 'spei'>('tarjeta');
  const [conektaReady, setConektaReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [datosPago, setDatosPago] = useState<any>(null);
  
  const [cardData, setCardData] = useState({ numero: '', nombre: '', expiracion: '', cvv: '' });

  const comisionActual = calcularComision(PLAN.precio, metodoPago);
  const totalActual = PLAN.precio + comisionActual;

  useEffect(() => {
    cargarUsuario();
  }, []);

  const cargarUsuario = async () => {
    try {
      const token = localStorage.getItem('usuario_token');
      if (!token) { router.push('/login'); return; }

      const res = await fetch(`${API_URL}/api/usuarios/perfil`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setUsuario(data.usuario || data);
        if (data.usuario?.suscripcion_activa || data.suscripcion_activa) {
          router.push('/mi-cuenta');
        }
      } else {
        router.push('/login');
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
      const token = localStorage.getItem('usuario_token');
      
      if (!token) {
        setError('Sesión expirada. Por favor inicia sesión nuevamente.');
        setProcesando(false);
        return;
      }

      if (metodoPago === 'tarjeta') {
        const cardToken = await tokenizarTarjeta();
        
        const res = await fetch(`${API_URL}/api/pagos/suscripcion-usuario`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ 
            plan: planSeleccionado, // ✅ Enviar plan correcto
            token_tarjeta: cardToken, 
            metodo: 'tarjeta',
            total_con_comision: totalActual
          })
        });

        const data = await res.json();

        if (res.status === 401) {
          setError('Sesión expirada. Por favor inicia sesión nuevamente.');
        } else if (res.ok) {
          setExito(true);
        } else {
          setError(data.error || 'Error al procesar pago');
        }
      } else if (metodoPago === 'oxxo') {
        const res = await fetch(`${API_URL}/api/pagos/suscripcion-usuario`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ 
            plan: planSeleccionado, // ✅ Enviar plan correcto
            metodo: 'oxxo', 
            total_con_comision: totalActual 
          })
        });

        const data = await res.json();

        if (res.status === 401) {
          setError('Sesión expirada.');
        } else if (res.ok) {
          setDatosPago({ tipo: 'oxxo', referencia: data.referencia, monto: totalActual });
        } else {
          setError(data.error || 'Error al generar referencia');
        }
      } else if (metodoPago === 'spei') {
        const res = await fetch(`${API_URL}/api/pagos/suscripcion-usuario`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ 
            plan: planSeleccionado, // ✅ Enviar plan correcto
            metodo: 'spei', 
            total_con_comision: totalActual 
          })
        });

        const data = await res.json();

        if (res.status === 401) {
          setError('Sesión expirada.');
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

  if (loading) {
    return (
      <div className="checkout-page">
        <div className="checkout-loading">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (datosPago) {
    return (
      <div className="checkout-page">
        <div className="checkout-result">
          <div className="result-icon">{datosPago.tipo === 'oxxo' ? '🏪' : '🏦'}</div>
          <h1>¡Casi listo!</h1>
          <p className="result-subtitle">Realiza tu pago para activar tu membresía</p>
          
          <div className="payment-data">
            <div className="data-highlight">
              <span className="data-label">{datosPago.tipo === 'oxxo' ? 'Referencia OXXO' : 'CLABE Interbancaria'}</span>
              <span className="data-value">{datosPago.tipo === 'oxxo' ? datosPago.referencia : datosPago.clabe}</span>
              <button className="btn-copy" onClick={() => navigator.clipboard.writeText(datosPago.tipo === 'oxxo' ? datosPago.referencia : datosPago.clabe)}>
                📋 Copiar
              </button>
            </div>
            
            {datosPago.tipo === 'spei' && (
              <div className="data-row">
                <span className="data-label">Banco destino</span>
                <span className="data-value">{datosPago.banco || 'STP'}</span>
              </div>
            )}

            <div className="data-row">
              <span className="data-label">Monto exacto</span>
              <span className="data-value">${datosPago.monto.toLocaleString()} MXN</span>
            </div>

            <div className="data-row">
              <span className="data-label">Vence en</span>
              <span className="data-value">72 horas</span>
            </div>
          </div>

          <div className="notice-box success">
            ✅ Tu membresía se activa automáticamente al confirmar el pago
          </div>

          <div className="notice-box info">
            📧 Recibirás confirmaciones de <strong>Turicanje</strong> y de <strong>Conekta</strong> (nuestro procesador de pagos). Ambos correos son legítimos.
          </div>

          <Link href="/" className="btn-primary">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  if (exito) {
    return (
      <div className="checkout-page">
        <div className="checkout-result">
          <div className="result-icon">🎉</div>
          <h1>¡Bienvenido a Premium!</h1>
          <p className="result-subtitle success">Tu membresía está activa</p>
          
          <div className="benefits-list">
            <div className="benefit-item">✓ Cashback en restaurantes</div>
            <div className="benefit-item">✓ Ofertas exclusivas</div>
            <div className="benefit-item">✓ Recomendaciones personalizadas</div>
          </div>
          
          <Link href="/mi-cuenta" className="btn-primary">Ir a Mi Cuenta</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <Script src="https://cdn.conekta.io/js/latest/conekta.js" onLoad={handleConektaLoad} />

      <div className="checkout-header">
        <Link href="/suscripcion" className="back-link">← Volver a planes</Link>
        <h1>Activa tu Membresía</h1>
      </div>

      <div className="checkout-content">
        <div className="checkout-form-section">
          {/* Plan Card - Dinámico según URL */}
          <div className="plan-card">
            <span className="plan-badge">🌟 Membresía Premium</span>
            <h2>{PLAN.nombre}</h2>
            <div className="plan-price">
              <span className="price-amount">${PLAN.precio}</span>
              <span className="price-period">{PLAN.periodo}</span>
            </div>
            <ul className="plan-features">
              <li>✓ Cashback en todos los restaurantes</li>
              <li>✓ Puntos canjeables por descuentos</li>
              <li>✓ Ofertas exclusivas de temporada</li>
              <li>✓ Recomendaciones personalizadas</li>
              <li>✓ Sin límite de visitas</li>
            </ul>
          </div>

          {/* Método de pago */}
          <div className="payment-methods">
            <h3>Método de pago</h3>
            
            {error && <div className="error-box">⚠️ {error}</div>}

            <div className="methods-grid">
              <button 
                type="button" 
                className={`method-btn ${metodoPago === 'tarjeta' ? 'active' : ''}`} 
                onClick={() => setMetodoPago('tarjeta')}
              >
                <span className="method-icon">💳</span>
                <span className="method-name">Tarjeta</span>
                <span className="method-desc">Inmediato</span>
                <span className="method-fee">+${calcularComision(PLAN.precio, 'tarjeta')}</span>
              </button>
              
              <button 
                type="button" 
                className={`method-btn ${metodoPago === 'oxxo' ? 'active' : ''}`} 
                onClick={() => setMetodoPago('oxxo')}
              >
                <span className="method-icon">🏪</span>
                <span className="method-name">OXXO</span>
                <span className="method-desc">Efectivo</span>
                <span className="method-fee">+$15</span>
              </button>
              
              <button 
                type="button" 
                className={`method-btn ${metodoPago === 'spei' ? 'active' : ''}`} 
                onClick={() => setMetodoPago('spei')}
              >
                <span className="method-icon">🏦</span>
                <span className="method-name">SPEI</span>
                <span className="method-desc">Transferencia</span>
                <span className="method-fee">+$10</span>
              </button>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleComprar} className="checkout-form">
            {metodoPago === 'tarjeta' ? (
              <div className="card-form">
                <div className="form-group">
                  <label>Número de tarjeta</label>
                  <input 
                    type="text" 
                    placeholder="1234 5678 9012 3456" 
                    value={cardData.numero} 
                    onChange={(e) => setCardData({...cardData, numero: formatCardNumber(e.target.value)})} 
                    maxLength={19} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Nombre en la tarjeta</label>
                  <input 
                    type="text" 
                    placeholder="NOMBRE APELLIDO" 
                    value={cardData.nombre} 
                    onChange={(e) => setCardData({...cardData, nombre: e.target.value.toUpperCase()})} 
                    required 
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Vencimiento</label>
                    <input 
                      type="text" 
                      placeholder="MM/AA" 
                      value={cardData.expiracion} 
                      onChange={(e) => setCardData({...cardData, expiracion: formatExpiration(e.target.value)})} 
                      maxLength={5} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input 
                      type="text" 
                      placeholder="123" 
                      value={cardData.cvv} 
                      onChange={(e) => setCardData({...cardData, cvv: e.target.value.replace(/\D/g, '')})} 
                      maxLength={4} 
                      required 
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="alt-method-info">
                <div className="alt-icon">{metodoPago === 'oxxo' ? '🏪' : '🏦'}</div>
                <h4>Pago con {metodoPago === 'oxxo' ? 'OXXO' : 'Transferencia SPEI'}</h4>
                <p>Al continuar, te generaremos {metodoPago === 'oxxo' ? 'una referencia para pagar en OXXO' : 'una CLABE para transferir'}.</p>
                <ul className="alt-benefits">
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
                  <li>✓ Tu membresía se activa automáticamente</li>
                </ul>
              </div>
            )}

            {/* Resumen */}
            <div className="order-summary">
              <div className="summary-row">
                <span>{PLAN.nombre}</span>
                <span>${PLAN.precio.toLocaleString()} MXN</span>
              </div>
              <div className="summary-row fee">
                <span>Comisión por pago</span>
                <span>+${comisionActual} MXN</span>
              </div>
              <div className="summary-row total">
                <span>Total a pagar</span>
                <span>${totalActual.toLocaleString()} MXN</span>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-submit" 
              disabled={procesando || (metodoPago === 'tarjeta' && !conektaReady)}
            >
              {procesando ? (
                <><span className="spinner-small"></span>Procesando...</>
              ) : metodoPago === 'tarjeta' ? (
                `🔒 Pagar $${totalActual.toLocaleString()} MXN`
              ) : metodoPago === 'oxxo' ? (
                `🏪 Generar referencia`
              ) : (
                `🏦 Generar CLABE`
              )}
            </button>

            {/* Trust section */}
            <div className="trust-section">
              <div className="trust-header">
                <span>🔒</span> Pago seguro procesado por <strong>Conekta</strong>
              </div>
              <div className="trust-badges">
                <span className="badge">3D Secure</span>
                <span className="badge">PCI DSS</span>
                <span className="badge">SSL</span>
              </div>
              <p className="trust-note">
                📧 Recibirás confirmaciones de <strong>Turicanje</strong> y de <strong>Conekta</strong>. Ambos correos son legítimos.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}