'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import Button from './ui/Button';
import { useState, useEffect, useRef } from 'react';
import { User, LogOut, LayoutDashboard, ChevronDown, Menu, Bell } from 'lucide-react';
import Image from 'next/image';
import { API_URL } from '@/lib/api';

const NavLink = ({ href, children, active, className = "" }) => (
    <Link
        href={href}
        className={`${active ? "navbar__link navbar__link--active" : "navbar__link"} ${className}`}
    >
        {children}
    </Link>
);
const Navbar = () => {
    const pathname = usePathname();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch unread announcement count for logged-in users
    useEffect(() => {
        if (!isLoggedIn) { setUnreadCount(0); return; }
        const fetchUnread = async () => {
            try {
                const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
                if (!savedUser.token) return;
                const res = await fetch(`${API_URL}/api/announcements/unread-count`, {
                    headers: { 'Authorization': `Bearer ${savedUser.token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUnreadCount(data.count || 0);
                }
            } catch { }
        };
        fetchUnread();
    }, [isLoggedIn, pathname]);

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

    useEffect(() => {
        if (isSidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isSidebarOpen]);

    useEffect(() => {
        const onEscape = (e) => {
            if (e.key === 'Escape') setIsSidebarOpen(false);
        };
        if (isSidebarOpen) {
            window.addEventListener('keydown', onEscape);
            return () => window.removeEventListener('keydown', onEscape);
        }
    }, [isSidebarOpen]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        document.cookie = 'token=; Max-Age=0; path=/;';
        setIsLoggedIn(false);
        setUser(null);
        window.location.href = '/login';
    };

    const closeSidebar = () => setIsSidebarOpen(false);

    const isSidebarLinkActive = (href) => {
        if (href === '/blogs') return pathname.startsWith('/blogs');
        if (href === '/iq-tests') return pathname.startsWith('/iq-tests');
        if (href === '/dashboard') return pathname === '/dashboard';
        if (href === '/dashboard/announcements') return pathname.startsWith('/dashboard/announcements');
        return pathname === href;
    };

    const sidebarLink = (href, label) => (
        <Link
            href={href}
            onClick={closeSidebar}
            className={`navbar-sidebar__link ${isSidebarLinkActive(href) ? 'navbar-sidebar__link--active' : ''}`}
        >
            {label}
        </Link>
    );

    return (
        <nav className="glass-nav">
            {/* --- DESKTOP --- */}
            <div className="navbar-desktop" style={{ width: '100%', height: '100%' }}>
                <div className="navbar-inner">
                    <Link href="/" className="navbar__logo">
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px'
                        }}>
                            <Image src="/logo.png" alt="Logo" width={40} height={40} />
                        </div>
                        <span>Seedite</span>
                    </Link>

                    <div className="navbar__center">
                        <NavLink href="/courses" active={pathname === '/courses'}>Courses</NavLink>
                        {isLoggedIn && (
                            <>
                                <NavLink href="/dashboard" active={pathname === '/dashboard'}>Dashboard</NavLink>
                                <NavLink href="/dashboard/announcements" active={pathname === '/dashboard/announcements'}>
                                    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        Announcements
                                        {unreadCount > 0 && (
                                            <span style={{
                                                background: '#ef4444',
                                                color: 'white',
                                                fontSize: '0.65rem',
                                                fontWeight: 700,
                                                minWidth: '18px',
                                                height: '18px',
                                                borderRadius: '9px',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '0 5px',
                                                lineHeight: 1,
                                            }}>
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </span>
                                </NavLink>
                            </>
                        )}
                        <NavLink href="/blogs" active={pathname.startsWith('/blogs')}>Blogs</NavLink>
                        <NavLink
                            className="shimmer-link"
                            style={{ textDecoration: "underline" }}
                            href="/iq-tests"
                            active={pathname.startsWith('/iq-tests')}
                        >
                            Test your IQ
                        </NavLink>
                    </div>

                    <div className="navbar__right">
                        {isLoggedIn ? (
                            <div style={{ position: 'relative' }} ref={dropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '6px 10px',
                                        borderRadius: '10px',
                                        transition: 'background 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <div style={{
                                        width: '38px',
                                        height: '38px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                                        color: 'var(--foreground)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700,
                                        fontSize: '0.95rem',
                                        border: '1px solid #e2e8f0',
                                    }}>
                                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <ChevronDown size={16} color="var(--text-muted)" />
                                </button>

                                {showDropdown && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 'calc(100% + 8px)',
                                        right: 0,
                                        background: '#ffffff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)',
                                        width: 'fit-content',
                                        padding: '8px',
                                        zIndex: 9999,
                                    }}>
                                        <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', marginBottom: '6px' }}>
                                            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--foreground)' }}>{user?.name}</p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.email}</p>
                                        </div>
                                        <Link
                                            href="/profile"
                                            onClick={() => setShowDropdown(false)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', color: '#475569', fontSize: '0.9rem', borderRadius: '8px', transition: 'background 0.2s' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <User size={18} /> Profile
                                        </Link>
                                        <Link
                                            href="/dashboard"
                                            onClick={() => setShowDropdown(false)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', color: '#475569', fontSize: '0.9rem', borderRadius: '8px', transition: 'background 0.2s' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <LayoutDashboard size={18} /> Dashboard
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '10px 14px',
                                                color: '#ef4444',
                                                fontSize: '0.9rem',
                                                borderRadius: '8px',
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                transition: 'background 0.2s',
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <LogOut size={18} /> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link href={`/login?redirect=${encodeURIComponent(pathname)}`}>
                                    <Button variant="outline" style={{ borderColor: '#e2e8f0', color: 'var(--text-muted)' }}>Login</Button>
                                </Link>
                                <Link href={`/signup?redirect=${encodeURIComponent(pathname)}`}>
                                    <Button style={{ borderRadius: '10px', padding: '10px 22px' }}>Sign Up</Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* --- MOBILE: Bar + Hamburger --- */}
            <div className="navbar-mobile" style={{ width: '100%', height: '100%' }}>
                <div className="navbar-mobile-bar">
                    <div className="navbar-mobile__left">
                        <button
                            type="button"
                            className="navbar-mobile__hamburger"
                            onClick={() => setIsSidebarOpen(true)}
                            aria-label="Open menu"
                        >
                            <Menu size={24} strokeWidth={2} />
                        </button>
                        <Link href="/" className="navbar-mobile__logo" onClick={closeSidebar}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px'
                            }}>
                                <Image src="/logo.png" alt="Logo" width={32} height={32} />
                            </div>                            <span>Seedite</span>
                        </Link>
                    </div>

                    <div className="navbar__right">
                        {isLoggedIn ? (
                            <Link
                                href="/profile"
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                                    color: 'var(--foreground)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    border: '1px solid #e2e8f0',
                                }}
                            >
                                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </Link>
                        ) : (
                            <>
                                <Link href={`/login?redirect=${encodeURIComponent(pathname)}`}><Button variant="outline" style={{ borderColor: '#e2e8f0', color: 'var(--text-muted)', padding: '8px 16px', fontSize: '0.9rem' }}>Login</Button></Link>
                                <Link href={`/signup?redirect=${encodeURIComponent(pathname)}`}><Button style={{ borderRadius: '10px', padding: '8px 18px', fontSize: '0.9rem' }}>Sign Up</Button></Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* --- MOBILE: Sidebar overlay + panel (portaled to body so they sit above banner, Support, etc.) --- */}
            {mounted && typeof document !== 'undefined' && createPortal(
                <>
                    <div
                        className={`navbar-sidebar-overlay ${isSidebarOpen ? 'navbar-sidebar-overlay--open' : ''}`}
                        onClick={closeSidebar}
                        role="button"
                        tabIndex={-1}
                        aria-label="Close menu"
                    />
                    <aside className={`navbar-sidebar ${isSidebarOpen ? 'navbar-sidebar--open' : ''}`}>
                        <div className="navbar-sidebar__header">
                            <Link href="/" className="navbar-sidebar__logo" onClick={closeSidebar}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px'
                                }}>
                                    <Image src="/logo.png" alt="Logo" width={32} height={32} />
                                </div>                            <span>Seedite</span>
                            </Link>
                        </div>

                        <nav className="navbar-sidebar__nav">
                            {sidebarLink('/courses', 'Courses')}
                            {isLoggedIn && (
                                <>
                                    {sidebarLink('/dashboard', 'Dashboard')}
                                    <Link
                                        href="/dashboard/announcements"
                                        onClick={closeSidebar}
                                        className={`navbar-sidebar__link ${isSidebarLinkActive('/dashboard/announcements') ? 'navbar-sidebar__link--active' : ''}`}
                                    >
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                                            Announcements
                                            {unreadCount > 0 && (
                                                <span style={{
                                                    background: '#ef4444',
                                                    color: 'white',
                                                    fontSize: '0.65rem',
                                                    fontWeight: 700,
                                                    minWidth: '18px',
                                                    height: '18px',
                                                    borderRadius: '9px',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    padding: '0 5px',
                                                    lineHeight: 1,
                                                }}>
                                                    {unreadCount > 99 ? '99+' : unreadCount}
                                                </span>
                                            )}
                                        </span>
                                    </Link>
                                </>
                            )}
                            {sidebarLink('/blogs', 'Blogs')}
                            {sidebarLink('/iq-tests', 'Test your IQ')}
                        </nav>

                        <div className="navbar-sidebar__divider" />

                        {isLoggedIn ? (
                            <>
                                <div className="navbar-sidebar__user">
                                    <p className="navbar-sidebar__user-name">{user?.name}</p>
                                    <p className="navbar-sidebar__user-email">{user?.email}</p>
                                </div>
                                <div className="navbar-sidebar__actions">
                                    <Link href="/profile" onClick={closeSidebar} className="navbar-sidebar__link">
                                        <User size={20} /> Profile
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => { handleLogout(); closeSidebar(); }}
                                        className="navbar-sidebar__link"
                                        style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}
                                    >
                                        <LogOut size={20} /> Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="navbar-sidebar__actions">
                                <Link href={`/login?redirect=${encodeURIComponent(pathname)}`} onClick={closeSidebar}>
                                    <Button variant="outline" style={{ width: '100%', justifyContent: 'center' }}>Login</Button>
                                </Link>
                                <Link href={`/signup?redirect=${encodeURIComponent(pathname)}`} onClick={closeSidebar}>
                                    <Button style={{ width: '100%', justifyContent: 'center' }}>Sign Up</Button>
                                </Link>
                            </div>
                        )}
                    </aside>
                </>,
                document.body
            )}
        </nav>
    );
};

export default Navbar;
