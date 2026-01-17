import { MetadataRoute } from "next";

// Mirrors the existing public/manifest.json for PWA metadata
const manifest: MetadataRoute.Manifest = {
  name: "Piko Artist",
  short_name: "Piko",
  start_url: "/",
  display: "standalone",
  background_color: "#000000",
  theme_color: "#000000",
  orientation: "portrait",
  icons: [
    {
      src: "/icons/icon-192x192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: "/icons/icon-256x256.png",
      sizes: "256x256",
      type: "image/png",
    },
    {
      src: "/icons/icon-384x384.png",
      sizes: "384x384",
      type: "image/png",
    },
    {
      src: "/icons/icon-512x512.png",
      sizes: "512x512",
      type: "image/png",
    },
    // Safari mask/fallbacks can be added here if needed
  ],
};

export default function manifestFn(): MetadataRoute.Manifest {
  return manifest;
}
