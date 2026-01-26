'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SearchBar from '../../components/ui/SearchBar';
import CategoryFilter from '../../components/ui/CategoryFilter';
import Pagination from '../../components/ui/Pagination';
import { Calendar, Clock, TrendingUp, Tag, ArrowRight } from 'lucide-react';

export default function BlogListingClient({ initialBlogs }) {
    const [blogs] = useState(initialBlogs);
    const [filteredBlogs, setFilteredBlogs] = useState(initialBlogs);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [tags, setTags] = useState([]);
    const postsPerPage = 9;

    useEffect(() => {
        // Extract unique tags from initial data
        const allTags = initialBlogs.flatMap(blog => blog.tags || []);
        const uniqueTags = [...new Set(allTags)];
        setTags(uniqueTags);
    }, [initialBlogs]);

    const calculateReadTime = (content) => {
        const wordsPerMinute = 200;
        const wordCount = content.split(/\s+/).length;
        return Math.ceil(wordCount / wordsPerMinute);
    };

    const handleSearch = (term) => {
        setSearchTerm(term);
        // Reset category when searching or keep it? 
        // Logic in original was `filterBlogs(term, selectedCategory)` so we keep both.
        filterBlogs(term, selectedCategory);
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        filterBlogs(searchTerm, category);
    };

    const filterBlogs = (search, category) => {
        let filtered = [...blogs];

        if (search) {
            filtered = filtered.filter(blog =>
                blog.title.toLowerCase().includes(search.toLowerCase()) ||
                blog.content.toLowerCase().includes(search.toLowerCase()) ||
                (blog.tags && blog.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())))
            );
        }

        if (category !== 'all') {
            filtered = filtered.filter(blog =>
                blog.tags && blog.tags.includes(category)
            );
        }

        setFilteredBlogs(filtered);
        setCurrentPage(1);
    };

    // Pagination logic
    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const currentPosts = filteredBlogs.slice(indexOfFirstPost, indexOfLastPost);
    const totalPages = Math.ceil(filteredBlogs.length / postsPerPage);

    return (
        <div className="container" style={{ paddingTop: '60px', paddingBottom: '100px' }}>
            {/* Hero Section */}
            <div style={{ textAlign: 'center', marginBottom: '60px', maxWidth: '800px', margin: '0 auto' }}>
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
                <p style={{ color: '#64748b', fontSize: '1.2rem', lineHeight: '1.7', marginBottom: '40px' }}>
                    Insights, strategies, and updates to help you crack NSAT and master your tech career.
                </p>

                {/* Search and Filter */}
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                    <SearchBar onSearch={handleSearch} />
                    <CategoryFilter
                        categories={['all', ...tags.slice(0, 5)]}
                        selected={selectedCategory}
                        onChange={handleCategoryChange}
                    />
                </div>
            </div>

            {/* Popular Tags */}
            {tags?.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <TrendingUp size={20} color="#64748b" />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a' }}>Popular Topics</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {tags?.slice(0, 10)?.map((tag, index) => (
                            <button
                                key={index}
                                onClick={() => handleCategoryChange(tag)}
                                style={{
                                    background: selectedCategory === tag ? '#2563eb' : 'white',
                                    border: `1px solid ${selectedCategory === tag ? '#2563eb' : '#e2e8f0'}`,
                                    padding: '6px 16px',
                                    borderRadius: '100px',
                                    fontSize: '0.85rem',
                                    color: selectedCategory === tag ? 'white' : '#475569',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Blog Grid */}
            {currentPosts?.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '60px' }}>
                    <p>No posts found. Try a different search term or category.</p>
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '32px', marginBottom: '60px' }}>
                        {currentPosts?.map(blog => (
                            <article
                                key={blog?._id}
                                itemScope
                                itemType="https://schema.org/BlogPosting"
                                style={{ textDecoration: 'none', height: '100%' }}
                            >
                                <Link href={`/blogs/${blog.slug}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
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
                                            {blog?.image ? (
                                                <img
                                                    src={blog?.image}
                                                    alt={blog?.title}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        transition: 'transform 0.5s ease'
                                                    }}
                                                    onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                                                    onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#cbd5e1'
                                                }}>
                                                    <span style={{ fontSize: '3rem' }}>📝</span>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: '#64748b', marginBottom: '16px', flexWrap: 'wrap' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Calendar size={14} />
                                                    <time dateTime={new Date(blog?.createdAt).toISOString()}>
                                                        {new Date(blog?.createdAt).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </time>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={14} />
                                                    {calculateReadTime(blog?.content)} min read
                                                </div>
                                                {blog?.tags && blog?.tags?.length > 0 && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Tag size={14} />
                                                        {blog?.tags[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <h2 style={{
                                                fontSize: '1.25rem',
                                                fontWeight: '700',
                                                color: '#0f172a',
                                                marginBottom: '12px',
                                                lineHeight: '1.4'
                                            }}>
                                                {blog?.title}
                                            </h2>
                                            <p style={{
                                                color: '#64748b',
                                                fontSize: '0.95rem',
                                                lineHeight: '1.6',
                                                marginBottom: '24px',
                                                flex: 1
                                            }}>
                                                {blog?.content?.substring(0, 120)?.replace(/[#*_`]/g, '')}...
                                            </p>
                                            <div style={{
                                                color: '#2563eb',
                                                fontWeight: '600',
                                                fontSize: '0.9rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}>
                                                Read Article <ArrowRight size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                                {/* Microdata for search engines */}
                                <meta itemProp="datePublished" content={blog?.createdAt} />
                                <meta itemProp="author" content={blog?.author || 'Seedite Team'} />
                            </article>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    )}

                    {/* SEO Text Section */}
                    <div style={{
                        marginTop: '80px',
                        padding: '40px',
                        background: '#f8fafc',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0'
                    }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '16px', color: '#0f172a' }}>
                            About Seedite Blog
                        </h3>
                        <p style={{ color: '#64748b', lineHeight: '1.7', marginBottom: '16px' }}>
                            Welcome to the Seedite Blog, your ultimate resource for NSAT preparation, coding tutorials,
                            and tech career guidance. Our expert articles cover everything from exam strategies to
                            the latest trends in technology education.
                        </p>
                        <p style={{ color: '#64748b', lineHeight: '1.7' }}>
                            Explore our comprehensive guides on NSAT syllabus, coding interview preparation, algorithm
                            building, and more. Whether you're a beginner or an experienced developer, you'll find
                            valuable insights to accelerate your learning journey.
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
