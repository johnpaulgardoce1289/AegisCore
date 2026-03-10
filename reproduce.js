const { streamText, convertToModelMessages } = require('ai');
const { google } = require('@ai-sdk/google');
require('dotenv').config();

async function test() {
    const model = google('gemini-1.5-pro');
    const messages = [{ role: 'user', content: 'hello' }];

    try {
        const mappedMessages = await convertToModelMessages(messages);
        const stream = await streamText({
            model,
            messages: mappedMessages,
            system: "You are a test AI"
        });
        for await (const chunk of stream.textStream) {
            process.stdout.write(chunk);
        }
    } catch (err) {
        console.error("AI Streaming failed:", err);
    }
}
test();
