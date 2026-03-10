"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, Code2 } from "lucide-react";

interface CodeBlockProps {
    language: string;
    value: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
    const [copied, setCopied] = useState(false);

    const onCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative my-6 group rounded-xl border border-white/10 bg-[#0d0d0d] overflow-hidden shadow-2xl">
            {/* Header / Tab Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/5">
                <div className="flex items-center space-x-3">
                    <div className="flex space-x-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
                    </div>
                    <div className="h-4 w-px bg-white/10 mx-1" />
                    <div className="flex items-center space-x-2">
                        <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                            {language || "code"}
                        </span>
                    </div>
                </div>
                <div className="flex items-center space-x-1">
                    <button
                        onClick={onCopy}
                        className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md hover:bg-white/5 text-neutral-400 hover:text-white transition-all active:scale-95"
                    >
                        {copied ? (
                            <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-[11px] font-bold text-emerald-400">COPIED</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-bold">COPY</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="relative">
                <SyntaxHighlighter
                    language={language || "text"}
                    style={vscDarkPlus}
                    customStyle={{
                        margin: 0,
                        padding: "1.5rem",
                        background: "transparent",
                        fontSize: "13px",
                        lineHeight: "1.6",
                    }}
                    codeTagProps={{
                        style: {
                            fontFamily: 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        },
                    }}
                >
                    {value}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};

export const MarkdownRenderer = ({ content }: { content: string }) => {
    return (
        <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-transparent prose-pre:p-0 prose-code:text-indigo-300 prose-code:before:content-none prose-code:after:content-none prose-h1:text-xl prose-h1:font-black prose-h2:text-lg prose-h2:font-bold prose-h3:text-md prose-strong:text-white prose-a:text-indigo-400 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-500/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-lg">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                            <CodeBlock
                                language={match[1]}
                                value={String(children).replace(/\n$/, "")}
                            />
                        ) : (
                            <code
                                className="bg-white/10 px-1.5 py-0.5 rounded-md text-indigo-300 font-mono text-[13px]"
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    },
                    hr: () => <hr className="border-white/5 my-6" />,
                    ul: ({ children }) => <ul className="space-y-2 mb-4">{children}</ul>,
                    ol: ({ children }) => <ol className="space-y-2 mb-4 list-decimal pl-4">{children}</ol>,
                    li: ({ children }) => <li className="text-neutral-300 font-medium">{children}</li>,
                    p: ({ children }) => <p className="mb-4 text-neutral-300 leading-relaxed font-medium">{children}</p>,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};
