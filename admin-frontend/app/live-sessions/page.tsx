'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';

// Timezone-safe local date/time formatter
const getLocalDateTimeLocal = (isoString?: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
};

interface LiveSession {
    _id: string;
    title: string;
    description: string;
    sessionDate: string;
    sessionTime: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
    registeredUsers: { _id: string; name: string; email: string }[];
}

export default function LiveSessionsPage() {
    const router = useRouter();
    const [sessions, setSessions] = useState<LiveSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSession, setCurrentSession] = useState<Partial<LiveSession> | null>(null);
    const [viewUsersSession, setViewUsersSession] = useState<LiveSession | null>(null);
    const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [sessionDate, setSessionDate] = useState('');
    const [sessionTime, setSessionTime] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        if (!adminUser.token || adminUser.role !== 'admin') {
            router.push('/login');
            return;
        }
        fetchSessions();
    }, [router]);

    const fetchSessions = async () => {
        try {
            const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
            const res = await fetch(`${API_URL}/api/live-sessions`, {
                headers: { 'Authorization': `Bearer ${adminUser.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSessions(data);
            }
        } catch (error) {
            console.error('Error fetching live sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (session: LiveSession | null = null) => {
        if (session) {
            setCurrentSession(session);
            setTitle(session.title);
            setDescription(session.description);
            // Format sessionDate for date input safely handling timezones
            const localSessionDateStr = getLocalDateTimeLocal(session.sessionDate);
            setSessionDate(localSessionDateStr.slice(0, 10));
            setSessionTime(session.sessionTime);
            // Format dates for datetime-local input safely
            setStartTime(getLocalDateTimeLocal(session.startTime));
            setEndTime(getLocalDateTimeLocal(session.endTime));
            setIsActive(session.isActive);
        } else {
            setCurrentSession(null);
            setTitle('');
            setDescription('');
            setSessionDate('');
            setSessionTime('');
            setStartTime('');
            setEndTime('');
            setIsActive(false);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentSession(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
            const method = currentSession ? 'PUT' : 'POST';
            const url = currentSession
                ? `${API_URL}/api/live-sessions/${currentSession._id}`
                : `${API_URL}/api/live-sessions`;

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminUser.token}`
                },
                body: JSON.stringify({
                    title,
                    description,
                    sessionDate,
                    sessionTime,
                    startTime,
                    endTime,
                    isActive
                })
            });

            if (res.ok) {
                fetchSessions();
                handleCloseModal();
            } else {
                alert('Failed to save live session');
            }
        } catch (error) {
            console.error('Error saving live session:', error);
            alert('Error saving live session');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this session?')) return;

        try {
            const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
            const res = await fetch(`${API_URL}/api/live-sessions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminUser.token}` }
            });

            if (res.ok) {
                fetchSessions();
            } else {
                alert('Failed to delete live session');
            }
        } catch (error) {
            console.error('Error deleting live session:', error);
            alert('Error deleting live session');
        }
    };
    const copyAllEmails = () => {
        if (!viewUsersSession?.registeredUsers) return;
        const emails = viewUsersSession.registeredUsers.map(u => u.email).join(', ');
        navigator.clipboard.writeText(emails);
        alert('All emails copied to clipboard!');
    };

    if (loading) return <div className="p-8 bg-black text-white min-h-screen">Loading...</div>;

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Live Sessions</h1>
                        <Link href="/dashboard" className="text-gray-400 hover:text-white transition">
                            ← Back to Dashboard
                        </Link>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-medium"
                    >
                        Create Session
                    </button>
                </div>

                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Title</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Start Time</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">End Time</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Registered</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {sessions.map((session) => (
                                <tr key={session._id} className="hover:bg-gray-800/50 transition">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white">{session.title}</div>
                                        <div className="text-sm text-gray-400 truncate max-w-xs">{session.description}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-300">
                                        <div><strong>Date:</strong> {new Date(session.sessionDate).toLocaleDateString()}</div>
                                        <div><strong>Time:</strong> {session.sessionTime}</div>
                                        <hr className="my-1 border-gray-700" />
                                        <div className="text-xs text-gray-500">Banner From: {new Date(session.startTime).toLocaleString()}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-300">
                                        <div className="text-xs text-gray-500">Banner Until: {new Date(session.endTime).toLocaleString()}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${session.isActive ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                                            {session.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-300">
                                        {session.registeredUsers?.length || 0}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-3">
                                        <button
                                            onClick={() => {
                                                setViewUsersSession(session);
                                                setIsUsersModalOpen(true);
                                            }}
                                            className="text-green-400 hover:text-green-300 text-sm font-medium"
                                        >
                                            Users ({session.registeredUsers?.length || 0})
                                        </button>
                                        <button
                                            onClick={() => handleOpenModal(session)}
                                            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(session._id)}
                                            className="text-red-400 hover:text-red-300 text-sm font-medium"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {sessions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        No live sessions found. Create one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 w-full max-w-2xl">
                        <h2 className="text-2xl font-bold mb-6">
                            {currentSession ? 'Edit Live Session' : 'Create Live Session'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white transition"
                                    placeholder="e.g. Masterclass on Reading Comprehension"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                                <textarea
                                    required
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white transition h-32"
                                    placeholder="Brief description of the session..."
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-400 mb-1">Session Date & Time</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={sessionDate && sessionTime ? `${sessionDate}T${sessionTime}` : ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val) {
                                            const [d, t] = val.split('T');
                                            setSessionDate(d);
                                            setSessionTime(t);
                                        } else {
                                            setSessionDate('');
                                            setSessionTime('');
                                        }
                                    }}
                                    className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white transition"
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Banner Visible From</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white transition"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Banner Visible Until</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white transition"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center mt-4">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-800 bg-black text-blue-500 focus:ring-blue-500"
                                />
                                <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-300">
                                    Display this session actively on the frontend banner
                                </label>
                            </div>
                            <div className="flex justify-end space-x-4 mt-8 pt-4 border-t border-gray-800">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-6 py-2 bg-transparent text-white border border-gray-600 rounded-lg hover:bg-gray-800 font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-medium transition"
                                >
                                    {currentSession ? 'Update Session' : 'Create Session'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Registered Users Modal */}
            {isUsersModalOpen && viewUsersSession && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 w-full max-w-3xl max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold">Registered Users</h2>
                                <p className="text-gray-400 text-sm mt-1">{viewUsersSession.title}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsUsersModalOpen(false);
                                    setViewUsersSession(null);
                                }}
                                className="text-gray-500 hover:text-white"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-800">
                            <span className="text-sm text-gray-400">
                                {viewUsersSession.registeredUsers?.length || 0} users registered
                            </span>
                            <button
                                onClick={copyAllEmails}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                                Copy All Emails
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
                            <table className="w-full">
                                <thead className="text-gray-500 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-2 text-left bg-gray-900/50 sticky top-0">Name</th>
                                        <th className="px-4 py-2 text-left bg-gray-900/50 sticky top-0">Email</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {(viewUsersSession.registeredUsers || []).map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-800/30">
                                            <td className="px-4 py-3 text-sm text-white">{user.name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-400">{user.email}</td>
                                        </tr>
                                    ))}
                                    {(!viewUsersSession.registeredUsers || viewUsersSession.registeredUsers.length === 0) && (
                                        <tr>
                                            <td colSpan={2} className="px-4 py-8 text-center text-gray-500 text-sm">
                                                No users registered yet for this session.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
