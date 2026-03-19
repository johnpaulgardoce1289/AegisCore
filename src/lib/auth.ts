import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// ── Neural Shield: Rate Limiting System (Local Memory) ─────────────────────
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;

function isRateLimited(identifier: string): { limited: boolean; timeLeft?: number } {
    const now = Date.now();
    const attempts = loginAttempts.get(identifier);

    if (attempts && attempts.count >= LOCKOUT_THRESHOLD) {
        const timeSinceLast = now - attempts.lastAttempt;
        if (timeSinceLast < LOCKOUT_DURATION) {
            return { limited: true, timeLeft: Math.ceil((LOCKOUT_DURATION - timeSinceLast) / 1000 / 60) };
        } else {
            loginAttempts.delete(identifier);
        }
    }
    return { limited: false };
}

function recordAttempt(identifier: string, success: boolean) {
    if (success) {
        loginAttempts.delete(identifier);
        return;
    }
    const now = Date.now();
    const attempts = loginAttempts.get(identifier) || { count: 0, lastAttempt: now };
    attempts.count += 1;
    attempts.lastAttempt = now;
    loginAttempts.set(identifier, attempts);
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_ID || "x",
            clientSecret: process.env.GOOGLE_SECRET || "x",
            allowDangerousEmailAccountLinking: true,
        }),
        GithubProvider({
            clientId: process.env.GITHUB_ID || "x",
            clientSecret: process.env.GITHUB_SECRET || "x",
            allowDangerousEmailAccountLinking: true,
        }),
        FacebookProvider({
            clientId: process.env.FACEBOOK_ID || "x",
            clientSecret: process.env.FACEBOOK_SECRET || "x",
            allowDangerousEmailAccountLinking: true,
        }),
        CredentialsProvider({
            name: "Secure Protocol",
            credentials: {
                email: { label: "Email", type: "text" },
                code: { label: "Code", type: "text", placeholder: "Secure Code or Password" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email) return null;

                const email = credentials.email.toLowerCase().trim();
                const codeOrPass = credentials.code?.trim() || "";

                const lockout = isRateLimited(email);
                if (lockout.limited) {
                    throw new Error(`LOCKDOWN: Too many failed attempts. Try again in ${lockout.timeLeft} minutes.`);
                }

                // --- 1. SESSION_START: Try Creator Override (Dev Bypass) ---
                const creatorEmail = process.env.CREATOR_EMAIL?.toLowerCase().trim();
                const creatorPass = process.env.CREATOR_PASSWORD?.trim();
                const isCreator = creatorEmail && email === creatorEmail;

                if (isCreator && creatorPass && (codeOrPass === creatorPass || codeOrPass.toLowerCase() === creatorPass.toLowerCase())) {
                    console.log(`[AUTH] Creator Override successful for ${email}`);
                    recordAttempt(email, true);
                    let user = await prisma.user.findUnique({ where: { email } });
                    if (!user) {
                        user = await prisma.user.create({
                            data: { email, name: "Creator", role: "CREATOR" }
                        });
                    }
                    return user;
                }

                // --- 2. SESSION_STEP: Try Stored Password (Traditional Auth) ---
                let user = await prisma.user.findUnique({ where: { email } });
                if (user && user.password && codeOrPass) {
                    const bcrypt = await import("bcryptjs");
                    const isValid = await bcrypt.compare(codeOrPass, user.password);
                    if (isValid) {
                        console.log(`[AUTH] Password verification successful for ${email}`);
                        recordAttempt(email, true);
                        return user;
                    }
                }

                // --- 3. SESSION_FINAL: Try Secure OTP (One-Time Access) ---
                const tokenRecord = await prisma.verificationToken.findFirst({
                    where: { identifier: email, token: codeOrPass }
                });

                if (tokenRecord && tokenRecord.expires > new Date()) {
                    console.log(`[AUTH] Secure OTP verification successful for ${email}`);
                    recordAttempt(email, true);
                    await prisma.verificationToken.deleteMany({ where: { identifier: email } });

                    if (!user) {
                        user = await prisma.user.create({
                            data: { email, name: email.split('@')[0], role: "USER" }
                        });
                    }
                    return user;
                }

                // --- FAILURE_LOG: Record Failed Attempt ---
                console.log(`[AUTH] Authentication failed for ${email}`);
                recordAttempt(email, false);
                return null;
            }
        })
    ],
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as { role?: string }).role || "USER";
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as { id?: string }).id = token.id as string;
                (session.user as { role?: string }).role = token.role as string;
            }
            return session;
        },
    },

    secret: process.env.NEXTAUTH_SECRET || "super_secret_dev_key",
    pages: {
        signIn: "/login",
    },
};
