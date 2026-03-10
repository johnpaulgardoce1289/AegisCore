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
    ShieldCheck,
    Chrome,
    AlertCircle,
    CheckCircle2
} from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [isStepTwo, setIsStepTwo] = useState(false);
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

            setSuccessMessage("Secure code transmitted to your terminal (Email).");
            setIsStepTwo(true);
        } catch (err: any) {
            setError(err.message || "Uplink Failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        const result = await signIn("credentials", {
            email,
            code,
            redirect: false,
        });

        if (result?.error) {
            setError("Authentication failed: Invalid secure code.");
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
            {/* Background Neural Network Aesthetic */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full animate-pulse delay-700" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150" />
            </div>

            <div className="w-full max-w-md z-10 space-y-8">
                {/* Brand Identity */}
                <div className="text-center space-y-4">
                    <div className="relative inline-block group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2rem] blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                        <div className="relative w-20 h-20 bg-[#0d0d0d] border border-white/10 rounded-[1.75rem] flex items-center justify-center mx-auto shadow-2xl">
                            <Sparkles className="w-10 h-10 text-indigo-500" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase mb-1 bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-400">
                            Aegis Core
                        </h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500">
                            Neural Security Node
                        </p>
                    </div>
                </div>

                {/* Login Card */}
                <div className="bg-[#0c0c0c]/80 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 shadow-3xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-50" />

                    <div className="space-y-6">
                        {/* Error Handling */}
                        {error && (
                            <div className="flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 animate-in fade-in slide-in-from-top-2 duration-300">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-xs font-bold leading-tight uppercase tracking-wide">{error}</p>
                            </div>
                        )}

                        {/* Success Handling */}
                        {successMessage && !error && (
                            <div className="flex items-center space-x-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 animate-in fade-in slide-in-from-top-2 duration-300">
                                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                <p className="text-xs font-bold leading-tight uppercase tracking-wide">{successMessage}</p>
                            </div>
                        )}

                        <form onSubmit={handleVerifyOTP} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Email Terminal Address</label>
                                <div className="relative group/input flex gap-2">
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
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold placeholder-neutral-700 outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSendOTP}
                                        disabled={isLoading || !email}
                                        className="px-4 bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-30 whitespace-nowrap active:scale-95"
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Send Code"}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Secure Protocol Code</label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-neutral-600 transition-colors group-focus-within/input:text-indigo-500">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        required
                                        type="text"
                                        maxLength={6}
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="000000"
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-black tracking-[0.5em] placeholder-neutral-700 outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all text-center"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !code}
                                className="w-full group bg-white text-black hover:bg-neutral-200 disabled:opacity-50 font-black uppercase text-xs tracking-[0.2em] py-5 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-3"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <span>Sign in with Secure Protocol</span>
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/5"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px]">
                                <span className="bg-[#0c0c0c] px-4 text-neutral-700 font-black uppercase tracking-widest">Multi-Provider Auth</span>
                            </div>
                        </div>

                        {/* OAuth Providers */}
                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={handleGoogleSignIn}
                                className="w-full group flex items-center justify-center space-x-4 bg-white/[0.03] hover:bg-white/5 border border-white/10 py-5 rounded-2xl transition-all active:scale-[0.98]"
                            >
                                <Chrome className="w-4 h-4 text-neutral-400 group-hover:text-indigo-400 transition-colors" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-neutral-300">Authorize with Gmail</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="text-center pt-4 space-y-4">
                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest leading-relaxed">
                        By connecting, you authorize <span className="text-indigo-400">Aegis Neural Link</span><br />
                        to verify your digital signature and project access.
                    </p>
                    <div className="flex items-center justify-center space-x-6 text-[10px] font-black uppercase tracking-widest text-neutral-700">
                        <Link href="/" className="hover:text-neutral-400 transition-colors">Safety Systems</Link>
                        <span className="w-1 h-1 bg-neutral-800 rounded-full" />
                        <Link href="/" className="hover:text-neutral-400 transition-colors">Core Protocols</Link>
                    </div>
                </div>
            </div>

            {/* Bottom Accent */}
            <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500/20 via-purple-600/20 to-indigo-500/20 blur-sm" />
        </main>
    );
}
