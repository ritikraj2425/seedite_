'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import toast from 'react-hot-toast';

export default function CollegeAnalyticsPage() {
    const router = useRouter();
    const params = useParams();
    const collegeId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState<any>(null);

    useEffect(() => {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        if (!adminUser.token || adminUser.role !== 'admin') {
            router.push('/login');
            return;
        }

        const fetchAnalytics = async () => {
            try {
                const res = await fetch(`${API_URL}/api/admin/colleges/${collegeId}/analytics`, {
                    headers: { 'Authorization': `Bearer ${adminUser.token}` }
                });

                if (res.ok) {
                    setAnalytics(await res.json());
                } else {
                    toast.error('Failed to load analytics');
                }
            } catch (err) {
                console.error(err);
                toast.error('Error loading analytics');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [router, collegeId]);

    if (loading) return (
        <div className="p-8 bg-black text-white h-screen flex items-center justify-center">
            <div className="text-xl animate-pulse">Loading Analytics...</div>
        </div>
    );

    if (!analytics) return (
        <div className="p-8 bg-black text-white h-screen flex items-center justify-center">
            <p>Analytics not available</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Nav */}
            <nav className="bg-black border-b border-gray-800 sticky top-0 z-50 bg-opacity-80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-4">
                            <Link href={`/colleges/${collegeId}`} className="text-gray-400 hover:text-white transition">
                                ← Back to {analytics.collegeName}
                            </Link>
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                                {analytics.collegeName} — Analytics
                            </h1>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 p-6 rounded-xl border border-blue-500/20">
                        <p className="text-gray-400 text-sm">Total Active Students</p>
                        <p className="text-4xl font-bold text-blue-400">{analytics.totalStudents}</p>
                    </div>
                    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                        <p className="text-gray-400 text-sm">Overall Avg. Completion</p>
                        <p className="text-4xl font-bold text-emerald-400">{analytics.overallAverageProgress}%</p>
                    </div>
                    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                        <p className="text-gray-400 text-sm">Courses Assigned</p>
                        <p className="text-4xl font-bold text-white">
                            {analytics.students?.[0]?.courses?.length || 0}
                        </p>
                    </div>
                </div>

                {/* Student Progress Table */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                    <div className="p-6 border-b border-gray-800">
                        <h2 className="text-xl font-bold">Student Progress</h2>
                        <p className="text-sm text-gray-400 mt-1">Detailed completion tracking for each student</p>
                    </div>

                    {analytics.students?.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-black/50 text-gray-400 text-xs uppercase tracking-wider sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4">Student</th>
                                        {analytics.students[0]?.courses?.map((c: any) => (
                                            <th key={c.courseId} className="px-4 py-4 text-center">
                                                {c.courseTitle?.length > 20 ? c.courseTitle.substring(0, 20) + '...' : c.courseTitle}
                                            </th>
                                        ))}
                                        <th className="px-6 py-4 text-center">Average</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {analytics.students.map((student: any) => (
                                        <tr key={student.userId} className="hover:bg-gray-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-medium">{student.name}</p>
                                                <p className="text-xs text-gray-500">{student.email}</p>
                                            </td>
                                            {student.courses?.map((c: any) => (
                                                <td key={c.courseId} className="px-4 py-4">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className={`text-sm font-bold ${
                                                            c.progress >= 70 ? 'text-emerald-400' :
                                                            c.progress >= 30 ? 'text-yellow-400' :
                                                            'text-gray-400'
                                                        }`}>
                                                            {c.progress}%
                                                        </span>
                                                        <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${
                                                                    c.progress >= 70 ? 'bg-emerald-400' :
                                                                    c.progress >= 30 ? 'bg-yellow-400' :
                                                                    'bg-gray-500'
                                                                }`}
                                                                style={{ width: `${c.progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                            ))}
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                                    student.averageProgress >= 70 ? 'bg-emerald-900/30 text-emerald-400' :
                                                    student.averageProgress >= 30 ? 'bg-yellow-900/30 text-yellow-400' :
                                                    'bg-red-900/30 text-red-400'
                                                }`}>
                                                    {student.averageProgress}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-16 text-gray-500">
                            <div className="mb-4 text-5xl">📊</div>
                            <p className="text-lg">No active students yet.</p>
                            <p className="text-sm mt-1">Students will appear here once they register and start watching.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
