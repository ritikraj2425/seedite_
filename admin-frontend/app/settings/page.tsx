'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';

interface BannerData {
    active?: boolean;
    text?: string;
    link?: string;
    expiresAt?: string;
}

export default function SettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [banner, setBanner] = useState({
        active: false,
        text: '',
        link: '',
        expiresAt: ''
    });

    useEffect(() => {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        if (!adminUser.token || adminUser.role !== 'admin') {
            router.push('/login');
            return;
        }

        // Fetch current banner settings
        fetch(`${API_URL}/api/settings/banner`, {
            headers: { 'Authorization': `Bearer ${adminUser.token}` }
        })
            .then(res => res.ok ? res.json() : {})
            .then((data: BannerData) => {
                setBanner({
                    active: data.active || false,
                    text: data.text || '',
                    link: data.link || '',
                    expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString().slice(0, 16) : ''
                });
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [router]);

    const handleSave = async () => {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        setSaving(true);

        try {
            const res = await fetch(`${API_URL}/api/settings/banner`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminUser.token}`
                },
                body: JSON.stringify({
                    active: banner.active,
                    text: banner.text,
                    link: banner.link,
                    expiresAt: banner.expiresAt ? new Date(banner.expiresAt).toISOString() : null
                })
            });

            if (res.ok) {
                alert('Banner settings saved successfully!');
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to save banner settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 bg-black text-white min-h-screen">Loading...</div>;

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Top Nav */}
            <nav className="bg-black border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="text-gray-400 hover:text-white">
                                ← Back
                            </Link>
                            <h1 className="text-2xl font-bold">Settings</h1>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Banner Settings */}
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                    <h2 className="text-xl font-bold mb-6">Quick Update Banner</h2>

                    <div className="space-y-6">
                        {/* Toggle */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="font-medium">Enable Banner</label>
                                <p className="text-sm text-gray-400">Show announcement banner on the website</p>
                            </div>
                            <button
                                onClick={() => setBanner(prev => ({ ...prev, active: !prev.active }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${banner.active ? 'bg-blue-600' : 'bg-gray-600'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${banner.active ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        {/* Banner Text */}
                        <div>
                            <label className="block font-medium mb-2">Banner Text</label>
                            <input
                                type="text"
                                value={banner.text}
                                onChange={(e) => setBanner(prev => ({ ...prev, text: e.target.value }))}
                                placeholder="Enter your announcement text..."
                                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-white focus:outline-none"
                            />
                        </div>

                        {/* Banner Link (Optional) */}
                        <div>
                            <label className="block font-medium mb-2">Link (Optional)</label>
                            <input
                                type="url"
                                value={banner.link}
                                onChange={(e) => setBanner(prev => ({ ...prev, link: e.target.value }))}
                                placeholder="https://example.com/more-info"
                                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-white focus:outline-none"
                            />
                            <p className="text-sm text-gray-400 mt-1">If provided, a "Learn More" link will appear</p>
                        </div>

                        {/* Expiry Date */}
                        <div>
                            <label className="block font-medium mb-2">Expires At (Optional)</label>
                            <input
                                type="datetime-local"
                                value={banner.expiresAt}
                                onChange={(e) => setBanner(prev => ({ ...prev, expiresAt: e.target.value }))}
                                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:border-white focus:outline-none text-white"
                                style={{ colorScheme: 'dark' }}
                            />
                            <p className="text-sm text-gray-400 mt-1">Leave empty for no expiration</p>
                        </div>

                        {/* Preview */}
                        {banner.text && (
                            <div>
                                <label className="block font-medium mb-2">Preview</label>
                                <div
                                    className="p-3 rounded-lg text-white text-center text-sm"
                                    style={{
                                        background: 'linear-gradient(90deg, #2563eb 0%, #7c3aed 50%, #ec4899 100%)'
                                    }}
                                >
                                    📢 {banner.text} {banner.link && <span className="underline ml-2">Learn More →</span>}
                                </div>
                            </div>
                        )}

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Banner Settings'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
