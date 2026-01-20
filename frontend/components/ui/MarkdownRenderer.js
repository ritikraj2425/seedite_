import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import 'katex/dist/katex.min.css';

const MarkdownRenderer = ({ content, className = '' }) => {
  return (
    <div className={`markdown-renderer ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const content = String(children);
            // Robust check: if it has newlines or a language match, treat as block code
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
      <style jsx global>{`
        .markdown-renderer {
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .markdown-renderer p, .markdown-renderer li, .markdown-renderer div, .markdown-renderer span {
          margin-bottom: 0px;
          white-space: pre-wrap;
          font-family: inherit;
        }
        .markdown-renderer pre {
          border-radius: 8px;
          overflow: auto;
          color: #f8f8f2 !important;
          white-space: pre !important;
          tab-size: 4;
          width: 100%;
        }
        .markdown-renderer code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          white-space: pre-wrap;
          font-size: 0.9em;
        }
        /* Make code blocks inside pre not have the inline styling */
        .markdown-renderer pre code {
          background-color: transparent;
          padding: 0;
          color: inherit;
          white-space: pre !important;
          font-size: inherit;
        }
        .markdown-renderer table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        .markdown-renderer th, .markdown-renderer td {
          border: 1px solid rgba(0, 0, 0, 0.1);
          padding: 8px;
          text-align: left;
        }
        .markdown-renderer blockquote {
          border-left: 4px solid #2563eb;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #475569;
          background: #f8fafc;
          border-radius: 0 8px 8px 0;
        }
        .markdown-renderer table {
          border-collapse: collapse;
          width: 100%;
          margin: 1.5rem 0;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .markdown-renderer th {
          background: #f8fafc;
          font-weight: 600;
          color: #0f172a;
          text-align: left;
          padding: 12px 16px;
          border-bottom: 2px solid #e2e8f0;
        }
        .markdown-renderer td {
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
        }
        .markdown-renderer tr:last-child td {
          border-bottom: none;
        }
        .markdown-renderer tr:hover td {
          background: #f8fafc;
        }
        .markdown-renderer a {
          color: #2563eb;
          text-decoration: none;
          font-weight: 500;
        }
        .markdown-renderer a:hover {
          text-decoration: underline;
        }
        .markdown-renderer img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
        }
        .markdown-renderer hr {
          border: none;
          border-top: 1px solid #e2e8f0;
          margin: 2rem 0;
        }
        @media (max-width: 768px) {
          .markdown-renderer {
            font-size: 0.95rem;
          }
          .markdown-renderer table {
            display: block;
            overflow-x: auto;
          }
          .markdown-renderer pre {
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
};

export default memo(MarkdownRenderer);


