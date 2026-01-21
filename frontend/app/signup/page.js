'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { UserPlus, User, Mail, Lock } from 'lucide-react';

export default function Signup() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Signup failed');
            }

            localStorage.setItem('user', JSON.stringify(data));

            router.push('/courses');
            setTimeout(() => window.location.reload(), 100);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-bg" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
            <Card style={{
                width: '100%',
                maxWidth: '420px',
                padding: '40px 32px',
                boxShadow: '0 20px 60px -10px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                        background: 'var(--gradient-primary)',
                        boxShadow: '0 8px 30px -4px rgba(37, 99, 235, 0.35)'
                    }}>
                        <UserPlus size={28} color="white" />
                    </div>
                    <h2 style={{
                        fontSize: '1.5rem',
                        marginBottom: '8px',
                        color: '#0f172a'
                    }}>
                        Create Account
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
                        Start your NSAT preparation journey today
                    </p>
                </div>

                {error && (
                    <div style={{
                        color: '#dc2626',
                        background: '#fef2f2',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        marginBottom: '20px',
                        textAlign: 'center',
                        fontSize: '0.9rem',
                        border: '1px solid #fecaca'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            color: '#374151'
                        }}>
                            Full Name
                        </label>
                        <Input
                            id="name"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            style={{ marginBottom: 0 }}
                        />
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            color: '#374151'
                        }}>
                            Email Address
                        </label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            style={{ marginBottom: 0 }}
                        />
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            color: '#374151'
                        }}>
                            Password
                        </label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            style={{ marginBottom: 0 }}
                        />
                    </div>
                    <Button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '14px',
                            fontSize: '1rem',
                        }}
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                </form>

                <div style={{
                    marginTop: '24px',
                    paddingTop: '24px',
                    borderTop: '1px solid #e2e8f0',
                    textAlign: 'center'
                }}>
                    <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
                        Already have an account?{' '}
                        <Link href="/login" style={{ color: '#7c3aed', fontWeight: '600' }}>
                            Sign in
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
}
