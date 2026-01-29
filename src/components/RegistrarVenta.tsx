'use client';

import { useState, useEffect, useRef } from 'react';
import './registrar-venta.css';

// Endpoint de canje: POST /api/comercios/puntos/canjear

interface Usuario {
  id: number;
  nombre: string;
  telefono: string;
  puntos: number;
  codigo_qr?: string;
}

interface SaldoComercio {
  saldo: number;
  estado: string;
  mensaje: string | null;
  puede_dar_puntos: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://turicanje-backend.onrender.com';

export default function RegistrarVenta() {
  // ✅ NUEVO: Modo de operación
  const [modo, setModo] = useState<'dar' | 'canjear'>('dar');
  
  const [busqueda, setBusqueda] = useState('');
  const [tipoBusqueda, setTipoBusqueda] = useState<'telefono' | 'qr'>('telefono');
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error' | 'warning'; texto: string } | null>(null);
  const [resultado, setResultado] = useState<any>(null);
  const [saldoComercio, setSaldoComercio] = useState<SaldoComercio | null>(null);
  const [alertaComercio, setAlertaComercio] = useState<any>(null);
  
  // ✅ NUEVO: Para canje
  const [puntosACanjear, setPuntosACanjear] = useState('');
  const [resultadoCanje, setResultadoCanje] = useState<any>(null);
  
  // Scanner QR
  const [scannerActivo, setScannerActivo] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerIntervalRef = useRef<number | null>(null);

  // Cargar saldo del comercio al montar
  useEffect(() => {
    cargarSaldoComercio();
  }, []);

  const cargarSaldoComercio = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/comercios/mi-saldo-puntos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSaldoComercio(data);
      }
    } catch (error) {
      console.error('Error cargando saldo:', error);
    }
  };

  // Buscar usuario cuando se completa el input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const valorLimpio = tipoBusqueda === 'telefono' 
        ? busqueda.replace(/\D/g, '') 
        : busqueda.trim().toUpperCase();
      
      if (tipoBusqueda === 'telefono' && valorLimpio.length >= 10) {
        buscarPorTelefono(valorLimpio);
      } else if (tipoBusqueda === 'qr' && valorLimpio.length >= 10) {
        buscarPorQR(valorLimpio);
      } else {
        setUsuario(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [busqueda, tipoBusqueda]);

  // Limpiar cámara al desmontar
  useEffect(() => {
    return () => {
      detenerScanner();
    };
  }, []);

  const buscarPorTelefono = async (telefono: string) => {
    setBuscando(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/comercios/buscar-usuario/${telefono}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.encontrado) {
        setUsuario(data.usuario);
        setMensaje(null);
      } else {
        setUsuario(null);
      }
    } catch (error) {
      console.error('Error buscando usuario:', error);
      setUsuario(null);
    } finally {
      setBuscando(false);
    }
  };

  const buscarPorQR = async (codigo: string) => {
    setBuscando(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/comercios/buscar-usuario-qr/${codigo}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.encontrado) {
        setUsuario(data.usuario);
        setMensaje(null);
        detenerScanner();
      } else {
        setUsuario(null);
      }
    } catch (error) {
      console.error('Error buscando usuario por QR:', error);
      setUsuario(null);
    } finally {
      setBuscando(false);
    }
  };

  // ============================================================
  // SCANNER QR CON CÁMARA
  // ============================================================
  const iniciarScanner = async () => {
    setScannerError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setScannerActivo(true);
      
      setTimeout(() => {
        iniciarDeteccionQR();
      }, 500);
      
    } catch (error: any) {
      console.error('Error accediendo a la cámara:', error);
      
      let mensajeError = 'Error al acceder a la cámara.';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        mensajeError = 'Permiso de cámara denegado. Activa los permisos en tu navegador.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        mensajeError = 'No se encontró una cámara en el dispositivo.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        mensajeError = 'La cámara está siendo usada por otra aplicación.';
      } else if (error.name === 'OverconstrainedError') {
        mensajeError = 'No se encontró una cámara compatible.';
      } else if (error.name === 'TypeError') {
        mensajeError = 'Requiere HTTPS (en producción funcionará). Ingresa el código manualmente.';
      }
      
      setScannerError(mensajeError);
    }
  };

  const detenerScanner = () => {
    if (scannerIntervalRef.current) {
      cancelAnimationFrame(scannerIntervalRef.current);
      scannerIntervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setScannerActivo(false);
  };

  const iniciarDeteccionQR = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const tieneBarcodeDetector = 'BarcodeDetector' in window;
    
    const checkQR = async () => {
      if (!videoRef.current || !streamRef.current || !scannerActivo) return;
      
      if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
        scannerIntervalRef.current = requestAnimationFrame(checkQR);
        return;
      }
      
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        if (tieneBarcodeDetector) {
          try {
            // @ts-ignore
            const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] });
            const barcodes = await barcodeDetector.detect(canvas);
            
            if (barcodes.length > 0) {
              const codigo = barcodes[0].rawValue;
              console.log('QR detectado:', codigo);
              setBusqueda(codigo);
              buscarPorQR(codigo);
              return;
            }
          } catch (err) {
            // Continuar
          }
        }
      }
      
      if (streamRef.current) {
        scannerIntervalRef.current = requestAnimationFrame(checkQR);
      }
    };
    
    scannerIntervalRef.current = requestAnimationFrame(checkQR);
  };

  // ============================================================
  // REGISTRAR VENTA (DAR PUNTOS)
  // ============================================================
  const registrarVenta = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!usuario) {
      setMensaje({ tipo: 'error', texto: 'Primero busca un usuario' });
      return;
    }

    if (!monto || parseFloat(monto) <= 0) {
      setMensaje({ tipo: 'error', texto: 'Ingresa un monto válido' });
      return;
    }

    if (saldoComercio && !saldoComercio.puede_dar_puntos) {
      setMensaje({ tipo: 'error', texto: 'No tienes puntos disponibles. Recarga para continuar.' });
      return;
    }

    setLoading(true);
    setMensaje(null);
    setResultado(null);
    setAlertaComercio(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/comercios/registrar-compra`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          telefono_usuario: usuario.telefono,
          monto: parseFloat(monto),
          descripcion: descripcion || undefined
        })
      });

      const data = await res.json();

      if (res.ok) {
        setResultado(data.detalle);
        setMensaje({ tipo: 'success', texto: data.mensaje });
        
        if (data.alerta) {
          setAlertaComercio(data.alerta);
        }
        
        if (data.comercio) {
          setSaldoComercio(prev => prev ? {
            ...prev,
            saldo: data.comercio.saldo_actual,
            puede_dar_puntos: data.comercio.saldo_actual > 0
          } : null);
        }
      } else {
        setMensaje({ tipo: 'error', texto: data.mensaje || data.error || 'Error al registrar la venta' });
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error de conexión. Intenta de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // ✅ NUEVO: CANJEAR PUNTOS
  // ============================================================
  const canjearPuntos = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!usuario) {
      setMensaje({ tipo: 'error', texto: 'Primero busca un usuario' });
      return;
    }

    const puntos = parseInt(puntosACanjear);
    
    if (!puntos || puntos <= 0) {
      setMensaje({ tipo: 'error', texto: 'Ingresa una cantidad válida de puntos' });
      return;
    }

    if (puntos > usuario.puntos) {
      setMensaje({ tipo: 'error', texto: `El cliente solo tiene ${usuario.puntos} puntos disponibles` });
      return;
    }

    setLoading(true);
    setMensaje(null);
    setResultadoCanje(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/comercios/puntos/canjear`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          usuario_id: usuario.id,
          puntos: puntos,
          descripcion: descripcion || `Canje de ${puntos} puntos`
        })
      });

      const data = await res.json();

      if (res.ok) {
        setResultadoCanje({
          usuario: usuario.nombre,
          puntos_canjeados: puntos,
          valor_descuento: puntos, // 1 punto = $1 MXN
          puntos_anteriores: usuario.puntos,
          puntos_restantes: usuario.puntos - puntos
        });
        setMensaje({ tipo: 'success', texto: data.mensaje || '¡Canje exitoso!' });
        
        // Actualizar puntos del usuario en el estado local
        setUsuario(prev => prev ? { ...prev, puntos: prev.puntos - puntos } : null);
      } else {
        setMensaje({ tipo: 'error', texto: data.mensaje || data.error || 'Error al canjear puntos' });
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error de conexión. Intenta de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setBusqueda('');
    setMonto('');
    setPuntosACanjear('');
    setDescripcion('');
    setUsuario(null);
    setMensaje(null);
    setResultado(null);
    setResultadoCanje(null);
    setAlertaComercio(null);
    detenerScanner();
  };

  // ✅ Cambiar modo limpia el formulario
  const cambiarModo = (nuevoModo: 'dar' | 'canjear') => {
    setModo(nuevoModo);
    limpiarFormulario();
  };

  return (
    <div className="registrar-venta-container">
      {/* ========== SALDO DEL COMERCIO (solo en modo dar) ========== */}
      {modo === 'dar' && saldoComercio && (
        <div className={`saldo-comercio-card ${saldoComercio.estado}`}>
          <div className="saldo-header">
            <span className="saldo-label">💰 Tu saldo de puntos</span>
            <span className={`saldo-badge ${saldoComercio.estado}`}>
              {saldoComercio.estado === 'normal' && '✅ OK'}
              {saldoComercio.estado === 'info' && '💡 Info'}
              {saldoComercio.estado === 'advertencia' && '⚠️ Bajo'}
              {saldoComercio.estado === 'urgente' && '🟠 Urgente'}
              {saldoComercio.estado === 'critico' && '🔴 Crítico'}
              {saldoComercio.estado === 'bloqueado' && '❌ Sin saldo'}
            </span>
          </div>
          <div className="saldo-amount">
            <span className="saldo-numero">{saldoComercio.saldo.toLocaleString()}</span>
            <span className="saldo-unit">puntos</span>
          </div>
          {saldoComercio.mensaje && (
            <div className={`saldo-mensaje ${saldoComercio.estado}`}>
              {saldoComercio.mensaje}
            </div>
          )}
          <button className="btn-recargar" onClick={() => window.location.href = '/comercios/dashboard/recargar'}>
            💳 Recargar Puntos
          </button>
        </div>
      )}

      {/* ========== TOGGLE DAR / CANJEAR ========== */}
      <div className="modo-toggle">
        <button
          type="button"
          className={`modo-btn ${modo === 'dar' ? 'active' : ''}`}
          onClick={() => cambiarModo('dar')}
        >
          🎁 Dar Puntos
        </button>
        <button
          type="button"
          className={`modo-btn canjear ${modo === 'canjear' ? 'active' : ''}`}
          onClick={() => cambiarModo('canjear')}
        >
          🔄 Canjear Puntos
        </button>
      </div>

      <div className="registrar-venta-header">
        <h2>{modo === 'dar' ? '🎁 Dar Puntos a Cliente' : '🔄 Canjear Puntos del Cliente'}</h2>
        <p>
          {modo === 'dar' 
            ? 'Registra una venta y el cliente acumulará puntos automáticamente'
            : 'El cliente usa sus puntos como descuento (1 punto = $1 MXN)'
          }
        </p>
      </div>

      {/* ========== ALERTA POST-OPERACIÓN ========== */}
      {alertaComercio && (
        <div className={`alerta-comercio ${alertaComercio.tipo}`}>
          <span className="alerta-icono">{alertaComercio.icono}</span>
          <span className="alerta-texto">{alertaComercio.mensaje}</span>
        </div>
      )}

      {/* ========== RESULTADO EXITOSO - DAR PUNTOS ========== */}
      {modo === 'dar' && resultado && (
        <div className="resultado-exito">
          <div className="resultado-icon">✅</div>
          <div className="resultado-info">
            <h3>{resultado.usuario} ganó {resultado.puntos_ganados} puntos</h3>
            <p>Compra: ${resultado.monto_compra?.toLocaleString()} MXN ({resultado.cashback_porcentaje}% cashback)</p>
            <p>Nuevo balance del cliente: <strong>{resultado.nuevo_balance_usuario || resultado.nuevo_balance} puntos</strong></p>
          </div>
          <button onClick={limpiarFormulario} className="btn-nueva-venta">
            + Nueva Venta
          </button>
        </div>
      )}

      {/* ========== RESULTADO EXITOSO - CANJEAR PUNTOS ========== */}
      {modo === 'canjear' && resultadoCanje && (
        <div className="resultado-exito resultado-canje">
          <div className="resultado-icon">🎉</div>
          <div className="resultado-info">
            <h3>¡Canje exitoso!</h3>
            <p><strong>{resultadoCanje.usuario}</strong> canjeó <strong>{resultadoCanje.puntos_canjeados} puntos</strong></p>
            <p>Descuento aplicado: <strong style={{color: '#28a745', fontSize: '24px'}}>${resultadoCanje.valor_descuento} MXN</strong></p>
            <p style={{marginTop: '12px', color: '#666'}}>
              Puntos restantes del cliente: <strong>{resultadoCanje.puntos_restantes}</strong>
            </p>
          </div>
          <button onClick={limpiarFormulario} className="btn-nueva-venta">
            + Nuevo Canje
          </button>
        </div>
      )}

      {/* ========== FORMULARIO ========== */}
      {!resultado && !resultadoCanje && (
        <form onSubmit={modo === 'dar' ? registrarVenta : canjearPuntos} className="registrar-venta-form">
          {/* Tipo de búsqueda */}
          <div className="tipo-busqueda">
            <button
              type="button"
              className={`tipo-btn ${tipoBusqueda === 'telefono' ? 'active' : ''}`}
              onClick={() => { 
                setTipoBusqueda('telefono'); 
                setBusqueda(''); 
                setUsuario(null); 
                detenerScanner();
                setScannerError(null);
              }}
            >
              📱 Teléfono
            </button>
            <button
              type="button"
              className={`tipo-btn ${tipoBusqueda === 'qr' ? 'active' : ''}`}
              onClick={() => { 
                setTipoBusqueda('qr'); 
                setBusqueda(''); 
                setUsuario(null);
                setScannerError(null);
              }}
            >
              📷 Código QR
            </button>
          </div>

          {/* ========== SCANNER QR ========== */}
          {tipoBusqueda === 'qr' && (
            <div className="scanner-section">
              {!scannerActivo ? (
                <div className="scanner-placeholder">
                  <button 
                    type="button" 
                    className="btn-activar-camara"
                    onClick={iniciarScanner}
                  >
                    📷 Activar Cámara para Escanear
                  </button>
                  <p className="scanner-hint">O ingresa el código manualmente abajo</p>
                  {scannerError && (
                    <div className="scanner-error">⚠️ {scannerError}</div>
                  )}
                </div>
              ) : (
                <div className="scanner-activo">
                  <div className="scanner-video-container">
                    <video 
                      ref={videoRef} 
                      className="scanner-video"
                      playsInline
                      muted
                      autoPlay
                    />
                    <div className="scanner-overlay">
                      <div className="scanner-frame"></div>
                    </div>
                  </div>
                  <p className="scanner-scanning">
                    {'BarcodeDetector' in window 
                      ? 'Apunta al código QR del cliente...'
                      : 'Ve el código QR e ingrésalo abajo'
                    }
                  </p>
                  <button 
                    type="button" 
                    className="btn-detener-camara"
                    onClick={detenerScanner}
                  >
                    ✕ Cerrar Cámara
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Campo de búsqueda */}
          <div className="form-group">
            <label>
              {tipoBusqueda === 'telefono' ? 'Teléfono del cliente' : 'Código QR del cliente'}
            </label>
            <div className="input-with-status">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder={tipoBusqueda === 'telefono' ? '55 1234 5678' : 'TUR-XXXXXX-XXXX'}
                className={usuario ? 'input-success' : ''}
              />
              {buscando && <span className="input-status buscando">🔍</span>}
              {usuario && <span className="input-status encontrado">✓</span>}
            </div>
          </div>

          {/* Usuario encontrado */}
          {usuario && (
            <div className={`usuario-encontrado ${modo === 'canjear' ? 'modo-canje' : ''}`}>
              <div className="usuario-avatar">
                {usuario.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="usuario-info">
                <span className="usuario-nombre">{usuario.nombre}</span>
                <span className="usuario-puntos">
                  {modo === 'canjear' ? (
                    <strong style={{fontSize: '18px', color: '#d1007d'}}>
                      {usuario.puntos?.toLocaleString()} puntos disponibles
                    </strong>
                  ) : (
                    `${usuario.puntos?.toLocaleString()} puntos actuales`
                  )}
                </span>
              </div>
              <div className="usuario-badge">✓ Verificado</div>
            </div>
          )}

          {/* ========== CAMPOS SEGÚN MODO ========== */}
          {modo === 'dar' ? (
            <>
              {/* Monto de la compra */}
              <div className="form-group">
                <label>Monto de la compra (MXN)</label>
                <div className="input-monto">
                  <span className="monto-prefix">$</span>
                  <input
                    type="number"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="0.00"
                    min="1"
                    step="0.01"
                    disabled={!usuario}
                  />
                </div>
              </div>

              {/* Descripción opcional */}
              <div className="form-group">
                <label>Descripción (opcional)</label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Comida para 2, promoción especial..."
                  disabled={!usuario}
                />
              </div>
            </>
          ) : (
            <>
              {/* Puntos a canjear */}
              <div className="form-group">
                <label>Puntos a canjear</label>
                <div className="input-monto input-puntos">
                  <span className="monto-prefix">🎁</span>
                  <input
                    type="number"
                    value={puntosACanjear}
                    onChange={(e) => {
                      const val = e.target.value;
                      // No permitir más de lo que tiene el usuario
                      if (usuario && parseInt(val) > usuario.puntos) {
                        setPuntosACanjear(usuario.puntos.toString());
                      } else {
                        setPuntosACanjear(val);
                      }
                    }}
                    placeholder="0"
                    min="1"
                    max={usuario?.puntos || 0}
                    disabled={!usuario}
                  />
                </div>
                {usuario && puntosACanjear && (
                  <p style={{marginTop: '8px', color: '#666', fontSize: '14px'}}>
                    Descuento a aplicar: <strong style={{color: '#28a745'}}>${parseInt(puntosACanjear) || 0} MXN</strong>
                  </p>
                )}
              </div>

              {/* Botones rápidos de canje */}
              {usuario && usuario.puntos > 0 && (
                <div className="canje-rapido">
                  <span>Canje rápido:</span>
                  <div className="canje-btns">
                    {[50, 100, 200, 500].map(val => (
                      usuario.puntos >= val && (
                        <button 
                          key={val}
                          type="button" 
                          onClick={() => setPuntosACanjear(val.toString())}
                          className={puntosACanjear === val.toString() ? 'active' : ''}
                        >
                          {val} pts
                        </button>
                      )
                    ))}
                    <button 
                      type="button" 
                      onClick={() => setPuntosACanjear(usuario.puntos.toString())}
                      className={puntosACanjear === usuario.puntos.toString() ? 'active' : ''}
                    >
                      Todo ({usuario.puntos})
                    </button>
                  </div>
                </div>
              )}

              {/* Descripción opcional */}
              <div className="form-group">
                <label>Nota (opcional)</label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Descuento en cuenta final..."
                  disabled={!usuario}
                />
              </div>
            </>
          )}

          {/* Mensaje */}
          {mensaje && (
            <div className={`mensaje ${mensaje.tipo}`}>
              {mensaje.tipo === 'error' ? '⚠️' : '✅'} {mensaje.texto}
            </div>
          )}

          {/* Botón de envío */}
          <button
            type="submit"
            className={`btn-registrar ${modo === 'canjear' ? 'btn-canjear' : ''}`}
            disabled={
              !usuario || 
              loading || 
              (modo === 'dar' && (!monto || (saldoComercio && !saldoComercio.puede_dar_puntos))) ||
              (modo === 'canjear' && (!puntosACanjear || parseInt(puntosACanjear) <= 0))
            }
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                {modo === 'dar' ? 'Registrando...' : 'Canjeando...'}
              </>
            ) : modo === 'dar' ? (
              (saldoComercio && !saldoComercio.puede_dar_puntos) ? (
                <>🔒 Sin saldo - Recarga para continuar</>
              ) : (
                <>🎁 Dar Puntos</>
              )
            ) : (
              <>🔄 Canjear {puntosACanjear || 0} puntos (= ${puntosACanjear || 0} descuento)</>
            )}
          </button>
        </form>
      )}

      {/* Instrucciones */}
      <div className="instrucciones">
        <h4>💡 ¿Cómo funciona?</h4>
        {modo === 'dar' ? (
          <ol>
            <li>Pide al cliente su <strong>teléfono</strong> o escanea su <strong>código QR</strong></li>
            <li>Ingresa el <strong>monto total</strong> de la compra</li>
            <li>El sistema calcula automáticamente los puntos según tu porcentaje de cashback</li>
            <li>¡El cliente acumula puntos al instante!</li>
          </ol>
        ) : (
          <ol>
            <li>Pide al cliente su <strong>teléfono</strong> o escanea su <strong>código QR</strong></li>
            <li>Verifica los <strong>puntos disponibles</strong> del cliente</li>
            <li>Ingresa la cantidad de <strong>puntos a canjear</strong> (1 punto = $1 MXN)</li>
            <li>Aplica el descuento en la cuenta del cliente</li>
            <li><strong>Importante:</strong> Esta operación NO genera puntos nuevos</li>
          </ol>
        )}
      </div>
    </div>
  );
}