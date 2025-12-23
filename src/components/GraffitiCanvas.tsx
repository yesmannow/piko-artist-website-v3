"use client";

import { useRef, useState, useEffect } from "react";
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

export function GraffitiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  const getContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d", { willReadFrequently: true });
  };

  const drawSpray = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const particles = 15;
    for (let i = 0; i < particles; i++) {
      const offsetX = (Math.random() - 0.5) * brushSize * 2;
      const offsetY = (Math.random() - 0.5) * brushSize * 2;
      const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);

      // Create circular spray pattern
      if (distance <= brushSize) {
        const size = Math.random() * 3 + 1;
        ctx.fillStyle = selectedColor;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(x + offsetX, y + offsetY, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const ctx = getContext();
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    drawSpray(ctx, x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const ctx = getContext();
    if (!ctx) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    drawSpray(ctx, x, y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getContext();
    if (!ctx) return;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const postTag = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL("image/png");
    const newTag: SavedTag = {
      id: Date.now().toString(),
      dataURL,
      timestamp: Date.now(),
    };

    const updated = [newTag, ...savedTags].slice(0, 12); // Keep last 12
    setSavedTags(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Clear canvas after posting
    clearCanvas();
  };

  const deleteTag = (id: string) => {
    const updated = savedTags.filter((tag) => tag.id !== id);
    setSavedTags(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 800;
    canvas.height = 600;
    const ctx = getContext();
    if (!ctx) return;

    // Black background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-black/50 backdrop-blur-sm rounded-lg border-2 border-white/10 p-6">
        {/* Canvas */}
        <div className="relative mb-6">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full border-2 border-white/20 rounded-lg cursor-crosshair bg-black"
            style={{ maxHeight: "600px" }}
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

