import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { writeFile, mkdir } from 'node:fs/promises';
import 'dotenv/config';

const PLANET_PROMPTS = {
    "Rocky": "Seamless flat 2D texture map sheet of a rocky planet, cylindrical equirectangular projection, gray slate and dusty plains, heavy impact craters, jagged tectonic ridges, tiling horizontally, flat 2D surface fill, edge to edge, no 3d sphere, no space",
    "Gas Giant": "Seamless flat 2D texture map sheet of a Gas Giant, cylindrical equirectangular projection, horizontal flowing storm bands, heavy fluid atmospheric marbled look in orange and pale tan, tiling horizontally, flat 2D surface fill, edge to edge, no 3d sphere, no space",
    "Ice World": "Seamless flat 2D texture map sheet of a frozen ice planet, cylindrical equirectangular projection, deep blue glacial ice, jagged white frost fissures, smooth snow swept plains, tiling horizontally, flat 2D surface fill, edge to edge, no 3d sphere, no space",
    "Exotic": "Seamless flat 2D texture map sheet of an alien exotic planet, cylindrical equirectangular projection, magenta and glowing pink bioluminescent flora, weird teal terrain, tiling horizontally, flat 2D surface fill, edge to edge, no 3d sphere, no space",
    "Oceanic": "Seamless flat 2D texture map sheet of a deep ocean planet, cylindrical equirectangular projection, massive deep azure water currents, scattered tiny shallow cyan atolls, no large landmasses, tiling horizontally, flat 2D surface fill, edge to edge, no 3d sphere",
    "Volcanic": "Seamless flat 2D texture map sheet of a volcanic magma planet, cylindrical equirectangular projection, jagged black obsidian crust, glowing bright orange magma rivers, dark basalt, tiling horizontally, flat 2D surface fill, edge to edge, no 3d sphere",
    "Barren": "Seamless flat 2D texture map sheet of a dead barren planet, cylindrical equirectangular projection, pale ash, charcoal dust, lifeless gray flat terrain, tiling horizontally, flat 2D surface fill, edge to edge, no 3d sphere",
    "Crystaline": "Seamless flat 2D texture map sheet of a crystalline planet, cylindrical equirectangular projection, massive jagged purple and violet crystal formations, refractive geometric surfaces protruding from dark rock, tiling horizontally, flat 2D surface fill, edge to edge, no 3d sphere",
    "Radiated": "Seamless flat 2D texture map sheet of a radiated wasteland planet, cylindrical equirectangular projection, sickly glowing pink and pale green toxic terrain, porous irradiated rock, tiling horizontally, flat 2D surface fill, edge to edge, no 3d sphere",
    "Artificial": "Seamless flat 2D texture map sheet of an artificial megastructure planet, cylindrical equirectangular projection, sci-fi metallic paneling, glowing yellow circuitry trench lines, mechanical surface, tiling horizontally, flat 2D surface fill, edge to edge, no 3d sphere",
    "Tropical": "Seamless flat 2D texture map sheet of a lush tropical planet, cylindrical equirectangular projection, emerald green jungles, intricate coastlines, shallow turquoise waters, tiling horizontally, flat 2D surface fill, edge to edge, no 3d sphere",
    "Metallic": "Seamless flat 2D texture map sheet of a metallic planet, cylindrical equirectangular projection, polished gunmetal plains, rusted iron plates, smooth reflective gray alloy terrain, tiling horizontally, flat 2D surface fill, edge to edge, no 3d sphere",
    "Savanna": "Seamless flat 2D texture map sheet of a dry savanna planet, cylindrical equirectangular projection, golden yellow grass plains, dusty brown earth, scattered green vegetation patches, tiling horizontally, flat 2D surface fill, edge to edge, no 3d sphere",
    "Arid": "Seamless flat 2D texture map sheet of an arid planet, cylindrical equirectangular projection, dry cracked orange earth, sprawling canyon networks, dusty plateaus, tiling horizontally, flat 2D surface fill, edge to edge, no 3d sphere",
    "Desert": "Seamless flat 2D texture map sheet of a desert planet, cylindrical equirectangular projection, massive sweeping golden yellow sand dunes, wind swept Sahara terrain, tiling horizontally, flat 2D surface fill, edge to edge, no 3d sphere",
    "Carbonaceous": "Seamless flat 2D texture map sheet of a carbonaceous planet, cylindrical equirectangular projection, pitch black coal rock, porous dark gray terrain, deep charcoal fissures, tiling horizontally, flat 2D surface fill, edge to edge, no 3d sphere",
    "Storm Giant": "Seamless flat 2D texture map sheet of a violent Storm Giant, cylindrical equirectangular projection, swirling violent blue and cyan hurricane bands, massive storm eyes, deep navy blue atmospheric gas, tiling horizontally, flat 2D surface fill, edge to edge, no 3d sphere"
};

const ai = new GoogleGenAI({});

// Supabase Setup
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Retry Wrapper
async function generateWithRetry(requestAction, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await requestAction();
        } catch (error) {
            if (attempt === maxRetries) throw error;
            const waitTimeMs = 5000 * attempt;
            console.warn(`⚠️ API hiccup. Retrying in ${waitTimeMs / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, waitTimeMs));
        }
    }
}

async function runTextureJob(jobType) {
    // FIX 1: Referenced the correct dictionary
    const prompt = PLANET_PROMPTS[jobType];
    if (!prompt) {
        console.error(`❌ Invalid job type: ${jobType}`);
        return;
    }

    console.log(`🤖 Prompting Gemini for a ${jobType} texture...`);

    try {
        const response = await generateWithRetry(() =>
            ai.models.generateContent({
                model: 'gemini-3.1-flash-image',
                contents: prompt + " IMPORTANT: Generate exactly one image in a strictly square 1:1 aspect ratio."
            })
        );

        const imagePart = response?.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

        if (!imagePart) {
            console.error("Raw Response Dump:", JSON.stringify(response, null, 2));
            throw new Error("No image data found in the response parts array.");
        }

        const base64Data = imagePart.inlineData.data;
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // FIX 2: Sanitize file name and set target directory
        const safeName = jobType.toLowerCase().replace(/\s+/g, '_');
        const dirPath = './public/textures';
        const fileName = `${dirPath}/${safeName}_${Date.now()}.jpg`;

        // FIX 3: Ensure the directory exists before saving
        await mkdir(dirPath, { recursive: true });

        await writeFile(fileName, imageBuffer);
        console.log(`✅ Saved locally as ${fileName}`);

        // ☁️ Uploading to Supabase Storage (Commented out for local workflow)
        // console.log(`☁️ Uploading to Supabase Storage...`);
        // const { data, error } = await supabase.storage
        //     .from('planet-textures')
        //     .upload(`generated/${fileName.split('/').pop()}`, imageBuffer, {
        //         contentType: 'image/jpeg',
        //         upsert: true
        //     });

        // if (error) throw new Error(`Supabase Upload Failed: ${error.message}`);
        // console.log(`🎉 Success! Uploaded to Supabase at path: ${data.path}\n`);

    } catch (error) {
        console.error("❌ ERROR generating texture:", error);
    }
}

// Execution block
const args = process.argv.slice(2);
const requestedType = args.join(" ");

if (PLANET_PROMPTS[requestedType]) {
    runTextureJob(requestedType);
} else if (requestedType === "ALL") {
    (async () => {
        for (const type of Object.keys(PLANET_PROMPTS)) {
            await runTextureJob(type);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    })();
} else {
    console.log("❌ Please provide a valid planet type. Example: node content.js Gas Giant");
    console.log("Available types:", Object.keys(PLANET_PROMPTS).join(", "));
}