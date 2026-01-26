#!/usr/bin/env node

import https from "node:https";

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_VERCEL_ENV"
];

function fail(msg) {
  console.error("❌ Vercel Deploy Validation Failed:", msg);
  process.exit(1);
}

function checkEnv() {
  const missing = REQUIRED_ENV.filter(key => !process.env[key]);
  if (missing.length) {
    fail(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

function checkStudioHealth(url) {
  return new Promise((resolve, reject) => {
    https.get(url + "/studio", res => {
      if (res.statusCode !== 200) {
        reject(`Studio returned status ${res.statusCode}`);
      }

      let data = "";
      res.on("data", chunk => (data += chunk));
      res.on("end", () => {
        if (data.includes("InvalidStateError") || data.includes("worker")) {
          reject("Studio page contains worker or waveform errors");
        }
        resolve();
      });
    }).on("error", reject);
  });
}

async function main() {
  checkEnv();

  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) fail("NEXT_PUBLIC_SITE_URL is not set");

  console.log("🔍 Validating Studio health at:", url);

  try {
    await checkStudioHealth(url);
    console.log("✅ Vercel deploy validated successfully.");
  } catch (err) {
    fail(err);
  }
}

main();
