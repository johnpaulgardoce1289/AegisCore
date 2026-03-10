"use client";

import { useSession, signOut } from "next-auth/react";
import {
    Sparkles,
    Send,
    Bot,
    Plus,
    History,
    LogOut,
    Menu,
    Cpu,
    Shield,
    ChevronLeft,
    ChevronDown,
    LayoutDashboard
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

interface Conversation {
    id: string;
    title: string;
    updatedAt: string;
}

// ROBUST CHAT HOOK
function useCustomChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState("Aegis V1");

    const append = async (text: string, existingConvId?: string | null) => {
        if (!text.trim() || isLoading) return;

        const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                body: JSON.stringify({
                    messages: newMessages.map(m => ({ role: m.role, content: m.content })),
                    conversationId: existingConvId || currentId || null,
                    selectedModel: selectedModel
                }),
            });

            if (!res.ok) throw new Error("Neural Link Failed");

            const convIdHeader = res.headers.get("x-conversation-id");
            if (convIdHeader && !existingConvId && !currentId) {
                setCurrentId(convIdHeader);
            }

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "" };

            setMessages(prev => [...prev, assistantMsg]);

            let fullContent = "";
            while (true) {
                const { done, value } = await reader!.read();
                if (done) break;
                const chunk = decoder.decode(value);

                // The backend now streams pure text chunks directly. We can append them directly.
                // We'll strip any stray "0:" prefixes if standard AI SDK strings somehow bleed through, 
                // but the current route returns raw stream chunks.
                if (chunk.startsWith('0:"')) {
                    try {
                        const parsed = JSON.parse(chunk.substring(2));
                        fullContent += parsed;
                    } catch {
                        fullContent += chunk;
                    }
                } else if (chunk.startsWith('0:')) {
                    fullContent += chunk.substring(2);
                } else {
                    fullContent += chunk;
                }

                setMessages(prev => {
                    const last = prev[prev.length - 1];
                    if (last && last.role === "assistant") {
                        return [...prev.slice(0, -1), { ...last, content: fullContent }];
                    }
                    return prev;
                });
            }
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { id: "err", role: "assistant", content: "CRITICAL_ERROR: Connection to Aegis Core unstable." } as Message]);
        } finally {
            setIsLoading(false);
        }
    };

    const loadConversation = async (id: string) => {
        setIsLoading(true);
        setCurrentId(id);
        try {
            const res = await fetch(`/api/conversations/${id}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        messages, input, setInput, isLoading, setMessages, append,
        loadConversation, currentId, setCurrentId, selectedModel, setSelectedModel
    };
}

export default function ChatPage() {
    const { data: session } = useSession();
    const {
        messages, input, setInput, isLoading, setMessages, append,
        loadConversation, currentId, setCurrentId, selectedModel, setSelectedModel
    } = useCustomChat();

    const scrollRef = useRef<HTMLDivElement>(null);
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isModelDropdownOpen, setModelDropdownOpen] = useState(false);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (session && !isLoading) {
            const controller = new AbortController();
            fetch("/api/conversations", { signal: controller.signal })
                .then(res => res.json())
                .then(data => {
                    // Deduplicate by ID just in case
                    const unique = Array.isArray(data) ? data.filter((c, i, a) => a.findIndex(t => t.id === c.id) === i) : [];
                    setConversations(unique);
                })
                .catch(err => {
                    if (err.name !== 'AbortError') console.error(err);
                });
            return () => controller.abort();
        }
    }, [session, currentId, isLoading]);

    const startNewChat = () => {
        setCurrentId(null);
        setMessages([]);
    };

    // Removed blocking auth check to allow free open-source access


    const models = [
        { id: "Aegis V1", name: "Aegis V1", sub: "Standard Neural Engine", color: "text-blue-400" },
        { id: "OpenAI", name: "Open AI (GPT-4o)", sub: "Most Capable Model", color: "text-indigo-400" },
        { id: "Gemini", name: "Gemini (1.5 Pro)", sub: "Fast & Precise", color: "text-purple-400" },
        { id: "Claude 4.6", name: "Claude 4.6 Sonnet", sub: "Most Intelligent Model", color: "text-orange-400" },
        { id: "Claude 4.0", name: "Claude 4.0 Sonnet", sub: "Previous Generation", color: "text-yellow-400" },
        { id: "Aegis Image Genesis", name: "Image Generator", sub: "Visual Creation Engine", color: "text-emerald-400" },
    ];

    return (
        <main className="flex h-screen bg-[#080808] text-neutral-100 overflow-hidden font-sans">
            {/* Sidebar */}
            <div className={`
                fixed lg:relative inset-y-0 left-0 z-50 bg-[#050505] border-r border-white/5 transition-all duration-500 ease-in-out flex flex-col
                ${isSidebarOpen ? 'w-[280px] sm:w-80 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-0 overflow-hidden border-none'}
            `}>
                <div className="p-6 sm:p-8 flex items-center justify-between min-w-[280px] sm:min-w-[320px]">
                    <Link href="/" className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg border border-white/10">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-black text-lg tracking-tighter uppercase underline decoration-indigo-500 underline-offset-4">Aegis AI</span>
                    </Link>
                    <button onClick={() => setSidebarOpen(false)} className="p-2 text-neutral-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                </div>

                <div className="px-4 sm:px-6 mb-8 min-w-[280px] sm:min-w-[320px]">
                    <button
                        onClick={startNewChat}
                        className="w-full group flex items-center justify-center space-x-2 p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.25rem] font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Establish Stream</span>
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto px-2 sm:px-4 custom-scrollbar min-w-[280px] sm:min-w-[320px]">
                    <div className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.3em] mt-6 mb-4 px-4 flex items-center">
                        <History className="w-3 h-3 mr-3 text-indigo-500" />
                        Neural Records
                    </div>
                    {/* Neural Records List with Deduplication and Key Normalization */}
                    {conversations
                        .filter((conv, index, self) =>
                            // Only show the most recent unique title to keep the sideboard clean
                            self.findIndex((c) => c.title === conv.title) === index
                        )
                        .map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => {
                                    if (currentId === conv.id) return;
                                    loadConversation(conv.id);
                                    if (window.innerWidth < 1024) setSidebarOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3.5 rounded-2xl text-[13px] font-bold transition-all truncate border flex flex-col space-y-1 mb-1
                                ${currentId === conv.id
                                        ? 'bg-indigo-600/10 border-indigo-500/50 text-white shadow-lg'
                                        : 'bg-transparent border-transparent text-neutral-500 hover:bg-white/5 hover:text-neutral-200'}`}
                            >
                                <span className="truncate">{conv.title || "Secure Comm..."}</span>
                            </button>
                        ))}
                </div>



            </div>

            {/* Main Content Area */}
            <div className={`flex-grow flex flex-col relative h-full bg-[#080808] transition-all duration-500`}>
                {/* Header (AI Choices on Left, Profile on Right) */}
                <header className="h-20 flex items-center justify-between px-4 sm:px-8 border-b border-white/5 bg-black/40 backdrop-blur-3xl shrink-0 z-40">
                    <div className="flex items-center space-x-6">
                        {/* Sidebar Toggle */}
                        <button
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all shadow-inner"
                        >
                            <Menu className="w-5 h-5 text-indigo-400" />
                        </button>

                        {/* AI Choices (Model Selector) */}
                        <div className="relative">
                            <button
                                onClick={() => setModelDropdownOpen(!isModelDropdownOpen)}
                                className="flex items-center space-x-3 px-3 sm:px-5 py-2.5 bg-white/[0.03] border border-white/10 rounded-2xl hover:bg-white/5 transition-all group min-w-[140px] sm:min-w-[180px]"
                            >
                                <div className={`w-2 h-2 rounded-full animate-pulse ${selectedModel === 'OpenAI' ? 'bg-indigo-500 shadow-[0_0_8px_indigo]' : selectedModel === 'Gemini' ? 'bg-purple-500 shadow-[0_0_8px_purple]' : selectedModel.includes('Claude') ? 'bg-orange-500 shadow-[0_0_8px_orange]' : selectedModel === 'Aegis V1' ? 'bg-blue-500 shadow-[0_0_8px_blue]' : 'bg-emerald-500 shadow-[0_0_8px_emerald]'}`} />
                                <span className="text-xs font-black uppercase tracking-widest text-white/90 truncate">
                                    {models.find(m => m.id === selectedModel)?.name || "Aegis V1"}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isModelDropdownOpen && (
                                <div className="absolute top-[calc(100%+12px)] left-0 w-72 bg-[#0d0d12]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-200 z-50">
                                    {models.map((model) => (
                                        <button
                                            key={model.id}
                                            onClick={() => {
                                                setSelectedModel(model.id);
                                                setModelDropdownOpen(false);
                                            }}
                                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all hover:bg-white/5 group ${selectedModel === model.id ? 'bg-white/[0.03]' : ''}`}
                                        >
                                            <div className="text-left">
                                                <div className={`text-[11px] font-black uppercase tracking-widest ${model.color}`}>{model.name}</div>
                                                <div className="text-[10px] text-neutral-600 font-bold uppercase mt-0.5">{model.sub}</div>
                                            </div>
                                            {selectedModel === model.id && <Sparkles className="w-4 h-4 text-indigo-500" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* User Profile (Right Side) */}
                    <div className="flex items-center space-x-4">
                        {session?.user ? (
                            <div className="relative group">
                                <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center cursor-pointer overflow-hidden shadow-lg hover:shadow-indigo-500/20 transition-all">
                                    {session.user.image ? (
                                        <Image
                                            src={session.user.image}
                                            alt="Profile"
                                            width={40}
                                            height={40}
                                            className="w-full h-full object-cover"
                                            unoptimized // For external Google images
                                        />
                                    ) : (
                                        <span className="text-white font-black text-sm uppercase">
                                            {session.user.name?.charAt(0) || "U"}
                                        </span>
                                    )}
                                </div>
                                <div className="absolute right-0 top-[calc(100%+8px)] w-56 py-2 bg-[#0a0a0e]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                    <div className="px-5 py-3 border-b border-white/5 mb-2 bg-gradient-to-b from-white/[0.02] to-transparent">
                                        <p className="text-sm font-black text-white truncate tracking-tight">{session.user.name}</p>
                                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest truncate mt-0.5">{session.user.email}</p>
                                    </div>
                                    <div className="p-2 space-y-1">
                                        <Link href="/profile" className="flex items-center space-x-3 w-full px-3 py-2.5 text-xs font-bold text-neutral-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                                            <span>Profile Settings</span>
                                        </Link>
                                        <button
                                            onClick={() => signOut({ callbackUrl: '/' })}
                                            className="flex items-center space-x-3 w-full px-3 py-2.5 text-xs font-bold text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                        >
                                            <LogOut className="w-3.5 h-3.5" />
                                            <span>Sign Out</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-2.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-indigo-400 shadow-inner">
                                <Shield className="w-4 h-4" />
                            </div>
                        )}
                    </div>
                </header>

                {/* Chat Area */}
                <div
                    ref={scrollRef}
                    className="flex-grow overflow-y-auto w-full max-w-5xl mx-auto py-8 sm:py-12 px-4 sm:px-8 custom-scrollbar relative z-10"
                >
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto pb-40">
                            <div className="relative mb-12">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-3xl animate-pulse rounded-full" />
                                <div className="relative w-28 h-28 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl border border-white/10">
                                    <Sparkles className="w-14 h-14 text-white" />
                                </div>
                            </div>
                            <h2 className="text-6xl font-black mb-8 tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40"> Aegis Neural Link</h2>
                            <p className="text-neutral-500 text-sm font-black uppercase tracking-[0.3em] mb-16">Active Node: <span className="text-indigo-400 font-black underline underline-offset-4">{models.find(m => m.id === selectedModel)?.name}</span></p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full px-4">
                                {[
                                    { icon: Cpu, text: "Explain quantum encryption", sub: "Neural Audit" },
                                    { icon: Sparkles, text: "Generate a concept art", sub: "Genesis Core" },
                                    { icon: LayoutDashboard, text: "Next.js UI Template", sub: "Dev Ecosystem" },
                                    { icon: Shield, text: "Cyber Defense Strategy", sub: "Compliance" }
                                ].map((hint, i) => (
                                    <button
                                        key={i}
                                        onClick={() => append(hint.text)}
                                        className="group text-left p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:border-indigo-500/50 hover:bg-white/[0.04] transition-all duration-300 shadow-lg"
                                    >
                                        <div className="flex items-center space-x-5">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
                                                <hint.icon className="w-6 h-6 text-indigo-400" />
                                            </div>
                                            <div>
                                                <div className="text-[14px] font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{hint.text}</div>
                                                <div className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-1 opacity-60">{hint.sub}</div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-12 pb-44">
                            {messages.map((m) => (
                                <div key={m.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className={`flex gap-3 sm:gap-6 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xl overflow-hidden
                                            ${m.role === 'user'
                                                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/20'
                                                : 'bg-[#111] border border-white/5 ring-4 ring-indigo-500/5'
                                            }`}>
                                            {m.role === 'user' ? (
                                                <div className="w-full h-full flex items-center justify-center text-white font-black text-lg">
                                                    {session?.user?.name?.[0] || 'U'}
                                                </div>
                                            ) : (
                                                <Bot className="w-6 h-6 text-indigo-400" />
                                            )}
                                        </div>
                                        <div className={`flex flex-col max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            <div className={`text-[10px] font-black uppercase tracking-[0.3em] mb-3 opacity-20 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                                                {m.role === 'user' ? 'Input Stream' : 'Neural Output'}
                                            </div>
                                            <div className={`shadow-2xl ${m.role === 'user'
                                                ? 'bg-neutral-100 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] rounded-tr-none text-black font-semibold shadow-indigo-500/5'
                                                : 'w-full'
                                                }`}>
                                                {m.role === 'user' ? (
                                                    <div className="text-[15px] leading-relaxed">{m.content}</div>
                                                ) : (
                                                    <MarkdownRenderer content={m.content} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-center space-x-3 text-neutral-600 animate-pulse px-2">
                                    <Cpu className="w-4 h-4 animate-spin-slow" />
                                    <span className="text-[11px] font-black uppercase tracking-widest opacity-50">Synthesizing Link...</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 z-30">
                    <div className="max-w-4xl mx-auto relative group">
                        {/* Static Glow */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 blur-2xl rounded-[3rem] opacity-50 group-hover:opacity-100 transition-opacity" />

                        <div className="relative bg-[#0d0d0d]/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-4 shadow-2xl transition-all group-focus-within:border-indigo-500/50 group-focus-within:bg-black group-focus-within:shadow-indigo-500/10">
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                append(input);
                            }} className="flex items-end space-x-3">
                                <textarea
                                    rows={1}
                                    value={input}
                                    onChange={(e) => {
                                        setInput(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = (e.target.scrollHeight) + 'px';
                                    }}
                                    className="flex-grow bg-transparent border-none focus:ring-0 text-[15px] py-4 px-6 placeholder-neutral-700 min-h-[56px] max-h-60 overflow-y-auto resize-none font-bold leading-relaxed selection:bg-indigo-500/30"
                                    placeholder={`Command ${models.find(m => m.id === selectedModel)?.name}...`}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            append(input);
                                        }
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !input?.trim()}
                                    className="w-14 h-14 bg-white text-black rounded-[1.5rem] flex items-center justify-center disabled:opacity-30 transition-all active:scale-90 group shadow-xl hover:bg-neutral-100"
                                >
                                    <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
