import './globals.css';
import Navbar from '../components/Navbar';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Seedite Education Platform',
  description: 'Learn and grow with Seedite',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main style={{ paddingTop: '80px', minHeight: 'calc(100vh - 80px)' }}>
          {children}
        </main>

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
            padding: '12px 24px',
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
          <span>💬</span> Have a query?
        </a>
      </body>
    </html>
  );
}
