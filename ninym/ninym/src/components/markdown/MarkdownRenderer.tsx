"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose max-w-full break-words whitespace-normal leading-7">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className || "");

            // Block code with syntax highlighting
            if (match) {
              return (
                <pre className="bg-accent-secondary/10 text-gray-100 p-4 rounded overflow-x-auto break-words text-xs">
                  <code className={className}>{children}</code>
                </pre>
              );
            }

            // Fallback for inline code
            return (
              <code className="px-1 rounded text-sm break-words">
                {children}
              </code>
            );
          },

          a({ children, ...props }) {
            return (
              <a
                className="text-blue-500 underline hover:text-blue-700 break-words"
                {...props}
              >
                {children}
              </a>
            );
          },

        }}
      >
        {content.replace(/\\n/g, "\n")}
      </ReactMarkdown>
    </div>
  );
}