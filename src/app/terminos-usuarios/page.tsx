'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './terminos.css';

export default function TerminosUsuariosPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="terminos-container">
      <header className="landing-header">
        <div className="header-content">
          <Link href="/" className="logo-link">
            <Image 
              src="/icons/logo-turicanje.png" 
              alt="Turicanje" 
              width={200}
              height={70}
              className="logo-image"
              priority
            />
          </Link>

          <nav className="nav-desktop">
            <Link href="/" className="nav-link">INICIO</Link>
            <Link href="/nosotros" className="nav-link">NOSOTROS</Link>
            <Link href="/contacto" className="nav-link">CONTACTO</Link>
          </nav>

          <Link href="/login" className="login-btn">
            <span className="login-icon">👤</span>
            Iniciar sesión
          </Link>

          <button 
            className="hamburger-btn"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`}></span>
          </button>
        </div>
      </header>

      <section className="terminos-hero">
        <h1>Términos y Condiciones</h1>
        <p>Programa Turicanje - Usuarios</p>
      </section>

      <main className="terminos-main">
        <div className="terminos-content">
          <p className="ultima-actualizacion">Última actualización: Diciembre 2024</p>

          <section className="terminos-section">
            <h2>INTRODUCCIÓN</h2>
            <p>
              El presente documento (en lo sucesivo, "Términos y Condiciones") regula la operación del Programa de Lealtad Turicanje, por lo que respecta, de manera enunciativa mas no limitativa, a lo siguiente:
            </p>
          </section>

          <section className="terminos-section">
            <h2>DEFINICIONES</h2>
            
            <h3>Programa Turicanje</h3>
            <p>
              Es el Programa multimarca que opera en México y que le permite al Socio usar su Cuenta Turicanje, acumular Puntos Turicanje ("Puntos Turicanje" y/o "Puntos") por: las compras/consumos y/o pago de productos y/o servicios seleccionados que realice en los comercios de las marcas de las Empresas Afiliadas al Programa Turicanje e intercambiar dichos Puntos por productos, consumos y/o servicios que se ofrezcan en los comercios de las Marcas de las Empresas Afiliadas al Programa Turicanje. Los Puntos Turicanje no pueden canjearse por dinero.
            </p>

            <h3>Socio</h3>
            <p>
              Se refiere a los individuos que participan en el Programa Turicanje y que tengan cuenta Turicanje emitido por alguna de las Marcas o Socios en el Programa Turicanje con la cual acumulen y/o intercambien sus Puntos en la compra/contratación/consumo de productos y/o servicios en las tiendas tanto físicas como digitales de las Marcas de las Empresas Afiliadas al Programa Turicanje. Podrá participar en el Programa Turicanje cualquier persona física que sea mayor de 18 años de edad, con capacidad legal para obligarse, que resida en territorio mexicano, y haya aceptado los presentes Términos y Condiciones al registrarse en el Programa Turicanje.
            </p>

            <h3>Cuenta</h3>
            <p>
              Significará el número único e intransferible que será asignado a cada Socio que guardará y administrará el Programa Turicanje y que estará enlazado a todas las interfaces donde cada Socio tenga interacción. En esta cuenta se reflejarán los movimientos que realice la cuenta en el Programa Turicanje ya sea para acumular y/o intercambiar Puntos por productos, consumos o servicios.
            </p>

            <h3>Empresas Afiliadas</h3>
            <p>
              Empresas, Grupo de Empresas, Comercio(s) y/o Tienda(s) operadoras de establecimientos de turismo (comercios participantes), físicos y/o virtuales, los puntos de venta de cada Marca y/o sitios Web de dichas marcas, que tienen celebrado un convenio de colaboración con Turicanje para la acumulación y pago con puntos de tu cuenta Turicanje conforme al consumo realizado por los socios del mismo en sus establecimientos.
            </p>
          </section>

          <section className="terminos-section">
            <h2>1. INSCRIPCIÓN AL PROGRAMA TURICANJE</h2>
            <p>
              Las personas mayores de 18 años que deseen formar parte del Programa Turicanje deberán registrarse a través de la página del Programa Turicanje o bien a través de la App y obtener su tarjeta digital. El registro al Programa Turicanje no tendrá costo alguno por un año en caso de ser nuevos socios.
            </p>
          </section>

          <section className="terminos-section">
            <h2>2. ACUMULACIÓN DE PUNTOS</h2>
            <p>El Socio acumulará puntos por sus consumos realizados en los restaurantes de las Marcas o Socios participantes de la siguiente manera:</p>
            <ul>
              <li>Por cada $10 pesos de consumo en las marcas participantes se acumula 1 punto que equivale a $1.00 (un peso 00/100 M.N).</li>
              <li>Para acumular puntos, el Socio deberá proporcionar su Tarjeta de Lealtad física o digital antes de pedir la cuenta.</li>
              <li>En caso de no realizar la acumulación conforme al procedimiento anterior, los puntos relacionados al consumo realizado no podrán ser acumulados con posterioridad (no habrá acumulaciones retroactivas).</li>
            </ul>
          </section>

          <section className="terminos-section">
            <h2>3. PAGO CON PUNTOS</h2>
            <ul>
              <li>Los puntos acumulados por un Socio podrán ser utilizados únicamente por el titular de la tarjeta Turicanje.</li>
              <li>Para pagar con puntos, el Socio deberá indicar al mesero su forma de pago y entregar su Tarjeta Turicanje física o digital.</li>
              <li>El pago con puntos no será aplicable para pago de propinas ni activaciones o compra de certificados de regalo.</li>
              <li>Los consumos pagados mediante redención de puntos no serán facturables.</li>
            </ul>
          </section>

          <section className="terminos-section">
            <h2>4. VENCIMIENTO DE PUNTOS</h2>
            <p>
              Los Puntos Turicanje vencen después de un periodo de 12 (doce) meses a partir de su fecha de emisión. Adicionalmente, en caso de que ningún Punto se haya emitido, y/o ningún Punto se haya intercambiado por productos y/o servicios dentro de un periodo de 12 (doce) meses consecutivos, es decir, en caso de inactividad de la Cuenta, los Puntos acumulados antes de ese periodo de inactividad vencerán y su Cuenta Turicanje podrá ser cancelada.
            </p>
          </section>

          <section className="terminos-section">
            <h2>5. RESTRICCIONES DE COMBINACIÓN</h2>
            <ul>
              <li>El pago con Tu cuenta Turicanje no podrá combinarse con otros programas de lealtad que en su caso manejen las Empresas Afiliadas.</li>
              <li>El pago de puntos no se podrá combinar con ninguna tarjeta de lealtad externa.</li>
              <li>Tus puntos Turicanje no pueden ser utilizados para la compra de tiempo aire, ni activación o recarga de otras tarjetas, ni pago de propinas.</li>
            </ul>
          </section>

          <section className="terminos-section">
            <h2>6. PROMOCIÓN DE CUMPLEAÑOS</h2>
            <p>Se otorgan beneficios en el mes de cumpleaños del Socio:</p>
            <ul>
              <li>Un cupón equivalente a $200 de descuento en el consumo mínimo de $500 en programa Turicanje Mensual.</li>
              <li>Un cupón equivalente a $300 de descuento en el consumo mínimo de $600 en programa Turicanje Anual.</li>
              <li>Un cupón equivalente a $500 de descuento en el consumo mínimo de $1000 en programa TuriClub.</li>
            </ul>
            <p>Los beneficios llegarán por correo electrónico los primeros días del mes de cumpleaños. Para hacer válido el cupón, el Socio deberá presentar identificación oficial.</p>
          </section>

          <section className="terminos-section">
            <h2>7. TERMINACIÓN DE LA PARTICIPACIÓN</h2>
            <p>
              El Socio podrá dar por terminada en forma voluntaria su participación en el Programa Turicanje en cualquier momento, ya sea a través de la página www.turicanje.app y/o llamando al número de teléfono: 5576794313 de lunes a viernes de 9:00 a 18:00 h.
            </p>
            <p>
              La cancelación de su participación en el Programa Turicanje resultará la pérdida y cancelación de los Puntos acumulados.
            </p>
          </section>

          <section className="terminos-section">
            <h2>8. AVISO DE PRIVACIDAD</h2>
            <p>
              El responsable del tratamiento y protección de sus datos personales es TURICANJE S.A.S DE C.V. (Turicanje), con domicilio en Aniceto Ortega 817, Del Valle Centro, Benito Juárez, 03100, Ciudad de México.
            </p>
            <p>
              Si desea conocer nuestro Aviso de Privacidad Integral, puede consultarlo en: <a href="https://www.turicanje.app" target="_blank" rel="noopener noreferrer">www.turicanje.app</a>
            </p>
          </section>

          <section className="terminos-section">
            <h2>9. CONTACTO</h2>
            <p>
              Para cualquier consulta relacionada con el Programa Turicanje el Socio deberá enviar correo electrónico a <a href="mailto:contacto@turicanje.com">contacto@turicanje.com</a> o visitar la página <a href="https://www.turicanje.app" target="_blank" rel="noopener noreferrer">www.turicanje.app</a>
            </p>
          </section>

          <div className="terminos-firma">
            <p><strong>TURICANJE S.A.S. DE C.V.</strong></p>
          </div>
        </div>
      </main>

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <Image 
              src="/icons/logo-turicanje.png" 
              alt="Turicanje" 
              width={150}
              height={52}
              className="footer-logo"
            />
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Turicanje. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}