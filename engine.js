import Replicate from "replicate";
import { writeFile } from "node:fs/promises";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

const input = {
    prompt: [
        "Seamless flat 2D texture map sheet of a 'Lush Earth-like Terran Planet',",
        "cylindrical equirectangular projection, horizontal continent distribution, deep azure blue oceans,",
        "sprawling emerald green jungle landmasses, scattered white atmospheric cloud bands horizontally,",
        "intricate coastlines and topography, tiling horizontally, no dark corners, no sphere shapes,",
        "no space, no horizon, flat 2D surface fill, edge to edge. Do not draw a sphere, do not draw a planet, do not draw a globe, do not draw a ball,",
        "no 3D, no perspective, no depth, no shadows, no lighting, no highlights, no reflections,",
        "no text, no logos, no watermarks, no signatures, no labels, no captions,",
        "no people, no animals, no vehicles, no buildings, no structures,",
        "no fantasy elements, no sci-fi elements, no aliens, no robots,",
        "no abstract art styles, no surrealism, no cubism,",
        "no anime style, no cartoon style, no comic book style.",
        " this will be used to wrap a spherical object and must tile seamlessly horizontally, so avoid any elements that would break the tiling."
    ].join(" "),
    go_fast: true,
    guidance: 3.0,
    megapixels: "1",
    num_outputs: 1,
    aspect_ratio: "1:1", // Critical to prevent centered sphere framing
    output_format: "webp",
    output_quality: 80,
    prompt_strength: 0.8,
    num_inference_steps: 28
};

const output = await replicate.run("black-forest-labs/flux-dev", { input });

// To access the file URL:
console.log(output[0].url()); //=> "http://example.com"

await writeFile("my-image.webp", output[0]);
console.log("Success! Image saved to my-image.webp");