import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const conversation = await (prisma as any).conversation.findUnique({
            where: { id: params.id },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        if (!conversation) {
            return new NextResponse("Not found", { status: 404 });
        }

        // Ensure the conversation belongs to the requesting user
        if (conversation.userId !== userId) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        return NextResponse.json(conversation);
    } catch (error) {
        console.error("Failed to fetch conversation:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
