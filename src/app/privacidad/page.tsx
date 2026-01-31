'use client';

import Link from 'next/link';
import Image from 'next/image';
import './privacidad.css';

export default function PrivacidadPage() {
  return (
    <div className="legal-container">
      {/* Header */}
      <header className="legal-header">
        <Link href="/" className="legal-logo">
          <Image 
            src="/icons/logo-turicanje.png" 
            alt="Turicanje" 
            width={150} 
            height={40}
            style={{ objectFit: 'contain' }}
          />
        </Link>
      </header>

      {/* Content */}
      <main className="legal-content">
        <h1>Política de Privacidad</h1>
        <p className="last-updated">Última actualización: 06 de Diciembre 2025</p>

        <p className="intro">
          En Turicanje, respetamos su privacidad y estamos comprometidos a proteger sus datos personales. 
          Esta política explica cómo recopilamos, usamos, compartimos y protegemos su información cuando 
          utiliza nuestra aplicación móvil y servicios asociados.
        </p>

        <section>
          <h2>1. Información que Recopilamos</h2>
          <p>Recopilamos la información necesaria para proporcionarle nuestros servicios, que incluye:</p>
          
          <h3>1.1 Información proporcionada por el usuario:</h3>
          <ul>
            <li>Nombre completo</li>
            <li>Correo electrónico</li>
            <li>Número de teléfono</li>
            <li>Dirección y datos de entrega (si aplica)</li>
          </ul>

          <h3>1.2 Información recopilada automáticamente:</h3>
          <ul>
            <li>Dirección IP</li>
            <li>Tipo de dispositivo y sistema operativo</li>
            <li>Datos de uso de la aplicación (páginas visitadas, clics, tiempo de uso)</li>
          </ul>

          <h3>1.3 Información de terceros:</h3>
          <ul>
            <li>Datos proporcionados por negocios afiliados relacionados con sus compras y puntos acumulados</li>
          </ul>
        </section>

        <section>
          <h2>2. Cómo Utilizamos Su Información</h2>
          <p>Usamos su información para:</p>
          <ul>
            <li>Proporcionarle acceso a nuestras funcionalidades, como el programa de lealtad y los menús digitales</li>
            <li>Mejorar su experiencia de usuario en la app</li>
            <li>Enviar notificaciones relevantes sobre promociones, actualizaciones y servicios</li>
            <li>Gestionar pagos y suscripciones para los negocios afiliados</li>
            <li>Cumplir con nuestras obligaciones legales y prevenir actividades fraudulentas</li>
          </ul>
        </section>

        <section>
          <h2>3. Compartición de la Información</h2>
          <p>Compartimos información solo cuando es necesario y en las siguientes circunstancias:</p>
          <ul>
            <li><strong>Con negocios afiliados:</strong> Para que gestionen su participación en el programa de lealtad y ofrezcan servicios personalizados</li>
            <li><strong>Con proveedores de servicios:</strong> Empresas que ayudan a operar nuestra app, como procesadores de pagos y servicios de entrega</li>
            <li><strong>Por razones legales:</strong> Cuando sea requerido por ley o para proteger nuestros derechos legales</li>
          </ul>
        </section>

        <section>
          <h2>4. Seguridad de la Información</h2>
          <p>
            Implementamos medidas técnicas y organizativas para proteger su información personal contra 
            accesos no autorizados, pérdida, alteración o divulgación. Esto incluye cifrado de datos y 
            acceso restringido a personal autorizado.
          </p>
        </section>

        <section>
          <h2>5. Almacenamiento y Retención de Datos</h2>
          <p>
            Almacenamos su información solo durante el tiempo necesario para los fines descritos en esta 
            política, salvo que la ley exija un período de retención mayor.
          </p>
        </section>

        <section>
          <h2>6. Derechos del Usuario</h2>
          <p>Usted tiene los siguientes derechos:</p>
          <ul>
            <li>Acceder, rectificar o borrar su información personal</li>
            <li>Retirar su consentimiento para el tratamiento de datos</li>
            <li>Oponerse al uso de su información para ciertos fines, como marketing directo</li>
          </ul>
          <p>
            Puede ejercer estos derechos contactándonos en{' '}
            <a href="mailto:contacto@turicanje.com">contacto@turicanje.com</a>
          </p>
        </section>

        <section>
          <h2>7. Uso de Cookies y Tecnologías Similares</h2>
          <p>
            Utilizamos cookies para mejorar la funcionalidad de nuestra app y personalizar su experiencia. 
            Puede desactivar las cookies a través de la configuración de su navegador o dispositivo.
          </p>
        </section>

        <section>
          <h2>8. Privacidad de los Menores</h2>
          <p>
            No recopilamos intencionadamente información de menores de 18 años. Si cree que hemos 
            recopilado información de un menor, contáctenos para eliminarla.
          </p>
        </section>

        <section>
          <h2>9. Cambios a esta Política</h2>
          <p>
            Podemos actualizar esta política de privacidad periódicamente. Publicaremos cualquier cambio 
            en esta página y notificaremos actualizaciones importantes a través de la app.
          </p>
        </section>

        <section>
          <h2>10. Contacto</h2>
          <p>Si tiene preguntas sobre esta política o desea ejercer sus derechos de privacidad, contáctenos en:</p>
          <ul className="contact-info">
            <li><strong>Correo electrónico:</strong> <a href="mailto:contacto@turicanje.com">contacto@turicanje.com</a></li>
            <li><strong>Teléfono:</strong> <a href="tel:5576794313">55 7679 4313</a></li>
          </ul>
        </section>
      </main>

      {/* Footer */}
      <footer className="legal-footer">
        <p>© 2026 Turicanje. Todos los derechos reservados.</p>
        <div className="legal-footer-links">
          <Link href="/terminos-usuarios">Términos de Uso</Link>
          <Link href="/terminos-comercio">Términos para Comercios</Link>
          <Link href="/">Volver al inicio</Link>
        </div>
      </footer>
    </div>
  );
}