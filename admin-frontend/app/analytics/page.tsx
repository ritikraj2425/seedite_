'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Analytics() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [payments, setPayments] = useState<any[]>([]);
    const [coupons, setCoupons] = useState<any[]>([]);
    const [feedback, setFeedback] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        if (!adminUser.token || adminUser.role !== 'admin') {
            router.push('/login');
            return;
        }

        const fetchData = async () => {
            try {
                // 1. Fetch Stats
                const statsRes = await fetch(`${API_URL}/api/admin/stats`, {
                    headers: { 'Authorization': `Bearer ${adminUser.token}` }
                });
                if (statsRes.ok) {
                    const data = await statsRes.json();
                    setStats(data);
                }

                // 2. Fetch Payments (Real Transaction Data)
                const paymentsRes = await fetch(`${API_URL}/api/payment/all`, {
                    headers: { 'Authorization': `Bearer ${adminUser.token}` }
                });
                if (paymentsRes.ok) {
                    const data = await paymentsRes.json();
                    setPayments(data.payments || []);
                }

                // 3. Fetch Coupons
                const couponsRes = await fetch(`${API_URL}/api/coupons`, {
                    headers: { 'Authorization': `Bearer ${adminUser.token}` }
                });
                if (couponsRes.ok) {
                    const data = await couponsRes.json();
                    setCoupons(data.coupons || []);
                }

                // 4. Fetch Feedback
                try {
                    const feedbackRes = await fetch(`${API_URL}/api/admin/feedback`, {
                        headers: { 'Authorization': `Bearer ${adminUser.token}` }
                    });
                    if (feedbackRes.ok) {
                        const feedbackData = await feedbackRes.json();
                        setFeedback(feedbackData);
                    }
                } catch (e) {
                    console.log("Feedback fetch failed", e);
                }

            } catch (err) {
                console.error(err);
                toast.error('Failed to load analytics');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    const handleCopyEmails = (emails: string[]) => {
        if (!emails || emails.length === 0) {
            toast.error('No emails to copy');
            return;
        }
        const emailString = emails.join(', ');
        navigator.clipboard.writeText(emailString)
            .then(() => toast.success(`Copied ${emails.length} emails to clipboard`))
            .catch(() => toast.error('Failed to copy emails'));
    };

    // Data Processing
    const chartData = useMemo(() => {
        if (!stats?.courseAnalytics) return [];

        return stats.courseAnalytics.map((c: any) => {
            // Calculate real revenue for chart (same logic as coursePerformance)
            const coursePayments = payments.filter(p => p.status === 'paid' && (p.course?._id === c._id || p.course === c._id));
            const realRevenue = coursePayments.reduce((sum, p) => sum + (p.amount || 0), 0);

            return {
                name: c.title.length > 15 ? c.title.substring(0, 15) + '...' : c.title,
                fullTitle: c.title,
                enrolled: c.enrolledCount,
                revenue: realRevenue, // Use real revenue
                avgScore: parseFloat(c.avgMockScore) || 0
            };
        });
    }, [stats, payments]);

    const globalMetrics = useMemo(() => {
        if (!payments.length) return { revenue: 0, discounts: 0, couponsUsed: 0 };
        const paid = payments.filter(p => p.status === 'paid');
        return {
            revenue: paid.reduce((sum, p) => sum + (p.amount || 0), 0),
            discounts: paid.reduce((sum, p) => sum + (p.discountApplied || 0), 0),
            couponsUsed: paid.filter(p => p.coupon).length
        };
    }, [payments]);

    const couponPerformance = useMemo(() => {
        if (!payments.length) return [];
        const paid = payments.filter(p => p.status === 'paid');
        const performanceMap: Record<string, any> = {};

        paid.forEach(p => {
            if (p.coupon) {
                let code = "";
                if (typeof p.coupon === 'object') {
                    code = p.coupon.code;
                } else {
                    const couponObj = coupons.find(c => c._id === p.coupon);
                    code = couponObj ? couponObj.code : "Unknown";
                }

                if (!performanceMap[code]) {
                    performanceMap[code] = { code, uses: 0, revenue: 0, discount: 0 };
                }
                performanceMap[code].uses += 1;
                performanceMap[code].revenue += (p.amount || 0);
                performanceMap[code].discount += (p.discountApplied || 0);
            }
        });

        return Object.values(performanceMap).sort((a, b) => b.revenue - a.revenue);
    }, [payments, coupons]);

    const coursePerformance = useMemo(() => {
        if (!stats?.courseAnalytics) return [];

        // Enhance stats with real revenue data from payments
        return stats.courseAnalytics.map((c: any) => {
            const coursePayments = payments.filter(p => p.status === 'paid' && (p.course?._id === c._id || p.course === c._id));
            const realRevenue = coursePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
            const realDiscounts = coursePayments.reduce((sum, p) => sum + (p.discountApplied || 0), 0);

            return {
                ...c,
                realRevenue,
                realDiscounts
            };
        }).sort((a: any, b: any) => b.realRevenue - a.realRevenue);
    }, [stats, payments]);

    const groupedFeedback: Record<string, any[]> = {};
    feedback.forEach((f) => {
        const courseTitle = f.courseId?.title || f.courseTitle || 'General / Unknown';
        if (!groupedFeedback[courseTitle]) {
            groupedFeedback[courseTitle] = [];
        }
        groupedFeedback[courseTitle].push(f);
    });

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    if (loading) return <div className="p-8 bg-black text-white h-screen flex items-center justify-center">
        <div className="text-xl animate-pulse">Loading Analytics Data...</div>
    </div>;

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Nav */}
            <nav className="bg-black border-b border-gray-800 sticky top-0 z-50 bg-opacity-80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="text-gray-400 hover:text-white transition">
                                ← Dashboard
                            </Link>
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                                Analytics & Insights
                            </h1>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                        <p className="text-gray-400 text-sm">Real Revenue (Paid)</p>
                        <p className="text-2xl font-bold text-green-400">₹{globalMetrics.revenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                        <p className="text-gray-400 text-sm">Discounts Given</p>
                        <p className="text-2xl font-bold text-red-400">₹{globalMetrics.discounts.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                        <p className="text-gray-400 text-sm">Total Coupons Used</p>
                        <p className="text-2xl font-bold text-blue-400">{globalMetrics.couponsUsed}</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                        <p className="text-gray-400 text-sm">Total Enrollments</p>
                        <p className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                        <p className="text-gray-400 text-sm">Total Courses</p>
                        <p className="text-2xl font-bold text-white">{stats?.totalCourses || 0}</p>
                    </div>
                </div>

                {/* 2. Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Revenue Bar Chart */}
                    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                        <h3 className="text-lg font-bold mb-6 text-gray-200">Revenue Distribution by Course</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tick={{ dy: 5 }} />
                                    <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `₹${value / 1000}k`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: 'white' }}
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    />
                                    <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Enrollments Pie/Bar Chart */}
                    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                        <h3 className="text-lg font-bold mb-6 text-gray-200">Student Enrollment Share</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }: any) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="enrolled"
                                        nameKey="name"
                                    >
                                        {chartData?.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                                    <Legend formatter={(value, entry: any) => <span className="text-gray-400 text-xs ml-2">{value}</span>} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* 3. Feature Requests Section (New) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    📢 Student Voice
                                    <span className="bg-blue-900 text-blue-200 text-xs px-2 py-1 rounded-full">{feedback.length} Requests</span>
                                </h2>
                                <p className="text-gray-400 text-sm mt-1">Feature requests and feedback collected from course pages.</p>
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[500px] custom-scrollbar">
                            {Object.keys(groupedFeedback).length > 0 ? (
                                <div className="space-y-8">
                                    {Object.entries(groupedFeedback).map(([courseName, requests]) => (
                                        <div key={courseName}>
                                            <h3 className="text-sm font-semibold text-blue-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                                                {courseName}
                                            </h3>
                                            <div className="grid gap-3">
                                                {requests.map((req: any, i) => (
                                                    <div key={i} className="bg-gray-800/50 hover:bg-gray-800 p-4 rounded-lg border border-gray-700/50 transition-all group">
                                                        <div className="flex justify-between items-start gap-4">
                                                            <p className="text-gray-200 text-sm leading-relaxed">"{req.text}"</p>
                                                        </div>
                                                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold">
                                                                    {req.user?.name?.charAt(0) || 'U'}
                                                                </div>
                                                                <span>{req.user?.name || 'Anonymous User'}</span>
                                                            </div>
                                                            <span>{req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Recent'}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <div className="mb-4 text-4xl">📭</div>
                                    <p>No feature requests received yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats/Suggestions Side Column */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-blue-900/20 to-emerald-900/20 border border-blue-500/20 rounded-xl p-6">
                            <h3 className="text-lg font-bold mb-3 text-blue-300">💡 Insights</h3>
                            <ul className="space-y-3 text-sm text-gray-400">
                                <li className="flex gap-2">
                                    <span className="text-blue-400">•</span>
                                    <span>Top performing course: <strong className="text-white">{[...(chartData || [])].sort((a: any, b: any) => b.revenue - a.revenue)[0]?.fullTitle || 'N/A'}</strong></span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-blue-400">•</span>
                                    <span>Most popular course: <strong className="text-white">{[...(chartData || [])].sort((a: any, b: any) => b.enrolled - a.enrolled)[0]?.fullTitle || 'N/A'}</strong></span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-blue-400">•</span>
                                    <span>Avg. Revenue per batch: <strong className="text-white">₹{stats?.courseAnalytics?.length ? Math.round(globalMetrics.revenue / stats.courseAnalytics.length).toLocaleString() : 0}</strong></span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Tab: Batches Overview */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-8">
                    <div className="p-6 border-b border-gray-800">
                        <h3 className="text-xl font-bold">All Batches Performance</h3>
                        <p className="text-sm text-gray-400 mt-1">Detailed performance tracking for each active course</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-black/50 text-gray-400 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Batch Name</th>
                                    <th className="px-6 py-4 font-medium">Students enrolled</th>
                                    <th className="px-6 py-4 font-medium">Real Revenue</th>
                                    <th className="px-6 py-4 font-medium">Discounts</th>
                                    <th className="px-6 py-4 font-medium">Avg. Score</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {coursePerformance.map((course: any) => (
                                    <tr key={course._id} className="hover:bg-gray-800/30 transition-colors">
                                        <td className="px-6 py-4 font-medium">{course.title}</td>
                                        <td className="px-6 py-4">{course.enrolledCount}</td>
                                        <td className="px-6 py-4 text-green-400 font-bold">₹{course.realRevenue.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-red-400">₹{course.realDiscounts.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${parseFloat(course.avgMockScore) > 60 ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                                                {course.avgMockScore}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleCopyEmails(course.studentEmails)}
                                                className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded transition-colors"
                                                title="Copy all student emails"
                                            >
                                                Copy Emails
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Coupon Performance Section */}
                {couponPerformance.length > 0 && (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-8">
                        <div className="p-6 border-b border-gray-800">
                            <h3 className="text-xl font-bold">Coupon Sales Performance</h3>
                            <p className="text-sm text-gray-400 mt-1">Impact of discount codes on course sales</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-black/50 text-gray-400 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Coupon Code</th>
                                        <th className="px-6 py-4 font-medium">Total Uses</th>
                                        <th className="px-6 py-4 font-medium">Revenue Generated</th>
                                        <th className="px-6 py-4 font-medium">Total Discount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {couponPerformance.map((item: any) => (
                                        <tr key={item.code} className="hover:bg-gray-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-mono font-bold text-blue-400 bg-blue-900/20 px-2 py-1 rounded">
                                                    {item.code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold">{item.uses}</td>
                                            <td className="px-6 py-4 text-green-400 font-bold">₹{item.revenue.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-red-300">₹{item.discount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
