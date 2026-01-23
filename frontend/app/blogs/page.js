import { API_URL } from '@/lib/api';
import BlogListingClient from './BlogListingClient';

export const metadata = {
    title: 'Seedite Blog | NSAT Preparation & Tech Career Insights',
    description: 'Get expert insights on NSAT exam preparation, coding tips, and tech career guidance. Stay updated with the latest trends in technology education.',
    openGraph: {
        title: 'Seedite Blog | NSAT Preparation & Tech Career Insights',
        description: 'Expert insights on NSAT exam preparation, coding tips, and tech career guidance',
        type: 'website',
        url: 'https://www.seedite.in/blogs',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Seedite Blog',
        description: 'NSAT Preparation & Tech Career Insights',
    },
};

async function getBlogs() {
    try {
        const res = await fetch(`${API_URL}/api/blogs`, { cache: 'no-store' });
        if (!res.ok) {
            throw new Error('Failed to fetch blogs');
        }
        return res.json();
    } catch (error) {
        if (error.digest === 'DYNAMIC_SERVER_USAGE') {
            throw error;
        }
        console.error('Error fetching blogs:', error);
        return [];
    }
}

export default async function BlogListing() {
    const blogs = await getBlogs();

    const schema = {
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "Seedite Blog",
        "description": "Insights, strategies, and updates to help you crack NSAT and master your tech career.",
        "url": "https://www.seedite.in/blogs",
        "publisher": {
            "@type": "Organization",
            "name": "Seedite",
            "logo": {
                "@type": "ImageObject",
                "url": "https://www.seedite.in/logo.png"
            }
        },
        "blogPost": blogs.slice(0, 10).map(blog => ({
            "@type": "BlogPosting",
            "headline": blog.title,
            "description": blog.content.substring(0, 200).replace(/[#*_`]/g, ''),
            "url": `https://www.seedite.in/blogs/${blog.slug}`,
            "datePublished": blog.createdAt,
            "author": {
                "@type": "Person",
                "name": blog.author || "Seedite Team"
            }
        }))
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            />
            <BlogListingClient initialBlogs={blogs} />
        </>
    );
}