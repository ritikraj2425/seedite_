'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, Mail, Globe, Twitter, Linkedin, Github, Award } from 'lucide-react';

export default function AuthorBio({
    author = 'Seedite Team',
    bio = 'Education expert focused on helping students crack competitive exams and build successful tech careers.',
    image = null,
    website = 'https://www.seedite.in',
    social = {
        twitter: 'https://twitter.com/seedite',
        linkedin: 'https://x.com/ritik_raj2425',
        github: 'https://github.com/ritikraj2425'
    },
    stats = {
        posts: 50,
        students: 10000,
        experience: '3+ years'
    }
}) {
    const [showFullBio, setShowFullBio] = useState(false);

    const isLongBio = bio.length > 200;
    const displayBio = showFullBio ? bio : isLongBio ? `${bio.substring(0, 200)}...` : bio;

    return (
        <div style={{
            background: '#f8fafc',
            padding: '32px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            marginTop: '60px'
        }}>
            {/* Author Schema for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Person",
                        "name": author,
                        "description": bio.substring(0, 200),
                        "image": image || "https://www.seedite.in/author-default.jpg",
                        "url": website,
                        "sameAs": Object.values(social)
                    })
                }}
            />

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                {/* Author Image */}
                <div style={{ flexShrink: 0 }}>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '3px solid white',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                        {image ? (
                            <img
                                src={image}
                                alt={author}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <div style={{
                                width: '100%',
                                height: '100%',
                                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '2.5rem'
                            }}>
                                {author.charAt(0)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Author Info */}
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <h3 style={{
                            fontSize: '1.25rem',
                            fontWeight: '700',
                            color: '#0f172a',
                            margin: 0
                        }}>
                            {author}
                        </h3>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#dcfce7',
                            color: '#166534',
                            padding: '2px 8px',
                            borderRadius: '100px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                        }}>
                            <Award size={12} />
                            Expert
                        </div>
                    </div>

                    <p style={{
                        color: '#475569',
                        lineHeight: '1.7',
                        marginBottom: '20px',
                        fontSize: '0.95rem'
                    }}>
                        {displayBio}
                        {isLongBio && !showFullBio && (
                            <button
                                onClick={() => setShowFullBio(true)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#2563eb',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    marginLeft: '4px'
                                }}
                            >
                                Read more
                            </button>
                        )}
                        {isLongBio && showFullBio && (
                            <button
                                onClick={() => setShowFullBio(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#2563eb',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    marginLeft: '4px',
                                    display: 'block',
                                    marginTop: '8px'
                                }}
                            >
                                Show less
                            </button>
                        )}
                    </p>

                    {/* Author Stats */}
                    <div style={{
                        display: 'flex',
                        gap: '24px',
                        marginBottom: '24px',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                color: '#0f172a'
                            }}>
                                {stats.posts}+
                            </div>
                            <div style={{
                                fontSize: '0.85rem',
                                color: '#64748b'
                            }}>
                                Articles
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                color: '#0f172a'
                            }}>
                                {stats.students.toLocaleString()}+
                            </div>
                            <div style={{
                                fontSize: '0.85rem',
                                color: '#64748b'
                            }}>
                                Students Helped
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                color: '#0f172a'
                            }}>
                                {stats.experience}
                            </div>
                            <div style={{
                                fontSize: '0.85rem',
                                color: '#64748b'
                            }}>
                                Experience
                            </div>
                        </div>
                    </div>

                    {/* Social Links */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{
                            fontSize: '0.85rem',
                            color: '#64748b',
                            fontWeight: '500'
                        }}>
                            Connect:
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {social.twitter && (
                                <a
                                    href={social.twitter}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '36px',
                                        height: '36px',
                                        background: 'white',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        color: '#475569',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.background = '#1da1f2';
                                        e.target.style.borderColor = '#1da1f2';
                                        e.target.style.color = 'white';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.background = 'white';
                                        e.target.style.borderColor = '#e2e8f0';
                                        e.target.style.color = '#475569';
                                    }}
                                    aria-label="Twitter"
                                >
                                    <Twitter size={16} />
                                </a>
                            )}
                            {social.linkedin && (
                                <a
                                    href={social.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '36px',
                                        height: '36px',
                                        background: 'white',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        color: '#475569',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.background = '#0077b5';
                                        e.target.style.borderColor = '#0077b5';
                                        e.target.style.color = 'white';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.background = 'white';
                                        e.target.style.borderColor = '#e2e8f0';
                                        e.target.style.color = '#475569';
                                    }}
                                    aria-label="LinkedIn"
                                >
                                    <Linkedin size={16} />
                                </a>
                            )}
                            {social.github && (
                                <a
                                    href={social.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '36px',
                                        height: '36px',
                                        background: 'white',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        color: '#475569',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.background = '#333';
                                        e.target.style.borderColor = '#333';
                                        e.target.style.color = 'white';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.background = 'white';
                                        e.target.style.borderColor = '#e2e8f0';
                                        e.target.style.color = '#475569';
                                    }}
                                    aria-label="GitHub"
                                >
                                    <Github size={16} />
                                </a>
                            )}
                            {website && (
                                <a
                                    href={website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '36px',
                                        height: '36px',
                                        background: 'white',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        color: '#475569',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.background = '#2563eb';
                                        e.target.style.borderColor = '#2563eb';
                                        e.target.style.color = 'white';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.background = 'white';
                                        e.target.style.borderColor = '#e2e8f0';
                                        e.target.style.color = '#475569';
                                    }}
                                    aria-label="Website"
                                >
                                    <Globe size={16} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* View All Posts Link */}
            <div style={{
                marginTop: '24px',
                paddingTop: '24px',
                borderTop: '1px solid #e2e8f0',
                textAlign: 'center'
            }}>
                <Link
                    href={`/blogs?author=${encodeURIComponent(author)}`}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#2563eb',
                        fontWeight: '600',
                        textDecoration: 'none',
                        fontSize: '0.9rem'
                    }}
                    onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                >
                    View all articles by {author}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>
        </div>
    );
}