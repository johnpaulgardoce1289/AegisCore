import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const conversations = await (prisma as any).conversation.findMany({
            where: {
                userId: (session.user as { id: string }).id,
            },
            orderBy: {
                updatedAt: "desc",
            },
            take: 20,
        });

        return NextResponse.json(conversations);
    } catch (error) {
        console.error("Failed to fetch conversations:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
