"use client";

import { useState } from "react";
import { X, CheckCircle2, ShieldCheck, Copy, Check } from "lucide-react";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: string;
    price: string;
}

export default function PaymentModal({ isOpen, onClose, plan, price }: PaymentModalProps) {
    const [copied, setCopied] = useState(false);
    const cardNum = "4601 8600 0516 4621";

    const copyToClipboard = () => {
        navigator.clipboard.writeText(cardNum.replace(/\s/g, ""));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            />

            <div className="relative w-full max-w-lg bg-[#0d0d12] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-8 pt-8 pb-4 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Complete Upgrade</h2>
                        <p className="text-neutral-500 text-sm mt-1">
                            Plan: <span className="text-indigo-400 font-bold">{plan}</span> • {price}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/5 text-neutral-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-8 pb-10">
                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-5 mb-6">
                        <div className="flex items-center space-x-3 text-indigo-400 mb-3">
                            <ShieldCheck className="w-5 h-5" />
                            <span className="text-xs font-black uppercase tracking-widest">Manual Verification Protocol</span>
                        </div>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                            To maintain maximum security and avoid middle-man fees, Aegis Core uses direct peer-to-peer transfers. Your upgrade will be activated within 5-15 minutes of verification.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Step 1: Payment Details */}
                        <div>
                            <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-3 ml-1">
                                Transfer to Creator Account
                            </label>

                            <div className="space-y-3">
                                <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-xs">
                                            BANK
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white">Direct Bank Transfer</p>
                                            <p className="text-[10px] text-neutral-500">Universal / Digital Bank</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={copyToClipboard}
                                        className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all text-[10px] font-bold"
                                    >
                                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        <span>{cardNum}</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center space-x-3 opacity-60">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-[10px]">
                                            GC
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-white">GCash</p>
                                            <p className="text-[9px] text-neutral-500">Send to Card</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center space-x-3 opacity-60">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-[10px]">
                                            MY
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-white">Maya</p>
                                            <p className="text-[9px] text-neutral-500">Send to Card</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Next Steps */}
                        <div className="pt-2">
                            <button
                                onClick={onClose}
                                className="w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-sm transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center space-x-2"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>I&apos;ve Made the Payment</span>
                            </button>
                            <p className="text-[10px] text-neutral-600 text-center mt-4 uppercase tracking-widest font-bold">
                                Support ID: {Math.random().toString(36).substring(7).toUpperCase()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
