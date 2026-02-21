'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import Loader from '../../components/ui/Loader';
import { Ticket, Copy, Check, Clock, Tag, BookOpen, ShieldCheck, AlertTriangle, XCircle, RefreshCw, DollarSign, ChevronDown, ChevronUp, Wallet, IndianRupee } from 'lucide-react';

export default function MyCouponsPage() {
    const [user, setUser] = useState(null);
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(null);
    const [expandedPayments, setExpandedPayments] = useState({});
    const router = useRouter();

    useEffect(() => {
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (!savedUser.token) {
            router.push('/login?redirect=/my-coupons');
            return;
        }
        setUser(savedUser);
        fetchMyCoupons(savedUser.token);
    }, [router]);

    const fetchMyCoupons = async (token) => {
        try {
            const res = await fetch(`${API_URL}/api/coupons/my-coupons`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setCoupons(data.coupons);
            }
        } catch (error) {
            console.error('Error fetching coupons:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (code, id) => {
        navigator.clipboard.writeText(code);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const getStatus = (coupon) => {
        const now = new Date();
        const expiry = new Date(coupon.expiryDate);
        if (expiry < now) return 'expired';
        if (!coupon.isActive) return 'inactive';
        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return 'exhausted';
        return 'active';
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'active':
                return {
                    label: 'Active',
                    bg: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
                    border: '#10b981',
                    color: '#6ee7b7',
                    icon: ShieldCheck
                };
            case 'expired':
                return {
                    label: 'Expired',
                    bg: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
                    border: '#ef4444',
                    color: '#fca5a5',
                    icon: XCircle
                };
            case 'exhausted':
                return {
                    label: 'Fully Used',
                    bg: 'linear-gradient(135deg, #78350f 0%, #92400e 100%)',
                    border: '#f59e0b',
                    color: '#fcd34d',
                    icon: AlertTriangle
                };
            case 'inactive':
                return {
                    label: 'Inactive',
                    bg: 'linear-gradient(135deg, #374151 0%, #4b5563 100%)',
                    border: '#6b7280',
                    color: '#9ca3af',
                    icon: XCircle
                };
            default:
                return {
                    label: 'Unknown',
                    bg: '#374151',
                    border: '#6b7280',
                    color: '#9ca3af',
                    icon: AlertTriangle
                };
        }
    };

    const getDaysRemaining = (expiryDate) => {
        const now = new Date();
        const expiry = new Date(expiryDate);
        const diff = expiry - now;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    };

    const getUsagePercentage = (coupon) => {
        if (coupon.usageLimit === null) return 0;
        return Math.min((coupon.usedCount / coupon.usageLimit) * 100, 100);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) return <Loader />;

    if (!user) return null;

    return (
        <div style={{ minHeight: '100vh' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderBottom: '1px solid #e2e8f0',
                padding: '50px 0 40px'
            }}>
                <div className="container">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            background: 'linear-gradient(135deg, #3e4451 0%, #1a1919 100%)',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 8px 30px -4px rgba(37, 99, 235, 0.35)'
                        }}>
                            <Ticket size={28} color="white" />
                        </div>
                        <div>
                            <h1 style={{
                                fontSize: '1.75rem',
                                margin: 0,
                                background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>
                                My Coupon Codes
                            </h1>
                            <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '4px' }}>
                                Track your assigned coupon codes and their usage in real-time
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container" style={{ paddingTop: '32px', paddingBottom: '80px' }}>
                {coupons.length === 0 ? (
                    /* Empty State */
                    <div style={{
                        textAlign: 'center',
                        padding: '80px 40px',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: 'linear-gradient(135deg, #e0e7ff 0%, #dbeafe 100%)',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px'
                        }}>
                            <Ticket size={36} color="#2563eb" />
                        </div>
                        <h3 style={{ marginBottom: '12px', color: '#0f172a', fontSize: '1.25rem' }}>
                            No Coupons Assigned Yet
                        </h3>
                        <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>
                            You don't have any coupon codes assigned to your account yet. Check back later!
                        </p>
                    </div>
                ) : (
                    /* Coupon Cards Grid */
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                        gap: '24px'
                    }}>
                        {coupons.map((coupon) => {
                            const status = getStatus(coupon);
                            const statusConfig = getStatusConfig(status);
                            const StatusIcon = statusConfig.icon;
                            const daysRemaining = getDaysRemaining(coupon.expiryDate);
                            const usagePercent = getUsagePercentage(coupon);

                            return (
                                <div
                                    key={coupon._id}
                                    className="modern-card"
                                    style={{
                                        padding: 0,
                                        overflow: 'hidden',
                                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                        opacity: status === 'expired' || status === 'exhausted' ? 0.75 : 1,
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 12px 40px -8px rgba(0,0,0,0.12)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '';
                                    }}
                                >
                                    {/* Top Section: Code + Discount */}
                                    <div style={{
                                        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                                        padding: '24px',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        {/* Decorative circles */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '-20px',
                                            right: '-20px',
                                            width: '100px',
                                            height: '100px',
                                            borderRadius: '50%',
                                            background: 'rgba(37, 99, 235, 0.1)',
                                            pointerEvents: 'none'
                                        }} />

                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            marginBottom: '16px'
                                        }}>
                                            {/* Status Badge */}
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                background: statusConfig.bg,
                                                color: statusConfig.color,
                                                border: `1px solid ${statusConfig.border}40`
                                            }}>
                                                <StatusIcon size={12} />
                                                {statusConfig.label}
                                            </span>

                                            {/* Discount Value */}
                                            <span style={{
                                                fontSize: '1.75rem',
                                                fontWeight: '800',
                                                background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                backgroundClip: 'text',
                                                lineHeight: 1
                                            }}>
                                                {coupon.discountType === 'percentage'
                                                    ? `${coupon.discountValue}%`
                                                    : `₹${coupon.discountValue}`}
                                                <span style={{
                                                    fontSize: '0.85rem',
                                                    fontWeight: '500',
                                                    marginLeft: '4px'
                                                }}>OFF</span>
                                            </span>
                                        </div>

                                        {/* Coupon Code */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            background: 'rgba(255,255,255,0.05)',
                                            borderRadius: '10px',
                                            padding: '12px 16px',
                                            border: '1px dashed rgba(255,255,255,0.15)'
                                        }}>
                                            <span style={{
                                                fontFamily: 'monospace',
                                                fontSize: '1.3rem',
                                                fontWeight: '700',
                                                color: '#93c5fd',
                                                letterSpacing: '2px',
                                                flex: 1
                                            }}>
                                                {coupon.code}
                                            </span>
                                            <button
                                                onClick={() => copyToClipboard(coupon.code, coupon._id)}
                                                style={{
                                                    background: copied === coupon._id ? '#059669' : 'rgba(59, 130, 246, 0.2)',
                                                    border: `1px solid ${copied === coupon._id ? '#10b981' : '#3b82f6'}40`,
                                                    borderRadius: '8px',
                                                    padding: '8px 12px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    color: copied === coupon._id ? '#a7f3d0' : '#93c5fd',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '500',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                {copied === coupon._id
                                                    ? <><Check size={14} /> Copied</>
                                                    : <><Copy size={14} /> Copy</>
                                                }
                                            </button>
                                        </div>
                                    </div>

                                    {/* Bottom Section: Details */}
                                    <div style={{ padding: '20px 24px 24px' }}>
                                        {/* Course Info */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginBottom: '16px',
                                            color: '#64748b',
                                            fontSize: '0.9rem'
                                        }}>
                                            <BookOpen size={16} color="#2563eb" />
                                            <span style={{ color: '#334155', fontWeight: '500' }}>
                                                {coupon.course ? coupon.course.title : 'All Courses'}
                                            </span>
                                        </div>

                                        {/* Stats Row */}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: '12px',
                                            marginBottom: '16px'
                                        }}>
                                            {/* Usage */}
                                            <div style={{
                                                background: '#f8fafc',
                                                borderRadius: '10px',
                                                padding: '12px',
                                                border: '1px solid #e2e8f0'
                                            }}>
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    color: '#94a3b8',
                                                    marginBottom: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    <Tag size={12} />
                                                    Usage
                                                </div>
                                                <div style={{
                                                    fontSize: '1.1rem',
                                                    fontWeight: '700',
                                                    color: '#0f172a'
                                                }}>
                                                    {coupon.usedCount}
                                                    <span style={{ color: '#94a3b8', fontWeight: '400', fontSize: '0.85rem' }}>
                                                        {' / '}{coupon.usageLimit || '∞'}
                                                    </span>
                                                </div>
                                                {coupon.usageLimit && (
                                                    <div style={{
                                                        marginTop: '6px',
                                                        height: '4px',
                                                        background: '#e2e8f0',
                                                        borderRadius: '2px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <div style={{
                                                            height: '100%',
                                                            width: `${usagePercent}%`,
                                                            background: usagePercent >= 90
                                                                ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                                                                : usagePercent >= 60
                                                                    ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                                                                    : 'linear-gradient(90deg, #2563eb, #3b82f6)',
                                                            borderRadius: '2px',
                                                            transition: 'width 0.5s ease'
                                                        }} />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Expiry */}
                                            <div style={{
                                                background: '#f8fafc',
                                                borderRadius: '10px',
                                                padding: '12px',
                                                border: '1px solid #e2e8f0'
                                            }}>
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    color: '#94a3b8',
                                                    marginBottom: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    <Clock size={12} />
                                                    Expires
                                                </div>
                                                <div style={{
                                                    fontSize: '0.95rem',
                                                    fontWeight: '600',
                                                    color: daysRemaining <= 0
                                                        ? '#dc2626'
                                                        : daysRemaining <= 7
                                                            ? '#d97706'
                                                            : '#0f172a'
                                                }}>
                                                    {formatDate(coupon.expiryDate)}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    color: daysRemaining <= 0
                                                        ? '#ef4444'
                                                        : daysRemaining <= 7
                                                            ? '#f59e0b'
                                                            : '#64748b',
                                                    marginTop: '2px',
                                                    fontWeight: '500'
                                                }}>
                                                    {daysRemaining <= 0
                                                        ? 'Expired'
                                                        : daysRemaining === 1
                                                            ? '1 day left'
                                                            : `${daysRemaining} days left`
                                                    }
                                                </div>
                                            </div>
                                        </div>

                                        {/* Earnings Section */}
                                        {coupon.assignedAmount > 0 && (
                                            <div style={{
                                                marginBottom: '16px'
                                            }}>
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '1fr 1fr',
                                                    gap: '8px',
                                                    marginBottom: '8px'
                                                }}>
                                                    <div style={{
                                                        background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                                                        borderRadius: '10px',
                                                        padding: '12px',
                                                        border: '1px solid #a7f3d0'
                                                    }}>
                                                        <div style={{ fontSize: '0.7rem', color: '#059669', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <IndianRupee size={10} />
                                                            Commission/Use
                                                        </div>
                                                        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#047857' }}>
                                                            ₹{coupon.commissionPerUse}
                                                        </div>
                                                    </div>
                                                    <div style={{
                                                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                                                        borderRadius: '10px',
                                                        padding: '12px',
                                                        border: '1px solid #93c5fd'
                                                    }}>
                                                        <div style={{ fontSize: '0.7rem', color: '#2563eb', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Wallet size={10} />
                                                            Total Earned
                                                        </div>
                                                        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1d4ed8' }}>
                                                            ₹{coupon.totalEarnings}
                                                        </div>
                                                    </div>
                                                    <div style={{
                                                        background: 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)',
                                                        borderRadius: '10px',
                                                        padding: '12px',
                                                        border: '1px solid #c4b5fd'
                                                    }}>
                                                        <div style={{ fontSize: '0.7rem', color: '#7c3aed', marginBottom: '2px' }}>Paid</div>
                                                        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#6d28d9' }}>
                                                            ₹{coupon.totalPaid}
                                                        </div>
                                                    </div>
                                                    <div style={{
                                                        background: coupon.pendingAmount > 0
                                                            ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
                                                            : 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                                                        borderRadius: '10px',
                                                        padding: '12px',
                                                        border: `1px solid ${coupon.pendingAmount > 0 ? '#fca5a5' : '#a7f3d0'}`
                                                    }}>
                                                        <div style={{ fontSize: '0.7rem', color: coupon.pendingAmount > 0 ? '#dc2626' : '#059669', marginBottom: '2px' }}>Pending</div>
                                                        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: coupon.pendingAmount > 0 ? '#b91c1c' : '#047857' }}>
                                                            ₹{coupon.pendingAmount}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Payment History Toggle */}
                                                {coupon.paymentHistory && coupon.paymentHistory.length > 0 && (
                                                    <div>
                                                        <button
                                                            onClick={() => setExpandedPayments(prev => ({ ...prev, [coupon._id]: !prev[coupon._id] }))}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                background: 'none',
                                                                border: 'none',
                                                                color: '#64748b',
                                                                fontSize: '0.8rem',
                                                                cursor: 'pointer',
                                                                padding: '4px 0',
                                                                fontWeight: '500'
                                                            }}
                                                        >
                                                            {expandedPayments[coupon._id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                            Payment History ({coupon.paymentHistory.length})
                                                        </button>
                                                        {expandedPayments[coupon._id] && (
                                                            <div style={{
                                                                marginTop: '8px',
                                                                background: '#f8fafc',
                                                                borderRadius: '8px',
                                                                border: '1px solid #e2e8f0',
                                                                overflow: 'hidden'
                                                            }}>
                                                                {coupon.paymentHistory.slice().reverse().map((payment, i) => (
                                                                    <div key={payment._id || i} style={{
                                                                        padding: '10px 12px',
                                                                        display: 'flex',
                                                                        justifyContent: 'space-between',
                                                                        alignItems: 'center',
                                                                        borderBottom: i < coupon.paymentHistory.length - 1 ? '1px solid #e2e8f0' : 'none',
                                                                        fontSize: '0.85rem'
                                                                    }}>
                                                                        <div>
                                                                            <span style={{ fontWeight: '600', color: '#059669' }}>₹{payment.amount}</span>
                                                                            {payment.note && <span style={{ color: '#94a3b8', marginLeft: '8px' }}>— {payment.note}</span>}
                                                                        </div>
                                                                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                                                                            {formatDate(payment.date)}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Description if present */}
                                        {coupon.description && (
                                            <p style={{
                                                fontSize: '0.85rem',
                                                color: '#64748b',
                                                margin: 0,
                                                padding: '8px 12px',
                                                background: '#f1f5f9',
                                                borderRadius: '8px',
                                                borderLeft: '3px solid #2563eb'
                                            }}>
                                                {coupon.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Refresh Button */}
                {coupons.length > 0 && (
                    <div style={{ textAlign: 'center', marginTop: '32px' }}>
                        <button
                            onClick={() => {
                                setLoading(true);
                                fetchMyCoupons(user?.token);
                            }}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '10px',
                                color: '#334155',
                                fontSize: '0.9rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = '#f8fafc';
                                e.currentTarget.style.borderColor = '#cbd5e1';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'white';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                        >
                            <RefreshCw size={16} />
                            Refresh Data
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
