'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

export default function Signup() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch('http://localhost:5000/api/auth/signup', {
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

            // Save token (if we were using localStorage for token, but we use cookies mostly)
            // However, we can also save user info to localStorage for navbar update
            localStorage.setItem('user', JSON.stringify(data));
            // data.token is also returned if we want to use it

            router.push('/courses');
            // Force reload to update navbar or use context (force reload is simpler for MVP)
            setTimeout(() => window.location.reload(), 100);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <Card style={{ width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>Sign Up</h2>
                {error && <div style={{ color: '#ef4444', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <Input
                        id="name"
                        label="Full Name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        id="email"
                        label="Email Address"
                        type="email"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        id="password"
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    <Button type="submit" style={{ width: '100%', marginTop: '8px' }}>Create Account</Button>
                </form>
                <p style={{ marginTop: '16px', textAlign: 'center', color: '#94a3b8' }}>
                    Already have an account? <Link href="/login" style={{ color: '#6366f1' }}>Login</Link>
                </p>
            </Card>
        </div>
    );
}
