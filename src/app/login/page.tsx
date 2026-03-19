"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    Sparkles,
    Mail,
    Lock,
    ArrowRight,
    Loader2,
    Chrome,
    AlertCircle,
    CheckCircle2
} from "lucide-react";

export default function LoginPage() {
    const { status } = useSession();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        if (status === "authenticated") {
            router.push("/chat");
        }
    }, [status, router]);

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Neural Pulse Failed");
            }

            setSuccessMessage("Secure code transmitted to your terminal Address.");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Uplink Failed";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        const result = await signIn("credentials", {
            email,
            code,
            redirect: false,
        });

        if (result?.error) {
            setError("Authentication failed: Invalid credentials or secure code.");
            setIsLoading(false);
        } else {
            router.push("/chat");
        }
    };

    const handleGoogleSignIn = () => {
        signIn("google", { callbackUrl: "/chat" });
    };

    if (status === "loading") {
        return (
            <div className="h-screen bg-[#080808] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#080808] text-neutral-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Aesthetic */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/5 blur-[150px] rounded-full" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/5 blur-[150px] rounded-full" />
            </div>

            <div className="w-full max-w-md z-10 space-y-12">
                {/* Brand Identity */}
                <div className="text-center space-y-6">
                    <div className="relative inline-block group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-white/10 to-purple-600 rounded-3xl blur opacity-20 group-hover:opacity-100 transition duration-1000" />
                        <div className="relative w-20 h-20 bg-[#0d0d0d] border border-white/10 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                            <Sparkles className="w-10 h-10 text-indigo-400/80" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-5xl font-black tracking-[0.25em] uppercase text-white/90">
                            Aegis Core
                        </h1>
                        <p className="text-[11px] font-black uppercase tracking-[0.6em] text-neutral-600">
                             Neural Security Node
                        </p>
                    </div>
                </div>

                {/* Login Card */}
                <div className="bg-[#111111]/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-1 shadow-3xl relative overflow-hidden ring-1 ring-white/5">
                    <div className="p-8 sm:p-12 space-y-10">
                        {/* Error Handling */}
                        {error && (
                            <div className="flex items-center space-x-3 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-red-500/80 animate-in fade-in slide-in-from-top-2 duration-300">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
                            </div>
                        )}

                        {/* Success Handling */}
                        {successMessage && !error && (
                            <div className="flex items-center space-x-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-emerald-400/80 animate-in fade-in slide-in-from-top-2 duration-300">
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                <p className="text-[10px] font-black uppercase tracking-widest">{successMessage}</p>
                            </div>
                        )}

                        <form onSubmit={handleAuth} className="space-y-8">
                            {/* Email Input Group */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 ml-1">Email Terminal Address</label>
                                <div className="flex flex-col sm:flex-row gap-3 relative group/input">
                                    <div className="relative flex-grow">
                                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-neutral-600 transition-colors group-focus-within/input:text-indigo-500">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <input
                                            required
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="youremail@proton.me"
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-5 pl-12 pr-4 text-[13px] font-bold text-neutral-200 placeholder-neutral-800 outline-none focus:border-white/10 focus:bg-white/[0.05] transition-all"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSendOTP}
                                        disabled={isLoading || !email}
                                        className="sm:w-32 py-5 bg-[#1a1a1a] border border-white/5 text-neutral-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white hover:bg-[#222] transition-all disabled:opacity-20 active:scale-95 shadow-xl whitespace-nowrap"
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Send Code"}
                                    </button>
                                </div>
                            </div>

                            {/* Code Input Group */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 ml-1">Secure Protocol Code</label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-neutral-600 transition-colors group-focus-within/input:text-indigo-500">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        required
                                        type="password"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="0 0 0 0 0 0"
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-5 pl-12 pr-4 text-[13px] font-black tracking-[0.4em] text-neutral-200 placeholder-neutral-800 outline-none focus:border-white/10 focus:bg-white/[0.05] transition-all"
                                    />
                                </div>
                            </div>

                            {/* Main Button */}
                            <button
                                type="submit"
                                disabled={isLoading || !code}
                                className="w-full group bg-neutral-100/10 hover:bg-neutral-100/15 border border-white/10 text-white font-black uppercase text-[11px] sm:text-[12px] tracking-[0.2em] py-6 sm:py-7 rounded-2xl shadow-3xl transition-all active:scale-[0.98] flex items-center justify-center space-x-3"
                            >
                                <span className="truncate">Sign In With Secure Protocol</span>
                                <ArrowRight className="w-4 h-4 opacity-50 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>

                        {/* Separator */}
                        <div className="relative pt-4 pb-2">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/5"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px]">
                                <span className="bg-[#0c0c0c]/80 backdrop-blur-xl px-4 text-neutral-700 font-bold uppercase tracking-[0.5em]">Multi-Provider Auth</span>
                            </div>
                        </div>

                        {/* Google Auth Button */}
                        <button
                            onClick={handleGoogleSignIn}
                            className="w-full group flex items-center justify-center space-x-4 bg-transparent hover:bg-white/[0.02] border border-white/5 py-5 rounded-[1.25rem] transition-all active:scale-[0.98]"
                        >
                            <Chrome className="w-4 h-4 text-neutral-600 group-hover:text-white transition-colors" />
                            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-neutral-500 group-hover:text-white">Authorize with Gmail</span>
                        </button>
                    </div>
                </div>

                {/* Footer Disclaimer */}
                <div className="text-center px-4">
                    <p className="text-[9px] font-medium text-neutral-600 uppercase tracking-[0.2em] leading-relaxed max-w-xs mx-auto">
                        By connecting, you authorize <span className="text-neutral-400">Aegis Neural Link</span> to verify your digital signature and project access.
                    </p>
                    <div className="mt-6 flex items-center justify-center space-x-4 text-[9px] font-black uppercase tracking-[0.3em] text-neutral-700">
                        <span>Safety Systems</span>
                        <div className="w-1 h-1 rounded-full bg-neutral-800" />
                        <span>Core Protocols</span>
                    </div>
                </div>
            </div>
        </main>
    );
}

