import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const { email: rawEmail } = await req.json();
        const email = rawEmail?.toLowerCase().trim();

        if (!email) {
            return new NextResponse("Email required", { status: 400 });
        }

        // Generate a 6-digit random code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Expires in 10 minutes
        const expires = new Date(Date.now() + 10 * 60 * 1000);

        // Delete any existing tokens for this exact email to keep the database clean
        await prisma.verificationToken.deleteMany({
            where: { identifier: email }
        });

        // Save the new OTP code to the database
        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token: code,
                expires
            }
        });

        // This simulates sending the email out! Right now it will print beautifully in your terminal.
        console.log(`\n========================================`);
        console.log(`\ud83d\udcde [AEGIS SECURE PROTOCOL]`);
        console.log(`\ud83d\udd12 EMAIL DESTINATION: ${email}`);
        console.log(`\ud83d\udd11 YOUR 6-DIGIT CODE IS: ${code}`);
        console.log(`========================================\n`);

        return NextResponse.json({ success: true, message: "Code generated successfully" });

    } catch (error) {
        console.error("OTP Generation Error:", error);
        return new NextResponse("Failed to generate Secure Code", { status: 500 });
    }
}
