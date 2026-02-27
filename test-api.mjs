import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from "fs";

// Load env
const envFile = readFileSync(".env", "utf-8");
const apiKeyLine = envFile.split("\n").find(line => line.startsWith("GEMINI_API_KEY="));
const apiKey = apiKeyLine.split("=")[1].trim();

const genAI = new GoogleGenerativeAI(apiKey);

async function runTest(modalities, imageConfig) {
    try {
        console.log(`Testing modalities: ${modalities}, config:`, imageConfig);
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-image-preview" });
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: "a simple dog" }] }],
            generationConfig: {
                // @ts-ignore
                responseModalities: modalities,
                ...(imageConfig ? { imageConfig } : {})
            }
        });
        console.log("Success!");
        return true;
    } catch (e) {
        console.error("Failed:", e.message);
        return false;
    }
}

async function main() {
    console.log("Starting test...");
    await runTest(['IMAGE'], { aspectRatio: '3:4' });
    await runTest(['IMAGE', 'TEXT'], { aspectRatio: '3:4' });
    await runTest(['Image', 'Text'], { aspectRatio: '3:4' });
    await runTest(['IMAGE'], { aspectRatio: '3:4', imageSize: '4K' });
    await runTest(['IMAGE'], { aspectRatio: '3:4', outputMimeType: 'image/jpeg' });
}

main();
