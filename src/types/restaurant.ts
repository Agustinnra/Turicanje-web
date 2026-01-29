export interface Restaurant {
    id: string;
    nombre: string;
    slug: string;
    descripcion: string;
    direccion: string;
    telefono?: string;
    horarios?: string;
    especialidades?: string[];
    categorias?: string[];
    imagen_principal?: string;
    imagenes?: string[];
    calificacion?: number;
    precio_promedio?: number;
    acepta_reservaciones?: boolean;
    delivery?: boolean;
    created_at?: string;
    updated_at?: string;
  }