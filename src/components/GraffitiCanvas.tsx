"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Download, Trash2 } from "lucide-react";

const COLORS = [
  { name: "Neon Green", value: "hsl(var(--neon-green))" },
  { name: "Neon Pink", value: "hsl(var(--neon-pink))" },
  { name: "Neon Cyan", value: "hsl(var(--neon-cyan))" },
  { name: "White", value: "#ffffff" },
];

const STORAGE_KEY = "graffiti_tags";

interface SavedTag {
  id: string;
  dataURL: string;
  timestamp: number;
}

interface Point {
  x: number;
  y: number;
}

export function GraffitiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPointRef = useRef<Point | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
  const [savedTags, setSavedTags] = useState<SavedTag[]>([]);
  const [brushSize, setBrushSize] = useState(20);

  // Load saved tags from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSavedTags(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved tags:", e);
      }
    }
  }, []);

  // Get canvas context
  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d", { willReadFrequently: true });
  }, []);

  // Get canvas coordinates from mouse event
  const getCanvasCoordinates = useCallback((e: React.MouseEvent<HTMLCanvasElement> | MouseEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    return { x, y };
  }, []);

  // Draw spray paint particles
  const drawSpray = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const radius = brushSize;
    const particleCount = Math.max(10, Math.floor(brushSize / 2));

    // Higher density in center, lower at edges
    for (let i = 0; i < particleCount; i++) {
      // Use polar coordinates for better circular distribution
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;

      // Higher probability of particles near center (inverse square)
      const normalizedDistance = distance / radius;
      const centerBias = 1 - normalizedDistance * normalizedDistance;

      // Skip particles based on distance from center (creates natural spray falloff)
      if (Math.random() > centerBias * 0.7) continue;

      const offsetX = Math.cos(angle) * distance;
      const offsetY = Math.sin(angle) * distance;

      const particleX = x + offsetX;
      const particleY = y + offsetY;

      // Particle size varies (smaller at edges)
      const size = (1 + Math.random() * 2) * (1 - normalizedDistance * 0.5);

      // Alpha varies (more opaque in center)
      const alpha = 0.4 + (centerBias * 0.4);

      ctx.fillStyle = selectedColor;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(particleX, particleY, size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }, [brushSize, selectedColor]);

  // Draw with interpolation between points for smooth lines
  const drawLine = useCallback((ctx: CanvasRenderingContext2D, from: Point, to: Point) => {
    const distance = Math.sqrt(
      Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2)
    );

    // Draw particles along the line
    const steps = Math.max(1, Math.floor(distance / 2));

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = from.x + (to.x - from.x) * t;
      const y = from.y + (to.y - from.y) * t;
      drawSpray(ctx, x, y);
    }
  }, [drawSpray]);

  // Handle mouse down
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasCoordinates(e);
    if (!point) return;

    const ctx = getContext();
    if (!ctx) return;

    setIsDrawing(true);
    lastPointRef.current = point;
    drawSpray(ctx, point.x, point.y);
  }, [getCanvasCoordinates, getContext, drawSpray]);

  // Handle mouse move
  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const point = getCanvasCoordinates(e);
    if (!point) return;

    const ctx = getContext();
    if (!ctx) return;

    // Draw line from last point to current point for smooth strokes
    if (lastPointRef.current) {
      drawLine(ctx, lastPointRef.current, point);
    } else {
      drawSpray(ctx, point.x, point.y);
    }

    lastPointRef.current = point;
  }, [isDrawing, getCanvasCoordinates, getContext, drawSpray, drawLine]);

  // Handle mouse up/leave
  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastPointRef.current = null;
  }, []);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getContext();
    if (!ctx) return;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [getContext]);

  // Post tag (save to localStorage)
  const postTag = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get the canvas data URL
    const dataURL = canvas.toDataURL("image/png");

    // Check if canvas has any content (not just black)
    const ctx = getContext();
    if (!ctx) return;

    // Create a temporary canvas to check if there's actual content
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    const img = new Image();
    img.onload = () => {
      tempCtx.drawImage(img, 0, 0);
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const pixels = imageData.data;

      // Check if there are any non-black pixels
      let hasContent = false;
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        if (r > 0 || g > 0 || b > 0) {
          hasContent = true;
          break;
        }
      }

      if (!hasContent) {
        // Canvas is empty, don't save
        return;
      }

      const newTag: SavedTag = {
        id: Date.now().toString(),
        dataURL,
        timestamp: Date.now(),
      };

      setSavedTags((prev) => {
        const updated = [newTag, ...prev].slice(0, 12); // Keep last 12
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });

      // Clear canvas after posting
      clearCanvas();
    };
    img.src = dataURL;
  }, [getContext, clearCanvas]);

  // Delete tag
  const deleteTag = useCallback((id: string) => {
    setSavedTags((prev) => {
      const updated = prev.filter((tag) => tag.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Initialize and resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Set display size
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.width * 0.75}px`; // 4:3 aspect ratio

      // Set actual size (accounting for device pixel ratio for crisp rendering)
      const displayWidth = rect.width;
      const displayHeight = rect.width * 0.75;
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;

      const ctx = getContext();
      if (!ctx) return;

      // Scale context to account for device pixel ratio
      ctx.scale(dpr, dpr);

      // Set black background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, displayWidth, displayHeight);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [getContext]);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-black/50 backdrop-blur-sm rounded-lg border-2 border-white/10 p-6">
        {/* Canvas */}
        <div ref={containerRef} className="relative mb-6">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full border-2 border-white/20 rounded-lg cursor-crosshair bg-black"
            style={{ aspectRatio: "4/3" }}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
          {/* Color Picker */}
          <div className="flex items-center gap-2">
            <span className="font-tag text-white/80 text-sm">Color:</span>
            <div className="flex gap-2">
              {COLORS.map((color) => (
                <motion.button
                  key={color.name}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    selectedColor === color.value
                      ? "border-white scale-110"
                      : "border-white/30"
                  }`}
                  style={{
                    backgroundColor: color.value,
                    boxShadow:
                      selectedColor === color.value
                        ? `0 0 15px ${color.value}`
                        : "none",
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                />
              ))}
            </div>
          </div>

          {/* Brush Size */}
          <div className="flex items-center gap-2">
            <span className="font-tag text-white/80 text-sm">Size:</span>
            <input
              type="range"
              min="10"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-24 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-green"
            />
            <span className="font-tag text-white/60 text-sm w-8">
              {brushSize}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <motion.button
              onClick={clearCanvas}
              className="px-4 py-2 bg-neon-pink/20 border-2 border-neon-pink/50 text-neon-pink font-tag rounded-lg flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </motion.button>
            <motion.button
              onClick={postTag}
              className="px-6 py-2 bg-neon-green/20 border-2 border-neon-green/50 text-neon-green font-tag rounded-lg flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                boxShadow: "0 0 20px hsl(var(--neon-green))",
              }}
            >
              <Download className="w-4 h-4" />
              Post Tag
            </motion.button>
          </div>
        </div>

        {/* Recent Tags Grid */}
        {savedTags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-white/10">
            <h3 className="font-tag text-xl text-white mb-4 text-center">
              Recent Tags
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {savedTags.map((tag) => (
                <motion.div
                  key={tag.id}
                  className="relative group"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <img
                    src={tag.dataURL}
                    alt="Graffiti tag"
                    className="w-full aspect-square object-cover rounded-lg border-2 border-white/20"
                  />
                  <motion.button
                    onClick={() => deleteTag(tag.id)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
