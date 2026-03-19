import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const { email: rawEmail } = await req.json();
        const email = rawEmail?.toLowerCase().trim();

        // Regex for basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return new NextResponse("Invalid Protocol Address (Email)", { status: 400 });
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

        // Real Email Delivery via Nodemailer
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS, // App Password
            },
        });

        const mailOptions = {
            from: `"Aegis Neural Shield" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: "[AEGIS CORE] Dynamic Authentication Protocol",
            html: `
                <div style="background-color: #080808; color: #ffffff; padding: 40px; font-family: sans-serif; border-radius: 20px;">
                    <h1 style="color: #6366f1; text-transform: uppercase; letter-spacing: 5px; font-size: 24px;">Aegis Secure Protocol</h1>
                    <p style="color: #94a3b8; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Identity Verification Triggered</p>
                    <div style="background-color: #111111; padding: 30px; border: 1px solid #1e1e1e; border-radius: 15px; margin-top: 20px; text-align: center;">
                        <p style="color: #4f46e5; font-size: 12px; font-weight: bold; text-transform: uppercase;">Your 6-Digit Secure Code</p>
                        <h2 style="font-size: 48px; letter-spacing: 15px; margin: 10px 0; color: #ffffff;">${code}</h2>
                    </div>
                    <p style="color: #64748b; font-size: 11px; margin-top: 30px; font-weight: bold;">EXPIRATION: 10 MINUTES</p>
                    <hr style="border: none; border-top: 1px solid #1e1e1e; margin-top: 30px;" />
                    <p style="color: #334155; font-size: 10px;">This is an automated neural transmission. If you did not request this, please ignore.</p>
                </div>
            `,
        };

        // If credentials aren't provided, we still log to console as fallback for development
        if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
            await transporter.sendMail(mailOptions);
            console.log(`[AUTH] Real email dispatched to ${email}`);
        } else {
            console.log(`\n========================================`);
            console.log(`\ud83d\udcde [AEGIS SECURE PROTOCOL]`);
            console.log(`\ud83d\udce7 (NO GMAIL_USER/PASS SET - LOGGING TO CONSOLE)`);
            console.log(`\ud83d\udd12 EMAIL DESTINATION: ${email}`);
            console.log(`\ud83d\udd11 YOUR 6-DIGIT CODE IS: ${code}`);
            console.log(`========================================\n`);
        }

        return NextResponse.json({ success: true, message: "Code generated successfully" });

    } catch (error) {
        console.error("OTP Generation Error:", error);
        return new NextResponse("Failed to generate Secure Code", { status: 500 });
    }
}
