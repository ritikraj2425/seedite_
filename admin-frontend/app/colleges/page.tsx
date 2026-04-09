'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import toast from 'react-hot-toast';

export default function CollegesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [colleges, setColleges] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Create form state
    const [newName, setNewName] = useState('');
    const [newCourseIds, setNewCourseIds] = useState<string[]>([]);
    const [newEmails, setNewEmails] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        if (!adminUser.token || adminUser.role !== 'admin') {
            router.push('/login');
            return;
        }

        const fetchData = async () => {
            try {
                const [collegesRes, coursesRes] = await Promise.all([
                    fetch(`${API_URL}/api/admin/colleges`, {
                        headers: { 'Authorization': `Bearer ${adminUser.token}` }
                    }),
                    fetch(`${API_URL}/api/courses`, {
                        headers: { 'Authorization': `Bearer ${adminUser.token}` }
                    })
                ]);

                if (collegesRes.ok) setColleges(await collegesRes.json());
                if (coursesRes.ok) setCourses(await coursesRes.json());
            } catch (err) {
                console.error(err);
                toast.error('Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) {
            toast.error('College name is required');
            return;
        }

        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        setCreating(true);

        try {
            const res = await fetch(`${API_URL}/api/admin/colleges`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminUser.token}`
                },
                body: JSON.stringify({
                    name: newName,
                    courseIds: newCourseIds,
                    emails: newEmails
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || 'College created!');
                setShowCreateModal(false);
                setNewName('');
                setNewCourseIds([]);
                setNewEmails('');
                // Refresh list
                const refreshRes = await fetch(`${API_URL}/api/admin/colleges`, {
                    headers: { 'Authorization': `Bearer ${adminUser.token}` }
                });
                if (refreshRes.ok) setColleges(await refreshRes.json());
            } else {
                toast.error(data.message || 'Failed to create college');
            }
        } catch (err) {
            toast.error('Error creating college');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}" and all its members?`)) return;

        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        try {
            const res = await fetch(`${API_URL}/api/admin/colleges/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminUser.token}` }
            });

            if (res.ok) {
                toast.success('College deleted');
                setColleges(colleges.filter(c => c._id !== id));
            } else {
                toast.error('Failed to delete');
            }
        } catch (err) {
            toast.error('Error deleting college');
        }
    };

    const toggleCourseSelection = (courseId: string) => {
        setNewCourseIds(prev =>
            prev.includes(courseId)
                ? prev.filter(id => id !== courseId)
                : [...prev, courseId]
        );
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
                            <Link href="/dashboard" className="text-gray-400 hover:text-white transition">
                                ← Back to Dashboard
                            </Link>
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">
                                College Management
                            </h1>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-lg font-bold hover:opacity-90 transition"
                        >
                            + New College
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-violet-900/30 to-indigo-900/30 p-6 rounded-xl border border-violet-500/20">
                        <p className="text-gray-400 text-sm">Total Colleges</p>
                        <p className="text-4xl font-bold text-violet-400">{colleges.length}</p>
                    </div>
                    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                        <p className="text-gray-400 text-sm">Total Members</p>
                        <p className="text-2xl font-bold text-white">
                            {colleges.reduce((sum, c) => sum + (c.totalMembers || 0), 0)}
                        </p>
                    </div>
                    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                        <p className="text-gray-400 text-sm">Active Students</p>
                        <p className="text-2xl font-bold text-emerald-400">
                            {colleges.reduce((sum, c) => sum + (c.activeMembers || 0), 0)}
                        </p>
                    </div>
                </div>

                {/* Colleges List */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                    <div className="p-6 border-b border-gray-800">
                        <h2 className="text-xl font-bold">All Partner Colleges</h2>
                    </div>
                    {colleges.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-black/50 text-gray-400 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">College</th>
                                        <th className="px-6 py-4">Slug / Route</th>
                                        <th className="px-6 py-4">Courses</th>
                                        <th className="px-6 py-4">Members</th>
                                        <th className="px-6 py-4">Active</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {colleges.map((college) => (
                                        <tr key={college._id} className="hover:bg-gray-800/30 transition-colors">
                                            <td className="px-6 py-4 font-medium">{college.name}</td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm text-indigo-400 bg-indigo-900/20 px-2 py-1 rounded">
                                                    /college/{college.slug}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {college.assignedCourses?.map((c: any) => (
                                                        <span key={c._id} className="text-xs bg-gray-800 px-2 py-0.5 rounded">
                                                            {c.title?.length > 20 ? c.title.substring(0, 20) + '...' : c.title}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold">{college.totalMembers || 0}</td>
                                            <td className="px-6 py-4 text-emerald-400 font-bold">{college.activeMembers || 0}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs ${college.isActive
                                                    ? 'bg-emerald-900/30 text-emerald-400'
                                                    : 'bg-red-900/30 text-red-400'
                                                    }`}>
                                                    {college.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <Link
                                                        href={`/colleges/${college._id}`}
                                                        className="text-xs bg-indigo-900/30 text-indigo-400 px-3 py-1 rounded hover:bg-indigo-900/50 transition"
                                                    >
                                                        Manage
                                                    </Link>
                                                    <Link
                                                        href={`/colleges/${college._id}/analytics`}
                                                        className="text-xs bg-blue-900/30 text-blue-400 px-3 py-1 rounded hover:bg-blue-900/50 transition"
                                                    >
                                                        Analytics
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(college._id, college.name)}
                                                        className="text-xs bg-red-900/30 text-red-400 px-3 py-1 rounded hover:bg-red-900/50 transition"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-16 text-gray-500">
                            <div className="mb-4 text-5xl">🏫</div>
                            <p className="text-lg">No colleges yet.</p>
                            <p className="text-sm mt-1">Click "New College" to partner with your first institution.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Create New College</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-5">
                            {/* College Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">College Name *</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g., IIT Delhi"
                                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-violet-500 focus:outline-none"
                                    required
                                />
                                {newName && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Route: <span className="text-indigo-400 font-mono">/college/{newName.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}</span>
                                    </p>
                                )}
                            </div>

                            {/* Course Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Assign Courses</label>
                                <div className="space-y-2 max-h-40 overflow-y-auto bg-black/50 p-3 rounded-lg border border-gray-700">
                                    {courses.map((c) => (
                                        <label key={c._id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-800/50 p-2 rounded transition">
                                            <input
                                                type="checkbox"
                                                checked={newCourseIds.includes(c._id)}
                                                onChange={() => toggleCourseSelection(c._id)}
                                                className="accent-violet-500"
                                            />
                                            <span className="text-sm text-gray-300">{c.title}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Emails */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Student Emails</label>
                                <textarea
                                    value={newEmails}
                                    onChange={(e) => setNewEmails(e.target.value)}
                                    placeholder={"Paste emails separated by commas or newlines:\nstudent1@gmail.com\nstudent2@gmail.com, student3@yahoo.com"}
                                    rows={5}
                                    className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-violet-500 focus:outline-none font-mono text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {newEmails.split(/[,\n\r;]+/).filter(e => e.trim() && e.includes('@')).length} emails detected
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={creating || !newName.trim()}
                                className={`w-full py-3 rounded-lg font-bold transition ${creating || !newName.trim()
                                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:opacity-90'
                                    }`}
                            >
                                {creating ? 'Creating...' : 'Create College'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
