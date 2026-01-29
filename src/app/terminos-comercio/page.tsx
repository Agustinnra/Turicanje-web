'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import '../terminos-usuarios/terminos.css';

export default function TerminosComercioPage() {
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

          <Link href="/login-usuario" className="login-btn">
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
        <p>Participación de Establecimientos Afiliados</p>
      </section>

      <main className="terminos-main">
        <div className="terminos-content">
          <p className="ultima-actualizacion">Última actualización: Diciembre 2024</p>

          <section className="terminos-section">
            <h2>DEFINICIONES</h2>
            
            <h3>Turicanje</h3>
            <p>
              Se entenderá a la persona moral que cuenta con las autorizaciones y capacidades e infraestructura propia para comercializar ante el público en general el programa de lealtad y monedero electrónico Turicanje.
            </p>

            <h3>Establecimiento afiliado</h3>
            <p>
              Se entenderá la persona física o moral que proporcionará los descuentos, promociones u ofertas a favor de los portadores del monedero electrónico Turicanje.
            </p>

            <h3>Monedero electrónico Turicanje</h3>
            <p>
              Se entenderá al monedero electrónico emitido por "Turicanje" y por virtud de la cual el "establecimiento afiliado" otorgará los descuentos, puntos, promociones u ofertas, bastando la simple presentación del mismo de forma física o digital.
            </p>

            <h3>Usuarios</h3>
            <p>
              Se entenderá a los portadores activos del Monedero electrónico Turicanje de forma física o digital.
            </p>
          </section>

          <section className="terminos-section">
            <h2>EL ESTABLECIMIENTO AFILIADO ENTIENDE Y ACEPTA:</h2>
            
            <ul>
              <li>
                Que "Turicanje" utilice su nombre con fines publicitarios y a conveniencia del mismo, siempre con consentimiento por parte del "establecimiento afiliado" y en conciliación con "Turicanje".
              </li>
              <li>
                Asimismo, "Turicanje" podrá visitar el establecimiento afiliado para realizar la toma de fotografías y/o videos con fines promocionales, previa notificación y coordinación con el encargado del negocio. Dicho material será utilizado exclusivamente en la app, redes sociales y medios asociados a "Turicanje".
              </li>
              <li>
                La publicidad creada para el "establecimiento afiliado" se realizará dentro de los medios que "Turicanje" utilice para la promoción del programa de lealtad multimarca denominado "Turicanje".
              </li>
            </ul>
          </section>

          <section className="terminos-section">
            <h2>SUSCRIPCIÓN Y TARIFAS</h2>
            <ul>
              <li>
                Por concepto de la contraprestación de suscripción al programa de lealtad y/o al catálogo o menú digital, el "establecimiento afiliado" no pagará cuotas durante el primer año.
              </li>
              <li>
                Solo se cobrará la tarifa fija por envío aplicable a distancias no mayores a 4 km. Las entregas adicionales tendrán un costo fijo adicional que será acordado con el negocio.
              </li>
              <li>
                Como bienvenida, el "establecimiento afiliado" tendrá derecho a 10 entregas gratuitas durante el primer mes de registro.
              </li>
            </ul>
          </section>

          <section className="terminos-section">
            <h2>SISTEMA DE PUNTOS Y CASHBACK</h2>
            <ul>
              <li>
                Por tiempo indefinido y a partir de la fecha de este acuerdo, el "establecimiento afiliado" se compromete a bonificar a los "usuarios" del "monedero electrónico Turicanje" el 10% del total de la compra exclusivamente en los productos, categorías del menú, días de la semana o montos mínimos que el establecimiento determine y haya notificado previamente a Turicanje.
              </li>
              <li>
                Si los puntos generados no se redimen por completo en el negocio, el establecimiento afiliado deberá cubrir la diferencia para garantizar que los usuarios puedan utilizar dichos puntos en otros establecimientos afiliados.
              </li>
              <li>
                Si un cliente redime más puntos de los generados en el negocio, Turicanje cubrirá la diferencia, cobrando al establecimiento afiliado una comisión del 10% sobre las ventas realizadas con esos puntos.
              </li>
              <li>
                Tanto "Turicanje" como el "establecimiento afiliado" entienden que para los "usuarios", la conversión de 1 punto equivale a $1 peso mexicano.
              </li>
            </ul>
          </section>

          <section className="terminos-section">
            <h2>BALANCE Y PAGOS</h2>
            <p>
              Mensualmente el "establecimiento afiliado" recibirá un balance detallado de todos los puntos generados y canjeados desde su establecimiento. El equivalente deberá saldarse en pesos mexicanos a favor de "Turicanje" o a favor del "establecimiento afiliado", según sea el caso, en un plazo máximo de 5 días naturales.
            </p>
          </section>

          <section className="terminos-section">
            <h2>OBLIGACIONES DEL ESTABLECIMIENTO</h2>
            <ul>
              <li>Los negocios deberán proporcionar información verídica y actualizada sobre su menú, horario y condiciones.</li>
              <li>Los puntos de cashback no son acumulables con otras promociones externas implementadas por el establecimiento.</li>
              <li>El radio de entrega de los pedidos será previamente definido entre ambas partes.</li>
            </ul>
          </section>

          <section className="terminos-section">
            <h2>VIGENCIA Y TERMINACIÓN</h2>
            <ul>
              <li>
                En caso de incumplimiento por alguna de las partes en cualquiera de los términos pactados, se dará por terminado de inmediato el presente acuerdo.
              </li>
              <li>
                Si ocurrieran casos o eventos fortuitos o de fuerza mayor, los efectos del presente acuerdo se suspenderán parcial o totalmente.
              </li>
              <li>
                La vigencia del mismo se considerará indefinida, por lo cual las partes podrán darlo por terminado en cualquier momento, previo aviso por escrito con treinta días naturales de anticipación, siempre y cuando se hayan saldado todos los servicios utilizados.
              </li>
            </ul>
          </section>

          <section className="terminos-section">
            <h2>RESERVA DE DERECHOS</h2>
            <p>
              Turicanje se reserva el derecho de revisar y ajustar las políticas del programa, notificando previamente a los negocios participantes sobre cualquier cambio.
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