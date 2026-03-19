import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
        const { name, email: rawEmail, password } = await req.json();
        const email = rawEmail?.toLowerCase().trim();

        if (!email || !password) {
            return new NextResponse("Email and Password required", { status: 400 });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return new NextResponse("Protocol Error: Identity already synchronized with this email.", { status: 400 });
        }

        // Hash the password (Neural Signature Encryption)
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create the new user
        const user = await prisma.user.create({
            data: {
                name: name || email.split('@')[0],
                email,
                password: hashedPassword,
                role: "USER"
            }
        });

        return NextResponse.json({
            success: true,
            user: { id: user.id, email: user.email, name: user.name }
        });

    } catch (error: unknown) {
        console.error("Registration Error:", error);
        return new NextResponse("Neural Uplink Failure", { status: 500 });
    }
}
