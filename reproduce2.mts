import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

async function test() {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "AIzaSyCOngSwlyY7iANsfIr7Zi2rzelEF9-bpOc";

    const model = google('gemini-flash-latest');
    const messages = [{ role: 'user', content: 'hello' }] as any;

    try {
        const result = await streamText({
            model,
            messages,
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
