'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import toast from 'react-hot-toast';

export default function CollegeDetailPage() {
    const router = useRouter();
    const params = useParams();
    const collegeId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [college, setCollege] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);

    // Edit state
    const [editName, setEditName] = useState('');
    const [editCourseIds, setEditCourseIds] = useState<string[]>([]);
    const [addEmails, setAddEmails] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        if (!adminUser.token || adminUser.role !== 'admin') {
            router.push('/login');
            return;
        }

        const fetchData = async () => {
            try {
                const [collegeRes, coursesRes] = await Promise.all([
                    fetch(`${API_URL}/api/admin/colleges/${collegeId}`, {
                        headers: { 'Authorization': `Bearer ${adminUser.token}` }
                    }),
                    fetch(`${API_URL}/api/courses`, {
                        headers: { 'Authorization': `Bearer ${adminUser.token}` }
                    })
                ]);

                if (collegeRes.ok) {
                    const data = await collegeRes.json();
                    setCollege(data.college);
                    setMembers(data.members);
                    setEditName(data.college.name);
                    setEditCourseIds(data.college.assignedCourses.map((c: any) => c._id));
                }
                if (coursesRes.ok) setCourses(await coursesRes.json());
            } catch (err) {
                console.error(err);
                toast.error('Failed to load college');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router, collegeId]);

    const handleSave = async () => {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        setSaving(true);

        try {
            const res = await fetch(`${API_URL}/api/admin/colleges/${collegeId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminUser.token}`
                },
                body: JSON.stringify({
                    name: editName,
                    courseIds: editCourseIds,
                    addEmails: addEmails || undefined
                })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success('College updated!');
                setAddEmails('');
                // Refresh
                const refreshRes = await fetch(`${API_URL}/api/admin/colleges/${collegeId}`, {
                    headers: { 'Authorization': `Bearer ${adminUser.token}` }
                });
                if (refreshRes.ok) {
                    const refreshed = await refreshRes.json();
                    setCollege(refreshed.college);
                    setMembers(refreshed.members);
                }
            } else {
                toast.error(data.message || 'Update failed');
            }
        } catch (err) {
            toast.error('Error updating college');
        } finally {
            setSaving(false);
        }
    };

    const handleRevokeMember = async (email: string) => {
        if (!confirm(`Revoke access for ${email}?`)) return;
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

        try {
            const res = await fetch(`${API_URL}/api/admin/colleges/${collegeId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminUser.token}`
                },
                body: JSON.stringify({ removeEmails: email })
            });

            if (res.ok) {
                toast.success(`Access revoked for ${email}`);
                setMembers(members.map(m =>
                    m.email === email ? { ...m, status: 'revoked' } : m
                ));
            }
        } catch (err) {
            toast.error('Failed to revoke');
        }
    };

    const toggleCourseSelection = (courseId: string) => {
        setEditCourseIds(prev =>
            prev.includes(courseId)
                ? prev.filter(id => id !== courseId)
                : [...prev, courseId]
        );
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-900/30 text-emerald-400';
            case 'pending': return 'bg-yellow-900/30 text-yellow-400';
            case 'revoked': return 'bg-red-900/30 text-red-400';
            default: return 'bg-gray-800 text-gray-400';
        }
    };

    if (loading) return (
        <div className="p-8 bg-black text-white h-screen flex items-center justify-center">
            <div className="text-xl animate-pulse">Loading...</div>
        </div>
    );

    if (!college) return (
        <div className="p-8 bg-black text-white h-screen flex items-center justify-center">
            <p>College not found</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Nav */}
            <nav className="bg-black border-b border-gray-800 sticky top-0 z-50 bg-opacity-80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-4">
                            <Link href="/colleges" className="text-gray-400 hover:text-white transition">
                                ← Back to Colleges
                            </Link>
                            <h1 className="text-2xl font-bold text-white">{college.name}</h1>
                            <span className="font-mono text-sm text-indigo-400 bg-indigo-900/20 px-2 py-1 rounded">
                                /college/{college.slug}
                            </span>
                        </div>
                        <Link
                            href={`/colleges/${collegeId}/analytics`}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-bold hover:opacity-90 transition"
                        >
                            View Analytics
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Edit Form */}
                    <div className="space-y-6">
                        {/* Edit College Name */}
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                            <h3 className="text-lg font-bold mb-4">College Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-violet-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Assigned Courses</label>
                                    <div className="space-y-2 max-h-40 overflow-y-auto bg-black/50 p-3 rounded-lg border border-gray-700">
                                        {courses.map((c) => (
                                            <label key={c._id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-800/50 p-2 rounded transition">
                                                <input
                                                    type="checkbox"
                                                    checked={editCourseIds.includes(c._id)}
                                                    onChange={() => toggleCourseSelection(c._id)}
                                                    className="accent-violet-500"
                                                />
                                                <span className="text-sm text-gray-300">{c.title}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className={`w-full py-3 rounded-lg font-bold transition ${saving
                                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:opacity-90'
                                        }`}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>

                        {/* Add More Emails */}
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                            <h3 className="text-lg font-bold mb-4">Add Students</h3>
                            <textarea
                                value={addEmails}
                                onChange={(e) => setAddEmails(e.target.value)}
                                placeholder={"Paste emails separated by commas or newlines:\nstudent@gmail.com"}
                                rows={4}
                                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-violet-500 focus:outline-none font-mono text-sm mb-2"
                            />
                            <p className="text-xs text-gray-500 mb-3">
                                {addEmails.split(/[,\n\r;]+/).filter(e => e.trim() && e.includes('@')).length} emails detected
                            </p>
                            <button
                                onClick={handleSave}
                                disabled={saving || !addEmails.trim()}
                                className={`w-full py-2 rounded-lg font-bold text-sm transition ${saving || !addEmails.trim()
                                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                                    }`}
                            >
                                Add Emails
                            </button>
                        </div>
                    </div>

                    {/* Right: Members Table */}
                    <div className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold">
                                Members
                                <span className="ml-2 text-xs bg-violet-900 text-violet-200 px-2 py-1 rounded-full">
                                    {members.length}
                                </span>
                            </h3>
                        </div>
                        <div className="overflow-y-auto max-h-[600px]">
                            {members.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead className="bg-black/50 text-gray-400 text-xs uppercase tracking-wider sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3">Email</th>
                                            <th className="px-4 py-3">Linked User</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Added</th>
                                            <th className="px-4 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {members.map((m, idx) => (
                                            <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                                                <td className="px-4 py-3 font-mono text-sm">{m.email}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    {m.user ? (
                                                        <span className="text-emerald-400">{m.user.name}</span>
                                                    ) : (
                                                        <span className="text-gray-500 italic">Not registered</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${statusColor(m.status)}`}>
                                                        {m.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-400">
                                                    {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {m.status !== 'revoked' && (
                                                        <button
                                                            onClick={() => handleRevokeMember(m.email)}
                                                            className="text-xs bg-red-900/30 text-red-400 px-3 py-1 rounded hover:bg-red-900/50 transition"
                                                        >
                                                            Revoke
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <p>No members added yet. Use the form on the left to add student emails.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
