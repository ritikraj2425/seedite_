'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function EditMockTestPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = params.id;
    const testId = params.testId;

    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState('');
    const [totalQuestions, setTotalQuestions] = useState('');
    const [passingScore, setPassingScore] = useState('');
    const [correctMarks, setCorrectMarks] = useState('');
    const [incorrectMarks, setIncorrectMarks] = useState('');
    const [videoSolutionKey, setVideoSolutionKey] = useState('');
    const [questions, setQuestions] = useState<any[]>([]);

    useEffect(() => {
        fetchTestDetails();
    }, [testId, router]);

    const fetchTestDetails = async () => {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        if (!adminUser.token) {
            router.push('/login');
            return;
        }

        try {
            // Note: Currently fetching from main API, assuming admin access works or using admin specific route if needed.
            // Adjust URL if there is a specific admin route for fetching single test details
            const res = await fetch(`http://localhost:5000/api/mock-tests/${testId}`, {
                headers: { 'Authorization': `Bearer ${adminUser.token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setTitle(data.title);
                setDuration(data.duration.toString());
                setTotalQuestions(data.totalQuestions.toString());
                setPassingScore(data.passingScore.toString());
                setCorrectMarks(data.correctMarks.toString());
                setIncorrectMarks(data.incorrectMarks.toString());
                setVideoSolutionKey(data.videoSolutionKey || ''); // Assuming this field exists or needs key extraction from URL

                // Ensure questions have at least 4 options structure
                const formattedQuestions = (data.questions || []).map((q: any) => ({
                    ...q,
                    options: q.options || ['', '', '', ''],
                    correctOption: q.correctOptionIndex !== undefined ? q.correctOptionIndex : 0,
                    marks: q.marks || 4
                }));
                setQuestions(formattedQuestions);
            } else {
                console.error('Failed to fetch test details');
                // Create a basic fallback or error state if needed
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
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
        if (uploading) {
            alert('Please wait for images to finish uploading');
            return;
        }
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

        try {
            const res = await fetch(`http://localhost:5000/api/admin/mock-tests/${testId}`, {
                method: 'PUT',
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
                    videoSolutionKey,
                    questions: questions.map(q => ({
                        ...q,
                        correctOptionIndex: q.correctOption // Map back to backend expected field
                    }))
                })
            });

            if (res.ok) {
                alert('Mock Test updated successfully!');
                router.push(`/courses/${courseId}`);
            } else {
                alert('Failed to update mock test');
            }
        } catch (error) {
            alert('Error updating mock test');
        }
    };

    if (loading) return <div className="p-8 bg-black text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-black text-white">
            <nav className="bg-black border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center space-x-4">
                            <Link href={`/courses/${courseId}`} className="text-gray-400 hover:text-white">← Back</Link>
                            <h1 className="text-2xl font-bold">Edit Mock Test</h1>
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
                                    value={passingScore}
                                    onChange={(e) => setPassingScore(e.target.value)}
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

                    {/* Video Solution Details - CloudFront Key */}
                    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                        <h2 className="text-xl font-bold mb-4">Video Solution (Optional)</h2>
                        <p className="text-gray-400 text-sm mb-4">Enter CloudFront video key for the solution video shown after test completion</p>

                        <div>
                            <label className="block text-xs text-gray-400 mb-1">CloudFront Video Key</label>
                            <input
                                type="text"
                                placeholder="e.g., mock_test_solution_202510011654.mp4"
                                value={videoSolutionKey}
                                onChange={(e) => setVideoSolutionKey(e.target.value)}
                                className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                            />
                            <span className="text-xs text-gray-500">URL will be: https://dr6ydg7wb58lc.cloudfront.net/{videoSolutionKey || 'your-video-key'}</span>
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
                                        value={q.text || q.questionText} // Handle differences in fetch vs state
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
                                                            const res = await fetch('http://localhost:5000/api/upload/s3', {
                                                                method: 'POST',
                                                                headers: {
                                                                    'Authorization': `Bearer ${adminUser.token}`
                                                                },
                                                                body: formData
                                                            });
                                                            const data = await res.json();
                                                            if (res.ok) {
                                                                handleQuestionChange(qIndex, 'image', data.url);
                                                                alert('Image uploaded successfully!');
                                                            } else {
                                                                alert('Upload failed: ' + data.message);
                                                            }
                                                        } catch (err) {
                                                            console.error(err);
                                                            alert('Upload failed');
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
                            {uploading ? 'Uploading Images...' : 'Update Mock Test'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
