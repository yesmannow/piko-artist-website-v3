#!/usr/bin/env node

/**
 * YouTube Video Sync Script
 * 
 * Scrapes the Piko FG YouTube channel to extract video metadata
 * and updates src/lib/data/videos.json with fresh data.
 * 
 * Usage: npm run sync
 */

import puppeteer from 'puppeteer';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CHANNEL_URL = 'https://www.youtube.com/@PikoFG';
const OUTPUT_FILE = join(__dirname, '..', 'src', 'lib', 'data', 'videos.json');

async function syncPikoVideos() {
  console.log('🚀 Starting Piko FG Video Vault Sync...');
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  try {
    // 1. Navigate to the videos tab
    await page.goto(`${CHANNEL_URL}/videos`, { waitUntil: 'networkidle2' });

    // 2. Auto-scroll to ensure all 28+ videos are loaded in the DOM
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        let distance = 100;
        let timer = setInterval(() => {
          let scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    // 3. Scrape Video Metadata
    const videos = await page.evaluate(() => {
      const items = document.querySelectorAll('#video-title-link');
      return Array.from(items).map(item => {
        const url = new URL(item.href);
        const videoId = url.searchParams.get('v');
        return {
          id: videoId,
          title: item.title || item.innerText,
          // We store the raw high-res thumbnail URL
          thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`
        };
      });
    });

    // 4. Save to Project Data Folder
    const outputDir = dirname(OUTPUT_FILE);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    writeFileSync(OUTPUT_FILE, JSON.stringify(videos, null, 2));
    console.log(`✅ Success! Imported ${videos.length} videos to ${OUTPUT_FILE}`);

  } catch (error) {
    console.error('❌ Sync Failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Target Piko FG Channel
syncPikoVideos();
