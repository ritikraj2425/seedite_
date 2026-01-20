'use client';

import { useState } from 'react';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { KeyRound, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to send reset email');
            }

            setMessage(data.message);
            setSubmitted(true);
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
                {!submitted ? (
                    <>
                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                background: 'var(--gradient-primary)', borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                                boxShadow: '0 8px 30px -4px rgba(37, 99, 235, 0.35)'
                            }}>
                                <KeyRound size={28} color="white" />
                            </div>
                            <h2 style={{
                                fontSize: '1.5rem',
                                marginBottom: '8px',
                                color: '#0f172a'
                            }}>
                                Forgot Password?
                            </h2>
                            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                No worries! Enter your email and we'll send you a reset link.
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
                            <div style={{ marginBottom: '24px' }}>
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
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
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
                                    boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.25)'
                                }}
                                disabled={loading}
                            >
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </Button>
                        </form>

                        <div style={{
                            marginTop: '24px',
                            paddingTop: '24px',
                            borderTop: '1px solid #e2e8f0',
                            textAlign: 'center'
                        }}>
                            <Link
                                href="/login"
                                style={{
                                    color: '#64748b',
                                    fontSize: '0.95rem',
                                    fontWeight: '500',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <ArrowLeft size={16} />
                                Back to Login
                            </Link>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{
                            width: '72px',
                            height: '72px',
                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            boxShadow: '0 8px 30px -4px rgba(34, 197, 94, 0.4)'
                        }}>
                            <CheckCircle size={36} color="white" />
                        </div>
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            marginBottom: '12px',
                            color: '#0f172a'
                        }}>
                            Check Your Email
                        </h2>
                        <p style={{ color: '#64748b', marginBottom: '8px', lineHeight: '1.6' }}>
                            We've sent a password reset link to
                        </p>
                        <p style={{
                            color: '#0f172a',
                            fontWeight: '600',
                            marginBottom: '20px',
                            fontSize: '1.05rem'
                        }}>
                            {email}
                        </p>
                        <p style={{
                            color: '#94a3b8',
                            fontSize: '0.85rem',
                            marginBottom: '24px',
                            background: '#f8fafc',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            display: 'inline-block'
                        }}>
                            The link will expire in 15 minutes
                        </p>
                        <Link href="/login">
                            <Button
                                variant="outline"
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <ArrowLeft size={18} />
                                Back to Login
                            </Button>
                        </Link>
                    </div>
                )}
            </Card>
        </div>
    );
}
