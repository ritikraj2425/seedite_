'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Loader from '../components/ui/Loader';
import CourseCardSkeleton from '../components/ui/CourseCardSkeleton';
import Testimonials from '../components/Testimonials';
import Chatbot from '../components/ui/Chatbot';
import { BookOpen, Users, Award, CheckCircle, ArrowRight, Sparkles, Play, Target, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';


// StatCard component with counting animation
function StatCard({ number, suffix, label }) {
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);


    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isVisible) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.5 }
        );

        const element = document.getElementById(`stat-${label.replace(/\s+/g, '-')}`);
        if (element) observer.observe(element);

        return () => observer.disconnect();
    }, [label, isVisible]);

    useEffect(() => {
        if (!isVisible) return;

        let start = 0;
        const duration = 2000; // 2 seconds
        const increment = number / (duration / 16);

        const timer = setInterval(() => {
            start += increment;
            if (start >= number) {
                setCount(number);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [isVisible, number]);

    return (
        <div
            id={`stat-${label.replace(/\s+/g, '-')}`}
            className="stat-card"
            style={{
                position: 'relative',
                zIndex: 1,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.6s ease, transform 0.6s ease'
            }}
        >
            <div className="stat-number">{count}{suffix}</div>
            <div className="stat-label">{label}</div>
        </div>
    );
}

export default function HomeClient() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [founderVideoUrl, setFounderVideoUrl] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    
    // Carousel states
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Static thumbnail path - user to upload file here
    const THUMBNAIL_PATH = '/intro-thumbnail.png';

    // Detect mobile screen
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 768px)');
        setIsMobile(mq.matches);
        const handler = (e) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    useEffect(() => {
        // Check if user is logged in
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (savedUser.token) {
            setIsLoggedIn(true);
        }

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

        // Fetch signed embed URL for founder video
        fetch(`${API_URL}/api/public/founder-video`)
            .then(res => res.json())
            .then(data => {
                if (data?.embedUrl) setFounderVideoUrl(data.embedUrl);
            })
            .catch(err => console.error('Failed to fetch founder video URL', err));
    }, []);

    // Handle hash scroll when navigating from another page via FloatingChatButton
    useEffect(() => {
        if (window.location.hash === '#chatbot-section') {
            setTimeout(() => {
                const el = document.getElementById('chatbot-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 500); // Delay to allow page render
        }
    }, []);
    // Wait for courses to load to initialize carousel
    useEffect(() => {
        if (courses?.length > 0) {
            setCarouselIndex(courses.length); // Start at the middle set for infinite looping
        }
    }, [courses]);

    const handleNext = () => {
        if (isTransitioning || !courses || courses.length === 0) return;
        setIsTransitioning(true);
        setCarouselIndex(prev => prev + 1);
    };

    const handlePrev = () => {
        if (isTransitioning || !courses || courses.length === 0) return;
        setIsTransitioning(true);
        setCarouselIndex(prev => prev - 1);
    };

    const handleTransitionEnd = () => {
        setIsTransitioning(false);
        if (!courses) return;
        if (carouselIndex >= courses.length * 2) {
            // Jump back to middle set smoothly
            setCarouselIndex(carouselIndex - courses.length);
        } else if (carouselIndex < courses.length) {
            // Jump forward to middle set smoothly
            setCarouselIndex(carouselIndex + courses.length);
        }
    };


    return (
        <div style={{ paddingBottom: '120px' }}>
            {/* Hero Section with Gradient Background */}
            <section className="gradient-hero-bg" style={{ position: 'relative', overflow: 'hidden' }}>
                {/* Floating Particles */}
                <div className="hero-particle hero-particle-1" />
                <div className="hero-particle hero-particle-2" />
                <div className="hero-particle hero-particle-3" />
                <div className="hero-particle hero-particle-4" />
                <div className="hero-particle hero-particle-5" />
                <div className="hero-particle hero-particle-6" />

                {/* Floating Shapes */}
                <div className="hero-shape hero-shape-ring" />
                <div className="hero-shape hero-shape-square" />
                <div className="hero-shape hero-shape-dots" />

                <div className="container" style={{ paddingTop: '120px', paddingBottom: '100px', position: 'relative', zIndex: 1 }}>
                    <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
                        {/* Badge */}
                        <div className="hero-badge" style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
                            padding: '8px 16px',
                            borderRadius: '100px',
                            marginBottom: '24px',
                            border: '1px solid #bfdbfe'
                        }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e40af' }}>NSAT Preparation Platform</span>
                        </div>

                        <h1 className="hero-title hero-title-shimmer" style={{
                            color: '#0f172a',
                            marginBottom: '24px',
                            letterSpacing: '-0.03em',
                            fontWeight: 800,
                        }}>
                            NSAT, Interviews & Pre-College Foundations               </h1>

                        <p className="hero-subtitle" style={{
                            fontSize: '1.2rem',
                            color: '#64748b',
                            maxWidth: '600px',
                            margin: '0 auto 40px',
                            lineHeight: '1.7'
                        }}>
                            Prepare for NST with structured NSAT mocks, interview guidance, and pre-college foundations built from real student experience.                            </p>

                        <div className="hero-cta" style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '60px' }}>
                            <Link href="/courses">
                                <Button className="hero-cta-button" style={{
                                    fontSize: '1.1rem',
                                    padding: '16px 32px',
                                    borderRadius: '12px',
                                    background: 'var(--gradient-primary)',
                                    boxShadow: '0 8px 30px -4px rgba(37, 99, 235, 0.35)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    Start NSAT Preparation
                                    <ArrowRight size={20} />
                                </Button>
                            </Link>
                            {isLoggedIn && (
                                <Link href="/dashboard">
                                    <Button variant="outline" className="hero-cta-button" style={{
                                        fontSize: '1.1rem',
                                        padding: '16px 32px',
                                        borderRadius: '12px',
                                        background: 'white',
                                        borderColor: '#e2e8f0',
                                        color: '#0f172a'
                                    }}>
                                        <Play size={18} style={{ marginRight: '4px' }} />
                                        Go to Dashboard
                                    </Button>
                                </Link>
                            )}
                        </div>

                        {/* Trust Badge */}
                        <div className="hero-trust-badge" style={{
                            maxWidth: 'max-content',
                            margin: '0 auto',
                            padding: '16px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '16px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.08)'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                flexShrink: 0
                            }}>
                                <Image
                                    src="/nstlogo.png"
                                    alt="NST Logo"
                                    width={32}
                                    height={32}
                                    style={{ objectFit: 'contain' }}
                                />
                            </div>
                            <span style={{
                                fontSize: '0.95rem',
                                fontWeight: '500',
                                color: '#475569',
                                lineHeight: '1.4'
                            }}>
                                Course content developed with guidance from the <strong style={{ color: '#0f172a' }}>NSAT team of NST</strong>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Decorative Gradient Orbs */}
                <div style={{
                    position: 'absolute',
                    top: '10%',
                    right: '5%',
                    width: '300px',
                    height: '300px',
                    background: 'radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, transparent 70%)',
                    borderRadius: '50%',
                    filter: 'blur(40px)',
                    pointerEvents: 'none',
                    animation: 'glowPulse 5s ease-in-out infinite'
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '10%',
                    left: '5%',
                    width: '250px',
                    height: '250px',
                    background: 'radial-gradient(circle, rgba(124, 58, 237, 0.12) 0%, transparent 70%)',
                    borderRadius: '50%',
                    filter: 'blur(40px)',
                    pointerEvents: 'none',
                    animation: 'glowPulse 7s ease-in-out infinite',
                    animationDelay: '1s'
                }} />
                <div style={{
                    position: 'absolute',
                    top: '40%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '400px',
                    height: '400px',
                    background: 'radial-gradient(circle, rgba(6, 182, 212, 0.06) 0%, transparent 70%)',
                    borderRadius: '50%',
                    filter: 'blur(60px)',
                    pointerEvents: 'none',
                    animation: 'glowPulse 9s ease-in-out infinite',
                    animationDelay: '2s'
                }} />
            </section>

            <div className="container">
                {/* Stats Section */}
                <section style={{
                    marginTop: '-40px',
                    marginBottom: '100px',
                    position: 'relative',
                    zIndex: 2
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '24px',
                        background: 'white',
                        borderRadius: '20px',
                        padding: '32px',
                        boxShadow: '0 20px 60px -10px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #e2e8f0',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <StatCard number={200} suffix="+" label="NSAT-Style Questions Explained" />
                        <StatCard number={30} suffix="+" label="Hours of Content" />
                        <StatCard number={10} suffix="+" label="Mock Tests" />
                        <StatCard number={95} suffix="%" label="Success Rate" />
                    </div>
                </section>

                {/* Founder Video Section */}
                <section style={{ marginBottom: '120px' }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#f1f5f9',
                            padding: '6px 14px',
                            borderRadius: '100px',
                            marginBottom: '16px',
                        }}>
                            <Play size={13} color="#2563eb" fill="#2563eb" />
                            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', letterSpacing: '0.05em' }}>From the Founders</span>
                        </div>
                        <h2 className="section-title" style={{ marginBottom: '12px' }}>Why We Built Seedite</h2>

                    </div>

                    {/* Video card */}
                    <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
                        {/* Gradient border effect */}
                        <div style={{
                            position: 'absolute',
                            inset: '-2px',
                            borderRadius: '22px',
                            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #06b6d4 100%)',
                            zIndex: 0,
                            opacity: 0.6,
                        }} />

                        {/* Card shell */}
                        <div style={{
                            position: 'relative',
                            zIndex: 1,
                            borderRadius: '20px',
                            overflow: 'hidden',
                            background: '#0f172a',
                            boxShadow: '0 32px 64px -16px rgba(37,99,235,0.2), 0 0 0 1px rgba(255,255,255,0.06)',
                        }}>
                            {/* Top bar — like a browser chrome */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 16px',
                                background: 'rgba(255,255,255,0.04)',
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                            }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f57' }} />
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#febc2e' }} />
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#28c840' }} />
                                <div style={{
                                    flex: 1,
                                    marginLeft: '8px',
                                    height: '24px',
                                    borderRadius: '6px',
                                    background: 'rgba(255,255,255,0.06)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    paddingLeft: '10px',
                                    gap: '6px',
                                }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 6px #22d3ee' }} />
                                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>seedite.in · founders video</span>
                                </div>
                            </div>

                            {/* Video iframe — only rendered after user clicks play */}
                            <div className="video-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
                                {isPlaying && !isVideoLoaded && (
                                    <div style={{
                                        position: 'absolute', inset: 0,
                                        background: '#0f172a',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        zIndex: 1
                                    }}>
                                        <Loader2 size={40} color="#22d3ee" className="animate-spin" style={{ marginBottom: '16px' }} />
                                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>Loading Video...</p>
                                    </div>
                                )}
                                {isPlaying && founderVideoUrl && (
                                    <iframe
                                        src={`${founderVideoUrl}&autoplay=true`}
                                        style={{
                                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none',
                                            zIndex: 2,
                                            opacity: isVideoLoaded ? 1 : 0,
                                            transition: 'opacity 0.3s ease'
                                        }}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share; keyboard-map"
                                        allowFullScreen
                                        loading="eager"
                                        referrerPolicy="no-referrer"
                                        playsInline
                                        title="Seedite Founders Video"
                                        onLoad={() => setIsVideoLoaded(true)}
                                    />
                                )}

                                {/* Thumbnail overlay — shown until the user clicks play */}
                                {!isPlaying && (
                                    <div
                                        onClick={() => setIsPlaying(true)}
                                        style={{
                                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                            cursor: 'pointer', zIndex: 2,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        <Image
                                            src={THUMBNAIL_PATH}
                                            alt="Founder Video Thumbnail"
                                            fill
                                            style={{ objectFit: 'cover' }}
                                            sizes="(max-width: 768px) 100vw, 900px"
                                            priority
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            background: 'linear-gradient(to top, rgba(15,23,42,0.8) 0%, rgba(15,23,42,0.2) 50%, rgba(15,23,42,0.4) 100%)',
                                        }} />

                                        <div style={{
                                            position: 'relative', zIndex: 2,
                                            width: '80px', height: '80px',
                                            borderRadius: '50%',
                                            background: 'rgba(255, 255, 255, 0.2)',
                                            backdropFilter: 'blur(8px)',
                                            border: '1px solid rgba(255, 255, 255, 0.3)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                                            transition: 'transform 0.3s ease, background 0.3s ease'
                                        }} className="play-button-hover">
                                            <div style={{
                                                width: '64px', height: '64px',
                                                borderRadius: '50%',
                                                background: '#fff',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                            }}>
                                                <Play size={28} fill="#2563eb" color="#2563eb" style={{ marginLeft: '4px' }} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Fallback if video URL hasn't loaded yet */}
                                {!founderVideoUrl && !isPlaying && (
                                    <div style={{
                                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#94a3b8', fontSize: '0.9rem'
                                    }}>
                                        Loading video...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Founder credit */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        marginTop: '28px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{
                                width: '34px', height: '34px', borderRadius: '50%',
                                overflow: 'hidden', border: '2px solid #e2e8f0',
                                position: 'relative', flexShrink: 0,
                                boxShadow: '0 0 0 3px rgba(37,99,235,0.1)',
                            }}>
                                <Image src="/ritik.png" alt="Ritik Raj" fill style={{ objectFit: 'cover' }} />
                            </div>
                            <div style={{
                                width: '34px', height: '34px', borderRadius: '50%',
                                overflow: 'hidden', border: '2px solid #e2e8f0',
                                position: 'relative', flexShrink: 0, marginLeft: '-10px',
                                boxShadow: '0 0 0 3px rgba(124,58,237,0.1)',
                            }}>
                                <Image src="/amod.jpg" alt="Amod Ranjan" fill style={{ objectFit: 'cover' }} />
                            </div>
                        </div>
                        <span style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: '500' }}>
                            <strong style={{ color: '#0f172a' }}>Ritik & Amod</strong> · Co-founders, NST students
                        </span>
                    </div>
                </section>

                {/* Features Section */}
                <section style={{ marginBottom: '120px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#f1f5f9',
                            padding: '6px 14px',
                            borderRadius: '100px',
                            marginBottom: '16px'
                        }}>
                            <Target size={14} color="#64748b" />
                            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', letterSpacing: '0.05em' }}>Why Seedite for NSAT?</span>
                        </div>
                        <h2 className="section-title" style={{ marginBottom: '16px' }}>Why Choose Seedite?</h2>
                        <p style={{ color: '#64748b', maxWidth: '500px', margin: '0 auto', fontSize: '1.05rem' }}>
                            One place for all your NSAT preparation needs.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
                        <div className="modern-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                            <div className="icon-box">
                                <BookOpen size={26} color="#0f172a" strokeWidth={1.5} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', fontWeight: '700', color: '#0f172a' }}>NSAT-Focused Mock Practice</h3>
                            <p style={{ color: '#64748b', lineHeight: '1.7', fontSize: '1rem' }}>
                                Topic-wise and full-length mocks designed to match NSAT difficulty, pattern, and thinking style not generic aptitude tests.
                            </p>
                        </div>

                        <div className="modern-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                            <div className="icon-box">
                                <Award size={26} color="#0f172a" strokeWidth={1.5} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', fontWeight: '700', color: '#0f172a' }}>Built from Real NST Experience</h3>
                            <p style={{ color: '#64748b', lineHeight: '1.7', fontSize: '1rem' }}>
                                Preparation strategy shaped by NST students who've cleared NSAT, faced the interview, and know where one can usually go wrong.
                            </p>
                        </div>

                        <div className="modern-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                            <div className="icon-box">
                                <CheckCircle size={26} color="#0f172a" strokeWidth={1.5} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', fontWeight: '700', color: '#0f172a' }}>Concepts Clarity</h3>
                            <p style={{ color: '#64748b', lineHeight: '1.7', fontSize: '1rem' }}>
                                Step-by-step video explanations that help you think like NSAT expects not just memorize answers.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Featured Courses Section — Manual Arrow Scroll */}
                <section style={{ marginBottom: '120px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <h2 className="section-title" style={{ marginBottom: '8px', textAlign: 'left' }}>Featured Courses</h2>
                            <p style={{ color: '#64748b', fontSize: '1rem' }}>Start your journey with our most popular courses</p>
                        </div>
                        <Link href="/courses">
                            <Button variant="outline" style={{
                                borderRadius: '100px',
                                fontSize: '0.9rem',
                                padding: '12px 24px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                View All
                                <ArrowRight size={16} />
                            </Button>
                        </Link>
                    </div>

                    {loading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '28px' }}>
                            {Array(3).fill(0).map((_, i) => <CourseCardSkeleton key={i} />)}
                        </div>
                    ) : courses?.length > 0 ? (
                        <div className="courses-carousel-wrapper">
                            {/* Left Arrow */}
                            <button
                                className="carousel-arrow carousel-arrow--left"
                                onClick={handlePrev}
                                aria-label="Scroll left"
                            >
                                <ChevronLeft size={22} />
                            </button>

                            {/* Scroll Track */}
                            <div 
                                className="courses-scroll-track infinite-carousel-track"
                                style={{
                                    '--carousel-transform': `translateX(calc(-${carouselIndex} * (360px + 28px)))`,
                                    '--carousel-transition': isTransitioning ? 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)' : 'none'
                                }}
                                onTransitionEnd={handleTransitionEnd}
                            >
                                {/* On mobile: render actual courses (max 3), on desktop: 3 cloned sets for infinite scroll */}
                                {(isMobile
                                    ? [...courses].reverse().slice(0, 3).map((course, index) => (
                                        <div key={`mobile-${course?._id}`} className="carousel-card modern-card" style={{
                                            padding: '0',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            border: '1px solid #e2e8f0',
                                            position: 'relative',
                                        }}>
                                            {index === 0 && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '16px',
                                                    left: '16px',
                                                    zIndex: 2,
                                                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                                    color: '#b45309',
                                                    padding: '4px 12px',
                                                    borderRadius: '100px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.02em'
                                                }}>
                                                    Popular
                                                </div>
                                            )}
                                            <div style={{
                                                height: '200px',
                                                background: '#f8fafc',
                                                position: 'relative',
                                                borderBottom: '1px solid #f1f5f9',
                                                overflow: 'hidden'
                                            }}>
                                                <img
                                                    src={course?.thumbnail}
                                                    alt={course?.title}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                            </div>
                                            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', fontWeight: '700', color: '#0f172a' }}>{course?.title}</h3>
                                                <p style={{ color: '#64748b', fontSize: '0.95rem', flex: 1, marginBottom: '20px', lineHeight: '1.6' }}>
                                                    {course?.description?.substring(0, 90)}...
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
                                                            fontSize: '1.1rem',
                                                            fontWeight: '700',
                                                            color: '#eab308',
                                                            background: '#fefce8',
                                                            padding: '8px 16px',
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
                                                            <span style={{ fontSize: '0.9rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                                                                ₹{course?.originalPrice || Math.round(course?.price * 1.5)}
                                                            </span>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{ fontSize: '1.35rem', fontWeight: '700', color: '#0f172a' }}>₹{course.price}</span>
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
                                                            <span style={{
                                                                fontSize: '0.95rem',
                                                                fontWeight: '600',
                                                                color: '#2563eb',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}>
                                                                View Details
                                                                <ArrowRight size={16} />
                                                            </span>
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                    : [...Array(3)].map((_, setIndex) => (
                                        [...courses].reverse().map((course, index) => (
                                            <div key={`carousel-${setIndex}-${course?._id}`} className="carousel-card modern-card" style={{
                                                padding: '0',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                border: '1px solid #e2e8f0',
                                                position: 'relative',
                                            }}>
                                                {index === 0 && setIndex === 1 && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '16px',
                                                        left: '16px',
                                                        zIndex: 2,
                                                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                                        color: '#b45309',
                                                        padding: '4px 12px',
                                                        borderRadius: '100px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '700',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.02em'
                                                    }}>
                                                        Popular
                                                    </div>
                                                )}
                                                <div style={{
                                                    height: '200px',
                                                    background: '#f8fafc',
                                                    position: 'relative',
                                                    borderBottom: '1px solid #f1f5f9',
                                                    overflow: 'hidden'
                                                }}>
                                                    <img
                                                        src={course?.thumbnail}
                                                        alt={course?.title}
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
                                                <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', fontWeight: '700', color: '#0f172a' }}>{course?.title}</h3>
                                                    <p style={{ color: '#64748b', fontSize: '0.95rem', flex: 1, marginBottom: '20px', lineHeight: '1.6' }}>
                                                        {course?.description?.substring(0, 90)}...
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
                                                                fontSize: '1.1rem',
                                                                fontWeight: '700',
                                                                color: '#eab308',
                                                                background: '#fefce8',
                                                                padding: '8px 16px',
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
                                                                <span style={{ fontSize: '0.9rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                                                                    ₹{course?.originalPrice || Math.round(course?.price * 1.5)}
                                                                </span>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <span style={{ fontSize: '1.35rem', fontWeight: '700', color: '#0f172a' }}>₹{course.price}</span>
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
                                                                <span style={{
                                                                    fontSize: '0.95rem',
                                                                    fontWeight: '600',
                                                                    color: '#2563eb',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px'
                                                                }}>
                                                                    View Details
                                                                    <ArrowRight size={16} />
                                                                </span>
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ))
                                )}
                            </div>

                            {/* Right Arrow */}
                            <button
                                className="carousel-arrow carousel-arrow--right"
                                onClick={handleNext}
                                aria-label="Scroll right"
                            >
                                <ChevronRight size={22} />
                            </button>
                        </div>
                    ) : (
                        <p style={{ color: '#64748b', textAlign: 'center' }}>No courses available yet.</p>
                    )}
                </section>

                {/* Instructors Section */}
                <section style={{ marginBottom: '80px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 className="section-title" style={{ marginBottom: '16px' }}>Meet Our Experts</h2>
                        <p style={{ color: '#64748b', maxWidth: '500px', margin: '0 auto', fontSize: '1.05rem' }}>
                            Learn from the best - our instructors bring real NSAT experience
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', maxWidth: '1200px', margin: '0 auto' }}>
                        <div className="modern-card" style={{ textAlign: 'center', padding: '40px 28px' }}>
                            <div style={{
                                width: '110px',
                                height: '110px',
                                borderRadius: '50%',
                                margin: '0 auto 20px',
                                position: 'relative',
                                overflow: 'hidden',
                                border: '3px solid #e2e8f0',
                                boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.1)'
                            }}>
                                <Image
                                    src="/ritik.png"
                                    alt="Ritik Raj"
                                    fill
                                    style={{ objectFit: 'cover' }}
                                />
                            </div>
                            <h3 style={{ fontSize: '1.15rem', marginBottom: '6px', fontWeight: '700', color: '#0f172a' }}>Ritik Raj</h3>
                            <p style={{
                                color: 'white',
                                fontWeight: '600',
                                fontSize: '0.8rem',
                                marginBottom: '12px',
                                background: 'var(--gradient-primary)',
                                padding: '4px 14px',
                                borderRadius: '100px',
                                display: 'inline-block'
                            }}>Ex-SDE Intern @Physics Wallah</p>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                Third year BTech student at NST
                            </p>
                        </div>

                        <div className="modern-card" style={{ textAlign: 'center', padding: '40px 28px' }}>
                            <div style={{
                                width: '110px',
                                height: '110px',
                                borderRadius: '50%',
                                margin: '0 auto 20px',
                                position: 'relative',
                                overflow: 'hidden',
                                border: '3px solid #e2e8f0',
                                boxShadow: '0 0 0 4px rgba(124, 58, 237, 0.1)'
                            }}>
                                <Image
                                    src="/amod.jpg"
                                    alt="Amod Ranjan"
                                    fill
                                    style={{ objectFit: 'cover' }}
                                />
                            </div>
                            <h3 style={{ fontSize: '1.15rem', marginBottom: '6px', fontWeight: '700', color: '#0f172a' }}>Amod Ranjan</h3>
                            <p style={{
                                color: 'white',
                                fontWeight: '600',
                                fontSize: '0.8rem',
                                marginBottom: '12px',
                                background: 'var(--gradient-primary)',
                                padding: '4px 14px',
                                borderRadius: '100px',
                                display: 'inline-block'
                            }}>2x ICPC Regionalist | 1x ICPC Asia-West</p>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                Third year BTech student at NST
                            </p>
                        </div>

                        <div className="modern-card" style={{ textAlign: 'center', padding: '40px 28px' }}>
                            <div style={{
                                width: '110px',
                                height: '110px',
                                borderRadius: '50%',
                                margin: '0 auto 20px',
                                position: 'relative',
                                overflow: 'hidden',
                                border: '3px solid #e2e8f0',
                                boxShadow: '0 0 0 4px rgba(124, 58, 237, 0.1)'
                            }}>
                                <Image
                                    src="/jigyashu.jpeg"
                                    alt="Jigyasu"
                                    fill
                                    style={{ objectFit: 'cover' }}
                                />
                            </div>
                            <h3 style={{ fontSize: '1.15rem', marginBottom: '6px', fontWeight: '700', color: '#0f172a' }}>Jigyasu Kalyan</h3>
                            <p style={{
                                color: 'white',
                                fontWeight: '600',
                                fontSize: '0.8rem',
                                marginBottom: '12px',
                                background: 'var(--gradient-primary)',
                                padding: '4px 14px',
                                borderRadius: '100px',
                                display: 'inline-block'
                            }}>1x ICPC Asia-West</p>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                Second year BTech student at NST
                            </p>
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <Testimonials />

                {/* Chatbot Section — placed after testimonials, right before CTA for maximum conversion */}
                <div id="chatbot-section" style={{ marginBottom: '80px', scrollMarginTop: '100px' }}>
                    <Chatbot />
                </div>

                {/* CTA Section */}
                <section style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    borderRadius: '24px',
                    padding: '60px 40px',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h2 style={{
                            color: 'white',
                            fontSize: '2rem',
                            fontWeight: '700',
                            marginBottom: '16px',
                            background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            Ready to Prepare for NSAT the Right Way?
                        </h2>
                        <p style={{ color: '#94a3b8', marginBottom: '32px', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 32px' }}>
                            Stop guessing. Start preparing with structure, clarity, and real NST guidance.
                        </p>
                        <Link href={isLoggedIn ? "/dashboard" : "/signup"}>
                            <Button style={{
                                padding: '16px 40px',
                                fontSize: '1.1rem',
                                borderRadius: '12px',
                                boxShadow: '0 8px 30px -4px rgba(37, 99, 235, 0.5)'
                            }}>
                                {isLoggedIn ? "Go to Dashboard" : "Get Started for Free"}
                                <ArrowRight size={20} style={{ marginLeft: '8px' }} />
                            </Button>
                        </Link>
                    </div>

                    {/* Decorative circles */}
                    <div style={{
                        position: 'absolute',
                        top: '-50px',
                        right: '-50px',
                        width: '200px',
                        height: '200px',
                        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.3) 0%, transparent 70%)',
                        borderRadius: '50%',
                        pointerEvents: 'none'
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: '-30px',
                        left: '-30px',
                        width: '150px',
                        height: '150px',
                        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.3) 0%, transparent 70%)',
                        borderRadius: '50%',
                        pointerEvents: 'none'
                    }} />
                </section>
            </div>
        </div>
    );
}
