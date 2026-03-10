"use client";

import Link from "next/link";
import { Sparkles, Brain, Cpu, ShieldCheck, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Aegis AI</span>
          </div>
          <div className="flex items-center space-x-6">
            {status === "authenticated" ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/chat"
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm rounded-full hover:shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] transition-all active:scale-95"
                >
                  Enter Workspace
                </Link>
                <div className="relative group">
                  <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center cursor-pointer overflow-hidden">
                    {session?.user?.image ? (
                      <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-sm">
                        {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-[#101010] border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="px-4 py-2 border-b border-white/5 mb-2">
                      <p className="text-sm font-bold text-white truncate">{session?.user?.name}</p>
                      <p className="text-xs text-neutral-400 truncate">{session?.user?.email}</p>
                    </div>
                    <Link href="/profile" className="block px-4 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/5 transition-colors">
                      Profile Settings
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => signIn(undefined, { callbackUrl: '/chat' })}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm rounded-full hover:shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] transition-all active:scale-95"
              >
                Login to Access
              </button>
            )}
          </div>

        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-40 pb-20 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-full mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <Brain className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">The Next Frontier of Open Source AI</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150">
          Intelligence without <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            Boundaries.
          </span>
        </h1>

        <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          Aegis AI brings the power of state-of-the-art open-source neural models to your private infrastructure. Secure, private, and 100% yours.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
          {status === "authenticated" ? (
            <Link
              href="/chat"
              className="group px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-lg tracking-tight rounded-2xl flex items-center transition-all hover:shadow-[0_0_60px_-10px_rgba(99,102,241,0.6)] hover:scale-[1.02] active:scale-[0.98]"
            >
              Launch Neural Link
              <ChevronRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <button
              onClick={() => signIn(undefined, { callbackUrl: '/chat' })}
              className="group px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-lg tracking-tight rounded-2xl flex items-center transition-all hover:shadow-[0_0_60px_-10px_rgba(99,102,241,0.6)] hover:scale-[1.02] active:scale-[0.98]"
            >
              Launch Neural Link
              <ChevronRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          <a
            href="https://github.com"
            target="_blank"
            className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all active:scale-[0.98]"
          >
            View Source on GitHub
          </a>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="relative z-10 py-20 px-6 max-w-7xl mx-auto pb-40">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Cpu,
              title: "Open Source Core",
              desc: "Deploy Llama 3, Mistral, or Gemini models directly on your hardware with seamless integration."
            },
            {
              icon: ShieldCheck,
              title: "Privacy First",
              desc: "Your data never leaves your server. Enterprise-grade encryption at rest and in transit."
            },
            {
              icon: Sparkles,
              title: "Neural Synergy",
              desc: "A custom-fine-tuned interface designed for maximum productivity and creative flow."
            }
          ].map((feature, i) => (
            <div key={i} className="group p-8 bg-white/5 border border-white/10 rounded-3xl hover:border-indigo-500/40 transition-all">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
              <p className="text-neutral-400 leading-relaxed text-sm">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-white/5 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2 opacity-50">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-bold tracking-tighter">AEGIS AI v1.0</span>
          </div>
          <div className="text-neutral-500 text-sm">
            © 2026 Aegis Core Infrastructure. All transmissions encrypted.
          </div>
        </div>
      </footer>
    </main>
  );
}
