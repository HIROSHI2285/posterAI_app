const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

async function testModel(modelName) {
    console.log(`\n--- Testing Model: ${modelName} ---`);

    // 1. Load API Key
    let apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        try {
            const envPath = path.resolve(__dirname, '.env');
            if (fs.existsSync(envPath)) {
                const envContent = fs.readFileSync(envPath, 'utf8');
                const match = envContent.match(/GEMINI_API_KEY=([^\\s]+)/);
                if (match) {
                    apiKey = match[1].replace(/['"]/g, '');
                }
            }
        } catch (e) {
            console.error("Error reading .env", e);
            return;
        }
    }

    if (!apiKey) {
        console.error("No API Key found.");
        return;
    }

    // 2. Initialize SDK
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    // 3. Run Simple Test
    try {
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log(`✅ Success! Response: ${response.text()}`);
    } catch (error) {
        console.error(`❌ Error with ${modelName}:`, error.message);
        if (error.cause) console.error("   Cause:", error.cause);
    }
}

async function runTests() {
    // Test the problematic model
    await testModel('gemini-2.5-pro');

    // Test the proposed fallback
    await testModel('gemini-2.0-flash');

    // Test a known stable legacy model (sanity check)
    await testModel('gemini-1.5-flash');
}

runTests();
