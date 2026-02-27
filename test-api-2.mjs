import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from "fs";

// Load env
const envFile = readFileSync(".env", "utf-8");
const apiKeyLine = envFile.split("\n").find(line => line.startsWith("GEMINI_API_KEY="));
const apiKey = apiKeyLine.split("=")[1].trim();

const genAI = new GoogleGenerativeAI(apiKey);

async function runTest(modelName, reqConfig) {
    try {
        console.log(`Testing model: ${modelName}, config:`, reqConfig);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: "a professional poster with dark theme" }] }],
            generationConfig: reqConfig
        });
        console.log("Success! Finish reason:", result.response.candidates[0].finishReason);
        return true;
    } catch (e) {
        console.error("Failed:", e.message);
        return false;
    }
}

async function main() {
    console.log("Starting test...");

    // Simulate what route.ts is doing exactly
    const imageConfigRoute = { aspectRatio: '3:4', imageSize: '4K' };
    const routeConfig = {
        responseModalities: ['Image', 'Text'],
        imageConfig: imageConfigRoute
    };

    await runTest("gemini-3.1-flash-image-preview", routeConfig);

    // Test what async.ts is doing
    const imageConfigAsync = { aspectRatio: '3:4', imageSize: '4K', seed: 123456, personGeneration: "allow_all" };
    const asyncConfig = {
        responseModalities: ['Image', 'Text'],
        imageConfig: imageConfigAsync
    };

    await runTest("gemini-3.1-flash-image-preview", asyncConfig);
}

main();
