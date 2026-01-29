'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import MapaUsuario from '@/components/MapaUsuario';
import SplashScreen from '@/components/SplashScreen';
import './usuario.css';

type Negocio = {
  id: number;
  nombre?: string;
  direccion?: string;
  productos?: string;
  horario?: string;
  hours_formatted?: string;
  imagen_url?: string;
  latitud?: number | string;
  longitud?: number | string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function UsuarioPage() {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [busquedaNombre, setBusquedaNombre] = useState('');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [posicionUsuario, setPosicionUsuario] =
    useState<{ lat: number; lng: number } | null>(null);

  const [mostrarSplash, setMostrarSplash] = useState(true);
  const [cargando, setCargando] = useState(true);

  const splashStartTime = useRef<number>(Date.now());
  const visitaRegistrada = useRef(false);

  const mapaRef = useRef<any>(null);
  const mapaAreaRef = useRef<HTMLDivElement | null>(null);

  /* =========================
     REGISTRAR VISITA
  ========================= */
  useEffect(() => {
    if (!API_URL || visitaRegistrada.current) return;

    const registrarVisita = async () => {
      try {
        const res = await fetch(`${API_URL}/api/visitas/registrar`, {
          method: 'POST',
        });
        if (res.ok) visitaRegistrada.current = true;
      } catch {
        console.warn('No se pudo registrar visita');
      }
    };

    registrarVisita();
  }, []);

  /* =========================
     OBTENER UBICACIÓN
  ========================= */
  useEffect(() => {
    const obtenerUbicacion = async () => {
      if (!navigator.geolocation) {
        setCargando(false);
        return;
      }

      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          })
        );

        const ubicacion = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        setPosicionUsuario(ubicacion);
        localStorage.setItem('ubicacion', JSON.stringify(ubicacion));
      } catch {
        try {
          const res = await fetch('https://ipapi.co/json/');
          const data = await res.json();

          const ubicacionIP = {
            lat: data.latitude,
            lng: data.longitude,
          };

          setPosicionUsuario(ubicacionIP);
          localStorage.setItem('ubicacion', JSON.stringify(ubicacionIP));
        } catch {
          console.warn('No se pudo obtener ubicación');
        }
      } finally {
        setCargando(false);
      }
    };

    obtenerUbicacion();
  }, []);

  /* =========================
     CARGAR NEGOCIOS (JSON SAFE)
  ========================= */
  useEffect(() => {
    if (!API_URL) return;

    const cargar = async () => {
      const cached = localStorage.getItem('negocios');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) setNegocios(parsed);
        } catch {}
      }

      try {
        const res = await fetch(`${API_URL}/api/comercios/publico/negocios`);

        if (!res.ok) throw new Error('Respuesta no válida');

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('La API no devolvió JSON');
        }

        const data = await res.json();

        if (Array.isArray(data)) {
          setNegocios(data);
          localStorage.setItem('negocios', JSON.stringify(data));
        } else {
          setNegocios([]);
        }
      } catch (err) {
        console.warn('Error al cargar negocios');
        setNegocios([]);
      }
    };

    cargar();
  }, []);

  /* =========================
     CONTROL SPLASH
  ========================= */
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Date.now() - splashStartTime.current;

      if ((!cargando && negocios.length > 0) || elapsed > 3000) {
        setMostrarSplash(false);
        clearInterval(timer);
      }
    }, 300);

    return () => clearInterval(timer);
  }, [negocios, cargando]);

  /* =========================
     FILTRO
  ========================= */
  const negociosFiltrados = negocios.filter((n) => {
    const nombre = n.nombre?.toLowerCase() || '';
    const productos = n.productos?.toLowerCase() || '';

    if (!busquedaNombre && !busquedaProducto) return true;

    return (
      (busquedaNombre && nombre.includes(busquedaNombre.toLowerCase())) ||
      (busquedaProducto && productos.includes(busquedaProducto.toLowerCase()))
    );
  });

  const manejarClickNegocio = (negocio: Negocio) => {
    mapaRef.current?.enfocarEnNegocio?.(negocio);
    mapaAreaRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  if (mostrarSplash) {
    return <SplashScreen onFinish={() => setMostrarSplash(false)} />;
  }

  return (
    <div className="usuario-panel">
      <div className="header-bienvenida">
        <h1>Bienvenido a Turicanje</h1>
        <p>Descubre los mejores lugares de tu ciudad</p>
      </div>

      <div className="mapa-usuario" ref={mapaAreaRef}>
        <MapaUsuario
          
          negocios={negociosFiltrados}
          posicionUsuario={posicionUsuario}
          onUbicacionActualizada={setPosicionUsuario}
        />
      </div>

      <div className="busqueda-panel">
        <input
          placeholder="Buscar por nombre"
          value={busquedaNombre}
          onChange={(e) => setBusquedaNombre(e.target.value)}
        />
        <input
          placeholder="Buscar por productos"
          value={busquedaProducto}
          onChange={(e) => setBusquedaProducto(e.target.value)}
        />
      </div>

      <div className="lista-negocios">
        <h2>Lista de Comercios</h2>
        {negociosFiltrados.length === 0 ? (
          <p className="sin-resultados">No hay negocios disponibles.</p>
        ) : (
          negociosFiltrados.map((n) => (
            <div key={n.id} onClick={() => manejarClickNegocio(n)} className="negocio-item">
              <strong>{n.nombre}</strong>
              <div className="direccion">📍 {n.direccion}</div>
              {n.productos && (
                <div className="productos">📦 {n.productos}</div>
              )}
              {(n.hours_formatted || n.horario) && (
                <div className="horario">🕒 {n.hours_formatted || n.horario}</div>
              )}
              {n.imagen_url && (
                <Image
                  src={n.imagen_url}
                  alt={n.nombre || 'Negocio'}
                  width={250}
                  height={150}
                  className="imagen-lista"
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}