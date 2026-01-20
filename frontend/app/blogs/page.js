'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { API_URL } from '@/lib/api';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import { Calendar, User, ArrowRight, Tag } from 'lucide-react';

export default function BlogListing() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/api/blogs`)
            .then(res => res.json())
            .then(data => {
                setBlogs(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch blogs', err);
                setLoading(false);
            });
    }, []);

    if (loading) return <Loader />;

    return (
        <div className="container" style={{ paddingTop: '120px', paddingBottom: '100px' }}>
            <div style={{ textAlign: 'center', marginBottom: '80px', maxWidth: '800px', margin: '0 auto 80px' }}>
                <h1 style={{
                    fontSize: '3rem',
                    fontWeight: '800',
                    marginBottom: '24px',
                    background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Seedite Blog
                </h1>
                <p style={{ color: '#64748b', fontSize: '1.2rem', lineHeight: '1.7' }}>
                    Insights, strategies, and updates to help you crack NSAT and master your tech career.
                </p>
            </div>

            {blogs.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '60px' }}>
                    <p>No posts available yet. Check back soon!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '32px' }}>
                    {blogs.map(blog => (
                        <Link href={`/blogs/${blog.slug}`} key={blog._id} style={{ textDecoration: 'none' }}>
                            <div className="modern-card" style={{
                                padding: '0',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                transition: 'all 0.3s ease'
                            }}>
                                <div style={{
                                    height: '220px',
                                    background: '#f1f5f9',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    {blog.image ? (
                                        <img
                                            src={blog.image}
                                            alt={blog.title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                                            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                                            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                                        />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                                            <span style={{ fontSize: '3rem' }}>📝</span>
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Calendar size={14} />
                                            {new Date(blog.createdAt).toLocaleDateString()}
                                        </div>
                                        {blog.tags && blog.tags.length > 0 && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Tag size={14} />
                                                {blog.tags[0]}
                                            </div>
                                        )}
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', marginBottom: '12px', lineHeight: '1.4' }}>
                                        {blog.title}
                                    </h3>
                                    <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px', flex: 1 }}>
                                        {blog.content.substring(0, 120).replace(/[#*_`]/g, '')}...
                                    </p>
                                    <div style={{ color: '#2563eb', fontWeight: '600', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        Read Article <ArrowRight size={16} />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
