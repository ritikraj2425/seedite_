'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Loader from '../../components/ui/Loader';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import GoogleLoginButton from '../../components/ui/GoogleLoginButton';

export default function Login() {
    return (
        <Suspense fallback={<Loader />}>
            <LoginContent />
        </Suspense>
    );
}

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect') || '/dashboard';

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prevent multiple submissions
        if (loading) return;

        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Login failed');
            }

            localStorage.setItem('user', JSON.stringify(data));

            router.push(redirectUrl);
            router.refresh();
        } catch (err) {
            setError(err.message);
            setLoading(false); // Only reset loading on error
        }
        // Don't reset loading on success - let the redirect happen
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
                        <LogIn size={28} color="white" />
                    </div>
                    <h2 style={{
                        fontSize: '1.5rem',
                        marginBottom: '8px',
                        color: '#0f172a'
                    }}>
                        Welcome Back
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
                        Sign in to continue your learning journey
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

                <GoogleLoginButton text="Sign in with Google" disabled={loading} />

                {/* Divider */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    margin: '24px 0'
                }}>
                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>or</span>
                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                </div>


                <form onSubmit={handleSubmit}>
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
                        <div style={{ position: 'relative' }}>
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={handleChange}
                                required
                                style={{ marginBottom: 0, paddingRight: '40px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#64748b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '4px'
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <Button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '14px',
                            fontSize: '1rem',
                            boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.25)'
                        }}
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                </form>



                <p style={{ marginTop: '16px', textAlign: 'center' }}>
                    <Link href="/forgot-password" style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>
                        Forgot Password?
                    </Link>
                </p>

                <div style={{
                    marginTop: '24px',
                    paddingTop: '24px',
                    borderTop: '1px solid #e2e8f0',
                    textAlign: 'center'
                }}>
                    <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
                        Don't have an account?{' '}
                        <Link href="/signup" style={{ color: '#2563eb', fontWeight: '600' }}>
                            Sign up
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
}
