#!/usr/bin/env node
/**
 * Generates PWA icons (192x192 and 512x512).
 * Run: node scripts/generate-pwa-icons.js
 * Uses placeholder API if sharp is not available.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const PUBLIC = path.join(__dirname, '../public');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  const base = 'https://placehold.co';
  try {
    const [icon192, icon512] = await Promise.all([
      fetchUrl(`${base}/192x192/171717/ffffff?text=BB&font=roboto`),
      fetchUrl(`${base}/512x512/171717/ffffff?text=BB&font=roboto`),
    ]);
    fs.writeFileSync(path.join(PUBLIC, 'icon-192.png'), icon192);
    fs.writeFileSync(path.join(PUBLIC, 'icon-512.png'), icon512);
    console.log('Generated icon-192.png and icon-512.png in public/');
  } catch (err) {
    console.error('Failed:', err.message);
    console.log('Fallback: create 192x192 and 512x512 PNGs manually in public/');
    process.exit(1);
  }
}

main();
