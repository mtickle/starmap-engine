import 'dotenv/config';

async function checkAvailableModels() {
    const API_KEY = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    console.log("🔍 Fetching authorized models for your API key...");

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

        const data = await res.json();

        // Filter for models associated with image generation
        const imageModels = data.models.filter(m =>
            m.name.includes("image") ||
            m.name.includes("imagen") ||
            (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("predict")) ||
            (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateImages"))
        );

        console.log("\n📸 AUTHORIZED IMAGE MODELS:\n");
        imageModels.forEach(m => {
            console.log(`- Model Name: ${m.name.replace('models/', '')}`);
            console.log(`  Supported Methods: ${m.supportedGenerationMethods?.join(", ")}`);
            console.log("-----------------------------------------");
        });

    } catch (err) {
        console.error("❌ Error fetching models:", err);
    }
}

checkAvailableModels();