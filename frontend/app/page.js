import HomeClient from './HomeClient';

export const metadata = {
  title: 'Seedite | Master Your NSAT Preparation',
  description: 'Access premium courses, mock tests, and video solutions tailored for NSAT success. Join thousands of students achieving their dreams with Seedite.',
  openGraph: {
    title: 'Seedite | Master Your NSAT Preparation',
    description: 'Access premium courses, mock tests, and video solutions tailored for NSAT success.',
    type: 'website',
    url: 'https://www.seedite.in',
    siteName: 'Seedite',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Seedite | Master Your NSAT Preparation',
    description: 'Access premium courses, mock tests, and video solutions tailored for NSAT success.',
  },
};

export default function Home() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Seedite",
    "url": "https://www.seedite.in",
    "logo": "https://www.seedite.in/logo.png",
    "sameAs": [
      "https://www.youtube.com/@Seedite",
      "https://www.instagram.com/seedite_edu"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-9876543210",
      "contactType": "customer support"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <HomeClient />
    </>
  );
}
