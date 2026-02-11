'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
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

// ============================================================
// KEYS - Clip para tarjetas, Conekta para OXXO/SPEI
// ============================================================
const CLIP_API_KEY = process.env.NEXT_PUBLIC_CLIP_API_KEY || '3da6e867-1794-4a33-bfd2-246ccd380636';
const CONEKTA_PUBLIC_KEY = process.env.NEXT_PUBLIC_CONEKTA_PUBLIC_KEY || '';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://turicanje-backend.onrender.com';

declare global {
  interface Window { 
    Conekta: any;
    ClipSDK: any;
  }
}

// ============================================================
// COMPONENTE PRINCIPAL (envuelto en Suspense)
// ============================================================
function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const planParam = searchParams.get('plan') || 'anual';
  const planSeleccionado = PLANES[planParam] ? planParam : 'anual';
  const PLAN = PLANES[planSeleccionado];
  
  const [usuario, setUsuario] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [metodoPago, setMetodoPago] = useState<'tarjeta' | 'oxxo' | 'spei'>('tarjeta');
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [datosPago, setDatosPago] = useState<any>(null);
  
  // Clip SDK
  const [clipReady, setClipReady] = useState(false);
  const [conektaReady, setConektaReady] = useState(false);
  const clipInstanceRef = useRef<any>(null);
  const cardElementRef = useRef<any>(null);

  const comisionActual = calcularComision(PLAN.precio, metodoPago);
  const totalActual = PLAN.precio + comisionActual;

  useEffect(() => {
    cargarUsuario();
  }, []);

  // Montar/desmontar Clip card element cuando cambia el método de pago
  useEffect(() => {
    if (metodoPago === 'tarjeta' && clipReady && clipInstanceRef.current) {
      // Montar el formulario de Clip
      setTimeout(() => {
        const checkoutDiv = document.getElementById('clip-checkout');
        if (checkoutDiv && !cardElementRef.current) {
          try {
            const card = clipInstanceRef.current.element.create("Card", { 
              locale: "es",
              paymentAmount: totalActual // Para MSI si aplica
            });
            card.mount("clip-checkout");
            cardElementRef.current = card;
          } catch (err) {
            console.error('Error montando Clip:', err);
          }
        }
      }, 100);
    }
    
    return () => {
      // Limpiar al cambiar de método
      if (cardElementRef.current && metodoPago !== 'tarjeta') {
        try {
          cardElementRef.current.unmount();
          cardElementRef.current = null;
        } catch (err) {
          console.error('Error desmontando Clip:', err);
        }
      }
    };
  }, [metodoPago, clipReady, totalActual]);

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

  // Inicializar Clip SDK
  const handleClipLoad = () => {
    console.log('🔄 Script de Clip cargado, inicializando...');
    console.log('window.ClipSDK:', window.ClipSDK);
    console.log('CLIP_API_KEY:', CLIP_API_KEY);
    
    if (window.ClipSDK && CLIP_API_KEY) {
      try {
        clipInstanceRef.current = new window.ClipSDK(CLIP_API_KEY);
        setClipReady(true);
        console.log('✅ Clip SDK listo');
      } catch (err) {
        console.error('❌ Error inicializando Clip:', err);
        setError('Error al cargar el formulario de pago. Recarga la página.');
      }
    } else {
      console.error('❌ Clip SDK no disponible:', { clip: !!window.ClipSDK, key: !!CLIP_API_KEY });
      // Reintentar en 1 segundo
      setTimeout(() => {
        if (window.ClipSDK && CLIP_API_KEY && !clipInstanceRef.current) {
          try {
            clipInstanceRef.current = new window.ClipSDK(CLIP_API_KEY);
            setClipReady(true);
            console.log('✅ Clip SDK listo (reintento)');
          } catch (err) {
            console.error('❌ Error en reintento:', err);
          }
        }
      }, 1000);
    }
  };

  // Inicializar Conekta (para OXXO/SPEI)
  const handleConektaLoad = () => {
    if (window.Conekta) {
      window.Conekta.setPublicKey(CONEKTA_PUBLIC_KEY);
      setConektaReady(true);
      console.log('✅ Conekta SDK listo');
    }
  };

  // Tokenizar tarjeta con Clip
  const tokenizarTarjetaClip = async (): Promise<string> => {
    if (!clipInstanceRef.current || !cardElementRef.current) {
      throw new Error('Clip no está listo');
    }
    
    try {
      const result = await clipInstanceRef.current.elements.cardToken(cardElementRef.current);
      if (result.card_token_id) {
        return result.card_token_id;
      } else {
        throw new Error('No se pudo obtener el token de la tarjeta');
      }
    } catch (err: any) {
      console.error('Error tokenizando con Clip:', err);
      throw new Error(err.message || 'Error al procesar la tarjeta');
    }
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
        // ============================================================
        // PAGO CON TARJETA - CLIP
        // ============================================================
        const cardToken = await tokenizarTarjetaClip();
        
        const res = await fetch(`${API_URL}/api/pagos/pago-tarjeta-clip`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ 
            plan: planSeleccionado,
            card_token: cardToken,
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
        // ============================================================
        // PAGO CON OXXO - CONEKTA (sin cambios)
        // ============================================================
        const res = await fetch(`${API_URL}/api/pagos/suscripcion-usuario`, {
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
          setError('Sesión expirada.');
        } else if (res.ok) {
          setDatosPago({ tipo: 'oxxo', referencia: data.referencia, monto: totalActual });
        } else {
          setError(data.error || 'Error al generar referencia');
        }
        
      } else if (metodoPago === 'spei') {
        // ============================================================
        // PAGO CON SPEI - CONEKTA (sin cambios)
        // ============================================================
        const res = await fetch(`${API_URL}/api/pagos/suscripcion-usuario`, {
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

  // ============================================================
  // PANTALLAS DE CARGA Y RESULTADOS
  // ============================================================
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
            📧 Recibirás confirmación de <strong>Turicanje</strong> cuando tu pago sea procesado.
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

  // ============================================================
  // FORMULARIO PRINCIPAL
  // ============================================================
  return (
    <div className="checkout-page">
      {/* Cargar SDK de Clip para tarjetas */}
      <Script 
        src="https://sdk.clip.mx/js/clip-sdk.js" 
        onLoad={handleClipLoad}
        strategy="afterInteractive"
      />
      
      {/* Cargar Conekta para OXXO/SPEI */}
      <Script 
        src="https://cdn.conekta.io/js/latest/conekta.js" 
        onLoad={handleConektaLoad}
        strategy="afterInteractive"
      />

      <div className="checkout-header">
        <Link href="/suscripcion" className="back-link">← Volver a planes</Link>
        <h1>Activa tu Membresía</h1>
      </div>

      <div className="checkout-content">
        <div className="checkout-form-section">
          {/* Plan Card */}
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
              // ============================================================
              // FORMULARIO CLIP (iframe embebido)
              // ============================================================
              <div className="clip-form-container">
                <div id="clip-checkout" className="clip-checkout-container">
                  {!clipReady && (
                    <div className="clip-loading">
                      <div className="spinner-small"></div>
                      <span>Cargando formulario seguro...</span>
                    </div>
                  )}
                </div>
                <p className="clip-secure-note">
                  🔒 Formulario seguro proporcionado por Clip
                </p>
              </div>
            ) : (
              // ============================================================
              // INFO OXXO/SPEI (sin cambios)
              // ============================================================
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
              disabled={procesando || (metodoPago === 'tarjeta' && !clipReady) || (metodoPago !== 'tarjeta' && !conektaReady)}
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
                <span>🔒</span> Pago seguro procesado por <strong>{metodoPago === 'tarjeta' ? 'Clip' : 'Conekta'}</strong>
              </div>
              <div className="trust-badges">
                <span className="badge">3D Secure</span>
                <span className="badge">PCI DSS</span>
                <span className="badge">SSL</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// EXPORT CON SUSPENSE
// ============================================================
export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="checkout-page">
        <div className="checkout-loading">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}