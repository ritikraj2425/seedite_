'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Analytics() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
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

                // 2. Fetch Feedback (Assuming endpoint exists, or fallback)
                // We'll try a generic endpoint that usually serves this
                try {
                    const feedbackRes = await fetch(`${API_URL}/api/admin/feedback`, {
                        headers: { 'Authorization': `Bearer ${adminUser.token}` }
                    });
                    if (feedbackRes.ok) {
                        const feedbackData = await feedbackRes.json();
                        setFeedback(feedbackData);
                    } else {
                        // Fallback - try to get it from a general feedback endpoint if specific admin one doesn't exist
                        // Or just leave empty
                        console.warn("Feedback endpoint might not be implemented yet");
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

    if (loading) return <div className="p-8 bg-black text-white min-h-screen">Loading Analytics...</div>;

    const totalRevenue = stats?.courseAnalytics?.reduce((acc: number, curr: any) => acc + curr.totalRevenue, 0) || 0;
    const totalEnrollments = stats?.courseAnalytics?.reduce((acc: number, curr: any) => acc + curr.enrolledCount, 0) || 0;

    // Prepare chart data
    const chartData = stats?.courseAnalytics?.map((c: any) => ({
        name: c.title.length > 15 ? c.title.substring(0, 15) + '...' : c.title,
        revenue: c.totalRevenue,
        students: c.enrolledCount,
        fullTitle: c.title
    })) || [];

    // Group Feedback by Course
    // Assuming feedback object: { courseId: { title: "..." } | "id", text: "...", user: { name: "..." }, createdAt: "..." }
    const groupedFeedback: Record<string, any[]> = {};
    feedback.forEach((f) => {
        const courseTitle = f.courseId?.title || f.courseTitle || 'General / Unknown';
        if (!groupedFeedback[courseTitle]) {
            groupedFeedback[courseTitle] = [];
        }
        groupedFeedback[courseTitle].push(f);
    });

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

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

                {/* 1. Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg shadow-green-900/10">
                        <h3 className="text-gray-400 text-sm mb-2 font-medium uppercase tracking-wider">Total Revenue</h3>
                        <p className="text-4xl font-bold text-green-400">₹{totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg shadow-blue-900/10">
                        <h3 className="text-gray-400 text-sm mb-2 font-medium uppercase tracking-wider">Total Enrollments</h3>
                        <p className="text-4xl font-bold text-blue-400">{totalEnrollments}</p>
                    </div>
                    {/* New Metrics Idea: Average Revenue Per User (ARPU) */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
                        <h3 className="text-gray-400 text-sm mb-2 font-medium uppercase tracking-wider">Avg. Revenue / Student</h3>
                        <p className="text-4xl font-bold text-purple-400">
                            {totalEnrollments > 0 ? `₹${Math.round(totalRevenue / totalEnrollments).toLocaleString()}` : '₹0'}
                        </p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
                        <h3 className="text-gray-400 text-sm mb-2 font-medium uppercase tracking-wider">Active Batches</h3>
                        <p className="text-4xl font-bold text-pink-400">{stats?.courseAnalytics?.length || 0}</p>
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
                                        dataKey="students"
                                        nameKey="name"
                                    >
                                        {chartData.map((entry: any, index: number) => (
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
                                    <span className="bg-purple-900 text-purple-200 text-xs px-2 py-1 rounded-full">{feedback.length} Requests</span>
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
                        <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-xl p-6">
                            <h3 className="text-lg font-bold mb-3 text-indigo-300">💡 Insights</h3>
                            <ul className="space-y-3 text-sm text-gray-400">
                                <li className="flex gap-2">
                                    <span className="text-indigo-400">•</span>
                                    <span>Top performing course: <strong className="text-white">{chartData.sort((a: any, b: any) => b.revenue - a.revenue)[0]?.fullTitle || 'N/A'}</strong></span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-indigo-400">•</span>
                                    <span>Most popular course: <strong className="text-white">{chartData.sort((a: any, b: any) => b.students - a.students)[0]?.fullTitle || 'N/A'}</strong></span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-indigo-400">•</span>
                                    <span>Avg. Revenue per batch: <strong className="text-white">₹{stats?.courseAnalytics?.length ? Math.round(totalRevenue / stats.courseAnalytics.length).toLocaleString() : 0}</strong></span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Original Table */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                        <h2 className="text-lg font-bold">All Batches Performance</h2>
                        <button className="text-xs text-gray-400 hover:text-white transition">Download CSV</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-950/50 text-gray-400 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4 font-medium tracking-wider">Batch Name</th>
                                    <th className="px-6 py-4 font-medium tracking-wider">Price</th>
                                    <th className="px-6 py-4 font-medium tracking-wider">Students</th>
                                    <th className="px-6 py-4 font-medium tracking-wider">Revenue</th>
                                    <th className="px-6 py-4 font-medium tracking-wider">Avg Mock Score</th>
                                    <th className="px-6 py-4 font-medium tracking-wider">Tests Taken</th>
                                    <th className="px-6 py-4 text-right font-medium tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {stats?.courseAnalytics?.map((batch: any) => (
                                    <tr key={batch._id} className="group hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-200">{batch.title}</td>
                                        <td className="px-6 py-4 text-gray-400">₹{batch.price}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-200 border border-blue-800">
                                                {batch.enrolledCount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-emerald-400 font-medium">₹{batch.totalRevenue.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-gray-300">{batch.avgMockScore}%</td>
                                        <td className="px-6 py-4 text-gray-300">{batch.totalTestsTaken}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleCopyEmails(batch.studentEmails)}
                                                className="text-xs bg-gray-800 hover:bg-blue-600 text-blue-200 hover:text-white px-3 py-1.5 rounded transition border border-gray-700 hover:border-blue-500"
                                                title="Copy Student Emails"
                                            >
                                                Copy Emails
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {(!stats?.courseAnalytics || stats.courseAnalytics.length === 0) && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            No batches found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
