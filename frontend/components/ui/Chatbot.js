'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { API_URL } from '@/lib/api';
import Image from 'next/image';

export default function Chatbot() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const chatScrollRef = useRef(null);

    const suggestQuestions = [
        "What is the NSAT exam?",
        "Tell me about Bridge course",
        "How should I prepare for NSAT?",
    ];

    const scrollToBottom = () => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = async (text = input) => {
        if (!text.trim()) return;

        if (!hasStarted) setHasStarted(true);

        const userMsg = { role: 'user', content: text };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history: messages })
            });
            const data = await res.json();

            if (res.ok && data.reply) {
                setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
            } else {
                setMessages([...newMessages, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
            }
        } catch (error) {
            console.error(error);
            setMessages([...newMessages, { role: 'assistant', content: 'Network error. Please check your connection.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Reusable logo avatar for assistant
    const AssistantAvatar = ({ size = 32 }) => (
        <div style={{
            width: `${size}px`, height: `${size}px`, borderRadius: '10px',
            flexShrink: 0, overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <Image src="/logo.png" alt="Seedite" width={size} height={size} style={{ objectFit: 'contain' }} />
        </div>
    );

    return (
        <section className="chatbot-section" style={{ position: 'relative', marginTop: '20px' }}>
            {/* Section Header */}
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: 'linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%)',
                    padding: '6px 16px', borderRadius: '100px', marginBottom: '16px',
                    border: '1px solid rgba(124, 58, 237, 0.15)',
                }}>
                    <Sparkles size={13} color="#7c3aed" fill="#7c3aed" />
                    <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#6d28d9', letterSpacing: '0.05em' }}>AI-Powered</span>
                </div>
                <h2 className="section-title" style={{ marginBottom: '12px' }}>Ask Anything About Us</h2>
            </div>

            {/* Main Chatbot Container */}
            <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 16px' }}>
                <div style={{ position: 'relative' }}>
                    {/* Gradient border glow */}
                    <div className="chatbot-glow" style={{
                        position: 'absolute', inset: '-2px', borderRadius: '26px',
                        background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 40%, #06b6d4 100%)',
                        opacity: 0.35, filter: 'blur(1px)', zIndex: 0,
                    }} />

                    {/* Card body */}
                    <div style={{
                        position: 'relative', zIndex: 1, borderRadius: '24px',
                        background: '#ffffff', overflow: 'hidden',
                        boxShadow: '0 25px 60px -15px rgba(37,99,235,0.1), 0 0 0 1px rgba(0,0,0,0.03)',
                    }}>
                        {/* Two-column layout */}
                        <div className="chatbot-layout">

                            {/* LEFT: Input / Suggestions */}
                            <div className="chatbot-left">
                                {/* Logo bar */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px',
                                }}>
                                    <AssistantAvatar size={40} />
                                    <div>
                                        <div style={{ fontWeight: '700', fontSize: '1rem', color: '#0f172a', lineHeight: '1.2' }}>Seedite AI</div>
                                        <div style={{ fontSize: '0.76rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#16a34a', display: 'inline-block', boxShadow: '0 0 6px #16a34a' }} />
                                            Ready to help
                                        </div>
                                    </div>
                                </div>

                                {/* Suggested questions */}
                                <div style={{ marginBottom: '16px' }}>
                                    <p style={{ fontSize: '0.72rem', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>
                                        Quick Questions
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {suggestQuestions.map((q, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSend(q)}
                                                disabled={isLoading}
                                                className="chatbot-suggest-btn"
                                            >
                                                <ArrowRight size={13} style={{ opacity: 0.35, flexShrink: 0 }} />
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Text input area */}
                                <div style={{ marginTop: 'auto' }}>
                                    <div className="chatbot-input-wrap">
                                        <textarea
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSend();
                                                }
                                            }}
                                            placeholder="Type your question..."
                                            rows={2}
                                            className="chatbot-textarea"
                                        />
                                        <button
                                            onClick={() => handleSend()}
                                            disabled={!input.trim() || isLoading}
                                            className="chatbot-send-btn"
                                            style={{
                                                background: input.trim() && !isLoading
                                                    ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
                                                    : '#e2e8f0',
                                                cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                                                boxShadow: input.trim() && !isLoading ? '0 4px 12px rgba(37,99,235,0.3)' : 'none',
                                            }}
                                        >
                                            <Send size={15} />
                                        </button>
                                    </div>
                                    <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '6px', textAlign: 'center' }}>
                                        Press Enter to send
                                    </p>
                                </div>
                            </div>

                            {/* RIGHT: Chat history */}
                            <div className="chatbot-right">
                                {/* Conversation area */}
                                <div ref={chatScrollRef} className="chatbot-messages">
                                    {!hasStarted ? (
                                        /* Welcome State */
                                        <div style={{
                                            display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center',
                                            height: '100%', textAlign: 'center', padding: '40px 20px',
                                        }}>
                                            <div style={{
                                                width: '64px', height: '64px', borderRadius: '18px',
                                                background: 'linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                marginBottom: '16px',
                                                border: '1px solid rgba(124,58,237,0.1)',
                                            }}>
                                                <Image src="/logo.png" alt="Logo" width={36} height={36} style={{ objectFit: 'contain' }} />
                                            </div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                                                Welcome to Seedite AI
                                            </h3>
                                            <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.6', maxWidth: '280px' }}>
                                                Ask about NSAT, courses, or NST campus life.
                                            </p>
                                        </div>
                                    ) : (
                                        /* Messages */
                                        <>
                                            {messages.map((msg, i) => (
                                                <div key={i} style={{
                                                    display: 'flex', gap: '8px', alignItems: 'flex-start',
                                                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                                                    animation: 'chatFadeIn 0.3s ease-out forwards',
                                                }}>
                                                    {/* Avatar */}
                                                    {msg.role === 'user' ? (
                                                        <div style={{
                                                            width: '28px', height: '28px', borderRadius: '8px',
                                                            flexShrink: 0, background: '#0f172a',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        }}>
                                                            <User size={14} color="white" />
                                                        </div>
                                                    ) : (
                                                        <AssistantAvatar size={28} />
                                                    )}

                                                    {/* Bubble */}
                                                    <div className={msg.role === 'assistant' ? 'chatbot-markdown' : ''} style={{
                                                        maxWidth: '80%',
                                                        padding: msg.role === 'user' ? '10px 14px' : '14px 16px',
                                                        borderRadius: '14px',
                                                        borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '14px',
                                                        borderTopRightRadius: msg.role === 'user' ? '4px' : '14px',
                                                        background: msg.role === 'user' ? '#0f172a' : '#ffffff',
                                                        color: msg.role === 'user' ? '#ffffff' : '#1e293b',
                                                        fontSize: '0.88rem', lineHeight: '1.6',
                                                        boxShadow: msg.role === 'assistant'
                                                            ? '0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)'
                                                            : '0 2px 6px rgba(15,23,42,0.12)',
                                                        wordBreak: 'break-word',
                                                    }}>
                                                        {msg.role === 'assistant' ? (
                                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                        ) : msg.content}
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Loading indicator */}
                                            {isLoading && (
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', animation: 'chatFadeIn 0.3s ease-out forwards' }}>
                                                    <AssistantAvatar size={28} />
                                                    <div style={{
                                                        padding: '12px 16px', borderRadius: '14px', borderTopLeftRadius: '4px',
                                                        background: '#ffffff', display: 'flex', gap: '5px', alignItems: 'center',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)',
                                                    }}>
                                                        <span className="chatbot-typing-dot" style={{ animationDelay: '0ms' }} />
                                                        <span className="chatbot-typing-dot" style={{ animationDelay: '160ms' }} />
                                                        <span className="chatbot-typing-dot" style={{ animationDelay: '320ms' }} />
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                /* ===== CHATBOT LAYOUT ===== */
                .chatbot-layout {
                    display: flex;
                    flex-direction: row;
                    height: 480px;
                }
                .chatbot-left {
                    flex: 0 0 320px;
                    padding: 28px 24px;
                    display: flex;
                    flex-direction: column;
                    border-right: 1px solid #f1f5f9;
                    background: linear-gradient(180deg, #fafbff 0%, #ffffff 100%);
                }
                .chatbot-right {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: #f8fafc;
                    overflow: hidden;
                    min-width: 0;
                }
                .chatbot-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 24px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                /* ===== MOBILE RESPONSIVE ===== */
                @media (max-width: 768px) {
                    .chatbot-layout {
                        flex-direction: column !important;
                        height: auto !important;
                    }
                    .chatbot-left {
                        flex: unset !important;
                        border-right: none !important;
                        border-bottom: 1px solid #f1f5f9;
                        padding: 20px 16px !important;
                    }
                    .chatbot-right {
                        min-height: 320px;
                        max-height: 400px;
                    }
                    .chatbot-messages {
                        padding: 16px 14px !important;
                    }
                    .chatbot-glow {
                        display: none;
                    }
                    .chatbot-section {
                        margin-bottom: 60px !important;
                    }
                }

                /* ===== INPUT STYLES ===== */
                .chatbot-input-wrap {
                    position: relative;
                    background: white;
                    border-radius: 14px;
                    border: 2px solid #e2e8f0;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease;
                    overflow: hidden;
                }
                .chatbot-input-wrap:focus-within {
                    border-color: #2563eb !important;
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
                }
                .chatbot-textarea {
                    width: 100%;
                    padding: 12px 48px 12px 14px;
                    border: none;
                    resize: none;
                    font-size: 0.9rem;
                    outline: none;
                    font-family: inherit;
                    background: transparent;
                    color: #0f172a;
                    line-height: 1.5;
                }
                .chatbot-send-btn {
                    position: absolute;
                    bottom: 10px;
                    right: 10px;
                    width: 34px;
                    height: 34px;
                    border-radius: 10px;
                    color: white;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }

                /* ===== SUGGEST BUTTONS ===== */
                .chatbot-suggest-btn {
                    text-align: left;
                    padding: 10px 12px;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    font-size: 0.84rem;
                    color: #334155;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-family: inherit;
                }
                .chatbot-suggest-btn:hover:not(:disabled) {
                    background: #f8fafc;
                    border-color: #2563eb;
                    color: #2563eb;
                }
                .chatbot-suggest-btn:disabled {
                    cursor: not-allowed;
                    opacity: 0.6;
                }

                /* ===== ANIMATIONS ===== */
                .chatbot-typing-dot {
                    width: 5px;
                    height: 5px;
                    background: #94a3b8;
                    border-radius: 50%;
                    display: inline-block;
                    animation: chatTypingBounce 1.4s infinite ease-in-out both;
                }
                @keyframes chatTypingBounce {
                    0%, 80%, 100% { transform: scale(0.4); opacity: 0.4; }
                    40% { transform: scale(1); opacity: 1; }
                }
                @keyframes chatFadeIn {
                    from { opacity: 0; transform: translateY(6px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* ===== MARKDOWN STYLES ===== */
                .chatbot-markdown p {
                    margin: 0 0 0.4em 0;
                }
                .chatbot-markdown p:last-child {
                    margin-bottom: 0;
                }
                .chatbot-markdown ul, .chatbot-markdown ol {
                    margin: 0.3em 0 0.5em 1.3em;
                    padding: 0;
                }
                .chatbot-markdown li {
                    margin-bottom: 0.15em;
                }
                .chatbot-markdown strong {
                    font-weight: 600;
                    color: #0f172a;
                }
                .chatbot-markdown a {
                    color: #2563eb;
                    text-decoration: underline;
                }
                .chatbot-markdown code {
                    background: #f1f5f9;
                    padding: 1px 5px;
                    border-radius: 4px;
                    font-size: 0.84em;
                }
                .chatbot-markdown h1, .chatbot-markdown h2, .chatbot-markdown h3 {
                    font-size: 0.95em;
                    font-weight: 700;
                    margin: 0.5em 0 0.25em 0;
                    background: none;
                    -webkit-text-fill-color: #0f172a;
                }

                /* ===== SCROLLBAR ===== */
                .chatbot-messages::-webkit-scrollbar {
                    width: 4px;
                }
                .chatbot-messages::-webkit-scrollbar-track {
                    background: transparent;
                }
                .chatbot-messages::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }
            `}</style>
        </section>
    );
}
