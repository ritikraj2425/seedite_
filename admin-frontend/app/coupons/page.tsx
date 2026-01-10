'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import toast from 'react-hot-toast';

interface Coupon {
    _id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    course: { _id: string; title: string } | null;
    expiryDate: string;
    usageLimit: number | null;
    usedCount: number;
    isActive: boolean;
    isValid: boolean;
    createdAt: string;
}

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        try {
            const res = await fetch(`${API_URL}/api/coupons`, {
                headers: {
                    'Authorization': `Bearer ${adminUser.token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setCoupons(data.coupons);
            } else {
                toast.error('Failed to fetch coupons');
            }
        } catch (error) {
            console.error('Error fetching coupons:', error);
            toast.error('Failed to fetch coupons');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (couponId: string, code: string) => {
        if (!confirm(`Are you sure you want to delete coupon "${code}"?`)) return;

        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        try {
            const res = await fetch(`${API_URL}/api/coupons/${couponId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${adminUser.token}`
                }
            });
            if (res.ok) {
                toast.success('Coupon deleted successfully');
                setCoupons(coupons.filter(c => c._id !== couponId));
            } else {
                toast.error('Failed to delete coupon');
            }
        } catch (error) {
            toast.error('Error deleting coupon');
        }
    };

    const toggleActive = async (coupon: Coupon) => {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        try {
            const res = await fetch(`${API_URL}/api/coupons/${coupon._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminUser.token}`
                },
                body: JSON.stringify({ isActive: !coupon.isActive })
            });
            if (res.ok) {
                toast.success(`Coupon ${coupon.isActive ? 'deactivated' : 'activated'}`);
                fetchCoupons();
            } else {
                toast.error('Failed to update coupon');
            }
        } catch (error) {
            toast.error('Error updating coupon');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const isExpired = (expiryDate: string) => new Date(expiryDate) < new Date();

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-xl">Loading coupons...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <nav className="bg-black border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center space-x-4">
                            <Link href="/dashboard" className="text-gray-400 hover:text-white">← Dashboard</Link>
                            <h1 className="text-2xl font-bold">Coupon Management</h1>
                        </div>
                        <Link
                            href="/coupons/new"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            + Create Coupon
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {coupons.length === 0 ? (
                    <div className="text-center py-16">
                        <h2 className="text-xl text-gray-400 mb-4">No coupons created yet</h2>
                        <Link
                            href="/coupons/new"
                            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Create Your First Coupon
                        </Link>
                    </div>
                ) : (
                    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Discount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Course</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Usage</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Expiry</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {coupons.map((coupon) => (
                                    <tr key={coupon._id} className="hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-mono text-lg font-bold text-blue-400">{coupon.code}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-green-400 font-semibold">
                                                {coupon.discountType === 'percentage'
                                                    ? `${coupon.discountValue}%`
                                                    : `₹${coupon.discountValue}`}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {coupon.course ? (
                                                <span className="text-gray-300">{coupon.course.title}</span>
                                            ) : (
                                                <span className="text-gray-500 italic">All Courses</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-gray-300">
                                                {coupon.usedCount} / {coupon.usageLimit || '∞'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={isExpired(coupon.expiryDate) ? 'text-red-400' : 'text-gray-300'}>
                                                {formatDate(coupon.expiryDate)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {isExpired(coupon.expiryDate) ? (
                                                <span className="px-2 py-1 text-xs rounded-full bg-red-900 text-red-300">Expired</span>
                                            ) : coupon.isActive ? (
                                                <span className="px-2 py-1 text-xs rounded-full bg-green-900 text-green-300">Active</span>
                                            ) : (
                                                <span className="px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-400">Inactive</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                            <button
                                                onClick={() => toggleActive(coupon)}
                                                className="text-gray-400 hover:text-white text-sm"
                                            >
                                                {coupon.isActive ? 'Disable' : 'Enable'}
                                            </button>
                                            <Link
                                                href={`/coupons/${coupon._id}/edit`}
                                                className="text-blue-400 hover:text-blue-300 text-sm"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(coupon._id, coupon.code)}
                                                className="text-red-400 hover:text-red-300 text-sm"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
