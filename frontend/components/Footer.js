'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Youtube, Instagram, Linkedin, Form } from 'lucide-react';
import Image from 'next/image';

const Footer = () => {
    const socialLinks = [
        {
            icon: Youtube,
            href: 'https://www.youtube.com/@ritikraj_2425'
        },
        {
            icon: Instagram,
            href: 'https://www.instagram.com/ritik_raj2425'
        },
        {
            icon: Linkedin,
            href: 'https://in.linkedin.com/in/ritik-raj-0a098228a'
        }
    ]
    return (
        <footer style={{
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            padding: '60px 0 30px',
            marginTop: '10px'
        }}>
            <div className="container">
                <div className="responsive-grid" style={{
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '40px',
                    marginBottom: '40px'
                }}>

                    {/* Brand Column */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px'
                            }}>
                                <Image src="/logo.png" alt="Logo" width={32} height={32} />
                            </div>
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Seedite</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.6' }}>
                            Empowering students with premium courses and expert guidance for a brighter future.
                        </p>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            {socialLinks.map((item, i) => (
                                <a key={i} href={item.href} target="_blank" rel="noopener noreferrer" style={{
                                    color: 'var(--text-muted)',
                                    transition: 'color 0.2s'
                                }}>
                                    <item.icon size={20} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>Quick Links</h3>
                        <ul style={{ listStyle: 'none' }}>
                            <li style={{ marginBottom: '12px' }}>
                                <Link href="/" className="footer-link">Home</Link>
                            </li>
                            <li style={{ marginBottom: '12px' }}>
                                <Link href="/courses" className="footer-link">Courses</Link>
                            </li>
                            <li style={{ marginBottom: '12px' }}>
                                <Link href="/dashboard" className="footer-link">Dashboard</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>Contact Us</h3>
                        <ul style={{ listStyle: 'none' }}>
                            <li style={{ display: 'flex', gap: '12px', marginBottom: '16px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                                <Form size={20} color="var(--primary)" />
                                <a href='https://forms.gle/nJFxEnBbGK3m8LtcA' target="_blank">Fill the form</a>
                            </li>
                            <li style={{ display: 'flex', gap: '12px', marginBottom: '16px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                                <Mail size={20} color="var(--primary)" />
                                <span>seediteofficial@gmail.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div style={{
                    borderTop: '1px solid #e2e8f0',
                    paddingTop: '30px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem'
                }}>
                    <p>&copy; {new Date().getFullYear()} Seedite. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
