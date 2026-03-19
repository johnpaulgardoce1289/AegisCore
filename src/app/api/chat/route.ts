import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id || "guest-user";
    const userEmail = session?.user?.email || "guest@aegis.core";
    const userRole = (session?.user as { role?: string })?.role || "USER";

    const body = await req.json();

    // --- Rate Limit Check (20 msgs/day for FREE accounts) ---------------------
    const isCreator = userRole === "CREATOR" || (userEmail && userEmail === process.env.CREATOR_EMAIL);
    const isExempt = isCreator || userRole === "ADMIN" || userId === "test-user" || userId === "guest-user";


    if (!isExempt) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const count = await prisma.message.count({
            where: {
                conversation: { userId },
                role: "user",
                createdAt: { gte: todayStart },
            },
        });

        if (count >= 20) {
            return new NextResponse(
                "⚠️ Daily message limit reached (20/20). Please upgrade to PREMIUM for unlimited access.",
                { status: 429 }
            );
        }
    }
    // -------------------------------------------------------------------------

    const {
        messages,
        conversationId,
        selectedModel = "Aegis V1",
    } = body;

    if (!messages || messages.length === 0) {
        return new NextResponse("No messages provided", { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];

    // Check if any AI API key is configured
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasGemini = !!(
        process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
    );

    // We no longer return 500 here. We proceed to fallback logic.

    // Save conversation and user message to DB
    let currentConversationId = conversationId;
    if (!currentConversationId && userId !== "test-user") {
        try {
            const titleRaw = lastMessage.content;
            const title =
                typeof titleRaw === "string"
                    ? titleRaw.substring(0, 50)
                    : Array.isArray(titleRaw)
                        ? (
                            (titleRaw as { type: string; text?: string }[]).find((p) => p.type === "text")?.text ??
                            "New Chat"
                        ).substring(0, 50)
                        : "New Chat";

            const conv = await prisma.conversation.create({
                data: { userId, title },
            });
            currentConversationId = conv.id;
        } catch (e) {
            console.error("Conv create:", e);
        }
    }

    if (userId !== "test-user") {
        try {
            await prisma.message.create({
                data: {
                    conversationId: currentConversationId,
                    role: "user",
                    content: typeof lastMessage.content === "string" ? lastMessage.content : JSON.stringify(lastMessage.content),
                },
            });
        } catch (e) {
            console.error("Msg create:", e);
        }
    }

    // Setup fallback chain
    const clientChain: { client: OpenAI; modelId: string; label: string }[] = [];

    const isAegis = selectedModel === "Aegis AI 0.1";

    if (selectedModel.toLowerCase().includes("gemini") || (!hasOpenAI && hasGemini)) {
        // Priority: Gemini
        clientChain.push({
            client: new OpenAI({
                apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY,
                baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
            }),
            modelId: "gemini-1.5-pro",
            label: "Gemini 1.5 Pro"
        });
        if (hasOpenAI) clientChain.push({ client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }), modelId: isAegis ? "gpt-4o" : "gpt-4o-mini", label: isAegis ? "Aegis Core 0.1" : "GPT Fallback" });
    } else {
        // Priority: OpenAI
        clientChain.push({
            client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
            modelId: isAegis ? "gpt-4o" : "gpt-4o-mini",
            label: isAegis ? "Aegis AI 0.1" : "OpenAI GPT"
        });
        if (hasGemini) {
            clientChain.push({
                client: new OpenAI({
                    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY,
                    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
                }),
                modelId: "gemini-1.5-pro",
                label: "Gemini 1.5 Pro (Fallback)"
            });
        }
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            let lastError: unknown = null;
            let fullText = "";

            // --- Special Case: Image Generation -----------------------------
            const isImageGen = selectedModel === "Aegis Image Genesis";
            if (isImageGen) {
                try {
                    const userPrompt = messages[messages.length - 1].content;
                    const promptText = typeof userPrompt === "string" ? userPrompt : "A beautiful cyberpunk city";

                    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
                    const response = await client.images.generate({
                        model: "dall-e-3",
                        prompt: promptText,
                        n: 1,
                        size: "1024x1024",
                    });

                    const url = response.data?.[0]?.url;
                    if (!url) throw new Error("OpenAI did not return an image URL.");

                    const markdown = `#### Generated Image\n\n![Generated Image](${url})\n\n> **Prompt:** ${promptText}`;

                    controller.enqueue(encoder.encode(markdown));
                    fullText = markdown;

                } catch (err: unknown) {
                    const errMsg = err instanceof Error ? err.message : String(err);
                    try {   // Fallback to Pollinations.ai for free image gen!
                        const userPrompt = messages[messages.length - 1].content;
                        const promptText = typeof userPrompt === "string" ? userPrompt : "A beautiful cyberpunk city";
                        const encodedPrompt = encodeURIComponent(promptText);
                        const fallbackUrl = `https://pollinations.ai/p/${encodedPrompt}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000000)}&model=flux`;

                        const msg = `![Aegis Genesis Output (Fallback Engine Active)](${fallbackUrl})\n\n*(Note: Primary OpenAI generation hit a limit or billing issue, using secure backup backup)*`;
                        controller.enqueue(encoder.encode(msg));
                        fullText = msg;
                    } catch {
                        const msg = `⚠️ Image Generation Error: ${errMsg}`;
                        controller.enqueue(encoder.encode(msg));
                        fullText = msg;
                    }
                }
            } else {
                // Try each client in chain (primary then fallback)
                let success = false;

                if (selectedModel.toLowerCase().includes("claude") || selectedModel === "Anthropic") {
                    try {
                        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
                        let claudeModelString = "claude-3-7-sonnet-20250219";
                        if (selectedModel.includes("3.5") || selectedModel.includes("4.0")) {
                            claudeModelString = "claude-3-5-sonnet-20241022";
                        } else if (selectedModel.includes("4.6")) {
                            claudeModelString = "claude-3-7-sonnet-20250219";
                        }

                        const claudeStream = await anthropic.messages.create({
                            model: claudeModelString,
                            max_tokens: 4096,
                            messages: messages.map((m: { role: string; content: string }) => ({
                                role: m.role as "user" | "assistant",
                                content: m.content
                            })),
                            stream: true,
                        });

                        for await (const event of claudeStream) {
                            if (event.type === 'content_block_delta' && 'text' in event.delta) {
                                const text = event.delta.text;
                                controller.enqueue(encoder.encode(text));
                                fullText += text;
                            }
                        }
                        success = true;
                    } catch (err) {
                        console.error("Anthropic Error:", err);
                        lastError = err;
                        // Fallback will happen below if success is still false
                    }
                }

                if (!success) {
                    for (let i = 0; i < clientChain.length; i++) {
                        const { client, modelId, label } = clientChain[i];
                        try {
                            const completion = await client.chat.completions.create({
                                model: modelId,
                                messages: messages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
                                stream: true,
                            });

                            for await (const chunk of completion) {
                                const text = chunk.choices[0]?.delta?.content || "";
                                if (text) {
                                    controller.enqueue(encoder.encode(text));
                                    fullText += text;
                                }
                            }

                            success = true;
                            break; 
                        } catch (err: unknown) {
                            lastError = err;
                            console.warn(`[AI Chain] ${label} failed, trying next...`, err);
                        }
                    }

                    if (!success) {
                        try {
                            const lastMsgText = typeof messages[messages.length - 1].content === "string"
                                ? messages[messages.length - 1].content
                                : "Explain Aegis AI";

                            const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(lastMsgText)}?model=openai&cache=false`);
                            if (response.ok) {
                                let text = await response.text();

                                // NORMALIZE OUTPUT: Handle double-quoted strings, JSON, and stray formatters
                                text = text.trim();
                                
                                // 1. Unquote if the whole string is wrapped in quotes (handles some fallback model quirks)
                                if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
                                    try {
                                        // Use JSON.parse to safely unescape quotes and newlines
                                        text = JSON.parse(text);
                                    } catch {
                                        text = text.substring(1, text.length - 1);
                                    }
                                }
                                
                                // 2. Extract content from JSON-like response if detected
                                if (text.startsWith('{')) {
                                    try {
                                        const parsed = JSON.parse(text);
                                        text = parsed.content || parsed.text || parsed.message || (parsed.choices?.[0]?.message?.content) || text;
                                    } catch {
                                        // Not valid JSON, keep as is
                                    }
                                }

                                const cleanText = text + "\n\n*(Note: Primary AI engines are currently offline/limited. Switched to Aegis Public Core)*";
                                controller.enqueue(encoder.encode(cleanText));
                                fullText = text;
                                success = true;
                            } else {
                                throw new Error("Public engine link unstable");
                            }
                        } catch {
                            const errMsg = lastError instanceof Error ? lastError.message : String(lastError);
                            const msg = `⚠️ Neural Link Error: ${errMsg}. Please check your API keys or quota.`;
                            controller.enqueue(encoder.encode(msg));
                            fullText = msg;
                        }
                    }
                }
            }

            // Save Assistant Message
            if (userId !== "test-user" && fullText) {
                try {
                    await prisma.message.create({
                        data: {
                            conversationId: currentConversationId,
                            role: "assistant",
                            content: fullText,
                        },
                    });
                } catch (e) {
                    console.error("Asst msg save error:", e);
                }
            }

            // --- Smart Title Generation (Only for new conversations) ---
            if (userId !== "test-user" && fullText && messages.length <= 2) {
                try {
                    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
                    const titleGen = await openai.chat.completions.create({
                         model: "gpt-4o-mini",
                         messages: [
                             { role: "system", content: "Generate a 3-5 word catchy title for this chat based on the user's message. Output ONLY the title, no quotes." },
                             { role: "user", content: messages[0].content }
                         ],
                         max_tokens: 20
                    });
                    const smartTitle = titleGen.choices[0]?.message?.content || "Neural Record";
                    await prisma.conversation.update({
                        where: { id: currentConversationId },
                        data: { title: smartTitle }
                    });
                } catch (error) {
                    console.error("Title generation failed:", error);
                }
            }

            controller.close();
        },
    });

    return new NextResponse(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "x-conversation-id": currentConversationId,
        },
    });
}
