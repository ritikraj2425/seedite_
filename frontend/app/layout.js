import './globals.css';
import Navbar from '../components/Navbar';
import { Inter } from 'next/font/google';


import { GoogleAnalytics } from '@next/third-parties/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  metadataBase: new URL('https://www.seedite.in'),
  title: {
    default: 'Seedite | Master Your NSAT Preparation',
    template: '%s | Seedite',
  },
  description: 'Access premium courses, mock tests, and video solutions tailored for NSAT success. Join thousands of students achieving their dreams with Seedite.',
  keywords: ['NSAT', 'Newton School of Technology', 'NSAT Preparation', 'NSAT Mock Test', 'NSAT Syllabus', 'Tech Career', 'Seedite'],
  authors: [{ name: 'Seedite Team' }],
  creator: 'Seedite',
  publisher: 'Seedite',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: './',
  },
  openGraph: {
    title: 'Seedite | Master Your NSAT Preparation',
    description: 'Access premium courses, mock tests, and video solutions tailored for NSAT success.',
    url: 'https://www.seedite.in',
    siteName: 'Seedite',
    images: [
      {
        url: '/logo.png', // Ensure this file exists in public/ folder or update path
        width: 1200,
        height: 630,
        alt: 'Seedite - NSAT Preparation Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Seedite | Master Your NSAT Preparation',
    description: 'Access premium courses, mock tests, and video solutions tailored for NSAT success.',
    creator: '@seedite_edu', // Update if specific handle exists
  },
  icons: {
    icon: [
      { url: '/logo.png' },
      { url: '/logo.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/logo.png' },
    ],
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/logo.png',
      },
    ],
  },
  manifest: '/manifest.json',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};


import ToastProvider from '../components/providers/ToastProvider';
import SessionProvider from '../components/providers/SessionProvider';

import Footer from '../components/Footer';
import QuickUpdateBanner from '../components/QuickUpdateBanner';

import FloatingChatButton from '../components/ui/FloatingChatButton';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <ToastProvider />
          <Navbar />
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <main style={{ paddingTop: '80px', flex: 1 }}>
              <QuickUpdateBanner />
              {children}
            </main>
            <Footer />
          </div>

          {/* Floating Chatbot Button — visible on all pages */}
          <FloatingChatButton />
        </SessionProvider>
        <GoogleAnalytics gaId="G-QGXK2J8EXS" />
      </body>
    </html>
  );
}
