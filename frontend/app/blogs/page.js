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
            "headline": blog.title || 'Untitled',
            "description": (blog.content || '').substring(0, 200).replace(/[#*_`]/g, ''),
            "url": `https://www.seedite.in/blogs/${blog.slug}`,
            "datePublished": blog.createdAt || new Date().toISOString(),
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

            {/* Server-rendered SEO content for Google crawlers */}
            <noscript>
                <div className="container" style={{ paddingTop: '60px', paddingBottom: '100px' }}>
                    <h1>Seedite Blog - NSAT Preparation & Tech Career Insights</h1>
                    <p>Expert insights on NSAT exam preparation, coding tips, and tech career guidance.</p>
                    <nav aria-label="Blog posts">
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {blogs?.map(blog => (
                                <li key={blog?._id} style={{ marginBottom: '24px' }}>
                                    <article>
                                        <h2>
                                            <a href={`/blogs/${blog?.slug}`}>{blog?.title || 'Untitled'}</a>
                                        </h2>
                                        <time dateTime={blog?.createdAt}>
                                            {new Date(blog?.createdAt || Date.now()).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </time>
                                        <p>{(blog?.content || '').substring(0, 160).replace(/[#*_`]/g, '')}...</p>
                                    </article>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
            </noscript>

            {/* Hidden SEO content visible to crawlers but not users */}
            <div
                aria-hidden="false"
                style={{
                    position: 'absolute',
                    width: '1px',
                    height: '1px',
                    padding: 0,
                    margin: '-1px',
                    overflow: 'hidden',
                    clip: 'rect(0, 0, 0, 0)',
                    whiteSpace: 'nowrap',
                    border: 0
                }}
            >
                <h1>Seedite Blog - NSAT Preparation & Tech Career Insights</h1>
                <nav aria-label="All blog posts">
                    {blogs?.map(blog => (
                        <article key={blog?._id} itemScope itemType="https://schema.org/BlogPosting">
                            <h2 itemProp="headline">
                                <a href={`/blogs/${blog?.slug}`} itemProp="url">{blog?.title || 'Untitled'}</a>
                            </h2>
                            <time itemProp="datePublished" dateTime={blog?.createdAt}>
                                {new Date(blog?.createdAt || Date.now()).toLocaleDateString()}
                            </time>
                            <span itemProp="author">{blog?.author || 'Seedite Team'}</span>
                            <p itemProp="description">{(blog?.content || '').substring(0, 160).replace(/[#*_`]/g, '')}</p>
                        </article>
                    ))}
                </nav>
            </div>

            <BlogListingClient initialBlogs={blogs} />
        </>
    );
}