import { streamText, convertToModelMessages } from 'ai';
import { google } from '@ai-sdk/google';

async function test() {
    // Inject environment variable explicitly
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "AIzaSyCOngSwlyY7iANsfIr7Zi2rzelEF9-bpOc";

    const model = google('gemini-1.5-pro');
    const messages = [{ role: 'user', content: 'hello' }];

    try {
        const mappedMessages = await convertToModelMessages(messages);
        const result = await streamText({
            model,
            messages: mappedMessages,
            system: "You are a test AI"
        });

        for await (const chunk of result.textStream) {
            process.stdout.write(chunk);
        }
        console.log("\nSuccess");
    } catch (err) {
        console.error("AI Streaming failed:", err);
    }
}
test();
