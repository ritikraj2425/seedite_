'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import toast from 'react-hot-toast';

interface Course {
    _id: string;
    title: string;
}

export default function CreateCouponPage() {
    const router = useRouter();

    const [code, setCode] = useState('');
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [discountValue, setDiscountValue] = useState('10');
    const [courseId, setCourseId] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [usageLimit, setUsageLimit] = useState('');
    const [minPurchaseAmount, setMinPurchaseAmount] = useState('');
    const [description, setDescription] = useState('');

    const [courses, setCourses] = useState<Course[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCourses();
        // Set default expiry date to 30 days from now
        const defaultExpiry = new Date();
        defaultExpiry.setDate(defaultExpiry.getDate() + 30);
        setExpiryDate(defaultExpiry.toISOString().split('T')[0]);
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await fetch(`${API_URL}/api/courses`);
            if (res.ok) {
                const data = await res.json();
                setCourses(data);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCode(result);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!code.trim()) {
            toast.error('Please enter a coupon code');
            return;
        }

        if (discountType === 'percentage' && (parseFloat(discountValue) < 0 || parseFloat(discountValue) > 100)) {
            toast.error('Percentage must be between 0 and 100');
            return;
        }

        setSubmitting(true);
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

        try {
            const res = await fetch(`${API_URL}/api/coupons`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminUser.token}`
                },
                body: JSON.stringify({
                    code: code.toUpperCase(),
                    discountType,
                    discountValue: parseFloat(discountValue),
                    courseId: courseId || null,
                    expiryDate,
                    usageLimit: usageLimit ? parseInt(usageLimit) : null,
                    minPurchaseAmount: minPurchaseAmount ? parseInt(minPurchaseAmount) : 0,
                    description
                })
            });

            if (res.ok) {
                toast.success('Coupon created successfully!');
                router.push('/coupons');
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to create coupon');
            }
        } catch (error) {
            console.error('Error creating coupon:', error);
            toast.error('Error creating coupon');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <nav className="bg-black border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center space-x-4">
                            <Link href="/coupons" className="text-gray-400 hover:text-white">← Back</Link>
                            <h1 className="text-2xl font-bold">Create Coupon</h1>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 space-y-6">
                        {/* Coupon Code */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Coupon Code *</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    placeholder="e.g., SAVE20"
                                    className="flex-1 px-4 py-2 bg-black border border-gray-700 rounded-lg text-white font-mono uppercase"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={generateCode}
                                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                                >
                                    Generate
                                </button>
                            </div>
                        </div>

                        {/* Discount Type & Value */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Discount Type *</label>
                                <select
                                    value={discountType}
                                    onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                                    className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                >
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount (₹)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Discount Value * {discountType === 'percentage' ? '(0-100)' : '(₹)'}
                                </label>
                                <input
                                    type="number"
                                    value={discountValue}
                                    onChange={(e) => setDiscountValue(e.target.value)}
                                    min="0"
                                    max={discountType === 'percentage' ? '100' : undefined}
                                    className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                    required
                                />
                            </div>
                        </div>

                        {/* Course Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Apply to Course</label>
                            <select
                                value={courseId}
                                onChange={(e) => setCourseId(e.target.value)}
                                className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                            >
                                <option value="">All Courses (Global)</option>
                                {courses.map((course) => (
                                    <option key={course._id} value={course._id}>
                                        {course.title}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Leave empty to apply to all courses</p>
                        </div>

                        {/* Expiry Date */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Expiry Date *</label>
                            <input
                                type="date"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                required
                            />
                        </div>

                        {/* Usage Limit */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Usage Limit</label>
                                <input
                                    type="number"
                                    value={usageLimit}
                                    onChange={(e) => setUsageLimit(e.target.value)}
                                    placeholder="Unlimited"
                                    min="1"
                                    className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                />
                                <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited uses</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Min. Purchase (₹)</label>
                                <input
                                    type="number"
                                    value={minPurchaseAmount}
                                    onChange={(e) => setMinPurchaseAmount(e.target.value)}
                                    placeholder="0"
                                    min="0"
                                    className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Internal notes about this coupon..."
                                rows={2}
                                className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white resize-none"
                            />
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-400 mb-2">Preview</h3>
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-xl font-bold text-blue-400">{code || 'CODE'}</span>
                            <span className="text-2xl font-bold text-green-400">
                                {discountType === 'percentage' ? `${discountValue}% OFF` : `₹${discountValue} OFF`}
                            </span>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-4">
                        <Link
                            href="/coupons"
                            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`px-8 py-3 rounded-lg font-bold ${submitting
                                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                        >
                            {submitting ? 'Creating...' : 'Create Coupon'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
