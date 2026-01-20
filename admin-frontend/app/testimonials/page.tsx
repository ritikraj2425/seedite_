'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import { toast } from 'react-hot-toast';

import { useRef } from 'react';
import { uploadFile } from '@/lib/upload';

export default function ManageTestimonials() {
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        content: '',
        rating: '5',
        image: ''
    });

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const fetchTestimonials = async () => {
        try {
            const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
            const res = await fetch(`${API_URL}/api/testimonials/admin`, {
                headers: { 'Authorization': `Bearer ${adminUser.token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch testimonials');
            const data = await res.json();
            setTestimonials(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error('Error fetching testimonials');
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
            const res = await fetch(`${API_URL}/api/testimonials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminUser.token}`
                },
                body: JSON.stringify({ ...formData, rating: Number(formData.rating) })
            });

            if (!res.ok) throw new Error('Failed to create testimonial');

            toast.success('Testimonial created');
            setShowForm(false);
            setFormData({ name: '', role: '', content: '', rating: '5', image: '' });
            if (fileInputRef.current) fileInputRef.current.value = '';
            setUploading(false);
            fetchTestimonials();
        } catch (error) {
            console.error(error);
            toast.error('Error creating testimonial');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this?')) return;
        try {
            const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
            const res = await fetch(`${API_URL}/api/testimonials/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminUser.token}` }
            });

            if (!res.ok) throw new Error('Failed to delete');
            toast.success('Testimonial deleted');
            fetchTestimonials();
        } catch (error) {
            console.error(error);
            toast.error('Error deleting');
        }
    };

    const handleToggleVisibility = async (id: string, currentStatus: boolean) => {
        try {
            const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
            const res = await fetch(`${API_URL}/api/testimonials/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminUser.token}`
                },
                body: JSON.stringify({ isVisible: !currentStatus })
            });
            if (!res.ok) throw new Error('Failed to update status');
            toast.success('Status updated');
            fetchTestimonials();
        } catch (error) {
            console.error(error);
            toast.error('Error updating status');
        }
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <nav className="bg-black border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center space-x-4">
                            <Link href="/dashboard" className="text-gray-400 hover:text-white">← Dashboard</Link>
                            <h1 className="text-2xl font-bold">Manage Testimonials</h1>
                        </div>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                            {showForm ? 'Cancel' : '+ New Testimonial'}
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 py-8">

                {showForm && (
                    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-8 animate-fade-in">
                        <h2 className="text-xl font-bold mb-4">Add New Testimonial</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Role (e.g. Student)</label>
                                    <input
                                        type="text"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Rating (1-5)</label>
                                    <select
                                        value={formData.rating}
                                        onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                                        className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                    >
                                        <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                                        <option value="4">⭐⭐⭐⭐ (4)</option>
                                        <option value="3">⭐⭐⭐ (3)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Photo (Upload)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;

                                                try {
                                                    setUploading(true);
                                                    const result = await uploadFile(file);
                                                    setFormData({ ...formData, image: result.url });
                                                    toast.success('Image uploaded');
                                                } catch (err) {
                                                    toast.error('Upload failed');
                                                    console.error(err);
                                                } finally {
                                                    setUploading(false);
                                                }
                                            }}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm hover:bg-gray-700"
                                        >
                                            {uploading ? 'Uploading...' : 'Choose File'}
                                        </button>
                                        {formData.image && (
                                            <div className="text-xs text-green-400 flex items-center">
                                                ✓ Uploaded
                                                <img src={formData.image} alt="Preview" className="w-8 h-8 rounded-full ml-2 object-cover" />
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="hidden"
                                        value={formData.image}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Content</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white h-32"
                                    required
                                />
                            </div>
                            <button type="submit" className="w-full py-2 bg-blue-600 rounded-lg font-bold hover:bg-blue-700">
                                Create Testimonial
                            </button>
                        </form>
                    </div>
                )}

                {loading ? <div className="text-center text-gray-400">Loading...</div> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {testimonials.map((t: any) => (
                            <div key={t._id} className="p-4 bg-gray-900 border border-gray-800 rounded-lg relative">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-gray-700 rounded-full overflow-hidden">
                                        {t.image ? <img src={t.image} className="w-full h-full object-cover" /> : null}
                                    </div>
                                    <div>
                                        <h3 className="font-bold">{t.name} <span className="text-yellow-500 text-sm">{'★'.repeat(t.rating)}</span></h3>
                                        <p className="text-xs text-gray-500">{t.role}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400 mb-8">"{t.content}"</p>

                                <div className="absolute bottom-4 right-4 flex gap-3">
                                    <button
                                        onClick={() => handleToggleVisibility(t._id, t.isVisible)}
                                        className={`text-xs px-2 py-1 rounded border ${t.isVisible ? 'border-green-800 text-green-500' : 'border-gray-700 text-gray-500'}`}
                                    >
                                        {t.isVisible ? 'Visible' : 'Hidden'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(t._id)}
                                        className="text-red-400 text-xs hover:text-red-300"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
