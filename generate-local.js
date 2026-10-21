import { createNoise3D } from 'simplex-noise';
import { PNG } from 'pngjs';
import { createWriteStream } from 'fs';

const width = 512;
const height = 512; // 1:1 Square, just like your CSS expects
const png = new PNG({ width, height });
const noise3D = createNoise3D(); // You can pass a seed string here for reproducible planets

console.log("🧮 Calculating procedural noise...");

for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
        // 1. Map 2D pixel coordinates to spherical angles (Latitude from -PI/2 to PI/2)
        const longitude = (x / width) * 2 * Math.PI;
        const latitude = (y / height) * Math.PI - (Math.PI / 2);

        // 2. Convert angles to standard 3D Cartesian coordinates
        const nx = Math.cos(latitude) * Math.cos(longitude);
        const ny = Math.sin(latitude); // True vertical axis
        const nz = Math.cos(latitude) * Math.sin(longitude);

        // 3. Layer the Simplex Noise
        // Multiplying the vertical axis (ny) by a high number forces rapid vertical changes (horizontal bands)
        // Multiplying nx and nz by low numbers keeps the horizontal flow smooth
        let n = noise3D(nx * 2, ny * 15, nz * 2);
        n += 0.5 * noise3D(nx * 4, ny * 30, nz * 4); // Add finer turbulent detail

        // Normalize the noise result to a 0.0 - 1.0 range
        const normalized = (n + 1.5) / 3;

        // 4. Map the math to a Pyrium-style color palette (Coppers, Ambers, Reds)
        let r, g, b;
        if (normalized < 0.4) {
            r = 70; g = 15; b = 15; // Dark shadow copper
        } else if (normalized < 0.6) {
            r = 160; g = 50; b = 20; // Mid-tone burnt sienna
        } else {
            r = 230; g = 150; b = 40; // Bright amber highlights
        }

        // 5. Write the pixel data
        const idx = (width * y + x) << 2;
        png.data[idx] = r;
        png.data[idx + 1] = g;
        png.data[idx + 2] = b;
        png.data[idx + 3] = 255; // Fully opaque
    }
}

// 6. Save the file locally
png.pack().pipe(createWriteStream('local_gas_giant.png'))
    .on('finish', () => console.log('✅ Seamless planet texture generated locally!'));