import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Next.js App Router lazy execution wrapper to prevent Vercel build time crashes
// This forces NextAuth to only initialize when a user actually hits the endpoint.
export async function GET(req: NextRequest, ctx: { params: { nextauth: string[] } }) {
    return NextAuth(authOptions)(req, ctx);
}

export async function POST(req: NextRequest, ctx: { params: { nextauth: string[] } }) {
    return NextAuth(authOptions)(req, ctx);
}
