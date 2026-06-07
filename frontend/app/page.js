import HomeClient from './HomeClient';

export const metadata = {
  title: 'Seedite | Pre-College Learning Platform for Future Tech Leaders',
  description: 'Access premium courses, mock tests, and video solutions designed to build your tech foundation before college. Join thousands of students getting a head start with Seedite.',
  openGraph: {
    title: 'Seedite | Pre-College Learning Platform for Future Tech Leaders',
    description: 'Access premium courses, mock tests, and video solutions designed to build your tech foundation before college.',
    type: 'website',
    url: 'https://www.seedite.in',
    siteName: 'Seedite',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Seedite | Pre-College Learning Platform for Future Tech Leaders',
    description: 'Access premium courses, mock tests, and video solutions designed to build your tech foundation before college.',
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
