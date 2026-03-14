'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { API_URL } from '@/lib/api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Loader from '../../components/ui/Loader';
import CourseCardSkeleton from '../../components/ui/CourseCardSkeleton';
import { BookOpen, Search, ArrowRight } from 'lucide-react';

export default function Courses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/api/courses`)
            .then(res => res.json())
            .then(data => {
                setCourses(data?.reverse());
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch courses', err);
                setLoading(false);
            });
    }, []);

    return (
        <>
            <Head>
                <title>Explore Premium Courses | Seedite</title>
                <meta name="description" content="Find the perfect course to accelerate your NSAT preparation journey. Browse our collection of expert-led courses." />
                <meta property="og:title" content="Explore Premium Courses | Seedite" />
                <meta property="og:description" content="Find the perfect course to accelerate your NSAT preparation journey." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://seedite.com/courses" />
            </Head>
            <div style={{ minHeight: '100vh' }}>
                {/* Header Section */}
                <div style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderBottom: '1px solid #e2e8f0',
                    padding: '60px 0 50px',
                    marginBottom: '40px'
                }}>
                    <div className="container">
                        <div style={{ maxWidth: '600px' }}>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'white',
                                padding: '6px 14px',
                                borderRadius: '100px',
                                marginBottom: '16px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <BookOpen size={14} color="#2563eb" />
                                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#2563eb' }}>Courses</span>
                            </div>
                            <h1 style={{
                                fontSize: '2.25rem',
                                marginBottom: '12px',
                                background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>
                                Explore All Courses
                            </h1>
                            <p style={{ color: '#64748b', fontSize: '1.1rem', lineHeight: '1.6' }}>
                                Find the perfect course to accelerate your NSAT preparation journey
                            </p>
                        </div>
                    </div>
                </div>

                <div className="container" style={{ paddingBottom: '80px' }}>
                    {loading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '28px' }}>
                            {Array(6).fill(0).map((_, i) => <CourseCardSkeleton key={i} />)}
                        </div>
                    ) : courses?.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '28px' }}>
                            {[...courses]?.reverse().map((course, index) => (
                                <div key={course?._id} className="modern-card" style={{
                                    padding: '0',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'relative'
                                }}>
                                    <div style={{
                                        height: '180px',
                                        background: '#f1f5f9',
                                        overflow: 'hidden'
                                    }}>
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                transition: 'transform 0.3s ease'
                                            }}
                                            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                                            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                                        />
                                    </div>
                                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <h3 style={{
                                            fontSize: '1.15rem',
                                            marginBottom: '8px',
                                            color: '#0f172a',
                                            fontWeight: '700'
                                        }}>
                                            {course.title}
                                        </h3>
                                        <p style={{
                                            color: '#64748b',
                                            fontSize: '0.9rem',
                                            flex: 1,
                                            marginBottom: '16px',
                                            lineHeight: '1.6',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}>
                                            {course?.description?.substring(0, 100)}...
                                        </p>
                                        {course?.launchLater ? (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '100%',
                                                paddingTop: '16px',
                                                borderTop: '1px solid #f1f5f9'
                                            }}>
                                                <span style={{
                                                    fontSize: '1.0rem',
                                                    fontWeight: '700',
                                                    color: '#eab308',
                                                    background: '#fefce8',
                                                    padding: '6px 14px',
                                                    borderRadius: '100px',
                                                    border: '1px solid #fef08a'
                                                }}>
                                                    {course?.launchDateText || "Coming Soon"}
                                                </span>
                                            </div>
                                        ) : (
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                paddingTop: '16px',
                                                borderTop: '1px solid #f1f5f9'
                                            }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '0.9rem', color: '#94a3b8', textDecoration: 'line-through', lineHeight: 1 }}>
                                                        ₹{course?.originalPrice || Math.round(course?.price * 1.5)}
                                                    </span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{
                                                            fontSize: '1.3rem',
                                                            fontWeight: '700',
                                                            color: '#0f172a'
                                                        }}>
                                                            ₹{course?.price}
                                                        </span>
                                                        <span style={{
                                                            fontSize: '0.75rem',
                                                            fontWeight: '700',
                                                            color: '#16a34a',
                                                            background: '#dcfce7',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px'
                                                        }}>
                                                            {Math.round(((course?.originalPrice || Math.round(course?.price * 1.5)) - course?.price) / (course?.originalPrice || Math.round(course?.price * 1.5)) * 100)}% OFF
                                                        </span>
                                                    </div>
                                                </div>
                                                <Link href={`/courses/${course?._id}`}>
                                                    <Button variant="outline" style={{
                                                        fontSize: '0.85rem',
                                                        padding: '10px 16px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}>
                                                        View Details
                                                        <ArrowRight size={14} />
                                                    </Button>
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Card style={{ textAlign: 'center', padding: '80px 40px' }}>
                            <BookOpen size={48} color="#94a3b8" style={{ marginBottom: '16px' }} />
                            <h3 style={{ marginBottom: '8px', color: '#0f172a' }}>No Courses Available</h3>
                            <p style={{ color: '#64748b' }}>Check back soon for new courses!</p>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
}
