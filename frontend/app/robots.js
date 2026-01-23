export default function robots() {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/dashboard/', '/payment/'],
        },
        // Ensure this URL is correct for your production environment.
        // If you have a different production URL, you should update it here.
        sitemap: 'https://www.seedite.in/sitemap.xml',
    }
}
