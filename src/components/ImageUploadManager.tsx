'use client';

import { useState, useEffect, useRef } from 'react';
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
  
  // Drag and drop states
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragSource, setDragSource] = useState<'current' | 'pending' | null>(null);

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
     DRAG AND DROP
     ====================== */
  const handleDragStart = (index: number, source: 'current' | 'pending') => {
    setDraggedIndex(index);
    setDragSource(source);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number, dropSource: 'current' | 'pending') => {
    e.preventDefault();
    
    if (draggedIndex === null || dragSource === null) return;
    
    // Solo permitir reordenar dentro del mismo grupo
    if (dragSource !== dropSource) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setDragSource(null);
      return;
    }
    
    if (dragSource === 'current') {
      const newImages = [...currentImages];
      const [removed] = newImages.splice(draggedIndex, 1);
      newImages.splice(dropIndex, 0, removed);
      onImagesChange(newImages);
    } else {
      const newImages = [...pendingImages];
      const [removed] = newImages.splice(draggedIndex, 1);
      newImages.splice(dropIndex, 0, removed);
      setPendingImages(newImages);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDragSource(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDragSource(null);
  };

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
    if (pendingImages.length === 0 && currentImages.length > 0) {
      // Permitir cerrar si solo reordenó
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
              <div 
                key={idx} 
                className={`image-item ${draggedIndex === idx && dragSource === 'current' ? 'dragging' : ''}`}
                draggable
                onDragStart={() => handleDragStart(idx, 'current')}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, idx, 'current')}
                onDragEnd={handleDragEnd}
              >
                <img src={url} alt={`Imagen ${idx + 1}`} />
                <span className="drag-indicator">⋮⋮</span>
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => handleRemoveCurrent(idx)}
                >
                  X
                </button>
                {idx === 0 && <span className="principal-badge">Principal</span>}
              </div>
            ))}
          </div>
          {multiple && currentImages.length > 1 && (
            <p className="drag-hint">↔ Arrastra para reordenar. La primera imagen será la principal.</p>
          )}
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
                    {multiple && currentImages.length > 1 && (
                      <span className="reorder-hint"> - Arrastra para reordenar</span>
                    )}
                  </p>
                  <div className="image-grid">
                    {currentImages.map((url, idx) => (
                      <div 
                        key={`current-${idx}`} 
                        className={`image-item 
                          ${draggedIndex === idx && dragSource === 'current' ? 'dragging' : ''} 
                          ${dragOverIndex === idx && dragSource === 'current' ? 'drag-over' : ''}`
                        }
                        draggable
                        onDragStart={() => handleDragStart(idx, 'current')}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, idx, 'current')}
                        onDragEnd={handleDragEnd}
                      >
                        <img src={url} alt={`Guardada ${idx + 1}`} draggable={false} />
                        <span className="drag-indicator">⋮⋮</span>
                        <button
                          type="button"
                          className="btn-remove"
                          onClick={() => handleRemoveCurrent(idx)}
                        >
                          X
                        </button>
                        {idx === 0 && <span className="principal-badge">Principal</span>}
                        <span className="position-badge">{idx + 1}</span>
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
                      <div 
                        key={`pending-${idx}`} 
                        className={`image-item pending
                          ${draggedIndex === idx && dragSource === 'pending' ? 'dragging' : ''} 
                          ${dragOverIndex === idx && dragSource === 'pending' ? 'drag-over' : ''}`
                        }
                        draggable
                        onDragStart={() => handleDragStart(idx, 'pending')}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, idx, 'pending')}
                        onDragEnd={handleDragEnd}
                      >
                        <img src={url} alt={`Nueva ${idx + 1}`} draggable={false} />
                        <span className="drag-indicator">⋮⋮</span>
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
              >
                {pendingImages.length > 0 ? `Confirmar (${pendingImages.length})` : 'Listo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}