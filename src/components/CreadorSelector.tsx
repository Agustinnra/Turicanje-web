// components/CreadorSelector.tsx
// Componente para seleccionar o crear un creador en el formulario de comercio

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import './CreadorSelector.css';

interface Creador {
  id: number;
  username: string;
  nombre: string;
  titulo?: string;
  foto_perfil?: string;
  foto_portada?: string;
  redes_sociales?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    tiktok?: string;
    web?: string;
  };
}

interface CreadorSelectorProps {
  value: number | null;
  onChange: (creadorId: number | null) => void;
  apiUrl?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function CreadorSelector({ value, onChange, apiUrl = API_URL }: CreadorSelectorProps) {
  const [creadores, setCreadores] = useState<Creador[]>([]);
  const [selectedCreador, setSelectedCreador] = useState<Creador | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estado para nuevo creador
  const [nuevoCreador, setNuevoCreador] = useState({
    username: '',
    nombre: '',
    titulo: '',
    bio: '',
    redes_sociales: {
      instagram: '',
      facebook: '',
      youtube: '',
      tiktok: '',
      web: ''
    }
  });
  const [fotoPerfil, setFotoPerfil] = useState<File | null>(null);
  const [fotoPortada, setFotoPortada] = useState<File | null>(null);
  const [fotoPerfilPreview, setFotoPerfilPreview] = useState<string | null>(null);
  const [fotoPortadaPreview, setFotoPortadaPreview] = useState<string | null>(null);

  // Manejar selección de foto de perfil
  const handleFotoPerfilChange = (file: File | null) => {
    setFotoPerfil(file);
    if (file) {
      setFotoPerfilPreview(URL.createObjectURL(file));
    } else {
      setFotoPerfilPreview(null);
    }
  };

  // Manejar selección de foto de portada
  const handleFotoPortadaChange = (file: File | null) => {
    setFotoPortada(file);
    if (file) {
      setFotoPortadaPreview(URL.createObjectURL(file));
    } else {
      setFotoPortadaPreview(null);
    }
  };

  // Cargar creador seleccionado si hay un value
  useEffect(() => {
    if (value) {
      fetch(`${apiUrl}/api/creadores/${value}`)
        .then(res => res.json())
        .then(data => setSelectedCreador(data))
        .catch(err => console.error('Error cargando creador:', err));
    }
  }, [value, apiUrl]);

  // Buscar creadores
  useEffect(() => {
    if (searchTerm.length >= 2) {
      setLoading(true);
      fetch(`${apiUrl}/api/creadores/search?q=${encodeURIComponent(searchTerm)}`)
        .then(res => res.json())
        .then(data => {
          setCreadores(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error buscando creadores:', err);
          setLoading(false);
        });
    } else {
      setCreadores([]);
    }
  }, [searchTerm, apiUrl]);

  // Seleccionar creador
  const handleSelect = (creador: Creador) => {
    setSelectedCreador(creador);
    onChange(creador.id);
    setShowDropdown(false);
    setSearchTerm('');
  };

  // Quitar creador
  const handleRemove = () => {
    setSelectedCreador(null);
    onChange(null);
  };

  // Crear nuevo creador
  const handleCreateCreador = async () => {
    if (!nuevoCreador.username || !nuevoCreador.nombre) {
      alert('Username y nombre son requeridos');
      return;
    }

    try {
      setLoading(true);

      // 1. Crear el creador
      const response = await fetch(`${apiUrl}/api/creadores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuevoCreador,
          redes_sociales: Object.fromEntries(
            Object.entries(nuevoCreador.redes_sociales).filter(([_, v]) => v)
          )
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error creando creador');
      }

      const creadorCreado = await response.json();

      // 2. Subir foto de perfil si existe
      if (fotoPerfil) {
        const formData = new FormData();
        formData.append('imagen', fotoPerfil);
        formData.append('tipo', 'perfil');
        
        await fetch(`${apiUrl}/api/creadores/${creadorCreado.id}/imagen`, {
          method: 'POST',
          body: formData
        });
      }

      // 3. Subir foto de portada si existe
      if (fotoPortada) {
        const formData = new FormData();
        formData.append('imagen', fotoPortada);
        formData.append('tipo', 'portada');
        
        await fetch(`${apiUrl}/api/creadores/${creadorCreado.id}/imagen`, {
          method: 'POST',
          body: formData
        });
      }

      // 4. Recargar el creador con las imágenes
      const creadorFinal = await fetch(`${apiUrl}/api/creadores/${creadorCreado.id}`)
        .then(res => res.json());

      // 5. Seleccionarlo
      handleSelect(creadorFinal);
      setShowModal(false);
      
      // Limpiar formulario
      setNuevoCreador({
        username: '',
        nombre: '',
        titulo: '',
        bio: '',
        redes_sociales: { instagram: '', facebook: '', youtube: '', tiktok: '', web: '' }
      });
      setFotoPerfil(null);
      setFotoPortada(null);
      setFotoPerfilPreview(null);
      setFotoPortadaPreview(null);

    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="creador-selector">
      <label className="selector-label">
        👤 Creador / Recomendado por
      </label>

      {/* Creador seleccionado */}
      {selectedCreador ? (
        <div className="creador-selected">
          <div className="creador-info">
            {selectedCreador.foto_perfil ? (
              <img 
                src={selectedCreador.foto_perfil} 
                alt={selectedCreador.nombre}
                className="creador-avatar"
              />
            ) : (
              <div className="creador-avatar-placeholder">
                {selectedCreador.nombre.charAt(0)}
              </div>
            )}
            <div className="creador-details">
              <span className="creador-nombre">{selectedCreador.nombre}</span>
              <span className="creador-username">@{selectedCreador.username}</span>
            </div>
          </div>
          <div className="creador-actions">
            <button 
              type="button" 
              className="btn-change" 
              onClick={handleRemove}
              title="Cambiar creador"
            >
              🔄 Cambiar
            </button>
            <button 
              type="button" 
              className="btn-remove" 
              onClick={handleRemove}
              title="Quitar creador"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        /* Buscador */
        <div className="creador-search">
          <input
            type="text"
            placeholder="Buscar creador por nombre..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            className="search-input"
          />
          
          {/* Dropdown de resultados */}
          {showDropdown && searchTerm.length >= 2 && (
            <div className="search-dropdown">
              {loading ? (
                <div className="dropdown-loading">Buscando...</div>
              ) : creadores.length > 0 ? (
                creadores.map(creador => (
                  <div 
                    key={creador.id}
                    className="dropdown-item"
                    onClick={() => handleSelect(creador)}
                  >
                    {creador.foto_perfil ? (
                      <img src={creador.foto_perfil} alt="" className="dropdown-avatar" />
                    ) : (
                      <div className="dropdown-avatar-placeholder">
                        {creador.nombre.charAt(0)}
                      </div>
                    )}
                    <div className="dropdown-info">
                      <span className="dropdown-nombre">{creador.nombre}</span>
                      <span className="dropdown-username">@{creador.username}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="dropdown-empty">
                  No se encontraron creadores
                </div>
              )}
              
              {/* Botón crear nuevo */}
              <button 
                type="button"
                className="dropdown-create"
                onClick={() => {
                  setShowDropdown(false);
                  setShowModal(true);
                }}
              >
                ➕ Crear nuevo creador
              </button>
            </div>
          )}
          
          {/* Botón para crear si no hay búsqueda */}
          {!showDropdown && (
            <button 
              type="button"
              className="btn-create-new"
              onClick={() => setShowModal(true)}
            >
              ➕ Nuevo creador
            </button>
          )}
        </div>
      )}

      {/* Modal para crear nuevo creador */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Crear nuevo creador</h3>
              <button type="button" className="modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              {/* Username */}
              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  placeholder="elarturito (sin @)"
                  value={nuevoCreador.username}
                  onChange={e => setNuevoCreador({
                    ...nuevoCreador,
                    username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                  })}
                />
                <small>URL: /profile/{nuevoCreador.username || 'username'}</small>
              </div>

              {/* Nombre */}
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  placeholder="El Arturito"
                  value={nuevoCreador.nombre}
                  onChange={e => setNuevoCreador({...nuevoCreador, nombre: e.target.value})}
                />
              </div>

              {/* Título */}
              <div className="form-group">
                <label>Título / Profesión</label>
                <input
                  type="text"
                  placeholder="Crítico gastronómico"
                  value={nuevoCreador.titulo}
                  onChange={e => setNuevoCreador({...nuevoCreador, titulo: e.target.value})}
                />
              </div>

              {/* Bio */}
              <div className="form-group">
                <label>Biografía</label>
                <textarea
                  placeholder="Breve descripción del creador..."
                  value={nuevoCreador.bio}
                  onChange={e => setNuevoCreador({...nuevoCreador, bio: e.target.value})}
                  rows={3}
                />
              </div>

              {/* Fotos */}
              <div className="form-row">
                <div className="form-group">
                  <label>Foto de perfil</label>
                  {fotoPerfilPreview && (
                    <div style={{ marginBottom: '8px', position: 'relative', display: 'inline-block' }}>
                      <img 
                        src={fotoPerfilPreview} 
                        alt="Preview perfil"
                        style={{ 
                          width: 80, 
                          height: 80, 
                          borderRadius: '50%', 
                          objectFit: 'cover',
                          border: '3px solid #d1007d'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => { setFotoPerfil(null); setFotoPerfilPreview(null); }}
                        style={{
                          position: 'absolute',
                          top: -5,
                          right: -5,
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: 22,
                          height: 22,
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >✕</button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleFotoPerfilChange(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="form-group">
                  <label>Foto de portada</label>
                  {fotoPortadaPreview && (
                    <div style={{ marginBottom: '8px', position: 'relative', display: 'inline-block' }}>
                      <img 
                        src={fotoPortadaPreview} 
                        alt="Preview portada"
                        style={{ 
                          width: 150, 
                          height: 60, 
                          borderRadius: '8px', 
                          objectFit: 'cover',
                          border: '3px solid #d1007d'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => { setFotoPortada(null); setFotoPortadaPreview(null); }}
                        style={{
                          position: 'absolute',
                          top: -5,
                          right: -5,
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: 22,
                          height: 22,
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >✕</button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleFotoPortadaChange(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              {/* Redes sociales */}
              <div className="form-section">
                <label className="section-label">Redes Sociales</label>
                
                <div className="form-group">
                  <label>📸 Instagram</label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/..."
                    value={nuevoCreador.redes_sociales.instagram}
                    onChange={e => setNuevoCreador({
                      ...nuevoCreador,
                      redes_sociales: {...nuevoCreador.redes_sociales, instagram: e.target.value}
                    })}
                  />
                </div>
                
                <div className="form-group">
                  <label>📘 Facebook</label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/..."
                    value={nuevoCreador.redes_sociales.facebook}
                    onChange={e => setNuevoCreador({
                      ...nuevoCreador,
                      redes_sociales: {...nuevoCreador.redes_sociales, facebook: e.target.value}
                    })}
                  />
                </div>
                
                <div className="form-group">
                  <label>▶️ YouTube</label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/@..."
                    value={nuevoCreador.redes_sociales.youtube}
                    onChange={e => setNuevoCreador({
                      ...nuevoCreador,
                      redes_sociales: {...nuevoCreador.redes_sociales, youtube: e.target.value}
                    })}
                  />
                </div>
                
                <div className="form-group">
                  <label>🎵 TikTok</label>
                  <input
                    type="url"
                    placeholder="https://tiktok.com/@..."
                    value={nuevoCreador.redes_sociales.tiktok}
                    onChange={e => setNuevoCreador({
                      ...nuevoCreador,
                      redes_sociales: {...nuevoCreador.redes_sociales, tiktok: e.target.value}
                    })}
                  />
                </div>
                
                <div className="form-group">
                  <label>🌐 Sitio web</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={nuevoCreador.redes_sociales.web}
                    onChange={e => setNuevoCreador({
                      ...nuevoCreador,
                      redes_sociales: {...nuevoCreador.redes_sociales, web: e.target.value}
                    })}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn-create"
                onClick={handleCreateCreador}
                disabled={loading}
              >
                {loading ? 'Creando...' : 'Crear creador'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}