'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CoursesPage() {
    const router = useRouter();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        if (!adminUser.token) {
            router.push('/login');
            return;
        }

        fetch('http://localhost:5000/api/courses')
            .then(res => res.json())
            .then(data => {
                setCourses(data);
                setLoading(false);
            });
    }, [router]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this course?')) return;

        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

        try {
            const res = await fetch(`http://localhost:5000/api/admin/courses/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminUser.token}` }
            });

            if (res.ok) {
                setCourses(courses.filter(c => c._id !== id));
            }
        } catch (error) {
            alert('Failed to delete course');
        }
    };

    if (loading) return <div className="p-8 bg-black text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-black text-white">
            <nav className="bg-black border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center space-x-4">
                            <Link href="/dashboard" className="text-gray-400 hover:text-white">← Back</Link>
                            <h1 className="text-2xl font-bold">Manage Courses</h1>
                        </div>
                        <Link href="/courses/new">
                            <button className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-medium">
                                + New Course
                            </button>
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(course => (
                        <div key={course._id} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                            <img
                                src={course.thumbnail || 'https://via.placeholder.com/400x200/000000/FFFFFF?text=No+Image'}
                                alt={course.title}
                                className="w-full h-48 object-cover"
                            />
                            <div className="p-6">
                                <h3 className="font-bold text-lg mb-2">{course.title}</h3>
                                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{course.description}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-white font-semibold">₹{course.price}</span>
                                    <div className="space-x-2">
                                        <Link href={`/courses/${course._id}`}>
                                            <button className="px-3 py-1 bg-white text-black rounded text-sm hover:bg-gray-200 font-medium">
                                                Edit
                                            </button>
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(course._id)}
                                            className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
