#!/usr/bin/env node

/**
 * download-fonts.mjs - Download Google Fonts as WOFF2 files for self-hosting
 *
 * Phase 10B: Eliminate build-time external font dependencies
 *
 * Downloads required Google Fonts as WOFF2 files and places them in public/fonts/
 * This allows using next/font/local instead of next/font/google
 */

import { writeFile, mkdir, createWriteStream, unlink } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const FONTS_DIR = join(ROOT_DIR, 'public', 'fonts');

// Font definitions: { family, weights[], style }
const FONTS_TO_DOWNLOAD = [
  { family: 'Permanent Marker', weights: ['400'], style: 'normal' },
  { family: 'Sedgwick Ave', weights: ['400'], style: 'normal' },
  { family: 'Anton', weights: ['400'], style: 'normal' },
  { family: 'Barlow Condensed', weights: ['400', '700'], style: 'normal' },
  { family: 'Inter', weights: ['400', '500', '600', '700', '800', '900'], style: 'normal' },
  { family: 'Lexend', weights: ['400', '500', '600', '700', '800', '900'], style: 'normal' },
];

/**
 * Download a file from URL
 */
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      const fileStream = createWriteStream(filePath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (err) => {
        unlink(filePath, () => {}); // Delete partial file
        reject(err);
      });
    }).on('error', reject);
  });
}

/**
 * Get Google Fonts API URL for a font variant
 */
function getGoogleFontUrl(family, weight, style = 'normal') {
  // Google Fonts API v2
  const familyParam = family.replace(/\s+/g, '+');
  const url = `https://fonts.googleapis.com/css2?family=${familyParam}:wght@${weight}`;
  return url;
}

/**
 * Extract WOFF2 URL from Google Fonts CSS
 */
async function extractWoff2Url(cssUrl) {
  return new Promise((resolve, reject) => {
    // Set user agent that supports WOFF2 to get WOFF2 URLs in CSS
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/css,*/*;q=0.1'
      }
    };

    https.get(cssUrl, options, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        // Google Fonts CSS has multiple @font-face blocks with different formats
        // We need to find the one with format('woff2')
        // Pattern: url(...) format('woff2')
        const woff2Matches = data.matchAll(/url\(([^)]+\.woff2[^)]*)\)\s+format\(['"]woff2['"]\)/gi);
        const matches = Array.from(woff2Matches);

        if (matches.length > 0) {
          // Get the first WOFF2 URL (usually the best quality)
          const url = matches[0][1].replace(/['"]/g, '');
          // Handle relative URLs - make them absolute
          if (url.startsWith('//')) {
            resolve(`https:${url}`);
          } else if (url.startsWith('http')) {
            resolve(url);
          } else {
            // Relative URL, prepend Google Fonts domain
            resolve(`https://fonts.gstatic.com${url}`);
          }
        } else {
          // Fallback: Extract TTF URL and convert to WOFF2
          // Google Fonts serves both formats from similar paths
          const ttfMatch = data.match(/url\(([^)]+\.ttf[^)]*)\)/);
          if (ttfMatch && ttfMatch[1]) {
            let url = ttfMatch[1].replace(/['"]/g, '');
            // Convert TTF URL to WOFF2 URL
            url = url.replace(/\.ttf$/, '.woff2');
            if (url.startsWith('//')) {
              resolve(`https:${url}`);
            } else if (url.startsWith('http')) {
              resolve(url);
            } else {
              resolve(`https://fonts.gstatic.com${url}`);
            }
          } else {
            reject(new Error(`No font URL found in CSS for ${cssUrl}. CSS preview: ${data.substring(0, 500)}`));
          }
        }
      });
    }).on('error', reject);
  });
}

/**
 * Download a single font variant
 */
async function downloadFontVariant(family, weight, style) {
  const cssUrl = getGoogleFontUrl(family, weight, style);
  console.log(`[download-fonts] Fetching CSS for ${family} ${weight}...`);

  try {
    const woff2Url = await extractWoff2Url(cssUrl);
    const fileName = `${family.replace(/\s+/g, '-').toLowerCase()}-${weight}${style !== 'normal' ? `-${style}` : ''}.woff2`;
    const filePath = join(FONTS_DIR, fileName);

    console.log(`[download-fonts] Downloading ${fileName}...`);
    await downloadFile(woff2Url, filePath);
    console.log(`[download-fonts] ✅ Downloaded ${fileName}`);

    return { family, weight, style, fileName, filePath };
  } catch (error) {
    console.error(`[download-fonts] ❌ Failed to download ${family} ${weight}:`, error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function downloadFonts() {
  console.log('[download-fonts] Starting font download...\n');

  // Ensure fonts directory exists
  try {
    await mkdir(FONTS_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist, that's fine
  }

  const downloaded = [];
  const failed = [];

  for (const font of FONTS_TO_DOWNLOAD) {
    for (const weight of font.weights) {
      try {
        const result = await downloadFontVariant(font.family, weight, font.style);
        downloaded.push(result);
      } catch (error) {
        failed.push({ family: font.family, weight, error: error.message });
      }
    }
  }

  console.log('\n[download-fonts] Summary:');
  console.log(`  ✅ Downloaded: ${downloaded.length} font files`);
  if (failed.length > 0) {
    console.log(`  ❌ Failed: ${failed.length} font files`);
    failed.forEach((f) => {
      console.log(`    - ${f.family} ${f.weight}: ${f.error}`);
    });
  }

  if (failed.length === 0) {
    console.log('\n[download-fonts] ✅ All fonts downloaded successfully!');
    console.log(`[download-fonts] Fonts are available at: ${FONTS_DIR}`);
    return true;
  } else {
    console.log('\n[download-fonts] ⚠️  Some fonts failed to download');
    return false;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('download-fonts.mjs')) {
  downloadFonts()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('[download-fonts] ❌ Fatal error:', error);
      process.exit(1);
    });
}

export { downloadFonts };
