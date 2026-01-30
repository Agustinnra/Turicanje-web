'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams} from 'next/navigation';
import './admin.css';
import GooglePlacesAutocomplete from '@/components/GooglePlacesAutocomplete';
import SolicitudesPendientes from './components/SolicitudesPendientes';
import TabClientes from './components/TabClientes';
import TabAnalyticsWeb from './components/TabAnalyticsWeb';



const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://turicanje-backend.onrender.com';

// ============================================================
// INTERFACES
// ============================================================
interface Negocio {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  is_active: boolean;
  cashback: boolean;
  afiliado: boolean;
  created_at: string;
}

interface Invitacion {
  id: number;
  codigo: string;
  place_id: string;
  negocio_nombre: string;
  email_invitado: string;
  nombre_invitado: string;
  telefono_invitado: string;
  usado: boolean;
  created_at: string;
  expires_at: string;
}

interface Usuario {
  id: number;
  nombre_contacto: string;
  email: string;
  role: string;
  place_id: string;
  activo: boolean;
  created_at: string;
  ultimo_acceso: string;
}

interface AnalyticsData {
  date: string;
  daily_active_users: number;
  new_users: number;
  returning_users: number;
  total_searches: number;
  total_clicks: number;
  search_to_click_rate: number;
  avg_session_duration_sec: number;
  avg_messages_per_session: number;
  avg_searches_per_user: number;
  pagination_usage_rate: number;
  retention_day1: number;
  retention_day7: number;
  avg_sessions_per_user: number;
  location_share_rate: number;
  goodbye_messages_sent: number;
  affiliate_clicks: number;
  cashback_place_clicks: number;
  top_craving: string;
  peak_hour: number;
  avg_results_per_search: number;
}

interface ConversacionRaw {
  id: string;
  event_type: string;
  timestamp: string;
  wa_id: string;
  session_id: string;
  raw_data: any;
}

interface ConversacionStats {
  usuarios_unicos: number;
  total_eventos: number;
  total_sesiones: number;
  eventos_por_tipo: { event_type: string; count: number }[];
  top_busquedas: { craving: string; count: number }[];
  top_clicks: { place_id: string; place_name: string; count: number }[];
  actividad_por_hora: { hora: number; count: number }[];
  actividad_por_dia: { fecha: string; eventos: number; usuarios: number; busquedas: number; clicks: number; sesiones: number }[];
}

interface EstadisticasReales {
  usuarios_unicos: number;
  busquedas: number;
  clicks: number;
  sesiones: number;
  conversion: string;
}

interface Stats {
  total: number;
  activos: number;
  porCategoria: { categoria: string; count: number }[];
  invitacionesPendientes: number;
  invitacionesUsadas: number;
  usuariosTotal: number;
  negociosUltimoMes: number;
  negociosCashback: number;
  negociosAfiliados: number;
}

interface Review {
  id: number;
  place_id: string;
  place_name?: string;
  user_nombre: string;
  user_email?: string;
  calificacion: number;
  comentario?: string;
  verificado: boolean;
  visible: boolean;
  created_at: string;
}

interface Creador {
  id: number;
  username: string;
  nombre: string;
  titulo?: string;
  bio?: string;
  foto_perfil?: string;
  foto_portada?: string;
  video_embed?: string;
  redes_sociales?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    tiktok?: string;
    twitter?: string;
    web?: string;
  };
  is_active: boolean;
  created_at: string;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function AdminPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'crear' | 'negocios' | 'invitaciones' | 'solicitudes' | 'analytics' | 'analyticsweb' | 'conversaciones' | 'usuarios' | 'reviews' | 'creadores' | 'clientes'>('analytics');

  // Estados para datos
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [conversaciones, setConversaciones] = useState<ConversacionRaw[]>([]);
  const [convStats, setConvStats] = useState<ConversacionStats | null>(null);
  const [statsReales, setStatsReales] = useState<EstadisticasReales | null>(null);
  const [solicitudesCount, setSolicitudesCount] = useState(0);
  const searchParams = useSearchParams();
  const [stats, setStats] = useState<Stats>({
    total: 0,
    activos: 0,
    porCategoria: [],
    invitacionesPendientes: 0,
    invitacionesUsadas: 0,
    usuariosTotal: 0,
    negociosUltimoMes: 0,
    negociosCashback: 0,
    negociosAfiliados: 0
  });
  
  // Estados para formularios
  const [nuevoNegocio, setNuevoNegocio] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    categoria: 'Restaurante',
    productos: '',
    email_propietario: '',
    latitud: null as number | null,
    longitud: null as number | null,
    neighborhood: '',
    city: '',
    state: '',
    country: '',
    postal_code: ''
  });
  
  const [invitacionForm, setInvitacionForm] = useState({
    place_id: '',
    email_invitado: '',
    nombre_invitado: '',
    telefono_invitado: '',
    metodo_envio: '' as '' | 'email' | 'whatsapp'
  });

  // Modal de conversación
  const [modalSesion, setModalSesion] = useState<{
    visible: boolean;
    sessionId: string | null;
    eventos: any[];
    waId: string;
  }>({ visible: false, sessionId: null, eventos: [], waId: '' });
  
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [creando, setCreando] = useState(false);
  const [mostrarPruebas, setMostrarPruebas] = useState(false);

  // Estados para reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [filtroComercioReviews, setFiltroComercioReviews] = useState('');

  // Estados para creadores
  const [creadores, setCreadores] = useState<Creador[]>([]);
  const [creadoresLoading, setCreadoresLoading] = useState(false);
  const [modalEditarCreador, setModalEditarCreador] = useState(false);
  const [creadorEditando, setCreadorEditando] = useState<Creador | null>(null);
  const [fotoPerfilFile, setFotoPerfilFile] = useState<File | null>(null);
  const [fotoPortadaFile, setFotoPortadaFile] = useState<File | null>(null);
  const [fotoPerfilPreview, setFotoPerfilPreview] = useState<string | null>(null);
  const [fotoPortadaPreview, setFotoPortadaPreview] = useState<string | null>(null);
  const [creadorForm, setCreadorForm] = useState({
    username: '',
    nombre: '',
    titulo: '',
    bio: '',
    video_embed: '',
    redes_sociales: {
      instagram: '',
      facebook: '',
      youtube: '',
      tiktok: '',
      twitter: '',
      web: ''
    }
  });

  // Modal crear usuario
  const [modalCrearUsuario, setModalCrearUsuario] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre_contacto: '',
    email: '',
    password: '',
    role: 'admin'
  });

  // Búsqueda de negocios
  const [busquedaNegocio, setBusquedaNegocio] = useState('');

  const isSuperAdmin = usuario?.role === 'super_admin';

  // Filtrar negocios por búsqueda
  const negociosFiltrados = negocios.filter(neg => {
    if (!busquedaNegocio.trim()) return true;
    const busqueda = busquedaNegocio.toLowerCase();
    return (
      neg.id.toLowerCase().includes(busqueda) ||
      neg.name.toLowerCase().includes(busqueda) ||
      neg.category?.toLowerCase().includes(busqueda) ||
      neg.address?.toLowerCase().includes(busqueda)
    );
  });

  // Función para exportar CSV
  const exportarCSV = async () => {
    try {
      setMensaje({ tipo: 'exito', texto: '📥 Generando CSV...' });
      
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Obtener todos los negocios con toda la info
      const res = await fetch(`${API_URL}/api/comercios/admin/negocios/exportar`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        // Si no existe el endpoint, usar los datos que ya tenemos
        const headers = ['ID', 'Nombre', 'Categoría', 'Dirección', 'Teléfono', 'Cashback', 'Afiliado', 'Activo', 'Creado'];
        const rows = negocios.map(neg => [
          neg.id,
          `"${(neg.name || '').replace(/"/g, '""')}"`,
          `"${(neg.category || '').replace(/"/g, '""')}"`,
          `"${(neg.address || '').replace(/"/g, '""')}"`,
          neg.phone || '',
          neg.cashback ? 'Sí' : 'No',
          neg.afiliado ? 'Sí' : 'No',
          neg.is_active ? 'Activo' : 'Inactivo',
          neg.created_at ? new Date(neg.created_at).toLocaleDateString('es-MX') : ''
        ]);
        
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        descargarCSV(csv, 'negocios_turicanje.csv');
        return;
      }
      
      const data = await res.json();
      descargarCSV(data.csv, 'negocios_turicanje_completo.csv');
      
    } catch (error) {
      console.error('Error exportando:', error);
      setMensaje({ tipo: 'error', texto: '❌ Error al exportar' });
    }
  };

  const descargarCSV = (contenido: string, nombreArchivo: string) => {
    const blob = new Blob(['\ufeff' + contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setMensaje({ tipo: 'exito', texto: '✅ CSV descargado' });
    setTimeout(() => setMensaje(null), 3000);
  };

  // ============================================================
  // CARGAR DATOS
  // ============================================================
  const cargarDatos = useCallback(async (token: string, role: string) => {
    try {
      // Negocios
      const negRes = await fetch(`${API_URL}/api/comercios/admin/negocios?limit=500`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (negRes.ok) {
        const data = await negRes.json();
        setNegocios(data.negocios || []);
      }

      // Invitaciones
      const invRes = await fetch(`${API_URL}/api/comercios/admin/invitaciones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (invRes.ok) {
        const data = await invRes.json();
        setInvitaciones(data.invitaciones || []);
      }

      // Estadísticas generales
      const statsRes = await fetch(`${API_URL}/api/comercios/admin/estadisticas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      // Analytics con stats reales
      const anaRes = await fetch(`${API_URL}/api/comercios/admin/analytics?dias=30&incluir_pruebas=${mostrarPruebas}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (anaRes.ok) {
        const data = await anaRes.json();
        setAnalytics(data.analytics || []);
        setStatsReales(data.estadisticas_reales || null);
      }

      // Conversaciones
      const convRes = await fetch(`${API_URL}/api/comercios/admin/conversaciones?limit=500&incluir_pruebas=${mostrarPruebas}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (convRes.ok) {
        const data = await convRes.json();
        setConversaciones(data.conversaciones || []);
      }

      // Stats de conversaciones
      const convStatsRes = await fetch(`${API_URL}/api/comercios/admin/conversaciones/stats?dias=30&incluir_pruebas=${mostrarPruebas}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (convStatsRes.ok) {
        const data = await convStatsRes.json();
        setConvStats(data);
      }

      // Solicitudes pendientes (conteo)
      const solRes = await fetch(`${API_URL}/api/comercios/admin/solicitudes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (solRes.ok) {
        const data = await solRes.json();
        setSolicitudesCount(data.solicitudes?.length || 0);
      }

      // Usuarios (solo super_admin)
      if (role === 'super_admin') {
        const usrRes = await fetch(`${API_URL}/api/comercios/super/usuarios`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (usrRes.ok) {
          const data = await usrRes.json();
          setUsuarios(data.usuarios || []);
        }
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  }, [mostrarPruebas]);

  useEffect(() => {
    const verificarAcceso = async () => {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }

      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) { localStorage.removeItem('token'); router.push('/login'); return; }

        const data = await res.json();
        if (!['admin', 'super_admin'].includes(data.usuario.role)) {
          router.push('/comercios/dashboard'); return;
        }

        setUsuario(data.usuario);
        await cargarDatos(token, data.usuario.role);
      } catch (error) {
        console.error('Error:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    verificarAcceso();
  }, [router, cargarDatos]);

  // Recargar al cambiar filtro de pruebas
  useEffect(() => {
    if (usuario) {
      const token = localStorage.getItem('token');
      if (token) cargarDatos(token, usuario.role);
    }
  }, [mostrarPruebas, usuario, cargarDatos]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'negocios') {
      setActiveTab('negocios');
    }
  }, [searchParams]);



  // ============================================================
  // FUNCIONES DE NEGOCIO
  // ============================================================
  const crearNegocio = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreando(true);
    setMensaje(null);
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/comercios/admin/crear-negocio`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoNegocio)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear negocio');

      setMensaje({ tipo: 'exito', texto: `✅ Negocio creado: ${data.negocio.name} (${data.negocio.id})` });
      setNuevoNegocio({ 
        nombre: '', 
        direccion: '', 
        telefono: '', 
        categoria: 'Restaurante', 
        productos: '', 
        email_propietario: '',
        latitud: null,
        longitud: null,
        neighborhood: '',
        city: '',
        state: '',
        country: '',
        postal_code: ''
      });
      await cargarDatos(token, usuario?.role || 'admin');
      setInvitacionForm(prev => ({ ...prev, place_id: data.negocio.id }));
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: `❌ ${error.message}` });
    } finally {
      setCreando(false);
    }
  };

  const crearInvitacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreando(true);
    setMensaje(null);
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/comercios/admin/crear-invitacion`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(invitacionForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear invitación');

      // Construir mensaje según si se envió o no
      let mensajeExito = `✅ Invitación creada: ${data.invitacion.codigo}`;
      if (data.envio?.success) {
        if (data.envio.method === 'email') {
          mensajeExito += `\n📧 Email enviado a: ${data.envio.to}`;
        } else if (data.envio.method === 'whatsapp') {
          mensajeExito += `\n📱 WhatsApp enviado a: ${data.envio.to}`;
        }
      } else if (data.envio && !data.envio.success) {
        mensajeExito += `\n⚠️ Error al enviar: ${data.envio.error}`;
      }
      mensajeExito += `\n🔗 Link: ${data.link_registro}`;

      setMensaje({ tipo: 'exito', texto: mensajeExito });
      setInvitacionForm({ place_id: '', email_invitado: '', nombre_invitado: '', telefono_invitado: '', metodo_envio: '' });
      await cargarDatos(token, usuario?.role || 'admin');
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: `❌ ${error.message}` });
    } finally {
      setCreando(false);
    }
  };

  const eliminarInvitacion = async (codigo: string) => {
    if (!confirm(`¿Eliminar invitación ${codigo}?`)) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/comercios/admin/invitacion/${codigo}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar');
      }
      setMensaje({ tipo: 'exito', texto: '✅ Invitación eliminada' });
      await cargarDatos(token, usuario?.role || 'admin');
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: `❌ ${error.message}` });
    }
  };

  const eliminarNegocio = async (negocioId: string, nombre: string) => {
    if (!confirm(`⚠️ ¿Estás seguro de ELIMINAR permanentemente el negocio "${nombre}" (${negocioId})?\n\nEsta acción no se puede deshacer.`)) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/comercios/admin/negocio/${negocioId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar negocio');
      }
      setMensaje({ tipo: 'exito', texto: `🗑️ Negocio "${nombre}" eliminado` });
      await cargarDatos(token, usuario?.role || 'admin');
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: `❌ ${error.message}` });
    }
  };

  const cambiarRolUsuario = async (usuarioId: number, nuevoRol: string) => {
    if (!confirm(`¿Cambiar rol a ${nuevoRol}?`)) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/comercios/super/usuario/${usuarioId}/rol`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevoRol })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al cambiar rol');
      }
      setMensaje({ tipo: 'exito', texto: '✅ Rol actualizado' });
      await cargarDatos(token, 'super_admin');
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: `❌ ${error.message}` });
    }
  };

  const toggleUsuarioActivo = async (usuarioId: number, activo: boolean) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/comercios/super/usuario/${usuarioId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !activo })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al actualizar');
      }
      setMensaje({ tipo: 'exito', texto: activo ? '🔴 Usuario desactivado' : '🟢 Usuario activado' });
      await cargarDatos(token, 'super_admin');
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: `❌ ${error.message}` });
    }
  };

  const crearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreando(true);
    setMensaje(null);
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/comercios/super/crear-admin`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoUsuario)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear usuario');

      setMensaje({ tipo: 'exito', texto: `✅ Usuario creado: ${data.usuario.email} (${data.usuario.role})` });
      setNuevoUsuario({ nombre_contacto: '', email: '', password: '', role: 'admin' });
      setModalCrearUsuario(false);
      await cargarDatos(token, 'super_admin');
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: `❌ ${error.message}` });
    } finally {
      setCreando(false);
    }
  };

  const eliminarUsuario = async (usuarioId: number, email: string) => {
    if (!confirm(`⚠️ ¿Estás seguro de ELIMINAR permanentemente al usuario ${email}?\n\nEsta acción no se puede deshacer.`)) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/comercios/super/usuario/${usuarioId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar');
      }
      setMensaje({ tipo: 'exito', texto: `🗑️ Usuario ${email} eliminado` });
      await cargarDatos(token, 'super_admin');
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: `❌ ${error.message}` });
    }
  };

  // ============================================================
  // FUNCIONES DE REVIEWS
  // ============================================================
  const cargarReviews = async () => {
    setReviewsLoading(true);
    try {
      // Cargar todos los reviews de todos los negocios
      const allReviews: Review[] = [];
      
      for (const negocio of negocios) {
        const res = await fetch(`${API_URL}/api/reviews/${negocio.id}`);
        if (res.ok) {
          const data = await res.json();
          const reviewsConNombre = (data.reviews || []).map((r: any) => ({
            ...r,
            place_id: negocio.id,
            place_name: negocio.name
          }));
          allReviews.push(...reviewsConNombre);
        }
      }
      
      // Ordenar por fecha más reciente
      allReviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setReviews(allReviews);
    } catch (error) {
      console.error('Error cargando reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const eliminarReview = async (reviewId: number) => {
    if (!confirm('⚠️ ¿Eliminar este comentario permanentemente?')) return;
    
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        setMensaje({ tipo: 'exito', texto: '🗑️ Comentario eliminado' });
        setReviews(reviews.filter(r => r.id !== reviewId));
      } else {
        throw new Error('Error al eliminar');
      }
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: `❌ ${error.message}` });
    }
  };

  // Reviews filtrados por comercio
  const reviewsFiltrados = filtroComercioReviews 
    ? reviews.filter(r => r.place_id === filtroComercioReviews)
    : reviews;

  // ============================================================
  // FUNCIONES DE CREADORES
  // ============================================================
  const cargarCreadores = async () => {
    setCreadoresLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/creadores`);
      if (res.ok) {
        const data = await res.json();
        setCreadores(data);
      }
    } catch (error) {
      console.error('Error cargando creadores:', error);
    } finally {
      setCreadoresLoading(false);
    }
  };

  const abrirEditarCreador = (creador: Creador) => {
    setCreadorEditando(creador);
    setFotoPerfilFile(null);
    setFotoPortadaFile(null);
    setFotoPerfilPreview(null);
    setFotoPortadaPreview(null);
    setCreadorForm({
      username: creador.username || '',
      nombre: creador.nombre || '',
      titulo: creador.titulo || '',
      bio: creador.bio || '',
      video_embed: creador.video_embed || '',
      redes_sociales: {
        instagram: creador.redes_sociales?.instagram || '',
        facebook: creador.redes_sociales?.facebook || '',
        youtube: creador.redes_sociales?.youtube || '',
        tiktok: creador.redes_sociales?.tiktok || '',
        twitter: creador.redes_sociales?.twitter || '',
        web: creador.redes_sociales?.web || ''
      }
    });
    setModalEditarCreador(true);
  };

  // Manejar cambio de foto de perfil
  const handleFotoPerfilChange = (file: File | null) => {
    setFotoPerfilFile(file);
    if (file) {
      setFotoPerfilPreview(URL.createObjectURL(file));
    } else {
      setFotoPerfilPreview(null);
    }
  };

  // Manejar cambio de foto de portada
  const handleFotoPortadaChange = (file: File | null) => {
    setFotoPortadaFile(file);
    if (file) {
      setFotoPortadaPreview(URL.createObjectURL(file));
    } else {
      setFotoPortadaPreview(null);
    }
  };

  const guardarCreador = async () => {
    if (!creadorEditando) return;
    
    const token = localStorage.getItem('token');
    
    try {
      // 1. Actualizar datos del creador
      const res = await fetch(`${API_URL}/api/creadores/${creadorEditando.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...creadorForm,
          redes_sociales: Object.fromEntries(
            Object.entries(creadorForm.redes_sociales).filter(([_, v]) => v)
          )
        })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al actualizar');
      }

      // 2. Subir foto de perfil si hay una nueva
      if (fotoPerfilFile) {
        const formData = new FormData();
        formData.append('imagen', fotoPerfilFile);
        formData.append('tipo', 'perfil');
        
        await fetch(`${API_URL}/api/creadores/${creadorEditando.id}/imagen`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
      }

      // 3. Subir foto de portada si hay una nueva
      if (fotoPortadaFile) {
        const formData = new FormData();
        formData.append('imagen', fotoPortadaFile);
        formData.append('tipo', 'portada');
        
        await fetch(`${API_URL}/api/creadores/${creadorEditando.id}/imagen`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
      }

      setMensaje({ tipo: 'exito', texto: '✅ Creador actualizado' });
      setModalEditarCreador(false);
      setFotoPerfilFile(null);
      setFotoPortadaFile(null);
      setFotoPerfilPreview(null);
      setFotoPortadaPreview(null);
      cargarCreadores();
      
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: `❌ ${error.message}` });
    }
  };

  const eliminarCreador = async (id: number, nombre: string) => {
    if (!confirm(`⚠️ ¿Eliminar al creador "${nombre}"?\n\nSus comercios asociados quedarán sin creador.`)) return;
    
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`${API_URL}/api/creadores/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        setMensaje({ tipo: 'exito', texto: '🗑️ Creador eliminado' });
        setCreadores(creadores.filter(c => c.id !== id));
      } else {
        throw new Error('Error al eliminar');
      }
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: `❌ ${error.message}` });
    }
  };

  const verSesion = async (sessionId: string, waId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/comercios/admin/conversacion/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setModalSesion({ visible: true, sessionId, eventos: data.eventos || [], waId });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const copiar = async (texto: string) => {
    try {
      // Intentar con la API moderna
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(texto);
      } else {
        // Fallback para HTTP o navegadores antiguos
        const textArea = document.createElement('textarea');
        textArea.value = texto;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setMensaje({ tipo: 'exito', texto: '📋 Copiado al portapapeles' });
      setTimeout(() => setMensaje(null), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
      setMensaje({ tipo: 'error', texto: '❌ No se pudo copiar' });
    }
  };

  // Generar mensaje de WhatsApp para invitación
  const generarMensajeWhatsApp = (inv: Invitacion) => {
    const linkRegistro = `${window.location.origin}/registro?codigo=${inv.codigo}`;
    const msg = `¡Hola${inv.nombre_invitado ? ` ${inv.nombre_invitado}` : ''}! 👋

Te invitamos a registrar tu negocio *${inv.negocio_nombre || ''}* en *Turicanje*.

🎟️ Tu código de invitación es: *${inv.codigo}*

📝 Regístrate aquí: ${linkRegistro}

Este código expira el ${new Date(inv.expires_at).toLocaleDateString('es-MX')}.

¿Tienes dudas? Contáctanos.`;
    return encodeURIComponent(msg);
  };

  const enviarWhatsApp = (inv: Invitacion, telefono?: string) => {
    const mensaje = generarMensajeWhatsApp(inv);
    const tel = telefono || inv.telefono_invitado || '';
    const url = tel 
      ? `https://wa.me/${tel.replace(/\D/g, '')}?text=${mensaje}`
      : `https://wa.me/?text=${mensaje}`;
    window.open(url, '_blank');
  };

  // ============================================================
  // HELPERS
  // ============================================================
  const formatPhone = (phone: string) => phone ? `***${phone.slice(-4)}` : 'N/A';
  
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-MX', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  const getEventIcon = (type: string) => {
    const icons: Record<string, string> = {
      'session_start': '🟢', 'search': '🔍', 'click': '👆', 
      'location': '📍', 'goodbye': '👋'
    };
    return icons[type] || '📝';
  };

  const getEventLabel = (type: string) => {
    const labels: Record<string, string> = {
      'session_start': 'Inicio sesión', 'search': 'Búsqueda', 'click': 'Click',
      'location': 'Ubicación', 'goodbye': 'Despedida'
    };
    return labels[type] || type;
  };

  // Agrupar conversaciones por sesión
  const sesionesPorUsuario = conversaciones.reduce((acc, conv) => {
    const key = conv.session_id;
    if (!acc[key]) {
      acc[key] = {
        session_id: conv.session_id,
        wa_id: conv.wa_id,
        eventos: [],
        primera: conv.timestamp,
        ultima: conv.timestamp,
        busquedas: [] as string[],
        clicks: [] as string[]
      };
    }
    acc[key].eventos.push(conv);
    if (new Date(conv.timestamp) < new Date(acc[key].primera)) acc[key].primera = conv.timestamp;
    if (new Date(conv.timestamp) > new Date(acc[key].ultima)) acc[key].ultima = conv.timestamp;
    if (conv.event_type === 'search' && conv.raw_data?.craving) {
      acc[key].busquedas.push(conv.raw_data.craving);
    }
    if (conv.event_type === 'click' && conv.raw_data?.place_name) {
      acc[key].clicks.push(conv.raw_data.place_name);
    }
    return acc;
  }, {} as Record<string, any>);

  const sesionesArray = Object.values(sesionesPorUsuario).sort((a: any, b: any) => 
    new Date(b.ultima).getTime() - new Date(a.ultima).getTime()
  );

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Verificando acceso...</p>
      </div>
    );
  }

  const categorias = [
    'Restaurante', 'Cafetería', 'Bar', 'Taquería', 'Pizzería',
    'Marisquería', 'Comida Callejera', 'Dark Kitchen', 'Panadería', 'Otro'
  ];

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="admin-container">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <h1>🛠️ Panel de Administración</h1>
          <span className={`admin-role-badge ${isSuperAdmin ? 'super' : ''}`}>
            {isSuperAdmin ? '👑 Super Admin' : '🔧 Admin'}
          </span>
        </div>
        <div className="admin-header-right">
          <label className="toggle-pruebas">
            <input 
              type="checkbox" 
              checked={mostrarPruebas} 
              onChange={(e) => setMostrarPruebas(e.target.checked)} 
            />
            <span>Incluir pruebas</span>
          </label>
          <span className="admin-user">{usuario?.email}</span>
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('usuario');
              router.push('/login');
            }} 
            className="btn-logout"
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Stats principales */}
      <div className="admin-stats">
        <div className="stat-card">
          <span className="stat-icon">🏪</span>
          <div className="stat-info">
            <span className="stat-value">{stats.total || negocios.length}</span>
            <span className="stat-label">Negocios Total</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <div className="stat-info">
            <span className="stat-value">{stats.activos || negocios.filter(n => n.is_active).length}</span>
            <span className="stat-label">Activos</span>
          </div>
        </div>
        <div className="stat-card highlight">
          <span className="stat-icon">👥</span>
          <div className="stat-info">
            <span className="stat-value">{statsReales?.usuarios_unicos || 0}</span>
            <span className="stat-label">Usuarios Reales</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🔍</span>
          <div className="stat-info">
            <span className="stat-value">{statsReales?.busquedas || 0}</span>
            <span className="stat-label">Búsquedas</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📈</span>
          <div className="stat-info">
            <span className="stat-value">{statsReales?.conversion || '0'}%</span>
            <span className="stat-label">Conversión</span>
          </div>
        </div>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`admin-mensaje ${mensaje.tipo}`}>
          <pre>{mensaje.texto}</pre>
          <button onClick={() => setMensaje(null)}>✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs">
        <button className={`tab ${activeTab === 'crear' ? 'active' : ''}`} onClick={() => setActiveTab('crear')}>
          ➕ Crear
        </button>
        <button className={`tab ${activeTab === 'negocios' ? 'active' : ''}`} onClick={() => setActiveTab('negocios')}>
          🏪 Negocios ({negocios.length})
        </button>
        <button className={`tab ${activeTab === 'invitaciones' ? 'active' : ''}`} onClick={() => setActiveTab('invitaciones')}>
          📨 Invitaciones ({invitaciones.length})
        </button>
        <button className={`tab ${activeTab === 'solicitudes' ? 'active' : ''}`} onClick={() => setActiveTab('solicitudes')}>
          📋 Solicitudes {solicitudesCount > 0 && <span className="tab-badge">{solicitudesCount}</span>}
        </button>
        <button className={`tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          📊 Analíticas
        </button>
        <button className={`tab ${activeTab === 'conversaciones' ? 'active' : ''}`} onClick={() => setActiveTab('conversaciones')}>
          💬 Conversaciones ({sesionesArray.length})
        </button>
        {isSuperAdmin && (
          <button className={`tab super ${activeTab === 'usuarios' ? 'active' : ''}`} onClick={() => setActiveTab('usuarios')}>
            👥 Usuarios ({usuarios.length})
          </button>
        )}
        <button className={`tab ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => { setActiveTab('reviews'); if (reviews.length === 0) cargarReviews(); }}>
          ⭐ Reviews
        </button>
        <button className={`tab ${activeTab === 'creadores' ? 'active' : ''}`} onClick={() => { setActiveTab('creadores'); if (creadores.length === 0) cargarCreadores(); }}>
          👤 Creadores
        </button>
        <button className={`tab ${activeTab === 'clientes' ? 'active' : ''}`} onClick={() => setActiveTab('clientes')}>
          💳 Clientes
        </button>
        <button className={`tab ${activeTab === 'analyticsweb' ? 'active' : ''}`} onClick={() => setActiveTab('analyticsweb')}>
        🌐 Analytics Web
        </button>
      </div>

      {/* Contenido */}
      <div className="admin-content">
        
        {/* ============================================================
            TAB: Crear Negocio e Invitación
            ============================================================ */}
        {activeTab === 'crear' && (
          <div className="admin-section">
            <h2>➕ Crear Nuevo Negocio</h2>
            <form onSubmit={crearNegocio} className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre del Negocio *</label>
                  <input
                    type="text"
                    value={nuevoNegocio.nombre}
                    onChange={(e) => setNuevoNegocio({...nuevoNegocio, nombre: e.target.value})}
                    placeholder="Ej: Tacos El Güero"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Categoría *</label>
                  <select
                    value={nuevoNegocio.categoria}
                    onChange={(e) => setNuevoNegocio({...nuevoNegocio, categoria: e.target.value})}
                    required
                  >
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Dirección *</label>
                <GooglePlacesAutocomplete
                  onPlaceSelected={(place) => {
                    console.log('📍 Lugar seleccionado:', place);
                    setNuevoNegocio({
                      ...nuevoNegocio,
                      direccion: place.address,
                      latitud: place.lat,
                      longitud: place.lng,
                      neighborhood: place.neighborhood || '',
                      city: place.city || '',
                      state: place.state || '',
                      country: place.country || '',
                      postal_code: place.postal_code || ''
                    });
                  }}
                  defaultValue={nuevoNegocio.direccion}
                  placeholder="Escribe la dirección y selecciona de la lista"
                />
              </div>

              <div className="form-group">
                <label>Productos / Especialidades (opcional)</label>
                <input
                  type="text"
                  value={nuevoNegocio.productos || ''}
                  onChange={(e) => setNuevoNegocio({...nuevoNegocio, productos: e.target.value})}
                  placeholder="tacos, quesadillas, tortas (separados por coma)"
                />
                <small className="form-help">Separar con comas. Se pueden agregar más después.</small>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="tel"
                    value={nuevoNegocio.telefono}
                    onChange={(e) => setNuevoNegocio({...nuevoNegocio, telefono: e.target.value})}
                    placeholder="55 1234 5678"
                  />
                </div>
                <div className="form-group">
                  <label>Email del propietario (opcional)</label>
                  <input
                    type="email"
                    value={nuevoNegocio.email_propietario}
                    onChange={(e) => setNuevoNegocio({...nuevoNegocio, email_propietario: e.target.value})}
                    placeholder="propietario@email.com"
                  />
                </div>
              </div>
              
              <button type="submit" className="btn-primary" disabled={creando}>
                {creando ? '⏳ Creando...' : '🏪 Crear Negocio'}
              </button>
            </form>

            <div className="admin-divider">
              <span>Después de crear el negocio, genera una invitación</span>
            </div>

            <h2>📨 Generar Invitación</h2>
            <form onSubmit={crearInvitacion} className="admin-form">
              <div className="form-group">
                <label>Seleccionar Negocio *</label>
                <select
                  value={invitacionForm.place_id}
                  onChange={(e) => setInvitacionForm({...invitacionForm, place_id: e.target.value})}
                  required
                >
                  <option value="">-- Selecciona un negocio --</option>
                  {negocios.map(neg => (
                    <option key={neg.id} value={neg.id}>
                      {neg.name} ({neg.id})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Nombre del invitado</label>
                <input
                  type="text"
                  value={invitacionForm.nombre_invitado}
                  onChange={(e) => setInvitacionForm({...invitacionForm, nombre_invitado: e.target.value})}
                  placeholder="Juan Pérez"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email del invitado {invitacionForm.metodo_envio === 'email' && '*'}</label>
                  <input
                    type="email"
                    value={invitacionForm.email_invitado}
                    onChange={(e) => setInvitacionForm({...invitacionForm, email_invitado: e.target.value})}
                    placeholder="juan@email.com"
                    required={invitacionForm.metodo_envio === 'email'}
                  />
                </div>
                <div className="form-group">
                  <label>WhatsApp del invitado {invitacionForm.metodo_envio === 'whatsapp' && '*'}</label>
                  <input
                    type="tel"
                    value={invitacionForm.telefono_invitado}
                    onChange={(e) => setInvitacionForm({...invitacionForm, telefono_invitado: e.target.value})}
                    placeholder="5512345678"
                    required={invitacionForm.metodo_envio === 'whatsapp'}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>¿Cómo enviar la invitación?</label>
                <div className="envio-options">
                  <label className={`envio-option ${invitacionForm.metodo_envio === '' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="metodo_envio"
                      value=""
                      checked={invitacionForm.metodo_envio === ''}
                      onChange={() => setInvitacionForm({...invitacionForm, metodo_envio: ''})}
                    />
                    <span className="envio-icon">📋</span>
                    <span className="envio-text">Solo generar código</span>
                  </label>
                  <label className={`envio-option ${invitacionForm.metodo_envio === 'email' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="metodo_envio"
                      value="email"
                      checked={invitacionForm.metodo_envio === 'email'}
                      onChange={() => setInvitacionForm({...invitacionForm, metodo_envio: 'email'})}
                    />
                    <span className="envio-icon">📧</span>
                    <span className="envio-text">Enviar por Email</span>
                  </label>
                  <label className={`envio-option ${invitacionForm.metodo_envio === 'whatsapp' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="metodo_envio"
                      value="whatsapp"
                      checked={invitacionForm.metodo_envio === 'whatsapp'}
                      onChange={() => setInvitacionForm({...invitacionForm, metodo_envio: 'whatsapp'})}
                    />
                    <span className="envio-icon">📱</span>
                    <span className="envio-text">Enviar por WhatsApp</span>
                  </label>
                </div>
              </div>
              
              <button type="submit" className="btn-secondary" disabled={creando || !invitacionForm.place_id}>
                {creando ? '⏳ Generando...' : invitacionForm.metodo_envio ? `📨 Generar y Enviar por ${invitacionForm.metodo_envio === 'email' ? 'Email' : 'WhatsApp'}` : '📋 Generar Código'}
              </button>
            </form>
          </div>
        )}

        {/* ============================================================
            TAB: Negocios
            ============================================================ */}
        {activeTab === 'negocios' && (
          <div className="admin-section">
            <div className="section-header-with-actions">
              <h2>🏪 Negocios Registrados ({negociosFiltrados.length} de {negocios.length})</h2>
              <div className="header-actions">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="🔍 Buscar por ID, nombre, categoría..."
                    value={busquedaNegocio}
                    onChange={(e) => setBusquedaNegocio(e.target.value)}
                    className="search-input"
                  />
                  {busquedaNegocio && (
                    <button 
                      className="btn-clear-search"
                      onClick={() => setBusquedaNegocio('')}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button className="btn-export" onClick={exportarCSV}>
                  📥 Exportar CSV
                </button>
              </div>
            </div>
            {negociosFiltrados.length === 0 ? (
              <p className="empty-state">
                {busquedaNegocio ? `No se encontraron negocios con "${busquedaNegocio}"` : 'No hay negocios registrados aún'}
              </p>
            ) : (
              <div className="table-container table-scroll-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Categoría</th>
                      <th>Dirección</th>
                      <th>Cashback</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {negociosFiltrados.map(neg => (
                      <tr key={neg.id}>
                        <td><code className="id-code">{neg.id}</code></td>
                        <td><strong>{neg.name}</strong></td>
                        <td>{neg.category}</td>
                        <td className="truncate">{neg.address}</td>
                        <td>{neg.cashback ? '💰 Sí' : '-'}</td>
                        <td>
                          <span className={`status-badge ${neg.is_active ? 'active' : 'inactive'}`}>
                            {neg.is_active ? '✅ Activo' : '❌ Inactivo'}
                          </span>
                        </td>
                        <td className="acciones-cell acciones-negocios">
                          <button 
                            className="btn-small btn-edit"
                            onClick={() => router.push(`/admin/negocio/${neg.id}`)}
                          >
                            ✏️ Editar
                          </button>
                          <button 
                            className="btn-small btn-invite"
                            onClick={() => {
                              setInvitacionForm({...invitacionForm, place_id: neg.id});
                              setActiveTab('crear');
                            }}
                          >
                            📨 Invitar
                          </button>
                          <button 
                            className="btn-small btn-delete"
                            onClick={() => eliminarNegocio(neg.id, neg.name)}
                            title="Eliminar negocio permanentemente"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            TAB: Invitaciones
            ============================================================ */}
        {activeTab === 'invitaciones' && (
          <div className="admin-section">
            <h2>📨 Invitaciones ({invitaciones.length})</h2>
            {invitaciones.length === 0 ? (
              <p className="empty-state">No hay invitaciones generadas</p>
            ) : (
              <div className="invitaciones-grid">
                {invitaciones.map(inv => (
                  <div key={inv.id} className={`invitacion-card ${inv.usado ? 'usada' : ''}`}>
                    <div className="invitacion-header">
                      <span className={`invitacion-status ${inv.usado ? 'usada' : 'pendiente'}`}>
                        {inv.usado ? '✅ Usada' : '⏳ Pendiente'}
                      </span>
                      {!inv.usado && (
                        <button className="btn-delete" onClick={() => eliminarInvitacion(inv.codigo)}>
                          🗑️
                        </button>
                      )}
                    </div>
                    
                    <div className="invitacion-codigo">
                      <code>{inv.codigo}</code>
                      {!inv.usado && (
                        <button className="btn-copy" onClick={() => copiar(inv.codigo)}>📋</button>
                      )}
                    </div>
                    
                    <div className="invitacion-info">
                      <p><strong>Negocio:</strong> {inv.negocio_nombre || inv.place_id}</p>
                      {inv.nombre_invitado && <p><strong>Para:</strong> {inv.nombre_invitado}</p>}
                      {inv.email_invitado && <p><strong>Email:</strong> {inv.email_invitado}</p>}
                      <p className="invitacion-fecha">
                        Creada: {new Date(inv.created_at).toLocaleDateString('es-MX')}
                      </p>
                      {!inv.usado && (
                        <p className="invitacion-expira">
                          Expira: {new Date(inv.expires_at).toLocaleDateString('es-MX')}
                        </p>
                      )}
                    </div>
                    
                    {!inv.usado && (
                      <div className="invitacion-actions">
                        <button 
                          className="btn-action btn-copy-link"
                          onClick={() => copiar(`${window.location.origin}/registro?codigo=${inv.codigo}`)}
                        >
                          🔗 Copiar Link
                        </button>
                        <button 
                          className="btn-action btn-whatsapp"
                          onClick={() => enviarWhatsApp(inv)}
                        >
                          💬 WhatsApp
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            TAB: Solicitudes Pendientes
            ============================================================ */}
        {activeTab === 'solicitudes' && (
          <SolicitudesPendientes
            token={localStorage.getItem('token') || ''}
            apiUrl={API_URL}
            onMensaje={(texto, tipo) => setMensaje({ texto, tipo: tipo === 'success' ? 'exito' : 'error' })}
            onRefresh={() => {
              const token = localStorage.getItem('token');
              if (token && usuario?.role) {
                cargarDatos(token, usuario.role);
              }
            }}
          />
        )}

        {/* ============================================================
            TAB: Analytics
            ============================================================ */}
        {activeTab === 'analytics' && (
          <div className="admin-section">
            <h2>📊 Analíticas del Bot (Últimos 30 días)</h2>
            
            {convStats ? (
              <>
                {/* Resumen principal */}
                <div className="analytics-summary">
                  <div className="analytics-card">
                    <div className="analytics-icon">👥</div>
                    <div className="analytics-value">{convStats.usuarios_unicos}</div>
                    <div className="analytics-label">Usuarios Únicos</div>
                  </div>
                  <div className="analytics-card">
                    <div className="analytics-icon">💬</div>
                    <div className="analytics-value">{convStats.total_sesiones}</div>
                    <div className="analytics-label">Sesiones</div>
                  </div>
                  <div className="analytics-card">
                    <div className="analytics-icon">📝</div>
                    <div className="analytics-value">{convStats.total_eventos}</div>
                    <div className="analytics-label">Eventos Totales</div>
                  </div>
                  <div className="analytics-card">
                    <div className="analytics-icon">👆</div>
                    <div className="analytics-value">{statsReales?.clicks || 0}</div>
                    <div className="analytics-label">Clicks</div>
                  </div>
                </div>

                {/* Top búsquedas y clicks */}
                <div className="conv-stats-grid">
                  <div className="conv-stat-card">
                    <h3>🔍 Top Búsquedas</h3>
                    <div className="conv-stat-list">
                      {convStats.top_busquedas?.length > 0 ? (
                        convStats.top_busquedas.map((b, i) => (
                          <div key={i} className="conv-stat-item">
                            <span className="conv-stat-rank">#{i + 1}</span>
                            <span className="conv-stat-name">{b.craving}</span>
                            <span className="conv-stat-count">{b.count}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted">Sin búsquedas aún</p>
                      )}
                    </div>
                  </div>

                  <div className="conv-stat-card">
                    <h3>👆 Top Clicks</h3>
                    <div className="conv-stat-list">
                      {convStats.top_clicks?.length > 0 ? (
                        convStats.top_clicks.map((c, i) => (
                          <div key={i} className="conv-stat-item">
                            <span className="conv-stat-rank">#{i + 1}</span>
                            <span className="conv-stat-name">{c.place_name || c.place_id}</span>
                            <span className="conv-stat-count">{c.count}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted">Sin clicks aún</p>
                      )}
                    </div>
                  </div>

                  <div className="conv-stat-card">
                    <h3>📊 Eventos por Tipo</h3>
                    <div className="conv-stat-list">
                      {convStats.eventos_por_tipo?.map((e, i) => (
                        <div key={i} className="conv-stat-item">
                          <span className="conv-stat-rank">{getEventIcon(e.event_type)}</span>
                          <span className="conv-stat-name">{getEventLabel(e.event_type)}</span>
                          <span className="conv-stat-count">{e.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actividad por día */}
                <h3 style={{ marginTop: '24px' }}>📅 Actividad por Día</h3>
                <div className="table-container table-scroll-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Usuarios</th>
                        <th>Sesiones</th>
                        <th>Búsquedas</th>
                        <th>Clicks</th>
                        <th>Eventos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {convStats.actividad_por_dia?.map((d, i) => (
                        <tr key={i}>
                          <td>{new Date(d.fecha).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                          <td><strong>{d.usuarios}</strong></td>
                          <td>{d.sesiones}</td>
                          <td>{d.busquedas}</td>
                          <td>{d.clicks}</td>
                          <td className="text-muted">{d.eventos}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>📊 No hay datos de analíticas disponibles</p>
                <p className="text-muted">Los datos aparecerán cuando el bot tenga actividad</p>
              </div>
            )}

            {/* Categorías de negocios */}
            <h3 style={{ marginTop: '32px' }}>🏪 Negocios por Categoría</h3>
            <div className="category-stats">
              {stats.porCategoria && stats.porCategoria.length > 0 ? (
                stats.porCategoria.map((cat: any) => (
                  <div key={cat.categoria} className="category-bar">
                    <div className="category-name">{cat.categoria}</div>
                    <div className="category-bar-wrapper">
                      <div 
                        className="category-bar-fill" 
                        style={{ width: `${Math.max((cat.count / stats.total) * 100, 5)}%` }}
                      />
                    </div>
                    <div className="category-count">{cat.count}</div>
                  </div>
                ))
              ) : (
                <p className="text-muted">Sin datos de categorías</p>
              )}
            </div>
          </div>
        )}

        {/* ============================================================
            TAB: Analytics Web       // ← AGREGAR ESTO
            ============================================================ */}
        {activeTab === 'analyticsweb' && (
          <div className="admin-section">
            <TabAnalyticsWeb />
          </div>
        )}                           // ← FIN DE LO NUEVo

        {/* ============================================================
            TAB: Conversaciones
            ============================================================ */}
        {activeTab === 'conversaciones' && (
          <div className="admin-section">
            <h2>💬 Historial de Conversaciones</h2>
            <p className="text-muted" style={{ marginBottom: '16px' }}>
              {conversaciones.length} eventos en {sesionesArray.length} sesiones 
              {!mostrarPruebas && ' (excluyendo pruebas)'}
            </p>

            {sesionesArray.length === 0 ? (
              <p className="empty-state">No hay conversaciones registradas</p>
            ) : (
              <div className="table-container table-scroll-container" style={{ maxHeight: '600px' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Eventos</th>
                      <th>Búsquedas</th>
                      <th>Clicks</th>
                      <th>Última actividad</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sesionesArray.map((s: any) => (
                      <tr key={s.session_id}>
                        <td><code className="phone-code">{formatPhone(s.wa_id)}</code></td>
                        <td><strong>{s.eventos.length}</strong></td>
                        <td>
                          {s.busquedas.length > 0 ? (
                            <span className="tag">{s.busquedas[0]}</span>
                          ) : '-'}
                        </td>
                        <td>
                          {s.clicks.length > 0 ? (
                            <span className="tag tag-green">{s.clicks[0]}</span>
                          ) : '-'}
                        </td>
                        <td className="text-muted">{formatTime(s.ultima)}</td>
                        <td>
                          <button className="btn-small" onClick={() => verSesion(s.session_id, s.wa_id)}>
                            👁️ Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            TAB: Usuarios (Solo Super Admin)
            ============================================================ */}
        {activeTab === 'usuarios' && isSuperAdmin && (
          <div className="admin-section">
            <div className="section-header-with-button">
              <h2>👥 Gestión de Usuarios ({usuarios.length})</h2>
              <button 
                className="btn-primary"
                onClick={() => setModalCrearUsuario(true)}
              >
                ➕ Crear Usuario
              </button>
            </div>
            {usuarios.length === 0 ? (
              <p className="empty-state">No hay usuarios registrados</p>
            ) : (
              <div className="table-container table-scroll-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Negocio</th>
                      <th>Estado</th>
                      <th>Último acceso</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map(u => (
                      <tr key={u.id} className={!u.activo ? 'row-inactive' : ''}>
                        <td><code>#{u.id}</code></td>
                        <td><strong>{u.nombre_contacto || '-'}</strong></td>
                        <td>{u.email}</td>
                        <td>
                          <select
                            value={u.role}
                            onChange={(e) => cambiarRolUsuario(u.id, e.target.value)}
                            className="role-select"
                            disabled={u.id === usuario?.id}
                          >
                            <option value="usuario">👤 Usuario</option>
                            <option value="comercio">🏪 Comercio</option>
                            <option value="admin">🔧 Admin</option>
                            <option value="super_admin">👑 Super Admin</option>
                          </select>
                        </td>
                        <td>
                          {u.place_id ? (
                            <code className="id-code">{u.place_id}</code>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge ${u.activo ? 'active' : 'inactive'}`}>
                            {u.activo ? '🟢 Activo' : '🔴 Inactivo'}
                          </span>
                        </td>
                        <td className="text-muted">
                          {u.ultimo_acceso 
                            ? new Date(u.ultimo_acceso).toLocaleDateString('es-MX')
                            : 'Nunca'
                          }
                        </td>
                        <td className="acciones-cell">
                          {u.id !== usuario?.id && (
                            <>
                              <button
                                className={`btn-small ${u.activo ? 'btn-danger' : 'btn-success'}`}
                                onClick={() => toggleUsuarioActivo(u.id, u.activo)}
                              >
                                {u.activo ? '🔴 Desactivar' : '🟢 Activar'}
                              </button>
                              <button
                                className="btn-small btn-delete"
                                onClick={() => eliminarUsuario(u.id, u.email)}
                                title="Eliminar usuario permanentemente"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================
          MODAL: Detalle de Sesión
          ============================================================ */}
      {modalSesion.visible && (
        <div className="modal-overlay" onClick={() => setModalSesion({ visible: false, sessionId: null, eventos: [], waId: '' })}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💬 Detalle de Sesión</h2>
              <code className="modal-phone">{formatPhone(modalSesion.waId)}</code>
              <button className="modal-close" onClick={() => setModalSesion({ visible: false, sessionId: null, eventos: [], waId: '' })}>✕</button>
            </div>
            <div className="modal-body">
              <div className="timeline">
                {modalSesion.eventos.map((e, i) => (
                  <div key={i} className={`timeline-item ${e.tipo}`}>
                    <div className="timeline-icon">{getEventIcon(e.tipo)}</div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <strong>{getEventLabel(e.tipo)}</strong>
                        <span className="timeline-time">{formatTime(e.timestamp)}</span>
                      </div>
                      <div className="timeline-details">
                        {/* SESSION START */}
                        {e.tipo === 'session_start' && (
                          <p className="text-muted">Nueva conversación iniciada</p>
                        )}
                        
                        {/* LOCATION */}
                        {e.tipo === 'location' && (
                          <div className="detail-box location-box">
                            <p>📍 Ubicación compartida</p>
                            {e.datos?.lat && e.datos?.lng && (
                              <p className="text-muted">Lat: {e.datos.lat.toFixed(4)}, Lng: {e.datos.lng.toFixed(4)}</p>
                            )}
                          </div>
                        )}
                        
                        {/* SEARCH - Mejorado */}
                        {e.tipo === 'search' && (
                          <div className="detail-box search-box">
                            <div className="search-craving">
                              <span className="craving-label">🔍 Buscó:</span>
                              <span className="craving-value">"{e.datos?.craving}"</span>
                            </div>
                            <div className="search-stats">
                              <span className="stat-item">
                                📊 {e.datos?.results_count || 0} resultados
                              </span>
                              <span className="stat-item">
                                👁️ {e.datos?.shown_count || 0} mostrados
                              </span>
                              {e.datos?.had_location && (
                                <span className="stat-item stat-location">📍 Con ubicación</span>
                              )}
                            </div>
                            {e.datos?.expanded_terms && e.datos.expanded_terms.length > 1 && (
                              <p className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>
                                Términos: {e.datos.expanded_terms.join(', ')}
                              </p>
                            )}
                            <p className="text-muted" style={{ fontSize: '11px' }}>
                              {e.datos?.day_of_week} {e.datos?.hour}:00 hrs {e.datos?.is_weekend ? '(fin de semana)' : ''}
                            </p>
                          </div>
                        )}
                        
                        {/* CLICK - Mejorado */}
                        {e.tipo === 'click' && (
                          <div className="detail-box click-box">
                            <div className="click-place">
                              <span className="place-name">🏪 {e.datos?.place_name}</span>
                              <code className="place-id">{e.datos?.place_id}</code>
                            </div>
                            <div className="click-meta">
                              <span className="meta-item">{e.datos?.place_category}</span>
                              <span className="meta-item">Posición #{e.datos?.result_position}</span>
                              {e.datos?.distance_meters && (
                                <span className="meta-item">
                                  📍 {(e.datos.distance_meters / 1000).toFixed(1)} km
                                </span>
                              )}
                            </div>
                            <div className="click-badges">
                              {e.datos?.was_open && <span className="badge badge-green">✅ Abierto</span>}
                              {e.datos?.has_cashback && <span className="badge badge-gold">💰 Cashback</span>}
                              {e.datos?.is_affiliate && <span className="badge badge-blue">⭐ Afiliado</span>}
                              {e.datos?.has_delivery && <span className="badge badge-purple">🛵 Delivery</span>}
                            </div>
                            {e.datos?.search_craving && (
                              <p className="text-muted" style={{ fontSize: '12px', marginTop: '6px' }}>
                                Búsqueda original: "{e.datos.search_craving}"
                              </p>
                            )}
                          </div>
                        )}
                        
                        {/* PAGINATION */}
                        {e.tipo === 'pagination' && (
                          <div className="detail-box">
                            <p>📄 Solicitó más resultados</p>
                            {e.datos?.page && <p className="text-muted">Página {e.datos.page}</p>}
                          </div>
                        )}
                        
                        {/* GOODBYE */}
                        {e.tipo === 'goodbye' && (
                          <div className="detail-box goodbye-box">
                            <p>{e.datos?.clicked_link ? '✅ Hizo click en un negocio' : '❌ No hizo click en ningún negocio'}</p>
                            {e.datos?.session_duration_sec && (
                              <p className="text-muted">
                                Duración: {Math.floor(e.datos.session_duration_sec / 60)}m {e.datos.session_duration_sec % 60}s
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB: Reviews
          ============================================================ */}
      {activeTab === 'reviews' && (
        <div className="admin-section">
          <div className="section-header-with-button">
            <h2>⭐ Gestión de Reviews ({reviewsFiltrados.length})</h2>
            <button 
              className="btn-secondary"
              onClick={cargarReviews}
              disabled={reviewsLoading}
            >
              {reviewsLoading ? '⏳ Cargando...' : '🔄 Actualizar'}
            </button>
          </div>
          
          {/* Filtro por comercio */}
          <div className="filter-row" style={{ marginBottom: '1rem' }}>
            <label>Filtrar por comercio:</label>
            <select 
              value={filtroComercioReviews} 
              onChange={(e) => setFiltroComercioReviews(e.target.value)}
              style={{ marginLeft: '0.5rem', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
            >
              <option value="">Todos los comercios</option>
              {negocios.map(n => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </div>

          {reviewsLoading ? (
            <p className="empty-state">⏳ Cargando reviews...</p>
          ) : reviewsFiltrados.length === 0 ? (
            <p className="empty-state">No hay reviews {filtroComercioReviews ? 'para este comercio' : ''}</p>
          ) : (
            <div className="table-container table-scroll-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Comercio</th>
                    <th>Usuario</th>
                    <th>⭐</th>
                    <th>Comentario</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewsFiltrados.map(review => (
                    <tr key={review.id}>
                      <td>
                        <strong>{review.place_name}</strong>
                        <br />
                        <small style={{ color: '#888' }}>{review.place_id}</small>
                      </td>
                      <td>
                        {review.user_nombre}
                        {review.verificado && <span style={{ marginLeft: '4px', color: '#22c55e' }} title="Verificado">✓</span>}
                        {review.user_email && <><br /><small style={{ color: '#888' }}>{review.user_email}</small></>}
                      </td>
                      <td>
                        <span style={{ color: '#fbbf24', fontSize: '1.1rem' }}>
                          {'★'.repeat(review.calificacion)}{'☆'.repeat(5 - review.calificacion)}
                        </span>
                      </td>
                      <td style={{ maxWidth: '300px' }}>
                        {review.comentario ? (
                          <span style={{ 
                            display: 'block', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }} title={review.comentario}>
                            {review.comentario}
                          </span>
                        ) : (
                          <span style={{ color: '#999', fontStyle: 'italic' }}>Sin comentario</span>
                        )}
                      </td>
                      <td>
                        {new Date(review.created_at).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td>
                        <button
                          className="btn-danger btn-small"
                          onClick={() => eliminarReview(review.id)}
                          title="Eliminar review"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          TAB: Creadores
          ============================================================ */}
      {activeTab === 'creadores' && (
        <div className="admin-section">
          <div className="section-header-with-button">
            <h2>👤 Gestión de Creadores ({creadores.length})</h2>
            <button 
              className="btn-secondary"
              onClick={cargarCreadores}
              disabled={creadoresLoading}
            >
              {creadoresLoading ? '⏳ Cargando...' : '🔄 Actualizar'}
            </button>
          </div>

          {creadoresLoading ? (
            <p className="empty-state">⏳ Cargando creadores...</p>
          ) : creadores.length === 0 ? (
            <p className="empty-state">No hay creadores registrados</p>
          ) : (
            <div className="table-container table-scroll-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Nombre</th>
                    <th>Username</th>
                    <th>Título</th>
                    <th>Redes</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {creadores.map(creador => (
                    <tr key={creador.id}>
                      <td>
                        {creador.foto_perfil ? (
                          <img 
                            src={creador.foto_perfil} 
                            alt={creador.nombre}
                            style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #d4007a, #6b3fa0)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold'
                          }}>
                            {creador.nombre?.charAt(0) || '?'}
                          </div>
                        )}
                      </td>
                      <td><strong>{creador.nombre}</strong></td>
                      <td>@{creador.username}</td>
                      <td>{creador.titulo || <span style={{ color: '#999' }}>-</span>}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {creador.redes_sociales?.instagram && <span title="Instagram">📸</span>}
                          {creador.redes_sociales?.youtube && <span title="YouTube">▶️</span>}
                          {creador.redes_sociales?.tiktok && <span title="TikTok">🎵</span>}
                          {creador.redes_sociales?.facebook && <span title="Facebook">📘</span>}
                          {creador.redes_sociales?.twitter && <span title="X">🐦</span>}
                          {creador.redes_sociales?.web && <span title="Web">🌐</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn-small btn-edit"
                            onClick={() => abrirEditarCreador(creador)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <a
                            href={`/profile/${creador.username}`}
                            target="_blank"
                            className="btn-small"
                            title="Ver perfil"
                            style={{ textDecoration: 'none' }}
                          >
                            👁️
                          </a>
                          <button
                            className="btn-small btn-danger"
                            onClick={() => eliminarCreador(creador.id, creador.nombre)}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          TAB: Clientes (loyalty_users - programa de lealtad)
          ============================================================ */}
      {activeTab === 'clientes' && (
        <div className="admin-section">
          <div className="section-header-with-button">
            <h2>💳 Gestión de Clientes (Programa de Lealtad)</h2>
          </div>
          <p style={{ marginBottom: '1rem', color: '#666' }}>
            Administra los usuarios del programa de cashback y lealtad.
          </p>
          {/* Aquí se integrará el componente TabClientes */}
          <div className="tab-clientes-container">
            <TabClientes />
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: Editar Creador
          ============================================================ */}
      {modalEditarCreador && creadorEditando && (
        <div className="modal-overlay" onClick={() => setModalEditarCreador(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Editar Creador</h2>
              <button className="modal-close" onClick={() => setModalEditarCreador(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={creadorForm.username}
                  onChange={e => setCreadorForm({...creadorForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})}
                  placeholder="username"
                />
              </div>
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={creadorForm.nombre}
                  onChange={e => setCreadorForm({...creadorForm, nombre: e.target.value})}
                  placeholder="Nombre completo"
                />
              </div>
              <div className="form-group">
                <label>Título / Profesión</label>
                <input
                  type="text"
                  value={creadorForm.titulo}
                  onChange={e => setCreadorForm({...creadorForm, titulo: e.target.value})}
                  placeholder="Food Blogger, Crítico, etc."
                />
              </div>

              {/* Sección de Fotos */}
              <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem', color: '#6b3fa0' }}>📷 Fotos</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Foto de Perfil</label>
                  {/* Preview de nueva foto o foto actual */}
                  {(fotoPerfilPreview || creadorEditando?.foto_perfil) && (
                    <div style={{ marginBottom: '8px', position: 'relative', display: 'inline-block' }}>
                      <img 
                        src={fotoPerfilPreview || creadorEditando?.foto_perfil || ''} 
                        alt="Perfil"
                        style={{ 
                          width: 80, 
                          height: 80, 
                          borderRadius: '50%', 
                          objectFit: 'cover',
                          border: fotoPerfilPreview ? '3px solid #22c55e' : '2px solid #ddd'
                        }}
                      />
                      <span style={{ 
                        display: 'block', 
                        fontSize: '11px', 
                        color: fotoPerfilPreview ? '#22c55e' : '#666',
                        marginTop: '4px'
                      }}>
                        {fotoPerfilPreview ? '✓ Nueva' : 'Actual'}
                      </span>
                      {fotoPerfilPreview && (
                        <button
                          type="button"
                          onClick={() => { setFotoPerfilFile(null); setFotoPerfilPreview(null); }}
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
                      )}
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleFotoPerfilChange(e.target.files?.[0] || null)}
                    style={{ fontSize: '14px' }}
                  />
                </div>
                
                <div className="form-group">
                  <label>Foto de Portada</label>
                  {/* Preview de nueva foto o foto actual */}
                  {(fotoPortadaPreview || creadorEditando?.foto_portada) && (
                    <div style={{ marginBottom: '8px', position: 'relative', display: 'inline-block' }}>
                      <img 
                        src={fotoPortadaPreview || creadorEditando?.foto_portada || ''} 
                        alt="Portada"
                        style={{ 
                          width: 150, 
                          height: 60, 
                          borderRadius: '8px', 
                          objectFit: 'cover',
                          border: fotoPortadaPreview ? '3px solid #22c55e' : '2px solid #ddd'
                        }}
                      />
                      <span style={{ 
                        display: 'block', 
                        fontSize: '11px', 
                        color: fotoPortadaPreview ? '#22c55e' : '#666',
                        marginTop: '4px'
                      }}>
                        {fotoPortadaPreview ? '✓ Nueva' : 'Actual'}
                      </span>
                      {fotoPortadaPreview && (
                        <button
                          type="button"
                          onClick={() => { setFotoPortadaFile(null); setFotoPortadaPreview(null); }}
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
                      )}
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleFotoPortadaChange(e.target.files?.[0] || null)}
                    style={{ fontSize: '14px' }}
                  />
                </div>
              </div>

              {/* Video Embed */}
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>🎬 Video Destacado</label>
                <input
                  type="url"
                  value={creadorForm.video_embed}
                  onChange={e => setCreadorForm({...creadorForm, video_embed: e.target.value})}
                  placeholder="https://..."
                />
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Link de video (YouTube, TikTok, Instagram, Vimeo, etc.)
                </small>
              </div>

              <div className="form-group">
                <label>Biografía</label>
                <textarea
                  value={creadorForm.bio}
                  onChange={e => setCreadorForm({...creadorForm, bio: e.target.value})}
                  placeholder="Descripción del creador..."
                  rows={3}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '8px', 
                    border: '1px solid #ddd',
                    backgroundColor: '#fff',
                    color: '#333',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem', color: '#6b3fa0' }}>Redes Sociales</h4>
              
              <div className="form-group">
                <label>📸 Instagram</label>
                <input
                  type="url"
                  value={creadorForm.redes_sociales.instagram}
                  onChange={e => setCreadorForm({
                    ...creadorForm,
                    redes_sociales: {...creadorForm.redes_sociales, instagram: e.target.value}
                  })}
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div className="form-group">
                <label>▶️ YouTube</label>
                <input
                  type="url"
                  value={creadorForm.redes_sociales.youtube}
                  onChange={e => setCreadorForm({
                    ...creadorForm,
                    redes_sociales: {...creadorForm.redes_sociales, youtube: e.target.value}
                  })}
                  placeholder="https://youtube.com/@..."
                />
              </div>
              <div className="form-group">
                <label>🎵 TikTok</label>
                <input
                  type="url"
                  value={creadorForm.redes_sociales.tiktok}
                  onChange={e => setCreadorForm({
                    ...creadorForm,
                    redes_sociales: {...creadorForm.redes_sociales, tiktok: e.target.value}
                  })}
                  placeholder="https://tiktok.com/@..."
                />
              </div>
              <div className="form-group">
                <label>📘 Facebook</label>
                <input
                  type="url"
                  value={creadorForm.redes_sociales.facebook}
                  onChange={e => setCreadorForm({
                    ...creadorForm,
                    redes_sociales: {...creadorForm.redes_sociales, facebook: e.target.value}
                  })}
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div className="form-group">
                <label>🐦 X (Twitter)</label>
                <input
                  type="url"
                  value={creadorForm.redes_sociales.twitter}
                  onChange={e => setCreadorForm({
                    ...creadorForm,
                    redes_sociales: {...creadorForm.redes_sociales, twitter: e.target.value}
                  })}
                  placeholder="https://x.com/..."
                />
              </div>
              <div className="form-group">
                <label>🌐 Sitio Web</label>
                <input
                  type="url"
                  value={creadorForm.redes_sociales.web}
                  onChange={e => setCreadorForm({
                    ...creadorForm,
                    redes_sociales: {...creadorForm.redes_sociales, web: e.target.value}
                  })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setModalEditarCreador(false)}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn-primary"
                onClick={guardarCreador}
              >
                💾 Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ============================================================
          MODAL: Crear Usuario
          ============================================================ */}
      {modalCrearUsuario && (
        <div className="modal-overlay" onClick={() => setModalCrearUsuario(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Crear Nuevo Usuario</h2>
              <button className="modal-close" onClick={() => setModalCrearUsuario(false)}>✕</button>
            </div>
            <form onSubmit={crearUsuario}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre completo *</label>
                  <input
                    type="text"
                    value={nuevoUsuario.nombre_contacto}
                    onChange={e => setNuevoUsuario({...nuevoUsuario, nombre_contacto: e.target.value})}
                    placeholder="Juan Pérez"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={nuevoUsuario.email}
                    onChange={e => setNuevoUsuario({...nuevoUsuario, email: e.target.value})}
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Contraseña *</label>
                  <div className="password-input-wrapper">
                    <input
                      type={mostrarPassword ? "text" : "password"}
                      value={nuevoUsuario.password}
                      onChange={e => setNuevoUsuario({...nuevoUsuario, password: e.target.value})}
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                      required
                    />
                    <button 
                      type="button"
                      className="btn-toggle-password"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                    >
                      {mostrarPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Rol *</label>
                  <select
                    value={nuevoUsuario.role}
                    onChange={e => setNuevoUsuario({...nuevoUsuario, role: e.target.value})}
                    required
                  >
                    <option value="admin">🔧 Admin</option>
                    <option value="super_admin">👑 Super Admin</option>
                  </select>
                  <small className="form-hint">
                    Admin: puede gestionar negocios e invitaciones. 
                    Super Admin: además puede gestionar usuarios y roles.
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setModalCrearUsuario(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={creando}
                >
                  {creando ? '⏳ Creando...' : '✅ Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}