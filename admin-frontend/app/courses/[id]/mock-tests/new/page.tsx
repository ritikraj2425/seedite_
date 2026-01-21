'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { uploadFile } from '@/lib/upload';
import { API_URL } from '@/lib/api';
import toast from 'react-hot-toast';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

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
        { type: 'mcq', text: '', options: ['', '', '', ''], correctOption: 0, marks: 4, externalLink: '', isUnrated: false, solution: '' }
    ]);

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        try {
            setUploadingVideo(true);
            const { key } = await uploadFile(file, 'video');
            setVideoSolutionKey(key);
            toast.success('Video solution uploaded successfully!');
        } catch (error) {
            toast.error('Failed to upload video solution');
        } finally {
            setUploadingVideo(false);
        }
    };

    const handleQuestionChange = (index: number, field: string, value: any) => {
        setQuestions(prev => prev.map((q, i) =>
            i === index ? { ...q, [field]: value } : q
        ));
    };

    const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
        setQuestions(prev => prev.map((q, i) => {
            if (i === qIndex) {
                const newOptions = [...(q.options || [])];
                newOptions[optIndex] = value;
                return { ...q, options: newOptions };
            }
            return q;
        }));
    };

    const addQuestion = () => {
        setQuestions([
            ...questions,
            { type: 'mcq', text: '', options: ['', '', '', ''], correctOption: 0, marks: 4, externalLink: '', isUnrated: false, solution: '' }
        ]);
    };

    const removeQuestion = (index: number) => {
        const newQuestions = questions.filter((_, i) => i !== index);
        setQuestions(newQuestions);
    };

    const [uploading, setUploading] = useState(false);

    const renderSmartPreview = (content: any) => {
        if (content === null || content === undefined || content === '') return '';
        const str = String(content);
        // Improved heuristic: keywords+newline OR indentation OR algo symbols
        const codeKeywords = [
            'def ', 'class ', 'import ', 'from ', 'public ', 'private ', 'function ', 'var ', 'const ', 'let ',
            'INPUT', 'OUTPUT', 'IF ', 'ELSE ', 'WHILE ', 'FOR ', 'THEN ', 'DO ', 'END ', 'PRINT ', 'STEP ', 'ALGORITHM'
        ];
        const algoSymbols = ['←', '≤', '≥', '≠', '×', '÷', 'mod ', '==', '!=', '>=', '<='];

        const lowerStr = str.toLowerCase();
        const hasCodeKeyword = codeKeywords.some(k => {
            const kl = k.toLowerCase().trim();
            // Match whole word or keyword followed by space
            const regex = new RegExp(`\\b${kl}\\b`, 'i');
            return regex.test(str);
        });
        const hasAlgoSymbol = algoSymbols.some(s => str.includes(s));
        const hasIndentation = /^\s{3,}/m.test(str);

        // Treat as code if it has multi-line structure OR certain algo elements
        const isCodeLike = (hasCodeKeyword && str.includes('\n')) || hasIndentation || (hasAlgoSymbol && str.length > 5);

        if (isCodeLike && !str.trim().startsWith('```')) {
            return `\n\n\`\`\`python\n${str}\n\`\`\`\n\n`;
        }
        return str;
    };

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
                    questions: questions.map(q => ({
                        type: q.type || 'mcq',
                        questionText: q.text || '', // Primary field for backend
                        text: q.text || '',         // Legacy field just in case
                        image: q.image || '',
                        options: (q.options || []).map((opt: any) => opt || ''),
                        correctOption: q.correctOption?.toString() || '',
                        externalLink: q.externalLink || '',
                        isUnrated: !!q.isUnrated,
                        marks: parseInt(q.marks?.toString() || '4'),
                        solution: q.solution || '' // Optional solution text
                    }))
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
                                    <div className="flex gap-4 items-center">
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-400 mb-1">Question Type</label>
                                            <select
                                                value={q.type || 'mcq'}
                                                onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)}
                                                className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                            >
                                                <option value="mcq">Multiple Choice (MCQ)</option>
                                                <option value="code">Coding Question</option>
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-400 mb-1">External Link (LeetCode/Github)</label>
                                            <input
                                                type="text"
                                                placeholder="https://leetcode.com/problems/..."
                                                value={q.externalLink || ''}
                                                onChange={(e) => handleQuestionChange(qIndex, 'externalLink', e.target.value)}
                                                className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white"
                                            />
                                        </div>
                                        <div className="flex items-center space-x-2 pt-4">
                                            <input
                                                type="checkbox"
                                                id={`unrated-${qIndex}`}
                                                checked={q.isUnrated || false}
                                                onChange={(e) => handleQuestionChange(qIndex, 'isUnrated', e.target.checked)}
                                                className="w-4 h-4 text-blue-600 rounded bg-black border-gray-700"
                                            />
                                            <label htmlFor={`unrated-${qIndex}`} className="text-sm font-medium text-gray-300">Unrated Question</label>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <label className="block text-xs text-gray-400 mb-1">Question Content (Markdown/LaTeX supported)</label>
                                            <textarea
                                                placeholder="Enter question text..."
                                                value={q.text}
                                                onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                                                className="w-full h-32 px-4 py-3 bg-black border border-gray-700 rounded-lg text-white font-mono text-sm"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-xs text-gray-400 mb-1">Live Preview</label>
                                            <div className="w-full h-32 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg overflow-auto">
                                                <MarkdownRenderer content={renderSmartPreview(q.text) || '*No content*'} />
                                            </div>
                                        </div>
                                    </div>

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

                                        {q.type !== 'code' ? (
                                            q.options.map((opt: string, optIndex: number) => (
                                                <div key={optIndex} className="space-y-2">
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="radio"
                                                            name={`correct-${qIndex}`}
                                                            checked={String(q.correctOption) === String(optIndex)}
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
                                                    <div className="ml-6 p-2 bg-gray-800 rounded">
                                                        <MarkdownRenderer content={renderSmartPreview(opt) || '*Option preview*'} />
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-2 space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Model Solution / Correct Code (Markdown Block encouraged)</label>
                                                    <textarea
                                                        placeholder="Enter the model solution code..."
                                                        value={q.correctOption ?? ''}
                                                        onChange={(e) => handleQuestionChange(qIndex, 'correctOption', e.target.value)}
                                                        className="w-full h-48 px-4 py-3 bg-black border border-gray-700 rounded-lg text-white font-mono text-sm"
                                                        required
                                                    />
                                                </div>
                                                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                                                    <label className="block text-xs text-gray-400 mb-2">Solution Preview</label>
                                                    <MarkdownRenderer content={renderSmartPreview(q.correctOption ?? '*No solution key*')} />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Solution Field - Optional */}
                                    <div className="col-span-2 mt-4">
                                        <label className="block text-xs text-gray-400 mb-1">Solution / Explanation (Optional)</label>
                                        <textarea
                                            placeholder="Enter the solution explanation for this question..."
                                            value={q.solution || ''}
                                            onChange={(e) => handleQuestionChange(qIndex, 'solution', e.target.value)}
                                            className="w-full h-24 px-4 py-3 bg-black border border-gray-700 rounded-lg text-white text-sm"
                                        />
                                        {q.solution && (
                                            <div className="mt-2 p-3 bg-gray-800 rounded-lg border border-gray-700">
                                                <label className="block text-xs text-gray-400 mb-1">Solution Preview</label>
                                                <MarkdownRenderer content={renderSmartPreview(q.solution) || '*No solution*'} />
                                            </div>
                                        )}
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
