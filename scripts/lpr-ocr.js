#!/usr/bin/env node
/**
 * Dorpwag™ Offline LPR OCR Script
 * ─────────────────────────────────────────────────────────────
 * Reads number plates from images WITHOUT any external API.
 * Uses: sharp (image preprocessing) + tesseract.js (local OCR)
 *
 * Usage:
 *   node scripts/lpr-ocr.js <image_path>
 *   node scripts/lpr-ocr.js --watch <camera_ip> <user> <pass>
 *   node scripts/lpr-ocr.js --test
 *
 * Install deps (once):
 *   npm install tesseract.js sharp
 *
 * No API key. No internet. Runs fully on your Render server or local machine.
 * ─────────────────────────────────────────────────────────────
 */

const path = require('path');
const fs = require('fs');

// ── SA Number Plate Regex Patterns ──────────────────────────
// South African plates: ABC 123 GP / ABC 123 GP / FS 12 34 GP etc.
const SA_PLATE_PATTERNS = [
  /\b[A-Z]{2,3}\s?\d{3}\s?[A-Z]{2}\b/,   // Standard: ABC 123 GP
  /\b[A-Z]{2}\s?\d{2}\s?\d{2}\s?[A-Z]{2}\b/, // FS: FS 12 34 GP
  /\b\d{3}\s?[A-Z]{3}\s?[A-Z]{2}\b/,       // Numeric first
  /\b[A-Z]{3}\d{3}[A-Z]{2}\b/,               // No spaces
];

// ── Clean and normalize raw OCR text to plate format ────────
function extractPlate(rawText) {
  const cleaned = rawText
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  for (const pattern of SA_PLATE_PATTERNS) {
    const match = cleaned.match(pattern);
    if (match) {
      return match[0].replace(/\s+/g, ' ').trim();
    }
  }

  // Fallback: return longest alphanumeric token that looks like a plate
  const tokens = cleaned.split(' ').filter(t => t.length >= 5 && t.length <= 10);
  return tokens[0] ?? null;
}

// ── Preprocess image for better OCR accuracy ────────────────
async function preprocessImage(inputPath) {
  try {
    const sharp = require('sharp');
    const outputPath = inputPath.replace(/\.[^.]+$/, '_processed.png');

    await sharp(inputPath)
      .resize({ width: 800, withoutEnlargement: false })  // Upscale small images
      .greyscale()                                          // Grayscale
      .normalize()                                          // Normalize contrast
      .sharpen({ sigma: 1.5 })                             // Sharpen edges
      .threshold(128)                                       // Binary threshold
      .png()
      .toFile(outputPath);

    return outputPath;
  } catch (e) {
    console.warn('sharp not available, using raw image:', e.message);
    return inputPath;
  }
}

// ── Run Tesseract OCR on image ───────────────────────────────
async function runOCR(imagePath) {
  const { createWorker } = require('tesseract.js');

  const worker = await createWorker('eng', 1, {
    logger: () => {},  // Suppress progress logs
  });

  await worker.setParameters({
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ',
    tessedit_pageseg_mode: '7',  // PSM 7 = single line of text
    tessedit_ocr_engine_mode: '1', // LSTM only
  });

  const { data } = await worker.recognize(imagePath);
  await worker.terminate();

  return { text: data.text, confidence: data.confidence };
}

// ── Main: scan single image ──────────────────────────────────
async function scanImage(imagePath) {
  console.log(`\n📷 Scanning: ${imagePath}`);

  if (!fs.existsSync(imagePath)) {
    console.error('❌ File not found:', imagePath);
    process.exit(1);
  }

  const processed = await preprocessImage(imagePath);
  const { text, confidence } = await runOCR(processed);

  console.log(`📝 Raw OCR: "${text.trim()}"`);
  console.log(`📊 Confidence: ${confidence.toFixed(1)}%`);

  const plate = extractPlate(text);

  if (plate) {
    console.log(`\n✅ PLATE DETECTED: ${plate}`);
    console.log(`   Confidence: ${confidence.toFixed(1)}%`);
  } else {
    console.log('\n⚠️  No valid SA plate pattern found in image');
  }

  // Cleanup processed file
  if (processed !== imagePath && fs.existsSync(processed)) {
    fs.unlinkSync(processed);
  }

  return { plate, confidence, rawText: text.trim() };
}

// ── Watch mode: poll Hikvision camera and OCR snapshots ─────
async function watchCamera(ip, username, password) {
  const { fetchWithDigest } = require('./hikvision-isapi');

  console.log(`\n📷 Watching Hikvision camera at ${ip}...`);
  console.log('Press Ctrl+C to stop.\n');

  const seen = new Set();

  setInterval(async () => {
    try {
      // Grab snapshot from camera
      const snapshotUrl = `http://${ip}/ISAPI/Streaming/channels/101/picture`;
      const result = await fetchWithDigest(snapshotUrl, 'GET', username, password);

      if (result.status === 200 && result.buffer) {
        const tmpPath = `/tmp/dorpwag_snap_${Date.now()}.jpg`;
        fs.writeFileSync(tmpPath, result.buffer);

        const { plate, confidence } = await scanImage(tmpPath);
        fs.unlinkSync(tmpPath);

        if (plate && !seen.has(plate)) {
          seen.add(plate);
          setTimeout(() => seen.delete(plate), 30000); // Debounce 30s

          console.log(`\n🚗 NEW PLATE: ${plate} (${confidence.toFixed(0)}%)`);
          console.log(`   Time: ${new Date().toLocaleTimeString('af-ZA')}`);

          // POST to Dorpwag API
          if (process.env.API_URL && process.env.CAMERA_ID) {
            await fetch(`${process.env.API_URL}/api/lpr/snipr/scan`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.API_TOKEN}` },
              body: JSON.stringify({ plate, imageBase64: null, location: `Camera ${ip}` }),
            }).catch(() => {});
          }
        }
      }
    } catch (e) {
      // Camera offline or error — silent
    }
  }, 3000); // Poll every 3 seconds
}

// ── Test mode ────────────────────────────────────────────────
function runTest() {
  console.log('\n🧪 Testing plate extraction patterns:\n');
  const testCases = [
    { input: 'ABC 123 GP', expected: 'ABC 123 GP' },
    { input: 'abc123gp', expected: 'ABC 123 GP' },
    { input: 'FS 12 34 GP', expected: 'FS 12 34 GP' },
    { input: 'XYZ 456 WC', expected: 'XYZ 456 WC' },
    { input: 'HELLO WORLD', expected: null },
    { input: 'CAR PLATE: ABC 789 NW DETECTED', expected: 'ABC 789 NW' },
  ];

  let passed = 0;
  for (const tc of testCases) {
    const result = extractPlate(tc.input.toUpperCase());
    const ok = result === tc.expected || (result && tc.expected && result.replace(/\s/g,'') === tc.expected.replace(/\s/g,''));
    console.log(`  ${ok ? '✅' : '❌'} "${tc.input}" → ${result ?? 'null'} (expected: ${tc.expected ?? 'null'})`);
    if (ok) passed++;
  }
  console.log(`\n${passed}/${testCases.length} tests passed`);
}

// ── CLI entry point ──────────────────────────────────────────
const args = process.argv.slice(2);

if (args[0] === '--test') {
  runTest();
} else if (args[0] === '--watch') {
  const [, ip, user, pass] = args;
  if (!ip || !user || !pass) {
    console.error('Usage: node lpr-ocr.js --watch <camera_ip> <username> <password>');
    process.exit(1);
  }
  watchCamera(ip, user, pass);
} else if (args[0]) {
  scanImage(args[0]).then(result => {
    process.exit(result.plate ? 0 : 1);
  });
} else {
  console.log(`
Dorpwag™ Offline LPR OCR — No API key required

Usage:
  node scripts/lpr-ocr.js <image.jpg>          Scan single image
  node scripts/lpr-ocr.js --watch <ip> <u> <p> Poll Hikvision camera
  node scripts/lpr-ocr.js --test               Run pattern tests

Environment vars (for --watch mode):
  API_URL      Your Dorpwag API URL
  API_TOKEN    Your auth token
  CAMERA_ID    Camera ID in Dorpwag DB

Install:
  npm install tesseract.js sharp
  `);
}

module.exports = { extractPlate, scanImage, runOCR, preprocessImage };
