'use client';

import { useEffect, useRef, useState } from 'react';

// ✅ Interface completa con todos los datos de ubicación
interface PlaceResult {
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  lat: number | null;
  lng: number | null;
  timezone: string;
}

interface GooglePlacesAutocompleteProps {
  onPlaceSelected: (place: PlaceResult) => void;
  defaultValue?: string;
  placeholder?: string;
  restrictToCountry?: string; // 'mx', 'us', etc. o null para global
}

// ✅ Detectar zona horaria por coordenadas (simplificado para México/LATAM)
function detectarZonaHoraria(lat: number, lng: number): string {
  // México
  if (lat >= 14 && lat <= 33 && lng >= -118 && lng <= -86) {
    if (lng <= -114.5) return "America/Tijuana";
    else if (lng <= -106) return "America/Chihuahua";
    else return "America/Mexico_City";
  }
  
  // Estados Unidos
  if (lat >= 24 && lat <= 50 && lng >= -125 && lng <= -66) {
    if (lng <= -120) return "America/Los_Angeles";
    if (lng <= -104) return "America/Denver";
    if (lng <= -87) return "America/Chicago";
    return "America/New_York";
  }
  
  // Centroamérica
  if (lat >= 7 && lat <= 18 && lng >= -92 && lng <= -77) {
    if (lng >= -90) return "America/Guatemala";
    if (lng >= -87) return "America/Tegucigalpa";
    if (lng >= -84) return "America/Costa_Rica";
    return "America/Panama";
  }
  
  // Colombia
  if (lat >= -5 && lat <= 13 && lng >= -79 && lng <= -66) {
    return "America/Bogota";
  }
  
  // Argentina
  if (lat >= -55 && lat <= -21 && lng >= -73 && lng <= -53) {
    return "America/Argentina/Buenos_Aires";
  }
  
  // Chile
  if (lat >= -56 && lat <= -17 && lng >= -76 && lng <= -66) {
    return "America/Santiago";
  }
  
  // Brasil
  if (lat >= -34 && lat <= 5 && lng >= -74 && lng <= -34) {
    return "America/Sao_Paulo";
  }
  
  // España
  if (lat >= 36 && lat <= 44 && lng >= -9 && lng <= 4) {
    return "Europe/Madrid";
  }
  
  // Default
  return "America/Mexico_City";
}

// ✅ Extraer componentes de dirección de Google Places
function extraerComponentesDireccion(addressComponents: any[]): {
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
} {
  let neighborhood = "";
  let city = "";
  let state = "";
  let country = "";
  let postal_code = "";

  if (!addressComponents) {
    return { neighborhood, city, state, country, postal_code };
  }

  addressComponents.forEach((component: any) => {
    const types = component.types || [];

    // Colonia / Barrio
    if (types.includes("neighborhood") || 
        types.includes("sublocality") || 
        types.includes("sublocality_level_1")) {
      neighborhood = component.long_name;
    }

    // Ciudad
    if (types.includes("locality")) {
      city = component.long_name;
    }

    // Estado / Provincia
    if (types.includes("administrative_area_level_1")) {
      state = component.long_name;
    }

    // País
    if (types.includes("country")) {
      country = component.long_name;
    }

    // Código Postal
    if (types.includes("postal_code")) {
      postal_code = component.long_name;
    }
  });

  return { neighborhood, city, state, country, postal_code };
}

// Función para cargar Google Maps script
function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const win = window as any;
    
    if (win.google && win.google.maps) {
      resolve();
      return;
    }

    if (win.googleMapsLoaded) {
      const checkLoaded = setInterval(() => {
        if (win.google && win.google.maps) {
          clearInterval(checkLoaded);
          resolve();
        }
      }, 100);
      return;
    }

    win.googleMapsLoaded = true;

    const script = document.createElement('script');
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error('❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no está configurada');
      reject(new Error('API Key no configurada'));
      return;
    }

    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=es`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('✅ Google Maps API cargada exitosamente');
      resolve();
    };

    script.onerror = () => {
      console.error('❌ Error al cargar Google Maps API');
      win.googleMapsLoaded = false;
      reject(new Error('Error al cargar Google Maps'));
    };

    document.head.appendChild(script);
  });
}

export default function GooglePlacesAutocomplete({ 
  onPlaceSelected, 
  defaultValue = '',
  placeholder = "Escribe la dirección y selecciona de la lista",
  restrictToCountry = 'mx'
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const onPlaceSelectedRef = useRef(onPlaceSelected);
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(defaultValue);

  // Mantener ref actualizada
  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected;
  }, [onPlaceSelected]);

  // Actualizar valor cuando cambia defaultValue
  useEffect(() => {
    setInputValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    let mounted = true;
    const win = window as any;

    async function initAutocomplete() {
      try {
        await loadGoogleMapsScript();

        if (!mounted) return;

        if (!win.google?.maps?.places) {
          console.error('❌ Google Places API no disponible');
          return;
        }

        if (!inputRef.current) return;

        // Si ya existe un autocomplete, no crear otro
        if (autocompleteRef.current) return;

        console.log('🔧 Inicializando Google Places Autocomplete...');

        // Opciones del autocomplete
        const options: any = {
          types: ['address'],
          fields: ['formatted_address', 'geometry', 'address_components', 'name']
        };

        // Restricción de país (opcional)
        if (restrictToCountry) {
          options.componentRestrictions = { country: restrictToCountry };
        }

        autocompleteRef.current = new win.google.maps.places.Autocomplete(
          inputRef.current,
          options
        );

        // ✅ Listener mejorado que extrae TODOS los datos
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          
          console.log('🔍 place_changed disparado, place:', place);
          
          if (place?.geometry?.location) {
            const address = place.formatted_address || place.name || '';
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            // Extraer componentes de dirección
            const { neighborhood, city, state, country, postal_code } = 
              extraerComponentesDireccion(place.address_components);

            // Detectar zona horaria
            const timezone = detectarZonaHoraria(lat, lng);

            const resultado: PlaceResult = {
              address,
              neighborhood,
              city,
              state,
              country,
              postal_code,
              lat,
              lng,
              timezone
            };

            console.log('📍 Lugar seleccionado completo:', resultado);

            setInputValue(address);
            // Usar ref para evitar problemas de closure
            onPlaceSelectedRef.current(resultado);
          } else {
            console.log('⚠️ place_changed pero sin geometry:', place);
          }
        });

        setIsLoaded(true);
        console.log('✅ Google Places Autocomplete listo');
      } catch (error) {
        console.error('❌ Error inicializando autocomplete:', error);
      }
    }

    initAutocomplete();

    return () => {
      mounted = false;
    };
  }, [restrictToCountry]); // Quitamos onPlaceSelected de las dependencias

  return (
    <input
      ref={inputRef}
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      placeholder={isLoaded ? placeholder : "⏳ Cargando Google Maps..."}
      style={{
        width: '100%',
        padding: '10px 14px',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#1a1a2e',
        backgroundColor: 'white',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        opacity: isLoaded ? 1 : 0.7
      }}
    />
  );
}