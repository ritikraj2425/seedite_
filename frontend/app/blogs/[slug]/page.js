'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Head from 'next/head';
import { API_URL } from '@/lib/api';
import Loader from '../../../components/ui/Loader';
import MarkdownRenderer from '../../../components/ui/MarkdownRenderer';
import TableOfContents from '../../../components/ui/TableOfContents';
import AuthorBio from '../../../components/ui/AuthorBio';
import ShareButtons from '../../../components/ui/ShareButtons';
import Breadcrumb from '../../../components/ui/Breadcrumb';
import ReadTime from '../../../components/ui/ReadTime';
import RelatedPosts from '../../../components/ui/RelatedPosts';
import { Calendar, User, ArrowLeft, Tag, Share2, Clock, BookOpen } from 'lucide-react';

export default function BlogPost() {
    const { slug } = useParams();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [headings, setHeadings] = useState([]);
    const [readTime, setReadTime] = useState(0);

    // Calculate read time
    const calculateReadTime = (content) => {
        const wordsPerMinute = 200;
        const wordCount = content.split(/\s+/).length;
        return Math.ceil(wordCount / wordsPerMinute);
    };

    // Extract headings for TOC
    const extractHeadings = (content) => {
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

    useEffect(() => {
        if (!slug) return;

        fetch(`${API_URL}/api/blogs/${slug}`)
            .then(res => {
                if (!res.ok) throw new Error('Blog not found');
                return res.json();
            })
            .then(data => {
                setBlog(data);
                setHeadings(extractHeadings(data.content));
                setReadTime(calculateReadTime(data.content));
                setLoading(false);

                // Update meta tags dynamically
                updateMetaTags(data);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [slug]);

    const updateMetaTags = (data) => {
        // Update title
        document.title = `${data.title} | Seedite Blog`;

        // Update meta description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        const description = data.content.substring(0, 160).replace(/[#*_`]/g, '');
        metaDesc.content = description;

        // Update Open Graph tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        const ogDesc = document.querySelector('meta[property="og:description"]');
        const ogImage = document.querySelector('meta[property="og:image"]');

        if (ogTitle) ogTitle.content = data.title;
        if (ogDesc) ogDesc.content = description;
        if (ogImage && data.image) ogImage.content = data.image;
    };

    const generateSchemaMarkup = () => {
        if (!blog) return null;

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
                "@id": typeof window !== 'undefined' ? window.location.href : ''
            },
            "articleBody": blog.content.replace(/[#*_`]/g, ''),
            "wordCount": blog.content.split(/\s+/).length,
            "timeRequired": `PT${readTime}M`
        };

        return JSON.stringify(schema);
    };

    if (loading) return <Loader />;
    if (!blog) return (
        <div className="container" style={{ paddingTop: '120px', textAlign: 'center' }}>
            <h1>Blog Post Not Found</h1>
            <Link href="/blogs" style={{ color: '#2563eb', marginTop: '16px', display: 'inline-block' }}>Back to Blogs</Link>
        </div>
    );

    return (
        <>
            <Head>
                <title>{blog.title} | Seedite Blog</title>
                <meta name="description" content={blog.content.substring(0, 160).replace(/[#*_`]/g, '')} />
                <meta property="og:title" content={blog.title} />
                <meta property="og:description" content={blog.content.substring(0, 160).replace(/[#*_`]/g, '')} />
                <meta property="og:type" content="article" />
                {blog.image && <meta property="og:image" content={blog.image} />}
                <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={blog.title} />
                <meta name="twitter:description" content={blog.content.substring(0, 160).replace(/[#*_`]/g, '')} />
                {blog.image && <meta name="twitter:image" content={blog.image} />}

                {/* Structured Data */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: generateSchemaMarkup() }}
                />
            </Head>

            <div style={{ paddingBottom: '100px' }}>
                {/* Breadcrumb */}
                <div className="container" style={{ maxWidth: '1200px', paddingTop: '120px', paddingBottom: '20px' }}>
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
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => {
                                            e.target.style.background = '#f1f5f9';
                                            e.target.style.color = '#2563eb';
                                        }}
                                        onMouseOut={(e) => {
                                            e.target.style.background = 'white';
                                            e.target.style.color = '#475569';
                                        }}
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
                                    loading="lazy"
                                />
                                {/* Add image schema for SEO */}
                                <script
                                    type="application/ld+json"
                                    dangerouslySetInnerHTML={{
                                        __html: JSON.stringify({
                                            "@context": "https://schema.org",
                                            "@type": "ImageObject",
                                            "contentUrl": blog.image,
                                            "name": blog.title,
                                            "description": blog.title,
                                            "license": "https://creativecommons.org/licenses/by/4.0/"
                                        })
                                    }}
                                />
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
                                url={typeof window !== 'undefined' ? window.location.href : ''}
                                description={blog.content.substring(0, 100).replace(/[#*_`]/g, '')}
                            />
                        </div>

                        {/* FAQ Schema (if applicable) */}
                        {blog.faq && blog.faq.length > 0 && (
                            <div style={{ marginTop: '60px' }}>
                                <script
                                    type="application/ld+json"
                                    dangerouslySetInnerHTML={{
                                        __html: JSON.stringify({
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
                                        })
                                    }}
                                />
                            </div>
                        )}

                        {/* Related Posts */}
                        <RelatedPosts currentSlug={slug} tags={blog.tags} />
                    </div>
                </div>
            </div>
        </>
    );
}