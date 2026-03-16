'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import toast from 'react-hot-toast';

export default function IQTestsPage() {
    const [iqTests, setIqTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchIQTests();
    }, []);

    const fetchIQTests = async () => {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        if (!adminUser.token) {
            router.push('/login');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/admin/iq-tests`, {
                headers: { 'Authorization': `Bearer ${adminUser.token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                setIqTests(data);
            } else {
                toast.error('Failed to fetch IQ tests');
            }
        } catch (error) {
            console.error('Error fetching IQ tests:', error);
            toast.error('Error loading IQ tests');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteIQTest = async (id: string) => {
        if (!confirm('Are you sure you want to delete this IQ test?')) return;
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

        try {
            const res = await fetch(`${API_URL}/api/admin/iq-tests/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminUser.token}` }
            });

            if (res.ok) {
                toast.success('IQ test deleted successfully');
                fetchIQTests(); // Refresh list
            } else {
                toast.error('Failed to delete IQ test');
            }
        } catch (error) {
            console.error('Error deleting IQ test:', error);
            toast.error('Server error deleting IQ test');
        }
    };

    if (loading) return <div className="p-8 bg-black text-white min-h-screen">Loading IQ Tests...</div>;

    return (
        <div className="min-h-screen bg-black text-white">
            <nav className="bg-black border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center space-x-4">
                            <Link href="/dashboard" className="text-gray-400 hover:text-white">← Dashboard</Link>
                            <h1 className="text-2xl font-bold">IQ Tests Management</h1>
                        </div>
                        <Link href="/iq-tests/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            + Create IQ Test
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                    <h2 className="text-xl font-bold mb-4">All IQ Tests</h2>
                    <div className="space-y-4">
                        {iqTests.map((test: any) => (
                            <div key={test._id} className="flex justify-between items-center p-4 bg-black border border-gray-700 rounded-lg">
                                <div>
                                    <h3 className="font-semibold text-lg">{test.title}</h3>
                                    <div className="text-sm text-gray-400 mt-1 space-x-4">
                                        <span>{test.totalQuestions || test.questions?.length || 0} Questions</span>
                                        <span>•</span>
                                        <span>{test.duration} mins</span>
                                        <span>•</span>
                                        <span>Passing: {test.passingScore}%</span>
                                    </div>
                                </div>
                                <div className="flex space-x-3">
                                    <Link href={`/iq-tests/${test._id}`} className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700">
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDeleteIQTest(test._id)}
                                        className="px-4 py-2 bg-red-900/50 text-red-500 rounded hover:bg-red-900/80"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                        {iqTests.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <p className="mb-4">No IQ tests created yet.</p>
                                <Link href="/iq-tests/new" className="text-blue-500 hover:underline">
                                    Create your first IQ Test
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
