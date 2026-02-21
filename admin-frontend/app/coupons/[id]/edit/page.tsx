'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import toast from 'react-hot-toast';

interface Course {
    _id: string;
    title: string;
}

interface User {
    _id: string;
    name: string;
    email: string;
}

interface Payment {
    _id?: string;
    amount: number;
    date: string;
    note: string;
}

export default function EditCouponPage() {
    const router = useRouter();
    const params = useParams();
    const couponId = params.id;

    const [code, setCode] = useState('');
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [discountValue, setDiscountValue] = useState('');
    const [courseId, setCourseId] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [usageLimit, setUsageLimit] = useState('');
    const [minPurchaseAmount, setMinPurchaseAmount] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [usedCount, setUsedCount] = useState(0);
    const [assignedAmount, setAssignedAmount] = useState(0);
    const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentNote, setPaymentNote] = useState('');
    const [addingPayment, setAddingPayment] = useState(false);

    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // User assignment state
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [userSearch, setUserSearch] = useState('');

    useEffect(() => {
        fetchCourses();
        fetchUsers();
        fetchCoupon();
    }, [couponId]);

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

    const fetchUsers = async () => {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        try {
            const res = await fetch(`${API_URL}/api/admin/users`, {
                headers: { 'Authorization': `Bearer ${adminUser.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const toggleUserSelection = (user: User) => {
        setSelectedUsers(prev =>
            prev.find(u => u._id === user._id)
                ? prev.filter(u => u._id !== user._id)
                : [...prev, user]
        );
    };

    const filteredUsers = users.filter(u =>
        (u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.email?.toLowerCase().includes(userSearch.toLowerCase())) &&
        !selectedUsers.find(su => su._id === u._id)
    );

    const fetchCoupon = async () => {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        try {
            const res = await fetch(`${API_URL}/api/coupons/${couponId}`, {
                headers: {
                    'Authorization': `Bearer ${adminUser.token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                const coupon = data.coupon;
                setCode(coupon.code);
                setDiscountType(coupon.discountType);
                setDiscountValue(coupon.discountValue.toString());
                setCourseId(coupon.course?._id || '');
                setExpiryDate(new Date(coupon.expiryDate).toISOString().split('T')[0]);
                setUsageLimit(coupon.usageLimit?.toString() || '');
                setMinPurchaseAmount(coupon.minPurchaseAmount?.toString() || '');
                setDescription(coupon.description || '');
                setIsActive(coupon.isActive);
                setUsedCount(coupon.usedCount || 0);
                setAssignedAmount(coupon.assignedAmount || 0);
                setPaymentHistory(coupon.paymentHistory || []);
                if (coupon.assignedTo && coupon.assignedTo.length > 0) {
                    setSelectedUsers(coupon.assignedTo);
                }
            } else {
                toast.error('Coupon not found');
                router.push('/coupons');
            }
        } catch (error) {
            console.error('Error fetching coupon:', error);
            toast.error('Error loading coupon');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (discountType === 'percentage' && (parseFloat(discountValue) < 0 || parseFloat(discountValue) > 100)) {
            toast.error('Percentage must be between 0 and 100');
            return;
        }

        setSubmitting(true);
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

        try {
            const res = await fetch(`${API_URL}/api/coupons/${couponId}`, {
                method: 'PUT',
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
                    description,
                    isActive,
                    assignedTo: selectedUsers.map(u => u._id)
                })
            });

            if (res.ok) {
                toast.success('Coupon updated successfully!');
                router.push('/coupons');
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to update coupon');
            }
        } catch (error) {
            console.error('Error updating coupon:', error);
            toast.error('Error updating coupon');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddPayment = async () => {
        if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
            toast.error('Enter a valid payment amount');
            return;
        }
        setAddingPayment(true);
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        try {
            const res = await fetch(`${API_URL}/api/coupons/${couponId}/payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminUser.token}`
                },
                body: JSON.stringify({
                    amount: parseFloat(paymentAmount),
                    note: paymentNote
                })
            });
            if (res.ok) {
                const data = await res.json();
                setPaymentHistory(data.paymentHistory);
                setPaymentAmount('');
                setPaymentNote('');
                toast.success(`Payment of ₹${paymentAmount} recorded!`);
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to record payment');
            }
        } catch (error) {
            toast.error('Error recording payment');
        } finally {
            setAddingPayment(false);
        }
    };

    const commissionPerUse = assignedAmount - parseFloat(discountValue || '0');
    const totalEarnings = Math.max(0, commissionPerUse) * usedCount;
    const totalPaid = paymentHistory.reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = Math.max(0, totalEarnings - totalPaid);

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-xl">Loading coupon...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <nav className="bg-black border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center space-x-4">
                            <Link href="/coupons" className="text-gray-400 hover:text-white">← Back</Link>
                            <h1 className="text-2xl font-bold">Edit Coupon</h1>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 space-y-6">
                        {/* Usage Stats */}
                        <div className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
                            <span className="text-gray-400">Times Used:</span>
                            <span className="text-2xl font-bold text-blue-400">{usedCount}</span>
                        </div>

                        {/* Assigned Amount (Read-only) */}
                        {assignedAmount > 0 && (
                            <div className="bg-gray-800 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-gray-400 text-sm">Assigned Amount (Locked)</span>
                                    <span className="text-xl font-bold text-yellow-400">₹{assignedAmount}</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="bg-black/30 rounded-lg p-3 text-center">
                                        <div className="text-xs text-gray-500">Commission/Use</div>
                                        <div className="text-green-400 font-bold">₹{Math.max(0, commissionPerUse)}</div>
                                    </div>
                                    <div className="bg-black/30 rounded-lg p-3 text-center">
                                        <div className="text-xs text-gray-500">Total Earned</div>
                                        <div className="text-blue-400 font-bold">₹{totalEarnings}</div>
                                    </div>
                                    <div className="bg-black/30 rounded-lg p-3 text-center">
                                        <div className="text-xs text-gray-500">Total Paid</div>
                                        <div className="text-purple-400 font-bold">₹{totalPaid}</div>
                                    </div>
                                    <div className="bg-black/30 rounded-lg p-3 text-center">
                                        <div className="text-xs text-gray-500">Pending</div>
                                        <div className={`font-bold ${pendingAmount > 0 ? 'text-red-400' : 'text-green-400'}`}>₹{pendingAmount}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Coupon Code */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Coupon Code *</label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="e.g., SAVE20"
                                className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white font-mono uppercase"
                                required
                            />
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
                        </div>

                        {/* Expiry Date */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Expiry Date *</label>
                            <input
                                type="date"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value)}
                                className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                required
                            />
                        </div>

                        {/* Usage Limit & Min Purchase */}
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

                        {/* Active Toggle */}
                        <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                            <div>
                                <label className="text-sm font-medium">Coupon Status</label>
                                <p className="text-xs text-gray-500">Enable or disable this coupon</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsActive(!isActive)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? 'bg-green-600' : 'bg-gray-600'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
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

                        {/* Assign to Users */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Assign to Users</label>
                            {selectedUsers.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {selectedUsers.map(user => (
                                        <span key={user._id} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-sm border border-blue-700">
                                            {user.name}
                                            <button
                                                type="button"
                                                onClick={() => toggleUserSelection(user)}
                                                className="ml-1 text-blue-400 hover:text-red-400 font-bold"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            <input
                                type="text"
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                placeholder="Search users by name or email..."
                                className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white mb-2"
                            />
                            {userSearch && filteredUsers.length > 0 && (
                                <div className="max-h-40 overflow-y-auto bg-black border border-gray-700 rounded-lg divide-y divide-gray-800">
                                    {filteredUsers.slice(0, 10).map(user => (
                                        <button
                                            key={user._id}
                                            type="button"
                                            onClick={() => {
                                                toggleUserSelection(user);
                                                setUserSearch('');
                                            }}
                                            className="w-full text-left px-4 py-2 hover:bg-gray-800 transition-colors"
                                        >
                                            <span className="text-white">{user.name}</span>
                                            <span className="text-gray-500 text-sm ml-2">{user.email}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {userSearch && filteredUsers.length === 0 && (
                                <p className="text-gray-500 text-sm py-2">No users found</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">Assigned users can track this coupon from their account</p>
                        </div>
                    </div>

                    {/* Record Payment */}
                    {assignedAmount > 0 && (
                        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 space-y-4">
                            <h3 className="text-lg font-bold">Record Payment</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Amount (₹) *</label>
                                    <input
                                        type="number"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        placeholder="e.g., 1000"
                                        min="1"
                                        className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Note (Optional)</label>
                                    <input
                                        type="text"
                                        value={paymentNote}
                                        onChange={(e) => setPaymentNote(e.target.value)}
                                        placeholder="e.g., UPI transfer"
                                        className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddPayment}
                                disabled={addingPayment}
                                className={`px-6 py-2 rounded-lg font-bold text-sm ${addingPayment ? 'bg-gray-600 text-gray-300' : 'bg-green-600 text-white hover:bg-green-700'}`}
                            >
                                {addingPayment ? 'Recording...' : 'Record Payment'}
                            </button>

                            {/* Payment History */}
                            {paymentHistory.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-medium text-gray-400 mb-2">Payment History</h4>
                                    <div className="bg-black rounded-lg border border-gray-800 divide-y divide-gray-800">
                                        {paymentHistory.slice().reverse().map((payment, i) => (
                                            <div key={payment._id || i} className="px-4 py-3 flex justify-between items-center">
                                                <div>
                                                    <span className="text-green-400 font-bold">₹{payment.amount}</span>
                                                    {payment.note && <span className="text-gray-500 text-sm ml-2">— {payment.note}</span>}
                                                </div>
                                                <span className="text-gray-500 text-xs">
                                                    {new Date(payment.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

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
                            {submitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
