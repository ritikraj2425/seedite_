'use client';

import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import 'katex/dist/katex.min.css';

const BlogMarkdownRenderer = ({ content, className = '' }) => {
    return (
        <div className={`blog-markdown-renderer ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex, rehypeRaw]}
                components={{
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const content = String(children);
                        const isActuallyBlock = !inline || match || content.includes('\n');

                        return isActuallyBlock ? (
                            <SyntaxHighlighter
                                style={atomDark}
                                language={match ? match[1] : 'python'}
                                PreTag="div"
                                {...props}
                            >
                                {content.replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        ) : (
                            <code className={className} {...props}>
                                {children}
                            </code>
                        );
                    },
                }}
            >
                {content}
            </ReactMarkdown>
            <style dangerouslySetInnerHTML={{
                __html: `
        .blog-markdown-renderer {
          line-height: 1.8;
          color: #334155;
        }
        .blog-markdown-renderer h1,
        .blog-markdown-renderer h2,
        .blog-markdown-renderer h3,
        .blog-markdown-renderer h4,
        .blog-markdown-renderer h5,
        .blog-markdown-renderer h6 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 700;
          color: #0f172a;
        }
        .blog-markdown-renderer h1 { font-size: 2rem; }
        .blog-markdown-renderer h2 { font-size: 1.5rem; }
        .blog-markdown-renderer h3 { font-size: 1.25rem; }
        .blog-markdown-renderer p {
          margin-bottom: 1em;
          font-family: inherit;
        }
        .blog-markdown-renderer ul,
        .blog-markdown-renderer ol {
          margin-bottom: 1em;
          padding-left: 1.5em;
        }
        .blog-markdown-renderer li {
          margin-bottom: 0.5em;
        }
        .blog-markdown-renderer pre {
          margin: 1.5rem 0;
          border-radius: 8px;
          overflow: auto;
          color: #f8f8f2 !important;
          padding: 1rem;
          white-space: pre !important;
          tab-size: 4;
          width: 100%;
        }
        .blog-markdown-renderer code {
          background-color: #f1f5f9;
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 0.9em;
          color: #e11d48;
        }
        .blog-markdown-renderer pre code {
          background-color: transparent;
          padding: 0;
          color: inherit;
          white-space: pre !important;
          font-size: inherit;
        }
        .blog-markdown-renderer table {
          border-collapse: collapse;
          width: 100%;
          margin: 1.5rem 0;
          overflow-x: auto;
          display: block;
        }
        .blog-markdown-renderer th,
        .blog-markdown-renderer td {
          border: 1px solid #4ade80;
          padding: 10px 14px;
          text-align: left;
          white-space: nowrap;
        }
        .blog-markdown-renderer th {
          background: #f0fdf4;
          font-weight: 600;
        }
        .blog-markdown-renderer blockquote {
          border-left: 4px solid #2563eb;
          margin: 1.5em 0;
          padding: 0.5em 1em;
          background: #f8fafc;
          color: #475569;
        }
        .blog-markdown-renderer img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1em 0;
        }
        .blog-markdown-renderer a {
          color: #2563eb;
          text-decoration: underline;
        }
        .blog-markdown-renderer a:hover {
          color: #1d4ed8;
        }
        .blog-markdown-renderer hr {
          border: none;
          border-top: 1px solid #e2e8f0;
          margin: 2em 0;
        }
        @media (max-width: 768px) {
          .blog-markdown-renderer {
            font-size: 1rem;
          }
          .blog-markdown-renderer h1 { font-size: 1.5rem; }
          .blog-markdown-renderer h2 { font-size: 1.25rem; }
          .blog-markdown-renderer h3 { font-size: 1.1rem; }
          .blog-markdown-renderer table {
            font-size: 0.85rem;
          }
          .blog-markdown-renderer th,
          .blog-markdown-renderer td {
            padding: 8px 10px;
          }
        }
      `}} />
        </div>
    );
};

export default memo(BlogMarkdownRenderer);
