'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

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

    // Questions
    const [questions, setQuestions] = useState<any[]>([
        { text: '', options: ['', '', '', ''], correctOption: 0, marks: 4 }
    ]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

        try {
            const res = await fetch('http://localhost:5000/api/admin/mock-tests', {
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
                alert('Mock Test created successfully!');
                router.push(`/courses/${courseId}`);
            } else {
                alert('Failed to create mock test');
            }
        } catch (error) {
            alert('Error creating mock test');
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
                                        value={q.text}
                                        onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                                        className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white"
                                        required
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            className="px-8 py-3 bg-white text-black rounded-lg hover:bg-gray-200 font-bold text-lg"
                        >
                            Create Mock Test
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
