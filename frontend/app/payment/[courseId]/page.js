'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { ShieldCheck, Lock, CreditCard } from 'lucide-react';
import { API_URL } from '../../../lib/api';
import toast from 'react-hot-toast';

export default function PaymentPage() {
    const params = useParams();
    const courseId = params?.courseId;
    const router = useRouter();

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (!courseId) return;

        const fetchCourse = async () => {
            try {
                const res = await fetch(`${API_URL}/api/courses/${courseId}`);
                if (res.ok) {
                    const data = await res.json();
                    setCourse(data);
                }
            } catch (error) {
                console.error('Failed to fetch course', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [courseId]);

    const handlePayment = async () => {
        setProcessing(true);
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const token = savedUser.token;

        if (!token) {
            router.push(`/login?redirect=/payment/${courseId}`);
            return;
        }

        try {
            // 1. Create Order
            const orderRes = await fetch(`${API_URL}/api/payment/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ courseId })
            });

            if (!orderRes.ok) {
                const errData = await orderRes.json();
                throw new Error(errData.message || 'Failed to create order');
            }

            const { order, key } = await orderRes.json();

            // 2. Initialize Razorpay
            const options = {
                key: key,
                amount: order.amount,
                currency: order.currency,
                name: 'Seedite',
                description: `Enrollment for ${course.title}`,
                order_id: order.id,
                handler: async function (response) {
                    try {
                        // 3. Verify Payment
                        const verifyRes = await fetch(`${API_URL}/api/payment/verify`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                courseId: courseId
                            })
                        });

                        if (verifyRes.ok) {
                            toast.success('Payment Successful! 🎉 You are now enrolled.');
                            router.push(`/courses/${courseId}`);
                        } else {
                            toast.error('Payment verification failed. Please contact support.');
                        }
                    } catch (error) {
                        console.error('Verification error:', error);
                        toast.error('Payment verification failed');
                    }
                },
                prefill: {
                    name: savedUser.name || '',
                    email: savedUser.email || '',
                },
                theme: {
                    color: '#2563eb'
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response) {
                toast.error(`Payment Failed: ${response.error.description}`);
            });
            rzp1.open();

        } catch (error) {
            console.error('Payment initiation failed:', error);
            toast.error(error.message || 'Something went wrong. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>Loading...</div>;
    if (!course) return <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>Course not found</div>;

    return (
        <>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

            <div className="container" style={{ paddingTop: '40px', maxWidth: '1000px' }}>
                <h1 style={{ marginBottom: '32px', textAlign: 'center' }}>Complete Your Purchase</h1>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', maxWidth: '600px', margin: '0 auto' }}>
                    <Card style={{ marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Order Summary</h2>
                        <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <img src={course.thumbnail} alt={course.title} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{course.title}</h3>
                                    <p style={{ fontSize: '0.9rem', color: '#64748b' }}>{course.description?.substring(0, 60)}...</p>
                                    {course.courseDetails && course.courseDetails.length > 0 && (
                                        <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '0.85rem', color: '#475569' }}>
                                            {course.courseDetails.map((detail, index) => (
                                                <li key={index} style={{ marginBottom: '4px' }}>{detail}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ color: '#64748b' }}>Course Price</span>
                            <span style={{ fontWeight: 600 }}>₹{course.price}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ color: '#64748b' }}>Platform Fee</span>
                            <span style={{ fontWeight: 600 }}>₹0</span>
                        </div>
                        <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Total</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>₹{course.price}</span>
                        </div>

                        <div style={{ marginTop: '24px' }}>
                            <Button
                                onClick={handlePayment}
                                disabled={processing}
                                style={{ width: '100%', padding: '16px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                {processing ? 'Processing...' : (
                                    <>
                                        <CreditCard size={20} />
                                        Pay With Razorpay
                                    </>
                                )}
                            </Button>
                        </div>
                        <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
                            Secure payment powered by Razorpay
                        </p>
                    </Card>

                    <Card style={{ background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', gap: '24px', padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <ShieldCheck size={24} color="#2563eb" />
                            <div>
                                <h4 style={{ fontSize: '1rem', marginBottom: '4px' }}>Secure Payment</h4>
                                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>256-bit SSL Encrypted</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Lock size={24} color="#2563eb" />
                            <div>
                                <h4 style={{ fontSize: '1rem', marginBottom: '4px' }}>Lifetime Access</h4>
                                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Full course access</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
}
