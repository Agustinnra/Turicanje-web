'use client';

import { useEffect, useRef } from 'react';

interface CloudinaryUploadWidgetProps {
  onUploadSuccess: (urls: string[]) => void;
  multiple?: boolean;
  buttonText?: string;
  folder?: string;
}

declare global {
  interface Window {
    cloudinary: any;
  }
}

export default function CloudinaryUploadWidget({
  onUploadSuccess,
  multiple = false,
  buttonText = 'Subir imagen',
  folder = 'turicanje',
}: CloudinaryUploadWidgetProps) {
  const widgetRef = useRef<any>(null);
  const uploadedUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!window.cloudinary) {
      const script = document.createElement('script');
      script.src = 'https://upload-widget.cloudinary.com/global/all.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const openWidget = () => {
    if (!window.cloudinary) {
      alert('Cargando widget de imagenes...');
      return;
    }

    // Limpiar URLs acumuladas al abrir
    uploadedUrlsRef.current = [];

    widgetRef.current = window.cloudinary.createUploadWidget(
      {
        cloudName: 'djaecf31x',
        uploadPreset: 'ml_default',
        folder: 'turicanje',
        multiple,
        maxFiles: multiple ? 10 : 1,
        sources: ['local', 'camera'],
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        maxFileSize: 5_000_000,
        resourceType: 'image',
        cropping: false,
      },
      (_error: any, result: any) => {
        // Acumular URL cuando se sube exitosamente
        if (result?.event === 'success') {
          const url = result.info.secure_url;
          uploadedUrlsRef.current.push(url);
          console.log('Imagen subida:', url);
        }

        // SOLO enviar URLs cuando el widget se CIERRA
        // Esto evita la duplicacion
        if (result?.event === 'close') {
          if (uploadedUrlsRef.current.length > 0) {
            onUploadSuccess([...uploadedUrlsRef.current]);
            uploadedUrlsRef.current = []; // Limpiar despues de enviar
          }
        }
      }
    );

    widgetRef.current.open();
  };

  return (
    <button
      type="button"
      onClick={openWidget}
      className="btn-upload-cloudinary"
    >
      {buttonText}
    </button>
  );
}