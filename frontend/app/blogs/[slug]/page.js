import Link from 'next/link';
import { notFound } from 'next/navigation';
import { API_URL } from '@/lib/api';
import Loader from '../../../components/ui/Loader';
import MarkdownRenderer from '../../../components/ui/MarkdownRenderer';
import TableOfContents from '../../../components/ui/TableOfContents';
import AuthorBio from '../../../components/ui/AuthorBio';
import ShareButtons from '../../../components/ui/ShareButtons';
import Breadcrumb from '../../../components/ui/Breadcrumb';
import ReadTime from '../../../components/ui/ReadTime';
import RelatedPosts from '../../../components/ui/RelatedPosts';
import { Calendar, User, BookOpen, Clock } from 'lucide-react';

// Helper functions (moved from client component)
const calculateReadTime = (content) => {
    if (!content) return 0;
    const wordsPerMinute = 200;
    // Strip HTML/Markdown characters for more accurate count if needed, but simple split is fine
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
};

const extractHeadings = (content) => {
    if (!content) return [];
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const matches = [];
    let match;
    while ((match = headingRegex.exec(content)) !== null) {
        const level = match[1].length;
        const text = match[2];
        const id = text.toLowerCase().replace(/[^\w]+/g, '-');
        matches.push({ id, text, level });
    }
    return matches;
};

// Data Fetching
async function getBlog(slug) {
    try {
        const res = await fetch(`${API_URL}/api/blogs/${slug}`, { cache: 'no-store' });
        if (!res.ok) {
            if (res.status === 404) return null;
            throw new Error('Failed to fetch blog');
        }
        return await res.json();
    } catch (error) {
        if (error.digest === 'DYNAMIC_SERVER_USAGE') {
            throw error;
        }
        console.error('Error fetching blog:', error);
        return null;
    }
}

// Dynamic Metadata
export async function generateMetadata({ params }) {
    const { slug } = await params;
    const blog = await getBlog(slug);

    if (!blog) {
        return {
            title: 'Blog Post Not Found | Seedite',
            description: 'The requested blog post could not be found.'
        };
    }

    const description = blog.content.substring(0, 160).replace(/[#*_`]/g, '');

    return {
        title: `${blog.title} | Seedite Blog`,
        description: description,
        openGraph: {
            title: blog.title,
            description: description,
            type: 'article',
            url: `https://www.seedite.in/blogs/${slug}`,
            images: blog.image ? [{ url: blog.image }] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title: blog.title,
            description: description,
            images: blog.image ? [blog.image] : [],
        },
    };
}

export default async function BlogPost({ params }) {
    const { slug } = await params;
    const blog = await getBlog(slug);

    if (!blog) {
        notFound();
    }

    const headings = extractHeadings(blog.content);
    // Use server-side calculation or passing content to ReadTime component if it handles calculation
    // The previous code had `setReadTime(calculateReadTime(data.content))` and passed nothing to `<ReadTime content={blog.content} />`?
    // Wait, line 184 in original was `<ReadTime content={blog.content} />`. 
    // But line 23 was `const [readTime, setReadTime] = useState(0);`.
    // And line 122 used `readTime` state for schema: `"timeRequired": PT${readTime}M`.
    // So I need the value for Schema, but the component might calculate it itself for display.
    const readTimeVal = calculateReadTime(blog.content);

    const schema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": blog.title,
        "description": blog.content.substring(0, 200).replace(/[#*_`]/g, ''),
        "image": blog.image || '',
        "author": {
            "@type": "Person",
            "name": blog.author || "Seedite Team"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Seedite",
            "logo": {
                "@type": "ImageObject",
                "url": "https://www.seedite.in/logo.png"
            }
        },
        "datePublished": blog.createdAt,
        "dateModified": blog.updatedAt || blog.createdAt,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://www.seedite.in/blogs/${slug}`
        },
        "articleBody": blog.content.replace(/[#*_`]/g, ''),
        "wordCount": blog.content.split(/\s+/).length,
        "timeRequired": `PT${readTimeVal}M`
    };

    // FAQ Schema
    const faqSchema = blog.faq && blog.faq.length > 0 ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": blog.faq.map(q => ({
            "@type": "Question",
            "name": q.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": q.answer
            }
        }))
    } : null;

    // Image Schema
    const imageSchema = blog.image ? {
        "@context": "https://schema.org",
        "@type": "ImageObject",
        "contentUrl": blog.image,
        "name": blog.title,
        "description": blog.title,
        "license": "https://creativecommons.org/licenses/by/4.0/"
    } : null;


    return (
        <>
            {/* Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            />
            {faqSchema && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
                />
            )}

            <div style={{ paddingBottom: '100px' }}>
                {/* Breadcrumb */}
                <div className="container" style={{ maxWidth: '1200px', paddingTop: '60px', paddingBottom: '20px' }}>
                    <Breadcrumb
                        items={[
                            { label: 'Home', href: '/' },
                            { label: 'Blog', href: '/blogs' },
                            { label: blog.title, href: `/blogs/${slug}`, active: true }
                        ]}
                    />
                </div>

                {/* Minimal Header */}
                <div style={{ background: '#f8fafc', paddingBottom: '60px', borderBottom: '1px solid #e2e8f0' }}>
                    <div className="container" style={{ maxWidth: '800px' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', color: '#64748b', fontSize: '0.9rem', marginBottom: '24px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={16} />
                                {new Date(blog.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Clock size={16} />
                                <ReadTime content={blog.content} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <User size={16} />
                                {blog.author || 'Seedite Team'}
                            </div>
                        </div>

                        <h1 style={{
                            fontSize: '2.5rem',
                            fontWeight: '800',
                            color: '#0f172a',
                            lineHeight: '1.2',
                            marginBottom: '32px'
                        }}>
                            {blog.title}
                        </h1>

                        {blog.tags && blog.tags.length > 0 && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {blog.tags.map((tag, i) => (
                                    <Link
                                        key={i}
                                        href={`/blogs?tag=${tag}`}
                                        style={{
                                            background: 'white',
                                            border: '1px solid #e2e8f0',
                                            padding: '4px 12px',
                                            borderRadius: '100px',
                                            fontSize: '0.85rem',
                                            color: '#475569',
                                            fontWeight: '500',
                                            textDecoration: 'none',
                                            transition: 'all 0.2s',
                                            // Note: inline styles for hover/active won't work in SSR component output easily without converting to client component or using CSS classes.
                                            // I'll stick to style prop but remove event handlers. 
                                            // The user should ideally use CSS modules or global CSS for this.
                                            // For now, I'll keep basic styles.
                                        }}
                                        className="tag-link" // Suggesting a class if they have CSS, otherwise just static style
                                    >
                                        #{tag}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Body with Sidebar */}
                <div className="container" style={{ maxWidth: '1200px', display: 'flex', gap: '48px', paddingTop: '60px' }}>
                    {/* Table of Contents Sidebar */}
                    {headings.length > 2 && (
                        <aside style={{ width: '250px', flexShrink: 0, position: 'sticky', top: '120px', height: 'fit-content' }}>
                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#0f172a' }}>
                                    <BookOpen size={18} />
                                    <h3 style={{ fontWeight: '600', fontSize: '1rem' }}>Table of Contents</h3>
                                </div>
                                <TableOfContents headings={headings} />
                            </div>
                        </aside>
                    )}

                    {/* Main Content */}
                    <div style={{ flex: 1 }}>
                        {blog.image && (
                            <div style={{
                                width: '100%',
                                height: '400px',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                marginBottom: '60px',
                                position: 'relative'
                            }}>
                                <img
                                    src={blog.image}
                                    alt={blog.title}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                // loading="lazy" - default in modern browsers or use Next.js Image
                                />
                                {imageSchema && (
                                    <script
                                        type="application/ld+json"
                                        dangerouslySetInnerHTML={{ __html: JSON.stringify(imageSchema) }}
                                    />
                                )}
                            </div>
                        )}

                        <div className="blog-content" style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#334155' }}>
                            <MarkdownRenderer content={blog.content} />
                        </div>

                        {/* Author Bio */}
                        <AuthorBio
                            author={blog.author || 'Seedite Team'}
                            bio={blog.authorBio || 'Education expert focused on helping students crack competitive exams and build successful tech careers.'}
                            image={blog.authorImage}
                        />

                        {/* Share Section */}
                        <div style={{ marginTop: '60px', paddingTop: '40px', borderTop: '1px solid #e2e8f0' }}>
                            <ShareButtons
                                title={blog.title}
                                url={`https://www.seedite.in/blogs/${slug}`}
                                description={blog.content.substring(0, 100).replace(/[#*_`]/g, '')}
                            />
                        </div>

                        {/* Related Posts */}
                        <RelatedPosts currentSlug={slug} tags={blog.tags} />
                    </div>
                </div>
            </div>
        </>
    );
}