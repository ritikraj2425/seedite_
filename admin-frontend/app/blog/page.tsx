'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { uploadFile } from '@/lib/upload';

export default function ManageBlog() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        image: '',
        tags: ''
    });

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        try {
            const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
            const res = await fetch(`${API_URL}/api/blogs/admin`, {
                headers: { 'Authorization': `Bearer ${adminUser.token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch blogs');
            const data = await res.json();
            setBlogs(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error('Error fetching blogs');
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

            // Fix tags: Ensure we send an array of strings
            const tagsArray = formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

            const payload = {
                title: formData.title,
                content: formData.content,
                image: formData.image,
                tags: tagsArray
            };

            const res = await fetch(`${API_URL}/api/blogs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminUser.token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to create blog');
            }

            toast.success('Blog created successfully');
            setShowForm(false);
            setFormData({ title: '', content: '', image: '', tags: '' });
            if (fileInputRef.current) fileInputRef.current.value = '';
            fetchBlogs();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Error creating blog');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this blog?')) return;
        try {
            const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
            const res = await fetch(`${API_URL}/api/blogs/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminUser.token}` }
            });

            if (!res.ok) throw new Error('Failed to delete blog');
            toast.success('Blog deleted');
            fetchBlogs();
        } catch (error) {
            console.error(error);
            toast.error('Error deleting blog');
        }
    };

    const handleTogglePublish = async (id: string, currentStatus: boolean) => {
        try {
            const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
            const res = await fetch(`${API_URL}/api/blogs/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminUser.token}`
                },
                body: JSON.stringify({ isPublished: !currentStatus })
            });
            if (!res.ok) throw new Error('Failed to update status');
            toast.success('Status updated');
            fetchBlogs();
        } catch (error) {
            console.error(error);
            toast.error('Error updating status');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center space-x-4">
                            <Link href="/dashboard" className="text-gray-500 hover:text-gray-900">← Dashboard</Link>
                            <h1 className="text-2xl font-bold">Manage Blog</h1>
                        </div>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                            {showForm ? 'Cancel' : '+ New Post'}
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 py-8">

                {showForm && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8 shadow-sm animate-fade-in">
                        <h2 className="text-xl font-bold mb-4">Create New Blog Post</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    required
                                />
                            </div>

                            {/* AWS Image Upload */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Cover Image (Upload)</label>
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
                                        className="px-3 py-2 bg-gray-100 border border-gray-300 rounded text-sm hover:bg-gray-200 text-gray-700"
                                    >
                                        {uploading ? 'Uploading...' : 'Choose File'}
                                    </button>
                                    {formData.image && (
                                        <div className="text-xs text-green-600 flex items-center font-medium">
                                            ✓ Uploaded
                                            <img src={formData.image} alt="Preview" className="w-8 h-8 rounded-full ml-2 object-cover" />
                                        </div>
                                    )}
                                </div>
                                <input type="hidden" value={formData.image} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    placeholder="Exam, Tips, Strategy"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Content (Markdown supported)</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 h-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    required
                                />
                            </div>
                            <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md">
                                Create Post
                            </button>
                        </form>
                    </div>
                )}

                {loading ? <div className="text-center text-gray-500">Loading...</div> : (
                    <div className="space-y-4">
                        {blogs.map((blog: any) => (
                            <div key={blog._id} className="p-4 bg-white border border-gray-200 rounded-lg flex justify-between items-center shadow-sm">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{blog.title}</h3>
                                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${blog.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {blog.isPublished ? 'Published' : 'Draft'}
                                        </span>
                                        <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                                        {blog.image && <span className="text-xs text-blue-600">• Has Image</span>}
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleTogglePublish(blog._id, blog.isPublished)}
                                        className="text-yellow-600 text-sm hover:text-yellow-800 font-medium"
                                    >
                                        {blog.isPublished ? 'Unpublish' : 'Publish'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(blog._id)}
                                        className="text-red-600 text-sm hover:text-red-800 font-medium"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                        {blogs.length === 0 && (
                            <div className="text-center text-gray-500 py-12">No blog posts yet</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
