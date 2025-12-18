'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Button from './ui/Button';
import { useState, useEffect, useRef } from 'react';
import { User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';

const Navbar = () => {
    const pathname = usePathname();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const checkAuth = () => {
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                setIsLoggedIn(true);
                setUser(JSON.parse(savedUser));
            } else {
                setIsLoggedIn(false);
                setUser(null);
            }
        };

        checkAuth();

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [pathname]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        document.cookie = 'token=; Max-Age=0; path=/;';
        setIsLoggedIn(false);
        setUser(null);
        window.location.href = '/login';
    };

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <nav className="glass-nav">
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>

                {/* --- Logo --- */}
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', zIndex: 101 }}>
                    <div style={{ width: '32px', height: '32px', background: '#000', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '20px' }}>S</div>
                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', letterSpacing: '-0.5px' }}>Seedite.</span>
                </Link>

                {/* --- DESKTOP Menu --- */}
                <div className="desktop-only" style={{ alignItems: 'center', gap: '40px', width: '100%', justifyContent: 'space-between', marginLeft: '40px' }}>
                    <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                        <Link href="/courses" style={{ color: pathname === '/courses' ? '#2563eb' : '#64748b', fontWeight: 500, transition: 'color 0.2s' }}>Courses</Link>
                        {isLoggedIn && (
                            <>
                                <Link href="/dashboard" style={{ color: pathname === '/dashboard' ? '#2563eb' : '#64748b', fontWeight: 500, transition: 'color 0.2s' }}>Dashboard</Link>
                                <Link href="/dashboard/announcements" style={{ color: pathname === '/dashboard/announcements' ? '#2563eb' : '#64748b', fontWeight: 500, transition: 'color 0.2s' }}>Announcements</Link>
                            </>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {isLoggedIn ? (
                            <div style={{ position: 'relative' }} ref={dropdownRef}>
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                                >
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f1f5f9', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '1px solid #e2e8f0' }}>
                                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <ChevronDown size={14} color="#64748b" />
                                </button>

                                {showDropdown && (
                                    <div style={{
                                        position: 'absolute', top: '48px', right: '0', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', width: '200px', padding: '8px', zIndex: 50
                                    }}>
                                        <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', marginBottom: '8px' }}>
                                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{user?.name}</p>
                                            <p style={{ fontSize: '12px', color: '#64748b' }}>{user?.email}</p>
                                        </div>
                                        <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', color: '#475569', fontSize: '14px', borderRadius: '6px' }}>
                                            <User size={16} /> Profile
                                        </Link>
                                        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', color: '#475569', fontSize: '14px', borderRadius: '6px' }}>
                                            <LayoutDashboard size={16} /> Dashboard
                                        </Link>
                                        <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', color: '#ef4444', fontSize: '14px', borderRadius: '6px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                                            <LogOut size={16} /> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link href="/login"><Button variant="outline" style={{ border: 'none', color: '#64748b' }}>Login</Button></Link>
                                <Link href="/signup"><Button style={{ borderRadius: '50px', padding: '10px 24px' }}>Sign Up</Button></Link>
                            </>
                        )}
                    </div>
                </div>

                {/* --- MOBILE Hamburger --- */}
                <button
                    className="mobile-only"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    style={{ background: 'transparent', padding: '8px', zIndex: 101 }}
                >
                    <div style={{ width: '24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ display: 'block', width: '100%', height: '2px', background: '#0f172a', transition: 'all 0.3s', transform: isMobileMenuOpen ? 'rotate(45deg) translate(6px, 6px)' : 'none' }}></span>
                        <span style={{ display: 'block', width: '100%', height: '2px', background: '#0f172a', transition: 'all 0.3s', opacity: isMobileMenuOpen ? 0 : 1 }}></span>
                        <span style={{ display: 'block', width: '100%', height: '2px', background: '#0f172a', transition: 'all 0.3s', transform: isMobileMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }}></span>
                    </div>
                </button>

                {/* --- MOBILE Menu Overlay --- */}
                {isMobileMenuOpen && (
                    <div className="mobile-only" style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'white', zIndex: 100,
                        flexDirection: 'column', padding: '80px 24px 24px', alignItems: 'center', gap: '24px'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', background: 'white', backdropFilter: 'blur(12px)', padding: '8px 12px', borderRadius: '6px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                            <Link href="/courses" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>Courses</Link>
                            {isLoggedIn && (
                                <>
                                    <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>Dashboard</Link>
                                    <Link href="/dashboard/announcements" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>Announcements</Link>
                                </>
                            )}

                            <div style={{ width: '100%', height: '1px', background: '#e2e8f0' }}></div>

                            {isLoggedIn ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontWeight: 600 }}>{user?.name}</p>
                                        <p style={{ fontSize: '0.9rem', color: '#64748b' }}>{user?.email}</p>
                                    </div>
                                    <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><User size={20} /> Profile</Link>
                                    <button onClick={handleLogout} style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent' }}><LogOut size={20} /> Logout</button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', alignItems: 'center' }}>
                                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} style={{ width: '100%' }}>
                                        <Button variant="outline" style={{ width: '100%', justifyContent: 'center' }}>Login</Button>
                                    </Link>
                                    <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)} style={{ width: '100%' }}>
                                        <Button style={{ width: '100%', justifyContent: 'center' }}>Sign Up</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;