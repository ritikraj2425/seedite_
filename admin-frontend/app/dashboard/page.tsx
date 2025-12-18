'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        if (!adminUser.token || adminUser.role !== 'admin') {
            router.push('/login');
            return;
        }

        fetch('http://localhost:5000/api/admin/stats', {
            headers: { 'Authorization': `Bearer ${adminUser.token}` }
        })
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('adminUser');
        router.push('/login');
    };

    if (loading) return <div className="p-8 bg-black text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Top Nav */}
            <nav className="bg-black border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-medium"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Total Courses" value={stats?.totalCourses || 0} />
                    <StatCard title="Total Users" value={stats?.totalUsers || 0} />
                    <StatCard title="Total Lectures" value={stats?.totalLectures || 0} />
                    <StatCard title="Mock Tests" value={stats?.totalMockTests || 0} />
                </div>

                {/* Quick Actions */}
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Link href="/courses/new">
                            <div className="border-2 border-white rounded-lg p-6 text-center hover:bg-gray-800 transition cursor-pointer">
                                <div className="text-4xl mb-2">➕</div>
                                <h3 className="font-semibold">Create Course</h3>
                            </div>
                        </Link>
                        <Link href="/courses">
                            <div className="border-2 border-white rounded-lg p-6 text-center hover:bg-gray-800 transition cursor-pointer">
                                <div className="text-4xl mb-2">📚</div>
                                <h3 className="font-semibold">Manage Courses</h3>
                            </div>
                        </Link>
                        <Link href="/users">
                            <div className="border-2 border-white rounded-lg p-6 text-center hover:bg-gray-800 transition cursor-pointer">
                                <div className="text-4xl mb-2">👥</div>
                                <h3 className="font-semibold">View Users</h3>
                            </div>
                        </Link>
                        <Link href="/analytics">
                            <div className="border-2 border-white rounded-lg p-6 text-center hover:bg-gray-800 transition cursor-pointer">
                                <div className="text-4xl mb-2">📈</div>
                                <h3 className="font-semibold">Analytics</h3>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Recent Courses */}
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                    <h2 className="text-xl font-bold mb-4">Recent Courses</h2>
                    <div className="space-y-3">
                        {stats?.recentCourses?.map((course: any) => (
                            <div key={course._id} className="flex justify-between items-center p-4 bg-black rounded-lg border border-gray-800">
                                <div>
                                    <h3 className="font-semibold">{course.title}</h3>
                                    <p className="text-sm text-gray-400">₹{course.price}</p>
                                </div>
                                <Link href={`/courses/${course._id}`}>
                                    <button className="px-4 py-2 bg-white text-black rounded-lg text-sm hover:bg-gray-200 font-medium">
                                        Edit
                                    </button>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value }: { title: string; value: number }) {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="w-12 h-12 bg-white text-black rounded-lg flex items-center justify-center text-2xl font-bold mb-4">
                {value}
            </div>
            <h3 className="text-gray-400 text-sm">{title}</h3>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    );
}
