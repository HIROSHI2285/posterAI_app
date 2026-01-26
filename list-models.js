const fs = require('fs');
const path = require('path');

async function listModels() {
    let apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        // Try reading .env manually
        try {
            const envPath = path.resolve(__dirname, '.env');
            if (fs.existsSync(envPath)) {
                const envContent = fs.readFileSync(envPath, 'utf8');
                const match = envContent.match(/GEMINI_API_KEY=([^\s]+)/);
                if (match) {
                    apiKey = match[1];
                    apiKey = apiKey.replace(/^['"]|['"]$/g, '');
                }
            }
        } catch (e) {
            console.error("Error reading .env", e);
        }
    }

    if (!apiKey) {
        console.warn("GEMINI_API_KEY not found. Trying process.env...");
        // If running in some environments, it might be already set.
    }

    if (!apiKey) {
        console.error("No API Key found.");
        process.exit(1);
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("Difference check: Gemini models only");
            data.models.forEach(m => {
                if (m.name.includes("gemini")) {
                    console.log(`- ${m.name}`);
                    // console.log(`  Display: ${m.displayName}`);
                }
            });
        } else {
            console.log("No models found or error:", JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
