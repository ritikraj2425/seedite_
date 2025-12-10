'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        if (!adminUser.token) {
            router.push('/login');
            return;
        }

        // Fetch all users
        fetch('http://localhost:5000/api/admin/users', {
            headers: { 'Authorization': `Bearer ${adminUser.token}` }
        })
            .then(res => res.json())
            .then(data => {
                setUsers(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [router]);

    if (loading) return <div className="p-8 bg-black text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-black text-white">
            <nav className="bg-black border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center space-x-4">
                            <Link href="/dashboard" className="text-gray-400 hover:text-white">← Back</Link>
                            <h1 className="text-2xl font-bold">Users</h1>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-black border-b border-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-medium">Name</th>
                                <th className="px-6 py-3 text-left text-sm font-medium">Email</th>
                                <th className="px-6 py-3 text-left text-sm font-medium">Role</th>
                                <th className="px-6 py-3 text-left text-sm font-medium">Enrolled Courses</th>
                                <th className="px-6 py-3 text-left text-sm font-medium">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {users.map(user => (
                                <tr key={user._id} className="hover:bg-gray-800">
                                    <td className="px-6 py-4">{user.name}</td>
                                    <td className="px-6 py-4 text-gray-400">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-white text-black' : 'bg-gray-700'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400">{user.enrolledCourses?.length || 0}</td>
                                    <td className="px-6 py-4 text-gray-400">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
