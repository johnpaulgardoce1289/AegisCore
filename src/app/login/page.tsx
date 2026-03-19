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
import Link from "next/link";

export default function LoginPage() {
    const { status } = useSession();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [name, setName] = useState(""); // For registration
    const [isRegistering, setIsRegistering] = useState(false);
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

        if (isRegistering) {
            // --- REGISTRATION PROTOCOL ---
            try {
                const res = await fetch("/api/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, password: code }),
                });

                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || "Registration Failed");
                }

                setSuccessMessage("Identity Synthesized. You may now Login.");
                setIsRegistering(false);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        } else {
            // --- LOGIN PROTOCOL ---
            const result = await signIn("credentials", {
                email,
                code, // This is either the OTP code OR the password
                redirect: false,
            });

            if (result?.error) {
                setError("Authentication failed: Invalid credentials or secure code.");
                setIsLoading(false);
            } else {
                router.push("/chat");
            }
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
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full animate-pulse delay-700" />
                <div className="absolute inset-0 bg-[#080808] opacity-10" />
            </div>

            <div className="w-full max-w-md z-10 space-y-8">
                {/* Brand Identity */}
                <div className="text-center space-y-4">
                    <div className="relative inline-block group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-white/20 to-purple-600 rounded-[2rem] blur opacity-40 group-hover:opacity-100 transition duration-1000" />
                        <div className="relative w-24 h-24 bg-[#0d0d0d] border border-white/10 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl transition-transform group-hover:rotate-12">
                            <Sparkles className="w-12 h-12 text-indigo-500" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-5xl font-black tracking-tighter uppercase mb-1 bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-600">
                            Aegis_Node
                        </h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.6em] text-neutral-500 ml-2">
                             Secure Access Terminal
                        </p>
                    </div>
                </div>

                {/* Login Card */}
                <div className="bg-[#0c0c0c]/90 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-3 shadow-3xl relative overflow-hidden ring-1 ring-white/5">
                    
                    {/* Tabs */}
                    <div className="flex p-2 bg-black/40 rounded-[2.5rem] mb-6">
                        <button 
                            onClick={() => { setIsRegistering(false); setError(""); setSuccessMessage(""); }}
                            className={`flex-1 py-3.5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${!isRegistering ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-neutral-500 hover:text-white'}`}
                        >
                            Establish Link
                        </button>
                        <button 
                            onClick={() => { setIsRegistering(true); setError(""); setSuccessMessage(""); }}
                            className={`flex-1 py-3.5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${isRegistering ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-neutral-500 hover:text-white'}`}
                        >
                            New Identity
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Error Handling */}
                        {error && (
                            <div className="flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 animate-in fade-in slide-in-from-top-2 duration-300">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-[10px] font-black leading-tight uppercase tracking-widest">{error}</p>
                            </div>
                        )}

                        {/* Success Handling */}
                        {successMessage && !error && (
                            <div className="flex items-center space-x-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 animate-in fade-in slide-in-from-top-2 duration-300">
                                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                <p className="text-[10px] font-black leading-tight uppercase tracking-widest">{successMessage}</p>
                            </div>
                        )}

                        <form onSubmit={handleAuth} className="space-y-5">
                            {isRegistering && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-left-4 duration-300">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Identity Name</label>
                                    <div className="relative group/input">
                                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-neutral-600 transition-colors group-focus-within/input:text-indigo-500">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <input
                                            required={isRegistering}
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="John Doe"
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold placeholder-neutral-700 outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Email Protocol</label>
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
                                    {!isRegistering && (
                                        <button
                                            type="button"
                                            onClick={handleSendOTP}
                                            disabled={isLoading || !email}
                                            className="px-4 bg-indigo-600 border border-indigo-500/30 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-30 whitespace-nowrap active:scale-95 shadow-lg shadow-indigo-600/20"
                                        >
                                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Get Code"}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">
                                    {isRegistering ? "Secret Neural Signature" : "Secure Code or Password"}
                                </label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-neutral-600 transition-colors group-focus-within/input:text-indigo-500">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        required
                                        type="password"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder={isRegistering ? "Choose Password" : "••••••"}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-black tracking-[0.3em] placeholder-neutral-700 outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !code}
                                className="w-full group bg-white text-black hover:bg-neutral-200 disabled:opacity-50 font-black uppercase text-[11px] tracking-[0.3em] py-5 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-3"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <span>{isRegistering ? 'Register Protocol' : 'Authorize Link'}</span>
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Google Auth */}
                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/5"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px]">
                                <span className="bg-[#0c0c0c] px-4 text-neutral-700 font-black uppercase tracking-[0.4em]">External Nexus</span>
                            </div>
                        </div>

                        <button
                            onClick={handleGoogleSignIn}
                            className="w-full group flex items-center justify-center space-x-4 bg-white/[0.03] hover:bg-white/5 border border-white/10 py-5 rounded-2xl transition-all active:scale-[0.98]"
                        >
                            <Chrome className="w-5 h-5 text-neutral-400 group-hover:text-indigo-400 transition-colors" />
                            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-neutral-300">Authorize via Google</span>
                        </button>
                    </div>
                </div>

                <div className="text-center pt-4">
                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">
                        Handcrafted by <span className="text-indigo-400">@johnpaulgardoce</span>
                    </p>
                </div>
            </div>
        </main>
    );
}
