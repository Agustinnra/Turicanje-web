'use client';

export default function OfflinePage() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: 'white',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '80px', marginBottom: '20px' }}>📡</div>
      <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>Sin conexion</h1>
      <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '30px', maxWidth: '300px' }}>
        Parece que no tienes conexion a internet. Verifica tu conexion e intenta de nuevo.
      </p>
      <button
        onClick={handleReload}
        style={{
          padding: '14px 28px',
          background: 'linear-gradient(135deg, #d1007d 0%, #ff006e 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        Reintentar
      </button>
      <p style={{ marginTop: '40px', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
        Mientras tanto, escribenos por WhatsApp
      </p>
      <a 
        href="https://wa.me/525522545216"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginTop: '10px',
          color: '#25D366',
          textDecoration: 'none',
          fontWeight: '600'
        }}
      >
        Abrir WhatsApp
      </a>
    </div>
  );
}
