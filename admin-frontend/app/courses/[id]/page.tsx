'use client'
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { uploadFile } from '@/lib/upload';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
        instructor: '',
        courseDetails: ''
    });
    const [lectures, setLectures] = useState<any[]>([]);
    const [mockTests, setMockTests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

    // Lecture State
    const [newLectureTitle, setNewLectureTitle] = useState('');
    const [newLectureVideoKey, setNewLectureVideoKey] = useState('');
    const [newLectureDuration, setNewLectureDuration] = useState('');
    const [newLectureIsFree, setNewLectureIsFree] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingLecture, setUploadingLecture] = useState(false);

    // Announcement State
    const [announcementTitle, setAnnouncementTitle] = useState('');
    const [announcementMessage, setAnnouncementMessage] = useState('');
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [postingAnnouncement, setPostingAnnouncement] = useState(false);

    useEffect(() => {
        fetchCourseData();
        fetchAnnouncements();
    }, [courseId, router]);

    const fetchCourseData = () => {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        if (!adminUser.token) {
            router.push('/login');
            return;
        }

        fetch(`${API_URL}/api/courses/${courseId}`, {
            headers: { 'Authorization': `Bearer ${adminUser.token}` }
        })
            .then(res => res.json())
            .then(data => {
                setFormData({
                    title: data.title || '',
                    description: data.description || '',
                    price: data.price ? String(data.price) : '0', // Ensure safe fallback
                    thumbnail: data.thumbnail || '',
                    category: data.category || '',
                    instructor: data.instructor || '',
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

    const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        try {
            setUploadingThumbnail(true);
            const { url } = await uploadFile(file);
            setFormData(prev => ({ ...prev, thumbnail: url }));
            toast.success('Thumbnail uploaded successfully!');
        } catch (error) {
            toast.error('Failed to upload thumbnail');
        } finally {
            setUploadingThumbnail(false);
        }
    };

    const fetchAnnouncements = async () => {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        try {
            const res = await fetch(`${API_URL}/api/announcements/course/${courseId}`, {
                headers: { 'Authorization': `Bearer ${adminUser.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAnnouncements(data);
            }
        } catch (error) {
            console.error('Error fetching announcements:', error);
        }
    };

    const handlePostAnnouncement = async () => {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        if (!adminUser.token) return;

        setPostingAnnouncement(true);
        try {
            const res = await fetch(`${API_URL}/api/announcements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminUser.token}`
                },
                body: JSON.stringify({
                    courseId: courseId,
                    title: announcementTitle,
                    message: announcementMessage
                })
            });

            if (res.ok) {
                toast.success('Announcement posted successfully!');
                setAnnouncementTitle('');
                setAnnouncementMessage('');
                fetchAnnouncements(); // Refresh list
            } else {
                toast.error('Failed to post announcement');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error posting announcement');
        } finally {
            setPostingAnnouncement(false);
        }
    };

    const handleLectureVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        try {
            setUploadingLecture(true);
            const { key } = await uploadFile(file);
            setNewLectureVideoKey(key);
            toast.success('Lecture video uploaded successfully!');
        } catch (error) {
            toast.error('Failed to upload lecture video');
        } finally {
            setUploadingLecture(false);
        }
    };

    const handleUpdateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

        try {
            const res = await fetch(`${API_URL}/api/admin/courses/${courseId}`, {
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
                toast.success('Course details updated successfully!');
            } else {
                toast.error('Failed to update course');
            }
        } catch (error) {
            toast.error('Failed to update course');
        }
    };

    const handleAddLecture = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLectureVideoKey || !newLectureTitle) {
            toast.error('Please enter lecture title and upload a video');
            return;
        }

        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        setSubmitting(true);

        try {
            // Create lecture with CloudFront video key
            const lectureRes = await fetch(`${API_URL}/api/admin/lectures`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminUser.token}`
                },
                body: JSON.stringify({
                    title: newLectureTitle,
                    videoKey: newLectureVideoKey,
                    duration: newLectureDuration,
                    isFree: newLectureIsFree,
                    courseId: courseId
                })
            });

            if (lectureRes.ok) {
                toast.success('Lecture added successfully!');
                setNewLectureTitle('');
                setNewLectureVideoKey('');
                setNewLectureDuration('');
                setNewLectureIsFree(false);
                fetchCourseData(); // Refresh list
            } else {
                const error = await lectureRes.json();
                toast.error('Failed to add lecture: ' + error.message);
            }
        } catch (error: any) {
            toast.error('Failed to add lecture: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteLecture = async (id: string) => {
        if (!confirm('Delete this lecture?')) return;
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

        try {
            await fetch(`${API_URL}/api/admin/lectures/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminUser.token}` }
            });
            fetchCourseData();
            toast.success('Lecture deleted');
        } catch (error) {
            toast.error('Failed to delete lecture');
        }
    };

    const handleDeleteMockTest = async (id: string) => {
        if (!confirm('Delete this mock test?')) return;
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

        try {
            await fetch(`${API_URL}/api/admin/mock-tests/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminUser.token}` }
            });
            fetchCourseData();
            toast.success('Mock test deleted');
        } catch (error) {
            toast.error('Failed to delete mock test');
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
                                <div>
                                    <label className="block text-sm font-medium mb-1">Instructor Name</label>
                                    <input
                                        type="text"
                                        value={formData.instructor}
                                        onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                                        className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                        placeholder="e.g. Ritik Raj"
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
                                <label className="block text-sm font-medium mb-1">Thumbnail</label>
                                {formData.thumbnail && (
                                    <div className="mb-2">
                                        <img src={formData.thumbnail} alt="Thumbnail Preview" className="h-32 rounded object-cover" />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleThumbnailUpload}
                                    disabled={uploadingThumbnail}
                                    className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                />
                                {uploadingThumbnail && <p className="text-sm text-blue-400 mt-1">Uploading thumbnail...</p>}
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
                                <label className="block text-xs text-gray-400 mb-1">Lecture Video</label>
                                {newLectureVideoKey && (
                                    <p className="text-xs text-green-400 mb-2">✓ Video Uploaded: {newLectureVideoKey}</p>
                                )}
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={handleLectureVideoUpload}
                                    disabled={uploadingLecture}
                                    className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                />
                                {uploadingLecture && <p className="text-sm text-blue-400 mt-1">Uploading video (this may take a while)...</p>}
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
                                disabled={submitting || uploadingLecture}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {submitting ? 'Adding Lecture...' : uploadingLecture ? 'Uploading...' : 'Add Lecture'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Mock Tests Management */}
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Mock Tests</h2>
                        <Link href={`/courses/${courseId}/mock-tests/new`} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            + Add Mock Test
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {mockTests.map((test: any) => (
                            <div key={test._id} className="flex justify-between items-center p-4 bg-black border border-gray-700 rounded-lg">
                                <div>
                                    <h3 className="font-semibold">{test.title}</h3>
                                    <p className="text-sm text-gray-400">{test.questions?.length || 0} Questions • {test.duration} mins</p>
                                </div>
                                <div className="flex space-x-2">
                                    <Link href={`/courses/${courseId}/mock-tests/${test._id}`} className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700">
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDeleteMockTest(test._id)}
                                        className="px-3 py-1 bg-red-900/50 text-red-500 rounded hover:bg-red-900/80"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                        {mockTests.length === 0 && <p className="text-gray-500 text-center py-4">No mock tests added yet</p>}
                    </div>
                </div>

                {/* Announcements Section */}
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                    <h2 className="text-xl font-bold mb-6">Batch Announcements</h2>

                    {/* New Announcement Form */}
                    <div className="mb-8 p-4 bg-black border border-gray-700 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4 text-gray-300">Post New Announcement</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-400">Title</label>
                                <input
                                    type="text"
                                    value={announcementTitle}
                                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                                    placeholder="e.g. Class Rescheduled"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-400">Message</label>
                                <textarea
                                    value={announcementMessage}
                                    onChange={(e) => setAnnouncementMessage(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white min-h-[100px]"
                                    placeholder="Type your message here..."
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={handlePostAnnouncement}
                                    disabled={postingAnnouncement || !announcementTitle || !announcementMessage}
                                    className={`px-6 py-2 rounded-lg font-semibold ${postingAnnouncement || !announcementTitle || !announcementMessage
                                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                        : 'bg-green-600 text-white hover:bg-green-700'
                                        }`}
                                >
                                    {postingAnnouncement ? 'Posting...' : 'Post Announcement'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Announcement History */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-300">History</h3>
                        <div className="space-y-4">
                            {announcements.map((ann: any) => (
                                <div key={ann._id} className="p-4 bg-black border border-gray-700 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-white">{ann.title}</h4>
                                        <span className="text-xs text-gray-500">{new Date(ann.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-gray-400 text-sm whitespace-pre-wrap">{ann.message}</p>
                                </div>
                            ))}
                            {announcements.length === 0 && <p className="text-gray-500 text-center py-4">No announcements posted yet</p>}
                        </div>
                    </div>
                </div>

            </div>
        </div >
    );
}
