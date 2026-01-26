'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { UserPlus, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import GoogleLoginButton from '../../components/ui/GoogleLoginButton';

export default function Signup() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate password match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            // Don't send confirmPassword to backend
            const { confirmPassword, ...submitData } = formData;
            const res = await fetch(`${API_URL}/api/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submitData),
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

                <GoogleLoginButton text="Sign up with Google" disabled={loading} />

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
                            Full Name
                        </label>
                        <Input
                            id="name"
                            placeholder="Your Name"
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
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            color: '#374151'
                        }}>
                            Confirm Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                style={{ marginBottom: 0, paddingRight: '40px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                            <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '6px' }}>Passwords do not match</p>
                        )}
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
