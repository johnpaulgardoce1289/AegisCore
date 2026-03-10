"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Shield, Sparkles, ArrowLeft, Crown } from "lucide-react";
import { useSession } from "next-auth/react";
import PaymentModal from "@/components/PaymentModal";

export default function PricingPage() {
    const { data: session } = useSession();
    const [selectedPlan, setSelectedPlan] = useState<{ plan: string, price: string } | null>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (session?.user as any)?.role || "USER";
    const isCreator = userRole === "CREATOR";
    const isPro = userRole === "PRO" || isCreator;

    const plans = [
        {
            name: "Free",
            price: "$0",
            period: "forever",
            desc: "Perfect for testing and standard development.",
            features: ["20 Daily Messages", "Aegis V1 Engine", "Basic Text Uploads", "Standard Response Time"],
            cta: "Active Plan",
            highlight: false,
            roleRequired: "USER"
        },
        {
            name: "Weekly",
            price: "$7",
            period: "per week",
            desc: "Full power for short-term intensive projects.",
            features: ["Unlimited Messages", "DALL-E 3 Image Gen", "Claude 3.5 Sonnet", "Gemini 2.5 Pro", "Priority Speed"],
            cta: "Upgrade Weekly",
            highlight: false,
            roleRequired: "PRO"
        },
        {
            name: "Monthly",
            price: "$20",
            period: "per month",
            desc: "The standard for elite neural interfacing.",
            features: ["Unlimited Messages", "DALL-E 3 Image Gen", "Claude 3.5 Sonnet", "Gemini 2.5 Pro", "Priority Speed", "Early Access"],
            cta: "Upgrade Monthly",
            highlight: true,
            roleRequired: "PRO"
        },
        {
            name: "Yearly",
            price: "$180",
            period: "per year",
            desc: "Ultimate commitment to cognitive defense.",
            features: ["All Pro Features", "2 Months Free", "Dedicated Support", "Custom Model Tuning", "Alpha Features"],
            cta: "Upgrade Yearly",
            highlight: false,
            roleRequired: "PRO"
        }
    ];

    if (isCreator) {
        return (
            <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none" />
                <div className="relative z-10 text-center max-w-2xl">
                    <div className="w-24 h-24 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-500/40 rotate-3">
                        <Crown className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-6xl font-black mb-4 tracking-tighter">Creator Status</h1>
                    <p className="text-xl text-neutral-400 mb-10 leading-relaxed">
                        Welcome, <span className="text-white font-bold">Aegis Founder</span>.
                        Your account has master-level override. You have permanent, unlimited access to all neural systems.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/chat" className="px-10 py-4 rounded-2xl bg-white text-black font-black hover:bg-neutral-200 transition-all flex items-center space-x-2">
                            <Sparkles className="w-5 h-5" />
                            <span>Access Mainframe</span>
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white selection:bg-indigo-500/30 font-sans relative overflow-hidden flex flex-col items-center py-20 px-6">
            <PaymentModal
                isOpen={!!selectedPlan}
                onClose={() => setSelectedPlan(null)}
                plan={selectedPlan?.plan || ""}
                price={selectedPlan?.price || ""}
            />

            <header className="fixed top-0 left-0 w-full p-6 flex justify-between items-center z-50 backdrop-blur-md bg-black/50 border-b border-white/5">
                <Link href="/chat" className="flex items-center space-x-2 text-neutral-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Link>
                <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Aegis Protocol v1.0</span>
                </div>
            </header>

            <div className="text-center mb-20 relative z-10 max-w-3xl mx-auto">
                <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-widest mb-8">
                    <Shield className="w-4 h-4" />
                    <span>Secure Neural Linkage</span>
                </div>
                <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter leading-none">
                    Select your <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Power Level</span>
                </h1>
                <p className="text-lg text-neutral-400 max-w-xl mx-auto leading-relaxed">
                    Flexible plans designed for standard operatives and elite neural architects alike.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1400px] mx-auto relative z-10 w-full">
                {plans.map((plan) => {
                    const isActive = (plan.name === "Free" && !isPro) || (plan.name !== "Free" && isPro);

                    return (
                        <div
                            key={plan.name}
                            className={`group relative bg-[#0a0a0c] border ${plan.highlight ? 'border-indigo-500/50 shadow-2xl shadow-indigo-500/10' : 'border-white/5'} rounded-[32px] p-8 flex flex-col transition-all duration-500 hover:translate-y-[-8px] hover:border-white/20`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-xl font-black text-white mb-2">{plan.name}</h3>
                                <p className="text-neutral-500 text-xs leading-relaxed h-10">{plan.desc}</p>
                                <div className="mt-8 flex items-baseline">
                                    <span className="text-4xl font-black text-white">{plan.price}</span>
                                    <span className="text-neutral-500 text-xs ml-2 font-bold italic">/{plan.name === "Yearly" ? "yr" : plan.name === "Weekly" ? "wk" : "mo"}</span>
                                </div>
                            </div>

                            <ul className="space-y-4 mb-10 flex-grow">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start space-x-3 text-sm text-neutral-300">
                                        <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-indigo-400' : 'text-neutral-600'}`} />
                                        <span className="font-medium">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => plan.name !== "Free" && setSelectedPlan({ plan: plan.name, price: plan.price })}
                                disabled={plan.name === "Free"}
                                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${plan.highlight
                                    ? 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-xl shadow-indigo-500/20'
                                    : plan.name === "Free"
                                        ? 'bg-neutral-900 text-neutral-500 border border-white/5'
                                        : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                                    }`}
                            >
                                {isActive && plan.name === "Free" ? "Current Protocol" : plan.cta}
                            </button>
                        </div>
                    );
                })}
            </div>

            <p className="text-neutral-600 text-[10px] mt-4 font-black uppercase tracking-[0.4em] flex items-center opacity-50">
                <Shield className="w-3 h-3 mr-2 text-emerald-500" /> Neural Shield Active: Anti-Brute Force Protected
            </p>
            <p className="text-[9px] text-neutral-700 mt-2 uppercase tracking-[0.2em]">
                End-to-End Encryption Protocol 0x4F92B
            </p>
        </main>
    );
}
