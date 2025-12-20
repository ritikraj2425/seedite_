'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import toast from 'react-hot-toast';

export default function NewCoursePage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        thumbnail: '',
        category: '',
        courseDetails: ''  // New field for bullet points
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

        try {
            // Create course (without lectures - add lectures later from edit page)
            const courseRes = await fetch(`${API_URL}/api/admin/courses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminUser.token}`
                },
                body: JSON.stringify({
                    ...formData,
                    courseDetails: formData.courseDetails.split('\n').filter(line => line.trim() !== '') // Split on newline
                })
            });

            if (!courseRes.ok) throw new Error('Failed to create course');

            const course = await courseRes.json();

            toast.success('Course created successfully! You can now add lectures.');
            router.push(`/courses/${course._id}`);
        } catch (error) {
            toast.error('Failed to create course');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white" >
            <nav className="bg-black border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center space-x-4">
                            <Link href="/courses" className="text-gray-400 hover:text-white">← Back</Link>
                            <h1 className="text-2xl font-bold">Create New Course</h1>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Course Details */}
                    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                        <h2 className="text-xl font-bold mb-4">Course Details</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                    placeholder="e.g., Complete React Masterclass"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                    rows={4}
                                    placeholder="Describe your course..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Course Features (Bullet Points)</label>
                                <textarea
                                    value={formData.courseDetails}
                                    onChange={(e) => setFormData({ ...formData, courseDetails: e.target.value })}
                                    className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white font-mono text-sm"
                                    rows={5}
                                    placeholder="• 50+ Hours of Content&#10;• Lifetime Access&#10;• Certificate of Completion&#10;(Enter each point on a new line)"
                                />
                                <p className="text-xs text-gray-500 mt-1">Each line will be shown as a bullet point on the purchase page.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                        placeholder="e.g., 999"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Category</label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                        placeholder="e.g., Web Development"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Thumbnail URL</label>
                                <input
                                    type="url"
                                    value={formData.thumbnail}
                                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                                    className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Info Note */}
                    <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                        <p className="text-blue-300 text-sm">
                            💡 <strong>Tip:</strong> After creating the course, you can add lectures and mock tests from the course edit page using CloudFront video keys.
                        </p>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end space-x-4">
                        <Link href="/courses">
                            <button
                                type="button"
                                className="px-6 py-3 border border-gray-700 rounded-lg hover:bg-gray-900"
                            >
                                Cancel
                            </button>
                        </Link>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 disabled:opacity-50 font-medium"
                        >
                            {submitting ? 'Creating...' : 'Create Course'}
                        </button>
                    </div>
                </form>
            </div>
        </div >
    );
}
