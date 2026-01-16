'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import toast from 'react-hot-toast';

export default function FreeAccessPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [freeAccessList, setFreeAccessList] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [reason, setReason] = useState('');
    const [granting, setGranting] = useState(false);

    useEffect(() => {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        if (!adminUser.token || adminUser.role !== 'admin') {
            router.push('/login');
            return;
        }

        const fetchData = async () => {
            try {
                // Fetch users
                const usersRes = await fetch(`${API_URL}/api/admin/users`, {
                    headers: { 'Authorization': `Bearer ${adminUser.token}` }
                });
                if (usersRes.ok) {
                    const data = await usersRes.json();
                    setUsers(data);
                }

                // Fetch courses
                const coursesRes = await fetch(`${API_URL}/api/courses`, {
                    headers: { 'Authorization': `Bearer ${adminUser.token}` }
                });
                if (coursesRes.ok) {
                    const data = await coursesRes.json();
                    setCourses(data);
                }

                // Fetch free access list
                const freeAccessRes = await fetch(`${API_URL}/api/admin/free-access`, {
                    headers: { 'Authorization': `Bearer ${adminUser.token}` }
                });
                if (freeAccessRes.ok) {
                    const data = await freeAccessRes.json();
                    setFreeAccessList(data);
                }
            } catch (err) {
                console.error(err);
                toast.error('Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleGrantAccess = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !selectedCourse) {
            toast.error('Please select a user and course');
            return;
        }

        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        setGranting(true);

        try {
            const res = await fetch(`${API_URL}/api/admin/free-access`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminUser.token}`
                },
                body: JSON.stringify({
                    userId: selectedUser._id,
                    courseId: selectedCourse,
                    reason
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('Free access granted successfully!');
                setFreeAccessList([data.freeAccess, ...freeAccessList]);
                setSelectedUser(null);
                setSelectedCourse('');
                setReason('');
                setSearchQuery('');
            } else {
                toast.error(data.message || 'Failed to grant access');
            }
        } catch (err) {
            toast.error('Error granting access');
        } finally {
            setGranting(false);
        }
    };

    const handleRevokeAccess = async (userId: string, courseId: string) => {
        if (!confirm('Are you sure you want to revoke this free access?')) return;

        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

        try {
            const res = await fetch(`${API_URL}/api/admin/free-access/${userId}/${courseId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminUser.token}` }
            });

            if (res.ok) {
                toast.success('Free access revoked');
                setFreeAccessList(freeAccessList.filter(
                    fa => !(fa.user?._id === userId && fa.course?._id === courseId)
                ));
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to revoke');
            }
        } catch (err) {
            toast.error('Error revoking access');
        }
    };

    if (loading) return (
        <div className="p-8 bg-black text-white h-screen flex items-center justify-center">
            <div className="text-xl animate-pulse">Loading...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Nav */}
            <nav className="bg-black border-b border-gray-800 sticky top-0 z-50 bg-opacity-80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-4">
                            <Link href="/analytics" className="text-gray-400 hover:text-white transition">
                                ← Back to Analytics
                            </Link>
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                                Free Access Management
                            </h1>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 p-6 rounded-xl border border-emerald-500/20">
                        <p className="text-gray-400 text-sm">Total Free Access Grants</p>
                        <p className="text-4xl font-bold text-emerald-400">{freeAccessList.length}</p>
                    </div>
                    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                        <p className="text-gray-400 text-sm">Total Users</p>
                        <p className="text-2xl font-bold text-white">{users.length}</p>
                    </div>
                    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                        <p className="text-gray-400 text-sm">Total Courses</p>
                        <p className="text-2xl font-bold text-white">{courses.length}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Grant Access Form */}
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            🎁 Grant Free Access
                        </h2>

                        <form onSubmit={handleGrantAccess} className="space-y-4">
                            {/* User Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Search User
                                </label>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by email or name..."
                                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                                />
                                {searchQuery && filteredUsers.length > 0 && !selectedUser && (
                                    <div className="mt-2 max-h-48 overflow-y-auto bg-gray-800 rounded-lg border border-gray-700">
                                        {filteredUsers.slice(0, 5).map(u => (
                                            <button
                                                key={u._id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedUser(u);
                                                    setSearchQuery(u.email);
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-gray-700 transition flex justify-between items-center"
                                            >
                                                <div>
                                                    <p className="font-medium">{u.name}</p>
                                                    <p className="text-sm text-gray-400">{u.email}</p>
                                                </div>
                                                <span className="text-xs bg-gray-600 px-2 py-1 rounded">
                                                    {u.enrolledCourses?.length || 0} courses
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {selectedUser && (
                                    <div className="mt-2 px-4 py-3 bg-emerald-900/30 border border-emerald-500/30 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-emerald-300">{selectedUser.name}</p>
                                            <p className="text-sm text-gray-400">{selectedUser.email}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedUser(null);
                                                setSearchQuery('');
                                            }}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            ✕ Clear
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Course Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Select Course
                                </label>
                                <select
                                    value={selectedCourse}
                                    onChange={(e) => setSelectedCourse(e.target.value)}
                                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                                    required
                                >
                                    <option value="">Choose a course...</option>
                                    {courses.map(c => (
                                        <option key={c._id} value={c._id}>
                                            {c.title} (₹{c.price})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Reason (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="e.g., Contest winner, Promotional offer..."
                                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={granting || !selectedUser || !selectedCourse}
                                className={`w-full py-3 rounded-lg font-bold transition ${granting || !selectedUser || !selectedCourse
                                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-black hover:opacity-90'
                                    }`}
                            >
                                {granting ? 'Granting...' : 'Grant Free Access'}
                            </button>
                        </form>
                    </div>

                    {/* Free Access List */}
                    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                        <div className="p-6 border-b border-gray-800">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                📋 Free Access Records
                                <span className="bg-emerald-900 text-emerald-200 text-xs px-2 py-1 rounded-full">
                                    {freeAccessList.length}
                                </span>
                            </h2>
                        </div>
                        <div className="overflow-y-auto max-h-[500px]">
                            {freeAccessList.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead className="bg-black/50 text-gray-400 text-xs uppercase tracking-wider sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3">User</th>
                                            <th className="px-4 py-3">Course</th>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {freeAccessList.map((fa, idx) => (
                                            <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-sm">{fa.user?.name || 'Unknown'}</p>
                                                    <p className="text-xs text-gray-500">{fa.user?.email}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm">{fa.course?.title || 'Unknown'}</p>
                                                    {fa.reason && (
                                                        <p className="text-xs text-gray-500 italic">"{fa.reason}"</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-400">
                                                    {fa.createdAt ? new Date(fa.createdAt).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => handleRevokeAccess(fa.user?._id, fa.course?._id)}
                                                        className="text-xs bg-red-900/30 text-red-400 px-3 py-1 rounded hover:bg-red-900/50 transition"
                                                    >
                                                        Revoke
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <div className="mb-4 text-4xl">🎟️</div>
                                    <p>No free access grants yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
