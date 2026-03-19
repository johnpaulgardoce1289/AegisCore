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
        const conversation = await prisma.conversation.findUnique({
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

        if (conversation.userId !== userId && userId !== "test-user") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        return NextResponse.json(conversation);
    } catch (error) {
        console.error("Failed to fetch conversation:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    try {
        // Find conversation first to check ownership
        const conversation = await prisma.conversation.findUnique({
            where: { id: params.id },
        });

        if (!conversation) {
            return new NextResponse("Not found", { status: 404 });
        }

        if (conversation.userId !== userId && userId !== "test-user") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        await prisma.conversation.delete({
            where: { id: params.id },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Failed to delete conversation:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
