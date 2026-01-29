'use client';

import { useState, useEffect } from 'react';
import CloudinaryUploadWidget from './CloudinaryUploadWidget';
import './ImageUploadManager.css';

interface ImageUploadManagerProps {
  label: string;
  currentImages: string[];
  onImagesChange: (images: string[]) => void;
  multiple?: boolean;
  maxImages?: number;
}

export default function ImageUploadManager({
  label,
  currentImages,
  onImagesChange,
  multiple = false,
  maxImages = 10
}: ImageUploadManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]);

  const totalImages = currentImages.length + pendingImages.length;
  const canAddMore = multiple ? totalImages < maxImages : totalImages < 1;

  // Manejar scroll del body cuando el modal se abre/cierra
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.dataset.scrollY = String(scrollY);
    } else {
      const scrollY = document.body.dataset.scrollY || '0';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, parseInt(scrollY));
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  /* ======================
     SUBIDA DE IMAGENES
     ====================== */
  const handleUploadSuccess = (urls: string[]) => {
    // CASO 1: SOLO UNA IMAGEN
    if (!multiple) {
      const image = urls[0];
      onImagesChange([image]);
      setPendingImages([]);
      setIsOpen(false);
      return;
    }

    // CASO 2: GALERIAS (multiples imagenes)
    // Filtrar duplicados por si acaso
    const existingUrls = new Set([...currentImages, ...pendingImages]);
    const newUrls = urls.filter(url => !existingUrls.has(url));
    
    const allowed = maxImages - totalImages;
    const urlsToAdd = newUrls.slice(0, allowed);
    
    if (urlsToAdd.length > 0) {
      setPendingImages(prev => [...prev, ...urlsToAdd]);
    }
  };

  /* ======================
     ELIMINAR
     ====================== */
  const handleRemovePending = (index: number) => {
    setPendingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveCurrent = (index: number) => {
    const updated = currentImages.filter((_, i) => i !== index);
    onImagesChange(updated);
  };

  /* ======================
     CONFIRMAR / CANCELAR
     ====================== */
  const handleConfirm = () => {
    if (pendingImages.length === 0) {
      setIsOpen(false);
      return;
    }

    const merged = multiple
      ? [...currentImages, ...pendingImages]
      : [pendingImages[0]];

    onImagesChange(merged);
    setPendingImages([]);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setPendingImages([]);
    setIsOpen(false);
  };

  return (
    <div className="image-upload-manager">
      {/* HEADER */}
      <div className="image-upload-header">
        <label>{label}</label>
        <span className="image-count-badge">
          {currentImages.length} imagen{currentImages.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* MINIATURAS SIEMPRE VISIBLES */}
      {currentImages.length > 0 && (
        <div className="current-images">
          <div className="image-grid">
            {currentImages.map((url, idx) => (
              <div key={idx} className="image-item">
                <img src={url} alt={`Imagen ${idx + 1}`} />
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => handleRemoveCurrent(idx)}
                >
                  X
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BOTON ABRIR MODAL */}
      <button
        type="button"
        className="btn-manage-images"
        onClick={() => setIsOpen(true)}
      >
        {currentImages.length > 0 ? 'Editar imagenes' : 'Subir imagenes'}
      </button>

      {/* MODAL */}
      {isOpen && (
        <div className="image-modal-overlay" onClick={handleCancel}>
          <div className="image-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{label}</h3>
              <button className="btn-close" onClick={handleCancel}>X</button>
            </div>

            <div className="modal-body">
              {/* GUARDADAS */}
              {currentImages.length > 0 && (
                <div className="modal-section">
                  <p className="section-title">
                    Imagenes guardadas ({currentImages.length})
                  </p>
                  <div className="image-grid">
                    {currentImages.map((url, idx) => (
                      <div key={`current-${idx}`} className="image-item">
                        <img src={url} alt={`Guardada ${idx + 1}`} />
                        <button
                          type="button"
                          className="btn-remove"
                          onClick={() => handleRemoveCurrent(idx)}
                        >
                          X
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NUEVAS */}
              {pendingImages.length > 0 && (
                <div className="modal-section">
                  <p className="section-title">
                    Nuevas imagenes ({pendingImages.length})
                  </p>
                  <div className="image-grid">
                    {pendingImages.map((url, idx) => (
                      <div key={`pending-${idx}`} className="image-item pending">
                        <img src={url} alt={`Nueva ${idx + 1}`} />
                        <button
                          type="button"
                          className="btn-remove"
                          onClick={() => handleRemovePending(idx)}
                        >
                          X
                        </button>
                        <span className="pending-badge">Nueva</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUBIR */}
              {canAddMore ? (
                <div className="upload-section">
                  <CloudinaryUploadWidget
                    onUploadSuccess={handleUploadSuccess}
                    buttonText={multiple ? 'Subir mas imagenes' : 'Subir imagen'}
                    multiple={multiple}
                  />
                  <p className="hint">
                    {multiple
                      ? `Maximo ${maxImages} imagenes`
                      : 'Solo se permite 1 imagen'}
                  </p>
                </div>
              ) : (
                <p className="limit-reached">
                  Limite alcanzado ({maxImages})
                </p>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={handleCancel}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn-confirm"
                onClick={handleConfirm}
                disabled={pendingImages.length === 0}
              >
                Confirmar {pendingImages.length > 0 && `(${pendingImages.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}