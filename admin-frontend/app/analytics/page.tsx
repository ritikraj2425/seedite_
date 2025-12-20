'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import toast from 'react-hot-toast';

export default function Analytics() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        if (!adminUser.token || adminUser.role !== 'admin') {
            router.push('/login');
            return;
        }

        fetch(`${API_URL}/api/admin/stats`, {
            headers: { 'Authorization': `Bearer ${adminUser.token}` }
        })
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                toast.error('Failed to load analytics');
                setLoading(false);
            });
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

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Nav */}
            <nav className="bg-black border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="text-gray-400 hover:text-white">
                                ← Dashboard
                            </Link>
                            <h1 className="text-2xl font-bold">Analytics & Revenue</h1>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                        <h3 className="text-gray-400 text-sm mb-2">Total Revenue</h3>
                        <p className="text-4xl font-bold text-green-500">₹{totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                        <h3 className="text-gray-400 text-sm mb-2">Total Enrollments</h3>
                        <p className="text-4xl font-bold text-blue-500">{totalEnrollments}</p>
                    </div>
                </div>

                {/* Detailed Table */}
                <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                    <div className="p-6 border-b border-gray-800">
                        <h2 className="text-xl font-bold">Batch Performance</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-950 text-gray-400 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">Batch Name</th>
                                    <th className="px-6 py-4">Price</th>
                                    <th className="px-6 py-4">Students</th>
                                    <th className="px-6 py-4">Revenue</th>
                                    <th className="px-6 py-4">Avg Mock Score</th>
                                    <th className="px-6 py-4">Tests Taken</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {stats?.courseAnalytics?.map((batch: any) => (
                                    <tr key={batch._id} className="hover:bg-gray-800/50">
                                        <td className="px-6 py-4 font-medium">{batch.title}</td>
                                        <td className="px-6 py-4">₹{batch.price}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-200">
                                                {batch.enrolledCount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-green-400">₹{batch.totalRevenue.toLocaleString()}</td>
                                        <td className="px-6 py-4">{batch.avgMockScore}%</td>
                                        <td className="px-6 py-4">{batch.totalTestsTaken}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleCopyEmails(batch.studentEmails)}
                                                className="text-sm bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded transition"
                                                title="Copy Student Emails"
                                            >
                                                📋 Copy Emails
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {(!stats?.courseAnalytics || stats.courseAnalytics.length === 0) && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
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
