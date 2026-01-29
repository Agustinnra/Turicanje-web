/**
 * ============================================
 * TURICANJE - TrackClick Component
 * ============================================
 * Componente para trackear clicks en botones/links
 * 
 * USO:
 * 
 * // Opción 1: Envolver un botón existente
 * <TrackClick id="btn-whatsapp" category="contact" placeId="NEG123">
 *   <button>Abrir WhatsApp</button>
 * </TrackClick>
 * 
 * // Opción 2: Usar como botón directamente
 * <TrackClick 
 *   id="btn-maps" 
 *   category="navigation"
 *   destination="https://maps.google.com/..."
 *   as="a"
 *   href="https://maps.google.com/..."
 *   target="_blank"
 * >
 *   Ver en mapa
 * </TrackClick>
 * 
 * // Opción 3: Con onClick personalizado
 * <TrackClick id="btn-menu" category="action" onClick={() => setMenuOpen(true)}>
 *   Ver menú
 * </TrackClick>
 * ============================================
 */

'use client';

import { ReactNode, MouseEvent } from 'react';
import { useAnalytics } from './AnalyticsProvider';

interface TrackClickProps {
  children: ReactNode;
  id: string;                    // ID único del elemento (ej: "btn-whatsapp")
  category?: string;             // Categoría (ej: "contact", "navigation", "social")
  destination?: string;          // URL destino si es link
  placeId?: string;              // ID del negocio si aplica
  text?: string;                 // Texto del botón (se auto-detecta si no se pasa)
  as?: 'div' | 'button' | 'a' | 'span';  // Elemento HTML a renderizar
  onClick?: (e: MouseEvent) => void;     // onClick adicional
  className?: string;
  href?: string;                 // Para cuando as="a"
  target?: string;               // Para cuando as="a"
  rel?: string;                  // Para cuando as="a"
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function TrackClick({
  children,
  id,
  category = 'action',
  destination,
  placeId,
  text,
  as = 'div',
  onClick,
  className,
  href,
  target,
  rel,
  disabled,
  style,
}: TrackClickProps) {
  const { trackClick } = useAnalytics();

  const handleClick = (e: MouseEvent) => {
    // Trackear el click
    trackClick({
      elementId: id,
      elementCategory: category,
      destinationUrl: destination || href,
      placeId,
      elementText: text || (typeof children === 'string' ? children : undefined),
    });

    // Ejecutar onClick personalizado si existe
    if (onClick) {
      onClick(e);
    }
  };

  // Props comunes
  const commonProps = {
    onClick: handleClick,
    className,
    style: { cursor: disabled ? 'not-allowed' : 'pointer', ...style },
    'data-track': id,
    'data-track-category': category,
  };

  // Renderizar según el tipo de elemento
  switch (as) {
    case 'a':
      return (
        <a
          {...commonProps}
          href={href}
          target={target}
          rel={rel || (target === '_blank' ? 'noopener noreferrer' : undefined)}
        >
          {children}
        </a>
      );
    case 'button':
      return (
        <button {...commonProps} disabled={disabled} type="button">
          {children}
        </button>
      );
    case 'span':
      return <span {...commonProps}>{children}</span>;
    default:
      return <div {...commonProps}>{children}</div>;
  }
}

// ============================================
// HOOKS HELPER PARA TRACKING MANUAL
// ============================================

/**
 * Hook para obtener función de tracking
 * Útil cuando necesitas trackear sin envolver el componente
 * 
 * USO:
 * const { track } = useTrack();
 * 
 * const handleSubmit = () => {
 *   track('form-submit', 'conversion');
 *   // ... resto de la lógica
 * };
 */
export function useTrack() {
  const { trackClick } = useAnalytics();

  const track = (
    elementId: string,
    category?: string,
    destinationUrl?: string,
    placeId?: string
  ) => {
    trackClick({
      elementId,
      elementCategory: category,
      destinationUrl,
      placeId,
    });
  };

  return { track };
}

export default TrackClick;