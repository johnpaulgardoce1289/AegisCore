"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, Code2, Download, Package } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

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

    const downloadFile = () => {
        const extension = language === "javascript" ? "js" : language === "typescript" ? "ts" : language === "python" ? "py" : language || "txt";
        const blob = new Blob([value], { type: "text/plain;charset=utf-8" });
        saveAs(blob, `snippet.${extension}`);
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
                        onClick={downloadFile}
                        className="p-1.5 rounded-md hover:bg-white/5 text-neutral-400 hover:text-white transition-all active:scale-95"
                        title="Download Snippet"
                    >
                        <Download className="w-3.5 h-3.5" />
                    </button>
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
    const handleDownloadAllAsZip = async () => {
        const zip = new JSZip();
        const codeBlocks: { lang: string; content: string }[] = [];

        // Simple regex to extract code blocks from markdown
        const regex = /```(\w+)?\n([\s\S]*?)```/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            codeBlocks.push({ lang: match[1] || "txt", content: match[2] });
        }

        if (codeBlocks.length === 0) return;

        codeBlocks.forEach((block, index) => {
            const ext = block.lang === "javascript" ? "js" : block.lang === "typescript" ? "ts" : block.lang === "html" ? "html" : block.lang === "css" ? "css" : block.lang || "txt";
            const filename = block.lang === "html" ? "index.html" : block.lang === "css" ? "style.css" : `file_${index + 1}.${ext}`;
            zip.file(filename, block.content);
        });

        const blob = await zip.generateAsync({ type: "blob" });
        saveAs(blob, "aegis_project_export.zip");
    };

    const hasCodeBlocks = /```[\s\S]*?```/.test(content);

    return (
        <div className="relative group/renderer">
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

            {hasCodeBlocks && (
                <div className="mt-8 flex justify-end opacity-0 group-hover/renderer:opacity-100 transition-opacity duration-300">
                    <button
                        onClick={handleDownloadAllAsZip}
                        className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
                    >
                        <Package className="w-4 h-4" />
                        <span>Download Project as ZIP</span>
                    </button>
                </div>
            )}
        </div>
    );
};
