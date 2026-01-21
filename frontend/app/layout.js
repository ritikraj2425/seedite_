import './globals.css';
import Navbar from '../components/Navbar';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Seedite | Master Your NSAT Preparation',
  description: 'Access premium courses, mock tests, and video solutions tailored for NSAT success. Join thousands of students achieving their dreams with Seedite.',
  keywords: 'NSAT, exam preparation, online courses, mock tests, video solutions, education, seedite',
  openGraph: {
    title: 'Seedite | Master Your NSAT Preparation',
    description: 'Access premium courses, mock tests, and video solutions tailored for NSAT success.',
    url: 'https://seedite.com',
    siteName: 'Seedite',
    images: [
      {
        url: '/og-image.jpg', // Placeholder
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#ffffff',
};


import ToastProvider from '../components/providers/ToastProvider';
import SessionProvider from '../components/providers/SessionProvider';

import Footer from '../components/Footer';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <ToastProvider />
          <Navbar />
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <main style={{ paddingTop: '40px', flex: 1 }}>
              {children}
            </main>
            <Footer />
          </div>

          {/* Floating Query Button */}
          <a
            href="https://forms.gle/nJFxEnBbGK3m8LtcA"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-105 floating-query-btn"
            style={{
              position: 'fixed',
              bottom: '30px',
              right: '30px',
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '50px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              textDecoration: 'none',
              fontWeight: '600',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'transform 0.2s ease'
            }}
          >
            <span>Support</span>
          </a>
        </SessionProvider>
      </body>
    </html>
  );
}
