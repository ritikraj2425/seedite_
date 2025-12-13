'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function EditCoursePage() {
    const router = useRouter();
    const params = useParams();
    const courseId = params.id;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        thumbnail: '',
        category: '',
        courseDetails: ''
    });
    const [lectures, setLectures] = useState<any[]>([]);
    const [mockTests, setMockTests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Lecture State - Now using CloudFront video key instead of file upload
    const [newLectureTitle, setNewLectureTitle] = useState('');
    const [newLectureVideoKey, setNewLectureVideoKey] = useState('');
    const [newLectureDuration, setNewLectureDuration] = useState('');
    const [newLectureIsFree, setNewLectureIsFree] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCourseData();
    }, [courseId, router]);

    const fetchCourseData = () => {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        if (!adminUser.token) {
            router.push('/login');
            return;
        }

        fetch(`http://localhost:5000/api/courses/${courseId}`, {
            headers: { 'Authorization': `Bearer ${adminUser.token}` }
        })
            .then(res => res.json())
            .then(data => {
                setFormData({
                    title: data.title || '',
                    description: data.description || '',
                    thumbnail: data.thumbnail || '',
                    category: data.category || '',
                    courseDetails: data.courseDetails ? data.courseDetails.join('\n') : ''
                });
                setLectures(data.lectures || []);
                setMockTests(data.mockTests || []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    const handleUpdateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

        try {
            const res = await fetch(`http://localhost:5000/api/admin/courses/${courseId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminUser.token}`
                },
                body: JSON.stringify({
                    ...formData,
                    courseDetails: formData.courseDetails.split('\n').filter(line => line.trim() !== '')
                })
            });

            if (res.ok) {
                alert('Course details updated successfully!');
            } else {
                alert('Failed to update course');
            }
        } catch (error) {
            alert('Failed to update course');
        }
    };

    const handleAddLecture = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLectureVideoKey || !newLectureTitle) {
            alert('Please enter lecture title and CloudFront video key');
            return;
        }

        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        setSubmitting(true);

        try {
            // Create lecture with CloudFront video key
            const lectureRes = await fetch('http://localhost:5000/api/admin/lectures', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminUser.token}`
                },
                body: JSON.stringify({
                    title: newLectureTitle,
                    videoKey: newLectureVideoKey,  // CloudFront file key
                    duration: newLectureDuration,
                    isFree: newLectureIsFree,
                    courseId: courseId
                })
            });

            if (lectureRes.ok) {
                alert('Lecture added successfully!');
                setNewLectureTitle('');
                setNewLectureVideoKey('');
                setNewLectureDuration('');
                setNewLectureIsFree(false);
                fetchCourseData(); // Refresh list
            } else {
                const error = await lectureRes.json();
                alert('Failed to add lecture: ' + error.message);
            }
        } catch (error: any) {
            alert('Failed to add lecture: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteLecture = async (id: string) => {
        if (!confirm('Delete this lecture?')) return;
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

        try {
            await fetch(`http://localhost:5000/api/admin/lectures/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminUser.token}` }
            });
            fetchCourseData();
        } catch (error) {
            alert('Failed to delete lecture');
        }
    };

    const handleDeleteMockTest = async (id: string) => {
        if (!confirm('Delete this mock test?')) return;
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

        try {
            await fetch(`http://localhost:5000/api/admin/mock-tests/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminUser.token}` }
            });
            fetchCourseData();
        } catch (error) {
            alert('Failed to delete mock test');
        }
    };

    if (loading) return <div className="p-8 bg-black text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-black text-white">
            <nav className="bg-black border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center space-x-4">
                            <Link href="/courses" className="text-gray-400 hover:text-white">← Back</Link>
                            <h1 className="text-2xl font-bold">Edit Course</h1>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Left Column: Course Details */}
                <div>
                    <form onSubmit={handleUpdateCourse} className="space-y-6">
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
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Course Features (One per line)</label>
                                    <textarea
                                        value={formData.courseDetails}
                                        onChange={(e) => setFormData({ ...formData, courseDetails: e.target.value })}
                                        className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white font-mono text-sm"
                                        rows={6}
                                        placeholder={`Lifetime Access\nCertificate of Completion\nMobile Access`}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                    rows={4}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
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
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="mt-4 w-full px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 font-medium"
                        >
                            Save Changes
                        </button>
                    </form>
                </div>
            </div>

            {/* Right Column: Content Management */}
            <div className="space-y-8">

                {/* Lectures Management */}
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                    <h2 className="text-xl font-bold mb-4">Lectures</h2>

                    {/* List */}
                    <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                        {lectures.map((lecture) => (
                            <div key={lecture._id} className="flex justify-between items-center p-3 bg-black rounded border border-gray-800">
                                <span className="truncate">{lecture.title || 'Untitled Lecture'}</span>
                                <button
                                    onClick={() => handleDeleteLecture(lecture._id)}
                                    className="text-red-500 hover:text-red-400 text-sm"
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                        {lectures.length === 0 && <p className="text-gray-500">No lectures yet.</p>}
                    </div>

                    {/* Add Lecture Form */}
                    <div className="border-t border-gray-800 pt-4">
                        <h3 className="font-semibold mb-3">Add New Lecture</h3>
                        <form onSubmit={handleAddLecture} className="space-y-3">
                            <input
                                type="text"
                                placeholder="Lecture Title"
                                value={newLectureTitle}
                                onChange={(e) => setNewLectureTitle(e.target.value)}
                                className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                required
                            />
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">CloudFront Video Key</label>
                                <input
                                    type="text"
                                    placeholder="e.g., lecture_intro_202510011654.mp4"
                                    value={newLectureVideoKey}
                                    onChange={(e) => setNewLectureVideoKey(e.target.value)}
                                    className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                    required
                                />
                                <span className="text-xs text-gray-500">URL will be: https://dr6ydg7wb58lc.cloudfront.net/{newLectureVideoKey || 'your-video-key'}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Duration (optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., 10:30"
                                        value={newLectureDuration}
                                        onChange={(e) => setNewLectureDuration(e.target.value)}
                                        className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                    />
                                </div>
                                <div className="flex items-center pt-5">
                                    <input
                                        type="checkbox"
                                        id="isFree"
                                        checked={newLectureIsFree}
                                        onChange={(e) => setNewLectureIsFree(e.target.checked)}
                                        className="mr-2"
                                    />
                                    <label htmlFor="isFree" className="text-sm text-gray-400">Free Preview</label>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {submitting ? 'Adding Lecture...' : 'Add Lecture'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Mock Tests Management */}
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Mock Tests</h2>
                        <Link href={`/courses/${courseId}/mock-tests/new`}>
                            <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                                + Add Test
                            </button>
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {mockTests.map((test) => (
                            <div key={test._id} className="flex justify-between items-center p-3 bg-black rounded border border-gray-800">
                                <div>
                                    <p className="font-medium">{test.title}</p>
                                    <p className="text-xs text-gray-500">{test.totalQuestions} Questions • {test.duration} mins</p>
                                </div>
                                <div className="flex space-x-2">
                                    <Link href={`/courses/${courseId}/mock-tests/${test._id}`}>
                                        <button className="text-blue-500 hover:text-blue-400 text-sm">
                                            Edit
                                        </button>
                                    </Link>
                                    <button
                                        onClick={() => handleDeleteMockTest(test._id)}
                                        className="text-red-500 hover:text-red-400 text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                        {mockTests.length === 0 && <p className="text-gray-500">No mock tests yet.</p>}
                    </div>
                </div>

            </div>
        </div >

    );
}
