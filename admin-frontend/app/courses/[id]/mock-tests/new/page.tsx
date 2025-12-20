'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { uploadFile } from '@/lib/upload';
import { API_URL } from '@/lib/api';
import toast from 'react-hot-toast';

// Removed local API_URL definition

export default function CreateMockTestPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = params.id;

    // Test Details
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState('180'); // minutes
    const [totalQuestions, setTotalQuestions] = useState('10');
    const [passingScore, setPassingScore] = useState('30');
    const [correctMarks, setCorrectMarks] = useState('4');
    const [incorrectMarks, setIncorrectMarks] = useState('-1');

    // Video Solution - Using CloudFront video key
    const [videoSolutionKey, setVideoSolutionKey] = useState('');
    const [uploadingVideo, setUploadingVideo] = useState(false);

    // Questions
    const [questions, setQuestions] = useState<any[]>([
        { text: '', options: ['', '', '', ''], correctOption: 0, marks: 4 }
    ]);

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        try {
            setUploadingVideo(true);
            const { key } = await uploadFile(file);
            setVideoSolutionKey(key);
            toast.success('Video solution uploaded successfully!');
        } catch (error) {
            toast.error('Failed to upload video solution');
        } finally {
            setUploadingVideo(false);
        }
    };

    const handleQuestionChange = (index: number, field: string, value: any) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[optIndex] = value;
        setQuestions(newQuestions);
    };

    const addQuestion = () => {
        setQuestions([
            ...questions,
            { text: '', options: ['', '', '', ''], correctOption: 0, marks: 4 }
        ]);
    };

    const removeQuestion = (index: number) => {
        const newQuestions = questions.filter((_, i) => i !== index);
        setQuestions(newQuestions);
    };

    const [uploading, setUploading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (uploading || uploadingVideo) {
            toast.error('Please wait for uploads to finish');
            return;
        }
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

        try {
            const res = await fetch(`${API_URL}/api/admin/mock-tests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminUser.token}`
                },
                body: JSON.stringify({
                    title,
                    duration: parseInt(duration),
                    totalQuestions: parseInt(totalQuestions),
                    passingScore: parseInt(passingScore),
                    correctMarks: parseInt(correctMarks),
                    incorrectMarks: parseInt(incorrectMarks),
                    videoSolutionKey,  // CloudFront file key
                    courseId,
                    questions
                })
            });

            if (res.ok) {
                toast.success('Mock Test created successfully!');
                router.push(`/courses/${courseId}`);
            } else {
                toast.error('Failed to create mock test');
            }
        } catch (error) {
            toast.error('Error creating mock test');
        }
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <nav className="bg-black border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center space-x-4">
                            <Link href={`/courses/${courseId}`} className="text-gray-400 hover:text-white">← Back</Link>
                            <h1 className="text-2xl font-bold">Create Mock Test</h1>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Info */}
                    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                        <h2 className="text-xl font-bold mb-4">Test Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">Test Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                                <input
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Passing Score</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Correct Marks</label>
                                <input
                                    type="number"
                                    value={correctMarks}
                                    onChange={(e) => setCorrectMarks(e.target.value)}
                                    className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Incorrect Marks</label>
                                <input
                                    type="number"
                                    value={incorrectMarks}
                                    onChange={(e) => setIncorrectMarks(e.target.value)}
                                    className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Video Solution - CloudFront Key */}
                    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                        <h2 className="text-xl font-bold mb-4">Video Solution (Optional)</h2>
                        <div className="mb-4">
                            <label className="block text-xs text-gray-400 mb-1">Solution Video</label>
                            {videoSolutionKey && (
                                <p className="text-xs text-green-400 mb-2">✓ Video Uploaded: {videoSolutionKey}</p>
                            )}
                            <input
                                type="file"
                                accept="video/*"
                                onChange={handleVideoUpload}
                                disabled={uploadingVideo}
                                className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                            />
                            {uploadingVideo && <p className="text-sm text-blue-400 mt-1">Uploading video solution...</p>}
                        </div>
                    </div>

                    {/* Questions Builder */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">Questions ({questions.length})</h2>
                            <button
                                type="button"
                                onClick={addQuestion}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                + Add Question
                            </button>
                        </div>

                        {questions.map((q, qIndex) => (
                            <div key={qIndex} className="bg-gray-900 rounded-lg border border-gray-800 p-6 relative">
                                <button
                                    type="button"
                                    onClick={() => removeQuestion(qIndex)}
                                    className="absolute top-4 right-4 text-red-500 hover:text-red-400"
                                >
                                    Remove
                                </button>

                                <h3 className="font-semibold mb-3 text-gray-400">Question {qIndex + 1}</h3>

                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Enter question text..."
                                        value={q.text}
                                        onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                                        className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white"
                                        required
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-xs text-gray-400 mb-1">Question Image (Optional)</label>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;

                                                        setUploading(true);
                                                        const formData = new FormData();
                                                        formData.append('image', file);

                                                        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
                                                        try {
                                                            const res = await fetch(`${API_URL}/api/upload/s3/image`, {
                                                                method: 'POST',
                                                                headers: {
                                                                    'Authorization': `Bearer ${adminUser.token}`
                                                                },
                                                                body: formData
                                                            });
                                                            const data = await res.json();
                                                            if (res.ok) {
                                                                handleQuestionChange(qIndex, 'image', data.url);
                                                                toast.success('Image uploaded successfully!');
                                                            } else {
                                                                toast.error('Upload failed: ' + data.message);
                                                            }
                                                        } catch (err) {
                                                            console.error(err);
                                                            toast.error('Upload failed');
                                                        } finally {
                                                            setUploading(false);
                                                        }
                                                    }}
                                                    className="block w-full text-sm text-gray-400
                                                        file:mr-4 file:py-2 file:px-4
                                                        file:rounded-full file:border-0
                                                        file:text-sm file:font-semibold
                                                        file:bg-blue-600 file:text-white
                                                        hover:file:bg-blue-700"
                                                />
                                                {q.image && (
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-green-500 text-xs">✓ Uploaded</span>
                                                        <img src={q.image} alt="Preview" className="h-8 w-8 object-cover rounded" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {q.options.map((opt: string, optIndex: number) => (
                                            <div key={optIndex} className="flex items-center space-x-2">
                                                <input
                                                    type="radio"
                                                    name={`correct-${qIndex}`}
                                                    checked={q.correctOption === optIndex}
                                                    onChange={() => handleQuestionChange(qIndex, 'correctOption', optIndex)}
                                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 bg-black border-gray-700"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder={`Option ${optIndex + 1}`}
                                                    value={opt}
                                                    onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                                                    className="flex-1 px-3 py-2 bg-black border border-gray-700 rounded-lg text-white text-sm"
                                                    required
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={uploading}
                            className={`px-8 py-3 rounded-lg font-bold text-lg ${uploading
                                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                                : 'bg-white text-black hover:bg-gray-200'
                                }`}
                        >
                            {uploading ? 'Uploading Images...' : 'Create Mock Test'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
