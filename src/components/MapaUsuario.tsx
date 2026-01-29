'use client';

import { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';

const LIBRARIES: ("places")[] = ['places'];
const containerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 19.4326, lng: -99.1332 };

const getIconForBusiness = (negocio: any) => {
  if (negocio.afiliado === true || negocio.afiliado === 'true') return '/icons/Turity.png';
  const icons: Record<string, string> = {
    Actividades: '/icons/Actividades.png',
    Bar: '/icons/Bar.png',
    Cafetería: '/icons/Cafeteria.png',
    'Comida Callejera': '/icons/Callejera.png',
    'Dark Kitchen': '/icons/Dark.png',
    Eventos: '/icons/Eventos.png',
    Hotel: '/icons/Hotel.png',
    Restaurante: '/icons/Restaurante.png',
    Spa: '/icons/Spa.png',
    Tours: '/icons/Tours.png',
  };
  return icons[negocio.categorias] || '/icons/Callejera.png';
};

const validarUrl = (url: string) => {
  if (!url?.startsWith('http://') && !url?.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

const obtenerHorario = (negocio: any) => {
  if (negocio.hours_formatted) {
    return negocio.hours_formatted;
  }
  
  if (negocio.hours && typeof negocio.hours === 'object' && Object.keys(negocio.hours).length > 0) {
    const daysMap: Record<string, string> = {
      mon: 'LUN', tue: 'MAR', wed: 'MIÉ', 
      thu: 'JUE', fri: 'VIE', sat: 'SÁB', sun: 'DOM'
    };
    
    const schedule: Record<string, string> = {};
    
    for (const [dayCode, times] of Object.entries(negocio.hours)) {
      if (Array.isArray(times) && times.length > 0 && Array.isArray(times[0]) && times[0].length === 2) {
        const openTime = times[0][0].substring(0, 5).replace(/^0+/, '').replace(':0', ':');
        const closeTime = times[0][1].substring(0, 5).replace(/^0+/, '').replace(':0', ':');
        schedule[dayCode] = `${openTime}-${closeTime}`;
      }
    }
    
    if (Object.keys(schedule).length === 0) {
      return 'Horario no disponible';
    }
    
    const timeGroups: Record<string, string[]> = {};
    for (const [day, timeRange] of Object.entries(schedule)) {
      if (!timeGroups[timeRange]) {
        timeGroups[timeRange] = [];
      }
      timeGroups[timeRange].push(day);
    }
    
    const resultParts: string[] = [];
    const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    
    for (const [timeRange, days] of Object.entries(timeGroups)) {
      const daysSorted = days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
      
      if (daysSorted.length >= 5 && daysSorted.includes('mon') && daysSorted.includes('fri')) {
        const weekdays = daysSorted.filter(d => !['sat', 'sun'].includes(d));
        const weekend = daysSorted.filter(d => ['sat', 'sun'].includes(d));
        
        if (weekdays.length === 5) {
          resultParts.push(`LUN-VIE ${timeRange}`);
          weekend.forEach(d => resultParts.push(`${daysMap[d]} ${timeRange}`));
          continue;
        }
      }
      
      if (daysSorted.length > 2) {
        const firstDay = daysMap[daysSorted[0]];
        const lastDay = daysMap[daysSorted[daysSorted.length - 1]];
        resultParts.push(`${firstDay}-${lastDay} ${timeRange}`);
      } else {
        resultParts.push(`${daysSorted.map(d => daysMap[d]).join(', ')} ${timeRange}`);
      }
    }
    
    return resultParts.join(', ');
  }
  
  return negocio.horario || negocio.schedule || 'Horario no disponible';
};

interface MapaUsuarioProps {
  negocios: any[];
  posicionUsuario: { lat: number; lng: number } | null;
  onUbicacionActualizada?: (pos: { lat: number; lng: number }) => void;
}

const MapaUsuario = forwardRef<any, MapaUsuarioProps>(
  ({ negocios, posicionUsuario, onUbicacionActualizada }, ref) => {
    const { isLoaded } = useJsApiLoader({
      googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      libraries: LIBRARIES,
    });

    const mapRef = useRef<google.maps.Map | null>(null);
    const [negocioSeleccionado, setNegocioSeleccionado] = useState<any>(null);
    const watchId = useRef<number | null>(null);

    useImperativeHandle(ref, () => ({
      enfocarEnNegocio: (negocio: any) => {
        if (mapRef.current && negocio.latitud && negocio.longitud) {
          const posicion = {
            lat: parseFloat(negocio.latitud),
            lng: parseFloat(negocio.longitud),
          };
          mapRef.current.panTo(posicion);
          setNegocioSeleccionado(negocio);
        }
      },
    }));

    const iniciarSeguimientoUbicacion = () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);

      if (!navigator.geolocation) return;

      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const nuevaPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          if (onUbicacionActualizada) onUbicacionActualizada(nuevaPos);
          localStorage.setItem('ubicacion', JSON.stringify(nuevaPos));
        },
        (error) => {
          // Solo log en consola, sin alert
          console.warn('⚠️ No se pudo seguir ubicación:', error.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    const detenerSeguimientoUbicacion = () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };

    const handleMapLoad = (map: google.maps.Map) => {
      // Solo ejecutar una vez
      if (mapRef.current) return;
      
      mapRef.current = map;
      iniciarSeguimientoUbicacion();

      // Crear botón solo si no existe
      const locationButton = document.createElement('button');
      locationButton.textContent = '📍 Mi ubicación';
      locationButton.classList.add('custom-map-control-button');
      locationButton.style.backgroundColor = '#fff';
      locationButton.style.border = 'none';
      locationButton.style.borderRadius = '2px';
      locationButton.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
      locationButton.style.cursor = 'pointer';
      locationButton.style.margin = '10px';
      locationButton.style.padding = '10px';
      
      map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);

      locationButton.addEventListener('click', () => {
        if (!navigator.geolocation) {
          console.warn('⚠️ Navegador no soporta geolocalización');
          return;
        }

        // Pedir permiso explícitamente
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const nuevaPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            map.setCenter(nuevaPos);
            map.setZoom(16);
            if (onUbicacionActualizada) onUbicacionActualizada(nuevaPos);
            iniciarSeguimientoUbicacion();
          },
          (error) => {
            // Solo log en consola, sin molestar al usuario
            console.warn('⚠️ No se pudo obtener ubicación:', error.code);
          },
          { 
            enableHighAccuracy: true, 
            timeout: 10000, 
            maximumAge: 0 
          }
        );
      });
    };

    if (!isLoaded) return <p>🗺️ Cargando mapa...</p>;

    return (
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={posicionUsuario || defaultCenter}
        zoom={12}
        onLoad={handleMapLoad}
        onDragStart={() => detenerSeguimientoUbicacion()}
        onZoomChanged={() => detenerSeguimientoUbicacion()}
        onClick={() => detenerSeguimientoUbicacion()}
        options={{
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        }}
      >
        {negocios.map((negocio, i) =>
          negocio.latitud && negocio.longitud ? (
            <Marker
              key={i}
              position={{
                lat: parseFloat(negocio.latitud),
                lng: parseFloat(negocio.longitud),
              }}
              icon={{
                url: getIconForBusiness(negocio),
                scaledSize: new window.google.maps.Size(40, 40),
              }}
              onClick={() => setNegocioSeleccionado(negocio)}
            />
          ) : null
        )}

        {posicionUsuario && (
          <Marker
            position={posicionUsuario}
            icon={{
              url: '/icons/Usuario.png',
              scaledSize: new window.google.maps.Size(40, 40),
            }}
          />
        )}

        {negocioSeleccionado && (
          <InfoWindow
            position={{
              lat: parseFloat(negocioSeleccionado.latitud),
              lng: parseFloat(negocioSeleccionado.longitud),
            }}
            onCloseClick={() => setNegocioSeleccionado(null)}
          >
            <div style={{ 
              minWidth: '220px', 
              maxWidth: '260px',
              padding: '6px',
              fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
              textAlign: 'center'
            }}>
              {negocioSeleccionado.imagen_url && (
                <img
                  src={negocioSeleccionado.imagen_url}
                  alt={negocioSeleccionado.nombre}
                  style={{
                    width: '100%',
                    height: '120px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    marginBottom: '10px',
                  }}
                />
              )}
              
              <h3 style={{ 
                margin: '0 0 6px 0', 
                color: '#333',
                fontSize: '16px',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                {negocioSeleccionado.nombre}
              </h3>
              
              <p style={{ 
                margin: '4px 0', 
                color: '#666',
                fontSize: '13px',
                textAlign: 'center'
              }}>
                <strong>📂</strong> {negocioSeleccionado.categorias || 'Sin categoría'}
              </p>
              
              <p style={{ 
                margin: '4px 0', 
                color: '#666',
                fontSize: '13px',
                textAlign: 'center'
              }}>
                <strong>🕒</strong> {obtenerHorario(negocioSeleccionado)}
              </p>
              
              {negocioSeleccionado.productos && (
                <p style={{ 
                  margin: '4px 0', 
                  color: '#666',
                  fontSize: '13px',
                  textAlign: 'center'
                }}>
                  <strong>📦</strong> {negocioSeleccionado.productos}
                </p>
              )}

              <div style={{ 
                marginTop: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                alignItems: 'center'
              }}>
                {negocioSeleccionado.url_extra && (
                  <a
                    href={validarUrl(negocioSeleccionado.url_extra)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      color: '#4285F4', 
                      textDecoration: 'none', 
                      fontWeight: '600',
                      fontSize: '13px'
                    }}
                  >
                    🌐 Más información
                  </a>
                )}

                {negocioSeleccionado.url_pedidos && (
                  <a
                    href={validarUrl(negocioSeleccionado.url_pedidos)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      color: '#34A853', 
                      textDecoration: 'none', 
                      fontWeight: '600',
                      fontSize: '13px'
                    }}
                  >
                    🛵 Hacer pedido
                  </a>
                )}

                <button
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${negocioSeleccionado.latitud},${negocioSeleccionado.longitud}`,
                      '_blank'
                    )
                  }
                  style={{
                    marginTop: '2px',
                    padding: '8px 12px',
                    backgroundColor: '#4285F4',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                >
                  📍 Ver en Google Maps
                </button>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    );
  }
);

MapaUsuario.displayName = 'MapaUsuario';

export default MapaUsuario;