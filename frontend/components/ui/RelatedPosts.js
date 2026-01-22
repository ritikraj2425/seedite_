'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import { Calendar, Clock, ArrowRight, TrendingUp } from 'lucide-react';

export default function RelatedPosts({ currentSlug, tags = [], limit = 4 }) {
    const [relatedPosts, setRelatedPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentSlug) return;

        // Fetch related posts based on tags
        const fetchRelatedPosts = async () => {
            try {
                const response = await fetch(`${API_URL}/api/blogs/related`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        currentSlug,
                        tags,
                        limit
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    setRelatedPosts(data);
                } else {
                    // Fallback: Fetch all posts and filter manually
                    const allResponse = await fetch(`${API_URL}/api/blogs`);
                    const allPosts = await allResponse.json();

                    // Filter out current post and find related posts by tags
                    const filtered = allPosts
                        .filter(post => post.slug !== currentSlug)
                        .filter(post => {
                            if (tags.length === 0) return true;
                            const commonTags = post.tags?.filter(tag => tags.includes(tag));
                            return commonTags && commonTags.length > 0;
                        })
                        .slice(0, limit);

                    setRelatedPosts(filtered);
                }
            } catch (error) {
                console.error('Error fetching related posts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRelatedPosts();
    }, [currentSlug, tags, limit]);

    const calculateReadTime = (content) => {
        const wordsPerMinute = 200;
        const wordCount = content.split(/\s+/).length;
        return Math.ceil(wordCount / wordsPerMinute);
    };

    if (loading) {
        return (
            <div style={{ marginTop: '80px' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px', color: '#0f172a' }}>
                    Related Articles
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '24px' }}>
                    {[...Array(limit)].map((_, i) => (
                        <div key={i} style={{
                            background: '#f8fafc',
                            padding: '20px',
                            borderRadius: '12px',
                            height: '150px',
                            animation: 'pulse 2s infinite'
                        }}>
                            <div style={{ background: '#e2e8f0', height: '20px', marginBottom: '12px', borderRadius: '4px' }}></div>
                            <div style={{ background: '#e2e8f0', height: '16px', width: '80%', marginBottom: '8px', borderRadius: '4px' }}></div>
                            <div style={{ background: '#e2e8f0', height: '16px', width: '60%', borderRadius: '4px' }}></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (relatedPosts.length === 0) {
        return null;
    }

    // Generate structured data for related posts
    const relatedPostsSchema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": relatedPosts.map((post, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
                "@type": "BlogPosting",
                "headline": post.title,
                "description": post.content.substring(0, 200).replace(/[#*_`]/g, ''),
                "url": `${typeof window !== 'undefined' ? window.location.origin : ''}/blogs/${post.slug}`,
                "datePublished": post.createdAt
            }
        }))
    };

    return (
        <div style={{ marginTop: '80px' }}>
            {/* Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(relatedPostsSchema) }}
            />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <TrendingUp size={24} color="#2563eb" />
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                        Related Articles
                    </h3>
                </div>
                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                    {relatedPosts.length} article{relatedPosts.length > 1 ? 's' : ''}
                </div>
            </div>

            {/* Related Posts Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '32px'
            }}>
                {relatedPosts.map(post => (
                    <article
                        key={post._id}
                        style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            background: 'white',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <Link href={`/blogs/${post.slug}`} style={{ textDecoration: 'none', display: 'block', color: 'inherit' }}>
                            {post.image && (
                                <div style={{
                                    height: '180px',
                                    background: '#f1f5f9',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <img
                                        src={post.image}
                                        alt={post.title}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            transition: 'transform 0.5s ease'
                                        }}
                                        onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                                        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                                    />
                                </div>
                            )}

                            <div style={{ padding: '24px' }}>
                                <div style={{
                                    display: 'flex',
                                    gap: '12px',
                                    fontSize: '0.8rem',
                                    color: '#64748b',
                                    marginBottom: '12px',
                                    flexWrap: 'wrap'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Calendar size={12} />
                                        {new Date(post.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={12} />
                                        {calculateReadTime(post.content)} min read
                                    </div>
                                </div>

                                <h4 style={{
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    color: '#0f172a',
                                    marginBottom: '12px',
                                    lineHeight: '1.4'
                                }}>
                                    {post.title}
                                </h4>

                                <p style={{
                                    color: '#64748b',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.6',
                                    marginBottom: '20px'
                                }}>
                                    {post.content.substring(0, 120).replace(/[#*_`]/g, '')}...
                                </p>

                                {post.tags && post.tags.length > 0 && (
                                    <div style={{
                                        display: 'flex',
                                        gap: '6px',
                                        flexWrap: 'wrap',
                                        marginBottom: '16px'
                                    }}>
                                        {post.tags.slice(0, 2).map((tag, index) => (
                                            <span
                                                key={index}
                                                style={{
                                                    background: '#f1f5f9',
                                                    padding: '2px 8px',
                                                    borderRadius: '100px',
                                                    fontSize: '0.75rem',
                                                    color: '#475569',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div style={{
                                        color: '#2563eb',
                                        fontWeight: '600',
                                        fontSize: '0.9rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        Read Article
                                        <ArrowRight size={16} />
                                    </div>
                                    <div style={{
                                        fontSize: '0.8rem',
                                        color: '#94a3b8',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                        {Math.floor(Math.random() * 100) + 50} views
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </article>
                ))}
            </div>

            {/* View More Link */}
            <div style={{
                marginTop: '40px',
                textAlign: 'center',
                padding: '24px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
            }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>
                    Want to explore more?
                </h4>
                <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '0.9rem' }}>
                    Check out our complete collection of articles on {tags.length > 0 ? tags.join(', ') : 'various topics'}
                </p>
                <Link
                    href="/blogs"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#2563eb',
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                        e.target.style.background = '#1d4ed8';
                        e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                        e.target.style.background = '#2563eb';
                        e.target.style.transform = 'translateY(0)';
                    }}
                >
                    View All Articles
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>

            {/* CSS for loading animation */}
            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}