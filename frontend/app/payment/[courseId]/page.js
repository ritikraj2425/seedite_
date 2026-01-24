'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { ShieldCheck, Lock, CreditCard, Tag, X, Check } from 'lucide-react';
import { API_URL } from '../../../lib/api';
import toast from 'react-hot-toast';

export default function PaymentPage() {
    const params = useParams();
    const courseId = params?.courseId;
    const router = useRouter();

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Coupon state
    const [couponCode, setCouponCode] = useState('');
    const [couponApplied, setCouponApplied] = useState(null);
    const [validatingCoupon, setValidatingCoupon] = useState(false);

    useEffect(() => {
        if (!courseId) return;

        // Validate user session first
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const token = savedUser.token;

        if (!token) {
            // Not logged in - redirect to login
            toast.error('Please login to continue with payment');
            router.push(`/login?redirect=/payment/${courseId}`);
            return;
        }

        // Verify token is still valid by making a test request
        const validateToken = async () => {
            try {
                const res = await fetch(`${API_URL}/api/users/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!res.ok) {
                    // Token expired or invalid
                    localStorage.removeItem('user');
                    toast.error('Session expired. Please login again.');
                    router.push(`/login?redirect=/payment/${courseId}`);
                    return false;
                }
                return true;
            } catch (error) {
                console.error('Token validation error:', error);
                localStorage.removeItem('user');
                toast.error('Session error. Please login again.');
                router.push(`/login?redirect=/payment/${courseId}`);
                return false;
            }
        };

        const fetchCourse = async () => {
            // Validate token before proceeding
            const isValid = await validateToken();
            if (!isValid) return;

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
    }, [courseId, router]);

    const applyCoupon = async () => {
        if (!couponCode.trim()) {
            toast.error('Please enter a coupon code');
            return;
        }

        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const token = savedUser.token;

        if (!token) {
            toast.error('Please login to apply coupon');
            return;
        }

        setValidatingCoupon(true);
        try {
            const res = await fetch(`${API_URL}/api/coupons/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    code: couponCode.toUpperCase(),
                    courseId
                })
            });

            const data = await res.json();

            if (res.ok && data.valid) {
                setCouponApplied(data);
                toast.success(data.message || 'Coupon applied successfully!');
            } else {
                toast.error(data.message || 'Invalid coupon code');
                setCouponApplied(null);
            }
        } catch (error) {
            console.error('Error validating coupon:', error);
            toast.error('Error validating coupon');
        } finally {
            setValidatingCoupon(false);
        }
    };

    const removeCoupon = () => {
        setCouponApplied(null);
        setCouponCode('');
        toast.success('Coupon removed');
    };

    const handlePayment = async () => {
        setProcessing(true);
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const token = savedUser.token;

        if (!token) {
            router.push(`/login?redirect=/payment/${courseId}`);
            return;
        }

        try {
            // 1. Create Order (with coupon if applied)
            const orderRes = await fetch(`${API_URL}/api/payment/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    courseId,
                    couponCode: couponApplied ? couponApplied.code : null
                })
            });

            if (!orderRes.ok) {
                const errData = await orderRes.json();
                throw new Error(errData.message || 'Failed to create order');
            }

            const { order, key, discountApplied } = await orderRes.json();

            // 2. Initialize Razorpay
            const options = {
                key: key,
                amount: order.amount,
                currency: order.currency,
                name: 'Seedite',
                description: `Enrollment for ${course.title}`,
                order_id: order.id,
                handler: async function (response) {
                    // Payment was successful on Razorpay's end
                    // Even if client verification fails, webhook will handle enrollment
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
                            // Verification failed but payment was successful
                            // Webhook will handle enrollment
                            toast.success('Payment received! ✅ Your enrollment is being processed.');
                            console.log('Client verification failed, but payment was successful. Webhook will handle enrollment.');
                            // Still redirect to course page - they should have access soon
                            setTimeout(() => {
                                router.push(`/courses/${courseId}`);
                            }, 2000);
                        }
                    } catch (error) {
                        // Network error during verification, but payment was successful
                        console.error('Verification error:', error);
                        toast.success('Payment received! ✅ Your enrollment is being processed.');
                        // Redirect anyway - webhook will handle enrollment
                        setTimeout(() => {
                            router.push(`/courses/${courseId}`);
                        }, 2000);
                    }
                },
                prefill: {
                    name: savedUser.name || '',
                    email: savedUser.email || '',
                    contact: savedUser.phone || ''
                },
                theme: {
                    color: '#2563eb'
                },
                modal: {
                    ondismiss: function () {
                        setProcessing(false);
                        toast.error('Payment cancelled');
                    }
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response) {
                toast.error(`Payment Failed: ${response.error.description}`);
                setProcessing(false);
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

    const finalPrice = couponApplied ? couponApplied.finalPrice : course.price;
    const discountAmount = couponApplied ? couponApplied.discountAmount : 0;

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

                        {/* Coupon Input Section */}
                        <div style={{
                            background: '#f8fafc',
                            borderRadius: '8px',
                            padding: '16px',
                            marginBottom: '16px',
                            border: '1px dashed #cbd5e1'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <Tag size={18} color="#2563eb" />
                                <span style={{ fontWeight: 600, color: '#1e293b' }}>Have a coupon code?</span>
                            </div>

                            {couponApplied ? (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: '#dcfce7',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    border: '1px solid #86efac'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Check size={18} color="#16a34a" />
                                        <span style={{ fontWeight: 600, color: '#166534' }}>{couponApplied.code}</span>
                                        <span style={{ color: '#16a34a', fontSize: '0.9rem' }}>
                                            ({couponApplied.discountType === 'percentage'
                                                ? `${couponApplied.discountValue}% off`
                                                : `₹${couponApplied.discountValue} off`})
                                        </span>
                                    </div>
                                    <button
                                        onClick={removeCoupon}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '4px'
                                        }}
                                    >
                                        <X size={18} color="#dc2626" />
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        placeholder="Enter coupon code"
                                        style={{
                                            flex: 1,
                                            padding: '10px 12px',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '6px',
                                            fontSize: '0.95rem',
                                            fontFamily: 'monospace',
                                            textTransform: 'uppercase'
                                        }}
                                        onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
                                    />
                                    <button
                                        onClick={applyCoupon}
                                        disabled={validatingCoupon || !couponCode.trim()}
                                        style={{
                                            padding: '10px 20px',
                                            background: validatingCoupon || !couponCode.trim() ? '#94a3b8' : '#2563eb',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            fontWeight: 600,
                                            cursor: validatingCoupon || !couponCode.trim() ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {validatingCoupon ? 'Checking...' : 'Apply'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Price Breakdown */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ color: '#64748b' }}>Course Price</span>
                            <span style={{ fontWeight: 600 }}>₹{course.price}</span>
                        </div>

                        {couponApplied && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: '#16a34a' }}>Coupon Discount</span>
                                <span style={{ fontWeight: 600, color: '#16a34a' }}>-₹{discountAmount}</span>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ color: '#64748b' }}>Platform Fee</span>
                            <span style={{ fontWeight: 600 }}>₹0</span>
                        </div>

                        <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Total</span>
                            <div style={{ textAlign: 'right' }}>
                                {couponApplied && (
                                    <span style={{ fontSize: '1rem', color: '#94a3b8', textDecoration: 'line-through', marginRight: '8px' }}>
                                        ₹{course.price}
                                    </span>
                                )}
                                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>₹{finalPrice}</span>
                            </div>
                        </div>

                        {couponApplied && (
                            <div style={{
                                marginTop: '12px',
                                padding: '8px 12px',
                                background: '#fef3c7',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                color: '#92400e',
                                textAlign: 'center'
                            }}>
                                🎉 You're saving ₹{discountAmount} with this coupon!
                            </div>
                        )}

                        <div style={{ marginTop: '24px' }}>
                            <Button
                                onClick={handlePayment}
                                disabled={processing}
                                style={{ width: '100%', padding: '16px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                {processing ? 'Processing...' : (
                                    <>
                                        <CreditCard size={20} />
                                        Pay ₹{finalPrice} with Razorpay
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
