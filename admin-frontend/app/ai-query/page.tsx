'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';

export default function AIQueryPage() {
    const router = useRouter();
    const [prompt, setPrompt] = useState<string>('');
    const [generatedQuery, setGeneratedQuery] = useState<any>(null);
    const [results, setResults] = useState<any>(null);
    const [loadingGen, setLoadingGen] = useState(false);
    const [loadingExec, setLoadingExec] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        if (!adminUser.token || adminUser.role !== 'admin') {
            router.push('/login');
        }
    }, [router]);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoadingGen(true);
        setError(null);
        setGeneratedQuery(null);
        setResults(null);

        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

        try {
            const res = await fetch(`${API_URL}/api/admin/ai-query/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminUser.token}`
                },
                body: JSON.stringify({ prompt })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to generate query');
            }

            setGeneratedQuery(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoadingGen(false);
        }
    };

    const handleExecute = async () => {
        if (!generatedQuery) return;
        setLoadingExec(true);
        setError(null);
        setResults(null);

        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

        try {
            const res = await fetch(`${API_URL}/api/admin/ai-query/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminUser.token}`
                },
                body: JSON.stringify({ query: generatedQuery })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to execute query');
            }

            setResults(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoadingExec(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">AI Database Query</h1>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                    >
                        Back to Dashboard
                    </button>
                </div>

                {error && (
                    <div className="bg-red-900 border border-red-500 text-red-200 px-4 py-3 rounded mb-6">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Step 1: Enter Natural Language Query</h2>
                    <p className="text-gray-400 mb-4 text-sm">
                        Example: "Get emails of all students where enrolledCourses is equal to 0" or "Count how many users are admins".
                    </p>
                    <textarea
                        className="w-full bg-black border border-gray-700 rounded-lg p-4 text-white focus:outline-none focus:border-blue-500 min-h-[100px]"
                        placeholder="Type your query here..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    ></textarea>
                    
                    <button
                        onClick={handleGenerate}
                        disabled={loadingGen || !prompt.trim()}
                        className={`mt-4 px-6 py-2 rounded-lg font-medium ${loadingGen || !prompt.trim() ? 'bg-gray-700 text-gray-400' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                        {loadingGen ? 'Generating...' : '⚡ Generate MongoDB Query'}
                    </button>
                </div>

                {generatedQuery && (
                    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
                        <h2 className="text-xl font-semibold mb-4 text-blue-400">Step 2: Review Generated Query</h2>
                        <div className="bg-black p-4 rounded border border-gray-700 overflow-x-auto text-green-400 font-mono text-sm whitespace-pre">
                            {JSON.stringify(generatedQuery, null, 2)}
                        </div>
                        
                        <div className="mt-4 flex gap-4">
                            <button
                                onClick={handleExecute}
                                disabled={loadingExec}
                                className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 ${loadingExec ? 'bg-gray-700 text-gray-400' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                            >
                                {loadingExec ? 'Verifying & Executing...' : '🚀 Verify & Execute'}
                            </button>
                            <button
                                onClick={() => setGeneratedQuery(null)}
                                className="px-6 py-2 rounded-lg font-medium bg-gray-800 hover:bg-gray-700 text-white"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {results && (
                    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                        <h2 className="text-xl font-semibold mb-4 text-green-400">Query Results</h2>
                        <p className="text-sm text-gray-400 mb-4">
                            Found {Array.isArray(results) ? results.length : 1} document(s).
                        </p>
                        <div className="bg-black p-4 rounded border border-gray-700 overflow-x-auto text-gray-300 font-mono text-sm max-h-[500px] overflow-y-auto">
                            <pre>{JSON.stringify(results, null, 2)}</pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
