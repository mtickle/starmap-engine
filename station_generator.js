import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const ai = new GoogleGenAI({});

// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY;
const BUCKET_NAME = 'station-textures';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function generateStationSprite(stationTheme = "military") {
    const prompt = `Symmetrical top-down schematic of a massive sci-fi space station, ${stationTheme} theme, high contrast, isolated on a pitch-black background, cyberpunk greebling, crisp 2D game sprite, 4k resolution. IMPORTANT: Generate exactly one image in a strictly square 1:1 aspect ratio.`;

    console.log(`[*] Triggering AI generation for: ${stationTheme}`);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-image',
            contents: prompt
        });

        const imagePart = response?.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

        if (!imagePart) {
            throw new Error("No image data found in the response.");
        }

        const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');

        const timestamp = Math.floor(Date.now() / 1000);
        // Using .jpg since Gemini image generation outputs jpeg base64
        const fileName = `${stationTheme}_station_${timestamp}.jpg`;

        console.log(`[*] Uploading ${fileName} to Supabase bucket: ${BUCKET_NAME}...`);

        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, imageBuffer, {
                contentType: 'image/jpeg',
                upsert: false
            });

        if (error) {
            console.error(`[!] Upload failed:`, error.message);
        } else {
            console.log(`[+] Upload complete:`, data.path);
        }
    } catch (error) {
        console.error(`[!] Process failed for ${stationTheme}:`, error);
    }
}

async function runGenerator() {
    // Merged your faction themes with Copilot's civilian economy themes
    const themes = [
        "military", "scientific", "biological", "covert", "bureaucratic",
        "industrial", "luxury", "mining", "research", "trade", "transportation", "general"
    ];

    for (const theme of themes) {
        await generateStationSprite(theme);
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

runGenerator();