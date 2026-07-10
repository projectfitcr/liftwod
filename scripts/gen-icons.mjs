// Generate the PWA icon set from the branding lockup (triangle mark +
// wordmark on black). Maskable variants scale to 80% inside a black square
// so launcher masks never clip the mark.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SRC = "/Users/joelkarum/ClaudeCode/LIFTwod/branding/mobilelogo.png";
const APP = "/Users/joelkarum/ClaudeCode/LIFTwod/src/app";
const ICONS = "/Users/joelkarum/ClaudeCode/LIFTwod/public/icons";
mkdirSync(ICONS, { recursive: true });

const plain = (size, out) => sharp(SRC).resize(size, size).png().toFile(out);

const maskable = async (size, out) => {
  const inner = await sharp(SRC).resize(Math.round(size * 0.8)).png().toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: "#0b0b0f" },
  })
    .composite([{ input: inner, gravity: "center" }])
    .png()
    .toFile(out);
};

await plain(512, `${APP}/icon.png`);
await plain(180, `${APP}/apple-icon.png`);
await plain(192, `${ICONS}/icon-192.png`);
await plain(512, `${ICONS}/icon-512.png`);
await maskable(192, `${ICONS}/maskable-192.png`);
await maskable(512, `${ICONS}/maskable-512.png`);
console.log("icons generated");
