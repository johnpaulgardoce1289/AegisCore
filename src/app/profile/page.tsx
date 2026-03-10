"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { User, ArrowLeft, Camera, Save, Sparkles, Shield, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
    const { data: session, status, update } = useSession();
    const [name, setName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        if (session?.user?.name) setName(session.user.name);
    }, [session]);


    const handleSave = async (e?: React.FormEvent, imageOverride?: string) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        try {
            const res = await fetch("/api/profile/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    image: imageOverride || session?.user?.image
                })
            });

            if (res.ok) {
                await update({ name, image: imageOverride || session?.user?.image });
                setMessage({ type: "success", text: "Profile updated successfully!" });
            } else {
                const data = await res.json();
                setMessage({ type: "error", text: data.error || "Failed to update profile." });
            }
        } catch {
            setMessage({ type: "error", text: "Network error. Please try again." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith("image/")) {
            setMessage({ type: "error", text: "Please select an image file." });
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setMessage({ type: "error", text: "Image size must be less than 2MB." });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            await handleSave(undefined, base64);
        };
        reader.readAsDataURL(file);
    };

    if (status === "loading") {
        return (
            <main className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </main>
        );
    }

    const initials = (session?.user?.name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

    return (
        <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient */}
            <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-indigo-600/15 blur-[130px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />

            <div className="w-full max-w-lg relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                {/* Back button */}
                <Link href="/chat" className="inline-flex items-center space-x-2 text-neutral-500 hover:text-white transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Chat</span>
                </Link>

                {/* Header */}
                <div className="flex items-center space-x-3 mb-8">
                    <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight">Account Settings</h1>
                        <p className="text-xs text-neutral-500">Manage your Aegis profile</p>
                    </div>
                </div>

                {/* Avatar section */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative group">
                        <input
                            type="file"
                            id="avatar-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-600/20 border-2 border-indigo-500/30 flex items-center justify-center overflow-hidden shadow-2xl shadow-indigo-500/10">
                            {session?.user?.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={session.user.image} alt="Profile" className="w-24 h-24 object-cover" />
                            ) : (
                                <span className="text-2xl font-black text-indigo-300">{initials}</span>
                            )}
                        </div>
                        <label
                            htmlFor="avatar-upload"
                            className="absolute -bottom-1 -right-1 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-indigo-400 transition-colors border-2 border-[#050505]"
                        >
                            <Camera className="w-4 h-4 text-white" />
                        </label>
                        <label
                            htmlFor="avatar-upload"
                            className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                        >
                            <Camera className="w-6 h-6 text-white" />
                        </label>
                    </div>
                    <p className="mt-3 text-xs text-neutral-600">Click the camera icon to update your photo</p>
                </div>

                {/* Form card */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
                    {message && (
                        <div className={`mb-5 flex items-center space-x-2 p-3 rounded-xl text-sm font-semibold animate-in fade-in ${message.type === "success"
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                            : "bg-red-500/10 border border-red-500/20 text-red-400"
                            }`}>
                            {message.type === "success"
                                ? <CheckCircle className="w-4 h-4 shrink-0" />
                                : <XCircle className="w-4 h-4 shrink-0" />
                            }
                            <span>{message.text}</span>
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-5">
                        {/* Display name */}
                        <div>
                            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Display Name</label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your name"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Email (read-only) */}
                        <div>
                            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Email Address</label>
                            <div className="relative">
                                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                <input
                                    type="email"
                                    value={session?.user?.email || ""}
                                    disabled
                                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-neutral-500 cursor-not-allowed"
                                />
                            </div>
                            <p className="mt-1.5 text-[10px] text-neutral-600 ml-1">Email cannot be changed once set.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving || !name.trim()}
                            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                        >
                            <Save className="w-4 h-4" />
                            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                        </button>
                    </form>
                </div>

                {/* Password reset removed for Free Open source mode */}


                <p className="mt-6 text-center text-[10px] text-neutral-700">
                    Aegis AI — All data is encrypted end-to-end.
                </p>
            </div>
        </main>
    );
}
