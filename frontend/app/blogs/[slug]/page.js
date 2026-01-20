'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import Loader from '../../../components/ui/Loader';
import MarkdownRenderer from '../../../components/ui/MarkdownRenderer';
import { Calendar, User, ArrowLeft, Tag, Share2 } from 'lucide-react';

export default function BlogPost() {
    const { slug } = useParams();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) return;

        fetch(`${API_URL}/api/blogs/${slug}`)
            .then(res => {
                if (!res.ok) throw new Error('Blog not found');
                return res.json();
            })
            .then(data => {
                setBlog(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [slug]);

    if (loading) return <Loader />;
    if (!blog) return (
        <div className="container" style={{ paddingTop: '120px', textAlign: 'center' }}>
            <h1>Blog Post Not Found</h1>
            <Link href="/blogs" style={{ color: '#2563eb', marginTop: '16px', display: 'inline-block' }}>Back to Blogs</Link>
        </div>
    );

    return (
        <div style={{ paddingBottom: '100px' }}>
            {/* Minimal Header */}
            <div style={{ background: '#f8fafc', paddingTop: '120px', paddingBottom: '60px', borderBottom: '1px solid #e2e8f0' }}>
                <div className="container" style={{ maxWidth: '800px' }}>
                    <Link href="/blogs" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', fontWeight: '500', marginBottom: '32px', fontSize: '0.9rem' }}>
                        <ArrowLeft size={16} /> Back to Blogs
                    </Link>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={16} />
                            {new Date(blog.createdAt).toLocaleDateString()}
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
                                <span key={i} style={{
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    padding: '4px 12px',
                                    borderRadius: '100px',
                                    fontSize: '0.85rem',
                                    color: '#475569',
                                    fontWeight: '500'
                                }}>
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Content Body */}
            <div className="container" style={{ maxWidth: '800px', paddingTop: '60px' }}>
                {blog.image && (
                    <div style={{
                        width: '100%',
                        height: '400px',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        marginBottom: '60px',
                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)'
                    }}>
                        <img
                            src={blog.image}
                            alt={blog.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>
                )}

                <div className="blog-content" style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#334155' }}>
                    <MarkdownRenderer content={blog.content} />
                </div>

                <div style={{ marginTop: '80px', paddingTop: '40px', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ background: '#f8fafc', padding: '32px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Share this article</h3>
                            <p style={{ color: '#64748b' }}>Help others find this useful content</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                alert('Link copied to clipboard!');
                            }} style={{ background: 'white', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Share2 size={16} /> Copy Link
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
