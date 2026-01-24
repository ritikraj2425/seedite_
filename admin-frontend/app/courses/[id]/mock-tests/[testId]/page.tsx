'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { uploadFile } from '@/lib/upload';
import { API_URL } from '@/lib/api';
import toast from 'react-hot-toast';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

// Removed local API_URL definition

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
    const [uploading, setUploading] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);

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

    const renderSmartPreview = (content: any) => {
        if (content === null || content === undefined || content === '') return '';
        let str = String(content);

        // Convert escaped newlines (literal \n from database) to actual newlines
        str = str.replace(/\\n/g, '\n');

        // If already has markdown code blocks, return as-is
        if (str.trim().startsWith('```')) {
            return str;
        }

        // Check for multiline content
        const hasNewlines = str.includes('\n');

        // Improved heuristic: keywords OR algo symbols OR indentation
        const codeKeywords = [
            'def ', 'class ', 'import ', 'from ', 'public ', 'private ', 'function ', 'var ', 'const ', 'let ',
            'INPUT', 'OUTPUT', 'IF ', 'ELSE ', 'WHILE ', 'FOR ', 'THEN ', 'DO ', 'END', 'PRINT', 'STEP', 'ALGORITHM',
            'for ', 'if ', 'else ', 'while ', 'end ', 'print ', 'arr', 'sum ', 'length('
        ];
        const algoSymbols = ['←', '≤', '≥', '≠', '×', '÷', 'mod ', '==', '!=', '>=', '<=', '= 0', '= [', '++', '--', '+=', '-='];

        // Use simple string matching instead of regex to avoid special character issues
        const lowerStr = str.toLowerCase();
        const hasCodeKeyword = codeKeywords.some(k => lowerStr.includes(k.toLowerCase()));
        const hasAlgoSymbol = algoSymbols.some(s => str.includes(s));
        const hasIndentation = /^[ \t]{2,}/m.test(str);

        // If it has multiple lines and looks like code/pseudocode, wrap in code block
        const isCodeLike = hasNewlines && (hasCodeKeyword || hasAlgoSymbol || hasIndentation);

        if (isCodeLike) {
            return `\n\n\`\`\`\n${str}\n\`\`\`\n\n`;
        }

        // For any content with newlines that isn't code-like, preserve line breaks
        if (hasNewlines) {
            return str.split('\n').join('  \n');
        }

        return str;
    };

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
            const res = await fetch(`${API_URL}/api/mock-tests/${testId}`, {
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

                // Ensure questions have at least 4 options structure and handle correctOption types
                const formattedQuestions = (data.questions || []).map((q: any) => {
                    let correctVal = q.correctOptionIndex !== undefined ? q.correctOptionIndex : q.correctOption;
                    if ((q.type === 'mcq' || !q.type) && typeof correctVal === 'string' && !isNaN(parseInt(correctVal))) {
                        correctVal = parseInt(correctVal);
                    }

                    const unifiedText = q.text || q.questionText || '';
                    return {
                        ...q,
                        type: q.type || 'mcq',
                        text: unifiedText,
                        questionText: unifiedText,
                        options: q.options || ['', '', '', ''],
                        correctOption: correctVal,
                        marks: q.marks || 4
                    };
                });
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

    // const [uploading, setUploading] = useState(false); // Removed duplicate

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (uploading || uploadingVideo) {
            toast.error('Please wait for uploads to finish');
            return;
        }
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

        try {
            const res = await fetch(`${API_URL}/api/admin/mock-tests/${testId}`, {
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
                toast.success('Mock Test updated successfully!');
                router.push(`/courses/${courseId}`);
            } else {
                toast.error('Failed to update mock test');
            }
        } catch (error) {
            toast.error('Error updating mock test');
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
                                            <label htmlFor={`unrated-${qIndex}`} className="text-sm font-medium text-gray-300">Unrated</label>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <label className="block text-xs text-gray-400 mb-1">Question Content (Markdown/LaTeX supported)</label>
                                            <textarea
                                                placeholder="Enter question text..."
                                                value={q.text || ''}
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
                                                        <textarea
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
                            {uploading ? 'Uploading Images...' : 'Update Mock Test'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
