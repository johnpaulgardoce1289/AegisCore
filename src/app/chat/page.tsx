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

// ROBUST CHAT HOOK WITH KILL-SWITCH
function useCustomChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState("Aegis V1");
    const abortControllerRef = useRef<AbortController | null>(null);

    const stop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsLoading(false);
        }
    };

    const append = async (text: string, existingConvId?: string | null) => {
        if (!text.trim() || isLoading) return;

        const controller = new AbortController();
        abortControllerRef.current = controller;

        const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                signal: controller.signal,
                body: JSON.stringify({
                    messages: newMessages.map(m => ({ role: m.role, content: m.content })),
                    conversationId: existingConvId || currentId || null,
                    selectedModel: selectedModel
                }),
            });

            if (!res.ok) {
                if (res.status === 429) {
                     const errorText = await res.text();
                     throw new Error(errorText);
                }
                throw new Error("Neural Link Failed");
            }

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

                // Pure text chunk streaming
                fullContent += chunk;

                setMessages(prev => {
                    const last = prev[prev.length - 1];
                    if (last && last.role === "assistant") {
                        return [...prev.slice(0, -1), { ...last, content: fullContent }];
                    }
                    return prev;
                });
            }
        } catch (err: any) {
            if (err.name === 'AbortError') {
                 console.log("Stream Terminated by Protocol");
            } else {
                 console.error(err);
                 setMessages(prev => [...prev, { id: "err", role: "assistant", content: err.message || "CRITICAL_ERROR: Connection to Aegis Core unstable." } as Message]);
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    const loadConversation = async (id: string) => {
        setIsLoading(true);
        setCurrentId(id);
        setMessages([]);
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
        messages, input, setInput, isLoading, setMessages, append, stop,
        loadConversation, currentId, setCurrentId, selectedModel, setSelectedModel
    };
}

export default function ChatPage() {
    const { data: session } = useSession();
    const {
        messages, input, setInput, isLoading, setMessages, append, stop,
        loadConversation, currentId, setCurrentId, selectedModel, setSelectedModel
    } = useCustomChat();

    const scrollRef = useRef<HTMLDivElement>(null);
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isModelDropdownOpen, setModelDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");

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
                    const unique = Array.isArray(data) ? data.filter((c: any, i: number, a: any[]) => a.findIndex(t => t.id === c.id) === i) : [];
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

    const handleResubmit = async (id: string) => {
        if (!editContent.trim()) return;
        
        const index = messages.findIndex(m => m.id === id);
        if (index === -1) return;

        const truncated = messages.slice(0, index);
        setMessages(truncated);
        setEditingId(null);
        
        await append(editContent);
    };

    // --- NEURAL AURA THEME ENGINE ---
    const getThemeClasses = () => {
        switch (selectedModel) {
            case "OpenAI": return { accent: "indigo-500", glow: "indigo-500/20", text: "text-indigo-400", border: "border-indigo-500/30", bg: "bg-indigo-600", shadow: "shadow-indigo-500/10", orb: "from-indigo-500" };
            case "Gemini": return { accent: "purple-500", glow: "purple-500/20", text: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-600", shadow: "shadow-purple-500/10", orb: "from-purple-500" };
            case "Claude 4.6": 
            case "Claude 4.0": return { accent: "orange-500", glow: "orange-500/20", text: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-600", shadow: "shadow-orange-500/10", orb: "from-orange-500" };
            case "Aegis Image Genesis": return { accent: "emerald-500", glow: "emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-600", shadow: "shadow-emerald-500/10", orb: "from-emerald-500" };
            default: return { accent: "blue-500", glow: "blue-500/20", text: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-600", shadow: "shadow-blue-500/10", orb: "from-blue-500" };
        }
    };
    const theme = getThemeClasses();

    // --- VOICE TRANSCRIPTION ---
    const [isListening, setIsListening] = useState(false);
    const startListening = () => {
        if (!('webkitSpeechRecognition' in window)) return;
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (e: any) => {
            const transcript = e.results[0][0].transcript;
            setInput(prev => prev + (prev ? " " : "") + transcript);
        };
        recognition.onend = () => setIsListening(false);
        recognition.start();
    };

    const models = [
        { id: "Aegis AI 0.1", name: "Aegis AI 0.1", sub: "Super Intelligence Core", color: "text-blue-400" },
        { id: "OpenAI", name: "Open AI (GPT-4o)", sub: "Capable Sub-Node", color: "text-indigo-400" },
        { id: "Gemini", name: "Gemini (1.5 Pro)", sub: "Precision Sub-Node", color: "text-purple-400" },
        { id: "Claude 4.6", name: "Claude 4.6 Sonnet", sub: "Most Intelligent Sub-Node", color: "text-orange-400" },
        { id: "Claude 4.0", name: "Claude 4.0 Sonnet", sub: "Previous Generation", color: "text-yellow-400" },
        { id: "Aegis Image Genesis", name: "Image Generator", sub: "Visual Creation Engine", color: "text-emerald-400" },
    ];

    const deleteConversation = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to terminate this neural record?")) return;

        try {
            const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
            if (res.ok) {
                setConversations(prev => prev.filter(c => c.id !== id));
                if (currentId === id) startNewChat();
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <main className="flex h-screen bg-[#080808] text-neutral-100 overflow-hidden font-sans">
            {/* Sidebar */}
            <div className={`
                fixed lg:relative inset-y-0 left-0 z-50 bg-[#050505] border-r border-white/5 transition-all duration-500 ease-in-out flex flex-col
                ${isSidebarOpen ? 'w-[280px] sm:w-80 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-0 overflow-hidden border-none'}
            `}>
                <div className="p-6 sm:p-8 flex items-center justify-between min-w-[280px] sm:min-w-[320px]">
                    <Link href="/" className="flex items-center space-x-3 group">
                        <div className={`w-10 h-10 bg-gradient-to-tr ${theme.orb} to-white/10 rounded-xl flex items-center justify-center shadow-lg border border-white/10 group-hover:scale-110 transition-transform`}>
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className={`font-black text-lg tracking-tighter uppercase underline decoration-${theme.accent} underline-offset-4 group-hover:opacity-80 transition-all`}>Aegis 0.1</span>
                    </Link>
                    <button onClick={() => setSidebarOpen(false)} className="p-2 text-neutral-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                </div>

                <div className="px-4 sm:px-6 mb-6 min-w-[280px] sm:min-w-[320px]">
                    <button
                        onClick={startNewChat}
                        className={`w-full group flex items-center justify-center space-x-2 p-4 bg-${theme.accent} hover:opacity-90 text-white rounded-[1.25rem] font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 shadow-${theme.accent}/20`}
                    >
                        <Plus className="w-4 h-4" />
                        <span>Establish Stream</span>
                    </button>
                </div>

                {/* Search Sidebar */}
                <div className="px-4 sm:px-6 mb-4 min-w-[280px] sm:min-w-[320px]">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <svg className="w-3.5 h-3.5 text-neutral-600 group-focus-within:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search Neural Records..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3 pl-10 pr-4 text-[11px] font-bold text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-indigo-500/30 focus:bg-white/[0.05] transition-all"
                        />
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto px-2 sm:px-4 custom-scrollbar min-w-[280px] sm:min-w-[320px]">
                    <div className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.3em] mt-6 mb-4 px-4 flex items-center">
                        <History className={`w-3 h-3 mr-3 ${theme.text}`} />
                        Neural Records
                    </div>
                    {/* Neural Records List */}
                    {conversations
                        .filter((conv) => (conv.title || "").toLowerCase().includes(searchTerm.toLowerCase()))
                        .filter((conv, index, self) =>
                            self.findIndex((c) => c.title === conv.title) === index
                        )
                        .map((conv) => (
                            <div key={conv.id} className="relative group/item mb-1 px-2">
                                <button
                                    onClick={() => {
                                        if (currentId === conv.id) return;
                                        loadConversation(conv.id);
                                        if (window.innerWidth < 1024) setSidebarOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-3.5 rounded-2xl text-[13px] font-bold transition-all truncate border flex flex-col space-y-1
                                    ${currentId === conv.id
                                            ? 'bg-indigo-600/10 border-indigo-500/50 text-white shadow-lg'
                                            : 'bg-transparent border-transparent text-neutral-500 hover:bg-white/5 hover:text-neutral-200'}`}
                                >
                                    <span className="truncate pr-8">{conv.title || "Secure Comm..."}</span>
                                    <span className="text-[9px] opacity-40 font-black uppercase tracking-widest leading-none">Record_{conv.id.substring(0, 4)}</span>
                                </button>
                                <button
                                    onClick={(e) => deleteConversation(conv.id, e)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover/item:opacity-100 hover:bg-red-500/10 text-neutral-500 hover:text-red-500 rounded-lg transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    {conversations.length === 0 && (
                        <div className="px-6 py-12 text-center bg-white/[0.02] rounded-3xl border border-dashed border-white/5 mx-4 mt-4">
                             <p className="text-[10px] text-neutral-600 uppercase font-black tracking-widest leading-relaxed">No active links found. <br/> Records purged.</p>
                        </div>
                    )}
                </div>

                {/* Sidebar Footer */}
                <div className="p-4 sm:p-6 border-t border-white/5 bg-black/20 min-w-[280px] sm:min-w-[320px]">
                    {conversations.length > 0 && (
                        <button
                            onClick={async () => {
                                if (confirm("DANGER: This will permanently wipe ALL neural records. Protocol cannot be reversed. Continue?")) {
                                    const res = await fetch("/api/conversations/clear", { method: "DELETE" });
                                    if (res.ok) {
                                        setConversations([]);
                                        startNewChat();
                                    }
                                }
                            }}
                            className="w-full flex items-center justify-center space-x-2 p-3 text-neutral-600 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all font-black uppercase text-[10px] tracking-widest mb-2 border border-transparent hover:border-red-500/20"
                        >
                            <Shield className="w-3.5 h-3.5" />
                            <span>Purge Neural Records</span>
                        </button>
                    )}
                    <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="w-full flex items-center justify-center space-x-2 p-3 text-neutral-600 hover:text-white hover:bg-white/5 rounded-xl transition-all font-black uppercase text-[10px] tracking-widest"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out Protocol</span>
                    </button>
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
                                className={`flex items-center space-x-3 px-3 sm:px-5 py-2.5 bg-white/[0.03] border border-white/10 rounded-2xl hover:bg-white/5 transition-all group min-w-[140px] sm:min-w-[180px]`}
                            >
                                <div className={`w-2 h-2 rounded-full animate-pulse bg-${theme.accent} shadow-[0_0_10px_rgba(0,0,0,0.5)] shadow-${theme.accent}`} />
                                <span className="text-xs font-black uppercase tracking-widest text-white/90 truncate">
                                    {models.find(m => m.id === selectedModel)?.name || "Aegis AI 0.1"}
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
                                <div className={`absolute inset-0 bg-${theme.accent}/20 blur-[120px] animate-pulse rounded-full`} />
                                <div className={`relative w-28 h-28 bg-gradient-to-tr ${theme.orb} to-purple-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl border border-white/10`}>
                                    <Sparkles className="w-14 h-14 text-white" />
                                </div>
                            </div>
                            <h2 className="text-6xl font-black mb-8 tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40"> Aegis Neural Link</h2>
                            <p className="text-neutral-500 text-sm font-black uppercase tracking-[0.3em] mb-16">Active Node: <span className={`${theme.text} font-black underline underline-offset-4`}>{models.find(m => m.id === selectedModel)?.name}</span></p>

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
                                                ? `bg-gradient-to-br ${theme.orb} to-purple-600 border border-white/20`
                                                : `bg-[#111] border border-white/5 ring-4 ring-${theme.accent}/5`
                                            }`}>
                                            {m.role === 'user' ? (
                                                <div className="w-full h-full flex items-center justify-center text-white font-black text-lg">
                                                    {session?.user?.name?.[0] || 'U'}
                                                </div>
                                            ) : (
                                                <Bot className={`w-6 h-6 ${theme.text}`} />
                                            )}
                                        </div>
                                        <div className={`flex flex-col max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            <div className="flex items-center space-x-2 mb-3">
                                                <div className={`text-[10px] font-black uppercase tracking-[0.3em] opacity-20 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                                                    {m.role === 'user' ? 'Input Stream' : 'Neural Output'}
                                                </div>
                                                {m.role === 'user' && editingId !== m.id && (
                                                    <button 
                                                        onClick={() => { setEditingId(m.id); setEditContent(m.content); }}
                                                        className="p-1 opacity-0 group-hover:opacity-100 text-neutral-600 hover:text-indigo-400 transition-all"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                            <div className={`shadow-2xl relative group ${m.role === 'user'
                                                ? 'bg-neutral-100 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] rounded-tr-none text-black font-semibold shadow-indigo-500/5'
                                                : 'w-full'
                                                }`}>
                                                {m.role === 'user' ? (
                                                    editingId === m.id ? (
                                                        <div className="w-full min-w-[300px] flex flex-col space-y-4">
                                                            <textarea
                                                                value={editContent}
                                                                onChange={(e) => setEditContent(e.target.value)}
                                                                className="w-full bg-black/5 border-none focus:ring-0 text-[15px] p-0 resize-none font-semibold"
                                                                rows={3}
                                                                autoFocus
                                                            />
                                                            <div className="flex justify-end space-x-3">
                                                                <button 
                                                                    onClick={() => setEditingId(null)}
                                                                    className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:bg-black/5 rounded-lg transition-all"
                                                                >
                                                                    Abeyance
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleResubmit(m.id)}
                                                                    className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-500 transition-all active:scale-95"
                                                                >
                                                                    Re-Link Pulse
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-[15px] leading-relaxed">{m.content}</div>
                                                    )
                                                ) : (
                                                    <MarkdownRenderer content={m.content} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-center space-x-6 animate-pulse px-2">
                                    <div className="flex items-center space-x-3 text-neutral-600">
                                        <Cpu className="w-4 h-4 animate-spin-slow" />
                                        <span className="text-[11px] font-black uppercase tracking-widest opacity-50">Synthesizing Link...</span>
                                    </div>
                                    <button
                                        onClick={stop}
                                        className="px-4 py-2 bg-red-500/5 border border-red-500/20 rounded-xl text-red-500 text-[9px] font-black uppercase tracking-[0.3em] hover:bg-red-500/10 transition-all flex items-center space-x-2 active:scale-90 shadow-lg shadow-red-500/5 pointer-events-auto"
                                    >
                                        <div className="w-2 h-2 bg-red-500 rounded-sm" />
                                        <span>Terminate Link</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 z-30 pointer-events-none">
                    <div className="max-w-4xl mx-auto relative group pointer-events-auto">
                        {/* Dynamic Background Glow */}
                        <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-indigo-500/10 blur-3xl rounded-[3rem] opacity-40 group-focus-within:opacity-100 transition-opacity duration-700" />
                        
                        <div className="relative bg-[#0d0d0d]/80 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-3 sm:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 group-focus-within:border-indigo-500/30 group-focus-within:bg-black/90 group-focus-within:shadow-[0_20px_80px_rgba(99,102,241,0.15)] ring-1 ring-white/5 group-focus-within:ring-indigo-500/10">
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                append(input);
                            }} className="flex items-end space-x-3">
                                <div className="flex-grow relative">
                                    <textarea
                                        rows={1}
                                        value={input}
                                        onChange={(e) => {
                                            setInput(e.target.value);
                                            e.target.style.height = 'auto';
                                            e.target.style.height = (e.target.scrollHeight) + 'px';
                                        }}
                                        className="w-full bg-transparent border-none focus:ring-0 text-[15px] py-4 px-6 text-neutral-200 placeholder-neutral-700 min-h-[56px] max-h-60 overflow-y-auto resize-none font-medium leading-relaxed selection:bg-indigo-500/30 custom-scrollbar scroll-smooth"
                                        placeholder={`Interrogate ${models.find(m => m.id === selectedModel)?.name}...`}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                append(input);
                                            }
                                        }}
                                    />
                                    <div className="absolute left-6 bottom-[-8px] flex items-center space-x-2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 translate-y-1 group-focus-within:translate-y-0">
                                        <div className="w-1 h-1 rounded-full bg-indigo-500 animate-ping" />
                                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em]">Neural Sync Active</span>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading || !input?.trim()}
                                    className="w-14 h-14 bg-white text-black rounded-[1.75rem] flex items-center justify-center disabled:opacity-20 disabled:scale-95 transition-all active:scale-90 group shadow-2xl hover:bg-indigo-50 hover:shadow-indigo-500/20"
                                >
                                    <Send className="w-6 h-6 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
