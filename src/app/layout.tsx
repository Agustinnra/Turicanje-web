import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { AnalyticsProvider } from '@/lib/analytics';
import "./globals.css";
import FloatingButtons from '@/components/FloatingButtons';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import InstallPWABanner from '@/components/InstallPWABanner';

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// ✅ Viewport separado (Next.js 14+)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#d1007d',
};

// ✅ Metadata con PWA
export const metadata: Metadata = {
  title: "Turicanje - Compra, Cambia y Viaja",
  description: "La nueva forma de conectar con tus clientes. Más que lealtad, una solución completa diseñada para negocios turísticos.",
  keywords: ["restaurantes", "México", "lealtad", "cashback", "turismo", "CDMX"],
  
  // PWA
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Turicanje',
  },
  formatDetection: {
    telephone: true,
  },
  
  // Open Graph
  openGraph: {
    title: "Turicanje - Compra, Cambia y Viaja",
    description: "Descubre restaurantes, acumula puntos y gana recompensas.",
    url: 'https://turicanje.com',
    siteName: 'Turicanje',
    locale: 'es_MX',
    type: "website",
  },
  
  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'Turicanje - Compra, Cambia y Viaja',
    description: 'Descubre restaurantes, acumula puntos y gana recompensas.',
  },
  
  // Iconos
  icons: {
    icon: [
      { url: '/icons/Turity.png', type: 'image/png', sizes: '500x500' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${playfair.variable} ${dmSans.variable}`}>
      <InstallPWABanner />
      <body>
        {children}
        
        <FloatingButtons 
          whatsappNumber="525522545216"
          whatsappMessage="Hola! ¿Qué me recomiendas para comer?"
        />
        
        {/* PWA Service Worker */}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}