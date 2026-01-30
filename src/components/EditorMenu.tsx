'use client';

import { useState, useEffect } from 'react';
import './editor-menu.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface MenuItem {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
  descripcion: string | null;
  disponible: boolean;
  imagen_fuente: string;
}

interface Props {
  placeId: string;
  modoAdmin?: boolean;
}

export default function EditorMenu({ placeId, modoAdmin = false }: Props) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  
  // Estado para edición
  const [editando, setEditando] = useState<number | null>(null);
  const [formEdit, setFormEdit] = useState({ nombre: '', precio: '', categoria: '', descripcion: '' });
  
  // Estado para agregar nuevo
  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const [formNuevo, setFormNuevo] = useState({ nombre: '', precio: '', categoria: '', descripcion: '' });
  const [guardando, setGuardando] = useState(false);

  // Cargar menú
  useEffect(() => {
    cargarMenu();
  }, [placeId]);

  const cargarMenu = async () => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = modoAdmin 
        ? `${API_URL}/api/menu/admin/${placeId}`
        : `${API_URL}/api/menu/mi-menu`;
      
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Error cargando menú:', error);
      mostrarMensaje('error', 'Error al cargar el menú');
    } finally {
      setLoading(false);
    }
  };

  const mostrarMensaje = (tipo: 'exito' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 3000);
  };

  // Agrupar por categoría
  const itemsPorCategoria = items.reduce((acc, item) => {
    const cat = item.categoria || 'Sin categoría';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Iniciar edición
  const iniciarEdicion = (item: MenuItem) => {
    setEditando(item.id);
    setFormEdit({
      nombre: item.nombre,
      precio: item.precio.toString(),
      categoria: item.categoria || '',
      descripcion: item.descripcion || ''
    });
  };

  // Cancelar edición
  const cancelarEdicion = () => {
    setEditando(null);
    setFormEdit({ nombre: '', precio: '', categoria: '', descripcion: '' });
  };

  // Guardar edición
  const guardarEdicion = async (id: number) => {
    try {
      setGuardando(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/menu/item/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: formEdit.nombre,
          precio: parseFloat(formEdit.precio),
          categoria: formEdit.categoria,
          descripcion: formEdit.descripcion || null
        })
      });
      
      if (response.ok) {
        mostrarMensaje('exito', 'Producto actualizado');
        cancelarEdicion();
        cargarMenu();
      } else {
        const data = await response.json();
        mostrarMensaje('error', data.error || 'Error al actualizar');
      }
    } catch (error) {
      mostrarMensaje('error', 'Error de conexión');
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar producto
  const eliminarProducto = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/menu/item/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        mostrarMensaje('exito', 'Producto eliminado');
        cargarMenu();
      } else {
        const data = await response.json();
        mostrarMensaje('error', data.error || 'Error al eliminar');
      }
    } catch (error) {
      mostrarMensaje('error', 'Error de conexión');
    }
  };

  // Cambiar disponibilidad
  const toggleDisponible = async (item: MenuItem) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/menu/item/${item.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ disponible: !item.disponible })
      });
      
      if (response.ok) {
        cargarMenu();
      }
    } catch (error) {
      mostrarMensaje('error', 'Error al actualizar');
    }
  };

  // Agregar nuevo producto
  const agregarProducto = async () => {
    if (!formNuevo.nombre || !formNuevo.precio) {
      mostrarMensaje('error', 'Nombre y precio son requeridos');
      return;
    }
    
    try {
      setGuardando(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/menu/item`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          placeId,
          nombre: formNuevo.nombre,
          precio: parseFloat(formNuevo.precio),
          categoria: formNuevo.categoria || 'general',
          descripcion: formNuevo.descripcion || null
        })
      });
      
      if (response.ok) {
        mostrarMensaje('exito', 'Producto agregado');
        setFormNuevo({ nombre: '', precio: '', categoria: '', descripcion: '' });
        setMostrarAgregar(false);
        cargarMenu();
      } else {
        const data = await response.json();
        mostrarMensaje('error', data.error || 'Error al agregar');
      }
    } catch (error) {
      mostrarMensaje('error', 'Error de conexión');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="editor-menu-loading">
        <div className="spinner"></div>
        <p>Cargando menú...</p>
      </div>
    );
  }

  return (
    <div className="editor-menu">
      {/* Header */}
      <div className="editor-menu-header">
        <div className="header-info">
          <h3>🍽️ Mi Menú</h3>
          <span className="badge-count">{items.length} productos</span>
        </div>
        <button 
          className="btn-agregar"
          onClick={() => setMostrarAgregar(!mostrarAgregar)}
        >
          {mostrarAgregar ? '✕ Cancelar' : '+ Agregar Producto'}
        </button>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`editor-mensaje ${mensaje.tipo}`}>
          {mensaje.tipo === 'exito' ? '✓' : '✕'} {mensaje.texto}
        </div>
      )}

      {/* Formulario agregar */}
      {mostrarAgregar && (
        <div className="form-agregar">
          <h4>Agregar Producto</h4>
          <div className="form-grid">
            <div className="campo">
              <label>Nombre *</label>
              <input
                type="text"
                value={formNuevo.nombre}
                onChange={(e) => setFormNuevo({ ...formNuevo, nombre: e.target.value })}
                placeholder="Ej: Hamburguesa Clásica"
              />
            </div>
            <div className="campo">
              <label>Precio *</label>
              <input
                type="number"
                value={formNuevo.precio}
                onChange={(e) => setFormNuevo({ ...formNuevo, precio: e.target.value })}
                placeholder="0.00"
                min="0"
                step="0.50"
              />
            </div>
            <div className="campo">
              <label>Categoría</label>
              <input
                type="text"
                value={formNuevo.categoria}
                onChange={(e) => setFormNuevo({ ...formNuevo, categoria: e.target.value })}
                placeholder="Ej: hamburguesas, bebidas"
              />
            </div>
            <div className="campo campo-full">
              <label>Descripción (opcional)</label>
              <input
                type="text"
                value={formNuevo.descripcion}
                onChange={(e) => setFormNuevo({ ...formNuevo, descripcion: e.target.value })}
                placeholder="Ingredientes o detalles"
              />
            </div>
          </div>
          <div className="form-actions">
            <button 
              className="btn-cancelar"
              onClick={() => {
                setMostrarAgregar(false);
                setFormNuevo({ nombre: '', precio: '', categoria: '', descripcion: '' });
              }}
            >
              Cancelar
            </button>
            <button 
              className="btn-guardar"
              onClick={agregarProducto}
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : '💾 Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* Lista vacía */}
      {items.length === 0 && (
        <div className="menu-vacio">
          <div className="icono">📋</div>
          <p>No hay productos en tu menú</p>
          <p className="hint">Sube fotos de tu menú en la sección de imágenes para extraer automáticamente los productos, o agrega productos manualmente.</p>
        </div>
      )}

      {/* Lista de productos por categoría */}
      {Object.entries(itemsPorCategoria).map(([categoria, productos]) => (
        <div key={categoria} className="categoria-grupo">
          <div className="categoria-header">
            <span className="categoria-nombre">{categoria}</span>
            <span className="categoria-count">{productos.length}</span>
          </div>
          
          <div className="productos-lista">
            {productos.map((item) => (
              <div 
                key={item.id} 
                className={`producto-item ${!item.disponible ? 'no-disponible' : ''}`}
              >
                {editando === item.id ? (
                  // Modo edición
                  <div className="producto-edicion">
                    <div className="edit-grid">
                      <input
                        type="text"
                        value={formEdit.nombre}
                        onChange={(e) => setFormEdit({ ...formEdit, nombre: e.target.value })}
                        placeholder="Nombre"
                      />
                      <input
                        type="number"
                        value={formEdit.precio}
                        onChange={(e) => setFormEdit({ ...formEdit, precio: e.target.value })}
                        placeholder="Precio"
                        min="0"
                        step="0.50"
                      />
                      <input
                        type="text"
                        value={formEdit.categoria}
                        onChange={(e) => setFormEdit({ ...formEdit, categoria: e.target.value })}
                        placeholder="Categoría"
                      />
                    </div>
                    <div className="edit-actions">
                      <button className="btn-cancelar-sm" onClick={cancelarEdicion}>
                        Cancelar
                      </button>
                      <button 
                        className="btn-guardar-sm" 
                        onClick={() => guardarEdicion(item.id)}
                        disabled={guardando}
                      >
                        {guardando ? '...' : '✓ Guardar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Modo vista
                  <>
                    <div className="producto-info">
                      <div className="producto-nombre">{item.nombre}</div>
                      {item.descripcion && (
                        <div className="producto-desc">{item.descripcion}</div>
                      )}
                    </div>
                    <div className="producto-precio">${Number(item.precio || 0).toFixed(2)}</div>
                    <div className="producto-acciones">
                      <button 
                        className={`btn-toggle ${item.disponible ? 'activo' : ''}`}
                        onClick={() => toggleDisponible(item)}
                        title={item.disponible ? 'Marcar como no disponible' : 'Marcar como disponible'}
                      >
                        {item.disponible ? '✓' : '✕'}
                      </button>
                      <button 
                        className="btn-editar"
                        onClick={() => iniciarEdicion(item)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-eliminar"
                        onClick={() => eliminarProducto(item.id, item.nombre)}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Nota sobre extracción automática */}
      {items.length > 0 && (
        <div className="nota-extraccion">
          <span className="nota-icono">💡</span>
          <span>Los productos se extraen automáticamente cuando subes fotos de tu menú. Puedes editarlos o agregar más manualmente.</span>
        </div>
      )}
    </div>
  );
}