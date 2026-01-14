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
          margin: 1rem 0;
          border-radius: 8px;
          overflow: auto;
          background: #1a1a1a !important;
          color: #f8f8f2 !important;
          padding: 1rem;
          white-space: pre !important;
          tab-size: 4;
          width: 100%;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        .markdown-renderer code {
          background-color: rgba(0, 0, 0, 0.05);
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
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
      `}</style>
    </div>
  );
};

export default memo(MarkdownRenderer);
