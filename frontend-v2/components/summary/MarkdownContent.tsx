"use client";
import React from "react";
import ReactMarkdown, { Components } from "react-markdown";

interface MarkdownContentProps {
  content: string;
}

const MarkdownContent: React.FC<MarkdownContentProps> = ({ content }) => {
  const components: Components = {
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold mb-4 text-gray-800">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-700">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-600">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="mb-3 text-gray-600 leading-relaxed">{children}</p>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline">
        {children}
      </a>
    ),
  };

  return <ReactMarkdown components={components}>{content}</ReactMarkdown>;
};

export default MarkdownContent;
