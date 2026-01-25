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
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CHANNEL_URL = 'https://www.youtube.com/@PikoFG/videos';
const OUTPUT_FILE = join(__dirname, '..', 'src', 'lib', 'data', 'videos.json');

// Helper function to delay execution (replaces deprecated waitForTimeout)
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrollToLoadAllVideos(page) {
  console.log('📜 Scrolling to load all videos...');
  
  let previousHeight = 0;
  let currentHeight = await page.evaluate(() => document.body.scrollHeight);
  let scrollAttempts = 0;
  const maxAttempts = 50; // Prevent infinite scrolling

  while (currentHeight !== previousHeight && scrollAttempts < maxAttempts) {
    previousHeight = currentHeight;
    
    // Scroll to bottom
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Wait for new content to load
    await delay(2000);
    
    // Check new height
    currentHeight = await page.evaluate(() => document.body.scrollHeight);
    scrollAttempts++;
    
    if (scrollAttempts % 5 === 0) {
      console.log(`   Scrolled ${scrollAttempts} times, height: ${currentHeight}px`);
    }
  }
  
  console.log(`✅ Finished scrolling after ${scrollAttempts} attempts`);
}

async function extractVideos(page) {
  console.log('🔍 Extracting video data...');
  
  const videos = await page.evaluate(() => {
    // Try multiple selectors for YouTube's changing structure
    const selectors = [
      'a#video-title-link',
      'a#video-title',
      'a[href*="/watch"]',
      'ytd-rich-grid-media a[href*="/watch"]',
      'ytd-grid-video-renderer a[href*="/watch"]'
    ];
    
    let videoElements = [];
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        videoElements = Array.from(elements);
        break;
      }
    }
    
    const extracted = [];
    
    videoElements.forEach((link) => {
      try {
        const href = link.getAttribute('href');
        if (!href || !href.includes('/watch')) return;
        
        // Extract video ID from URL
        // Format: /watch?v=VIDEO_ID or /shorts/VIDEO_ID
        let videoId = null;
        const watchMatch = href.match(/[?&]v=([^&]+)/);
        const shortsMatch = href.match(/\/shorts\/([^/?]+)/);
        
        if (watchMatch) {
          videoId = watchMatch[1];
        } else if (shortsMatch) {
          videoId = shortsMatch[1];
        }
        
        if (!videoId) return;
        
        // Get title - try multiple methods
        let title = link.textContent?.trim() || 
                   link.getAttribute('title') || 
                   link.getAttribute('aria-label') ||
                   link.querySelector('span')?.textContent?.trim() ||
                   'Untitled';
        
        // Clean up title (remove extra whitespace)
        title = title.replace(/\s+/g, ' ').trim();
        
        // Get thumbnail - always use standard YouTube thumbnail URL
        const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        
        extracted.push({
          id: videoId,
          title: title,
          thumbnail: thumbnail
        });
      } catch (error) {
        console.warn('Error extracting video:', error);
      }
    });
    
    // Remove duplicates based on video ID
    const unique = [];
    const seen = new Set();
    for (const video of extracted) {
      if (!seen.has(video.id)) {
        seen.add(video.id);
        unique.push(video);
      }
    }
    
    return unique;
  });
  
  console.log(`✅ Extracted ${videos.length} videos`);
  return videos;
}

async function syncVideos() {
  console.log('🚀 Starting YouTube video sync...');
  console.log(`📍 Channel: ${CHANNEL_URL}`);
  
  let browser;
  
  try {
    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to channel videos page
    console.log('📺 Navigating to channel videos page...');
    await page.goto(CHANNEL_URL, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    
    // Wait for video grid to load - try multiple selectors
    try {
      await page.waitForSelector('a#video-title-link, a#video-title, a[href*="/watch"]', { timeout: 15000 });
    } catch (e) {
      console.log('⚠️  Primary selector not found, trying alternative...');
      await delay(3000); // Wait a bit more if selector not found
    }
    await delay(2000); // Additional wait for initial render
    
    // Scroll to load all videos
    await scrollToLoadAllVideos(page);
    
    // Extract video data
    const videos = await extractVideos(page);
    
    if (videos.length === 0) {
      console.error('❌ No videos found!');
      process.exit(1);
    }
    
    // Write to JSON file
    console.log(`💾 Writing ${videos.length} videos to ${OUTPUT_FILE}...`);
    const jsonContent = JSON.stringify(videos, null, 2);
    writeFileSync(OUTPUT_FILE, jsonContent, 'utf-8');
    
    console.log('✅ Sync complete!');
    console.log(`   Total videos: ${videos.length}`);
    console.log(`   Output file: ${OUTPUT_FILE}`);
    
  } catch (error) {
    console.error('❌ Error during sync:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the sync
syncVideos().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
