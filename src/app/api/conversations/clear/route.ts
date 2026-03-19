import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    try {
        await prisma.conversation.deleteMany({
            where: { userId },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Failed to clear conversations:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
