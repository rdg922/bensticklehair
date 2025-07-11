"use client";

import type React from "react";

import {
  useState,
  useRef,
  useEffect,
  useActionState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { createBenPost } from "@/lib/actions";
import { SiteHeader } from "@/components/site-header";

const COLORS = [
  "#000000",
  "#FFFFFF",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#800000",
  "#008000",
  "#000080",
  "#808000",
  "#800080",
  "#008080",
  "#C0C0C0",
  "#808080",
];

const BRUSH_SIZES = [2, 4, 8, 12, 16, 24];

export default function EditorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [user, setUser] = useState<any>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const [benPostState, benPostAction, benPostPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const canvas = canvasRef.current;
      if (!canvas) return { error: "Canvas not available" };

      const imageData = canvas.toDataURL();
      formData.append("imageData", imageData);

      return await createBenPost(formData);
    },
    null
  );

  useEffect(() => {
    checkUser();
    initializeCanvas();
  }, []);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
    setUserLoaded(true);
  };

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsImageLoading(true);

    // Set canvas background to white first
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Show loading message
    ctx.fillStyle = "#000000";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Loading Ben...", canvas.width / 2, canvas.height / 2);

    // Load and draw Ben.png as background
    const benImage = new Image();
    benImage.onload = () => {
      // Clear canvas and draw the Ben image to fill the entire canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(benImage, 0, 0, canvas.width, canvas.height);
      setIsImageLoading(false);
      saveState();
    };
    benImage.onerror = () => {
      // Clear canvas and draw fallback
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawFallbackBen(ctx);
      setIsImageLoading(false);
      saveState();
    };
    benImage.src = "/Ben.webp";
  };

  const drawFallbackBen = (ctx: CanvasRenderingContext2D) => {
    // Draw base Ben image (placeholder)
    ctx.fillStyle = "#FFDDAA";
    ctx.fillRect(50, 50, 200, 250);

    // Simple Ben face
    ctx.fillStyle = "#000000";
    ctx.fillRect(100, 120, 20, 20); // left eye
    ctx.fillRect(180, 120, 20, 20); // right eye
    ctx.fillRect(130, 180, 40, 20); // mouth

    // Hair
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(50, 50, 200, 40);
  };

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(imageData);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;

    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const drawLine = (
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  };

  const drawDot = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    setLastPos(coords);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set drawing style
    ctx.strokeStyle = selectedColor;
    ctx.fillStyle = selectedColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Draw initial dot
    drawDot(ctx, coords.x, coords.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || !lastPos) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw line from last position to current position
    drawLine(ctx, lastPos.x, lastPos.y, coords.x, coords.y);
    setLastPos(coords);
  };

  const stopDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (isDrawing) {
      setIsDrawing(false);
      setLastPos(null);
      saveState();
    }
  };

  const undo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.putImageData(history[historyStep - 1], 0, 0);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.putImageData(history[historyStep + 1], 0, 0);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsImageLoading(true);

    // Set canvas background to white first
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Show loading message
    ctx.fillStyle = "#000000";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Loading Ben...", canvas.width / 2, canvas.height / 2);

    // Reload and draw Ben.png as background
    const benImage = new Image();
    benImage.onload = () => {
      // Clear canvas and draw the Ben image to fill the entire canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(benImage, 0, 0, canvas.width, canvas.height);
      setIsImageLoading(false);
      saveState();
    };
    benImage.onerror = () => {
      // Clear canvas and draw fallback
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawFallbackBen(ctx);
      setIsImageLoading(false);
      saveState();
    };
    benImage.src = "/Ben.webp";
  };

  // Prevent default touch behavior to avoid scrolling while drawing
  const preventDefault = (e: React.TouchEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-4">
        <SiteHeader currentPage="editor" />

        {/* Login Notice */}
        {userLoaded && !user && (
          <div className="bg-red-200 p-4 mb-4 border-4 border-red-600">
            <div className="text-center">
              <p className="text-xl font-bold text-red-800 mb-2 blink">
                ⚠️ WARNING ⚠️
              </p>
              <p className="text-lg text-red-900 font-bold mb-2">
                YOUR BEN WILL NOT BE SAVED!
              </p>
              <p className="text-sm text-red-700 mb-3">
                You must sign in to upload and share your masterpiece
              </p>
              <a
                href="/login"
                className="btn-3d btn-primary px-4 py-2 text-sm inline-block"
              >
                SIGN IN NOW
              </a>
            </div>
          </div>
        )}

        <main>
          <div className="space-y-4">
            {/* MS Paint Style Toolbar */}
            <div className="container-90s p-3 sm:p-4">
              {/* Mobile-first responsive layout */}
              <div className="space-y-4 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-4">
                {/* Colors Section */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="font-bold text-sm">COLORS:</span>
                  <div className="grid grid-cols-8 sm:flex gap-1">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 sm:w-6 sm:h-6 border-2 border-black touch-manipulation ${
                          selectedColor === color
                            ? "ring-2 ring-purple-500"
                            : ""
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(color)}
                      />
                    ))}
                  </div>
                </div>

                {/* Divider - hidden on mobile */}
                <div className="hidden sm:block w-px h-8 bg-black"></div>

                {/* Brush Size Section */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">BRUSH:</span>
                    <div
                      className="rounded-full bg-black"
                      style={{
                        width: `${Math.max(brushSize / 2, 3)}px`,
                        height: `${Math.max(brushSize / 2, 3)}px`,
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-3 sm:flex gap-1">
                    {BRUSH_SIZES.map((size) => (
                      <button
                        key={size}
                        className={`btn-3d px-3 py-2 sm:px-2 sm:py-1 text-sm sm:text-xs touch-manipulation ${
                          brushSize === size ? "btn-primary" : "btn-secondary"
                        }`}
                        onClick={() => setBrushSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider - hidden on mobile */}
                <div className="hidden sm:block w-px h-8 bg-black"></div>

                {/* Tools Section */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="font-bold text-sm">TOOLS:</span>
                  <div className="grid grid-cols-3 sm:flex gap-2">
                    <button
                      onClick={undo}
                      className="btn-3d btn-secondary px-3 py-2 sm:px-3 sm:py-1 text-sm touch-manipulation"
                      disabled={historyStep <= 0}
                    >
                      UNDO
                    </button>
                    <button
                      onClick={redo}
                      className="btn-3d btn-secondary px-3 py-2 sm:px-3 sm:py-1 text-sm touch-manipulation"
                      disabled={historyStep >= history.length - 1}
                    >
                      REDO
                    </button>
                    <button
                      onClick={clearCanvas}
                      className="btn-3d btn-danger px-3 py-2 sm:px-3 sm:py-1 text-sm touch-manipulation"
                      disabled={isImageLoading}
                    >
                      {isImageLoading ? "LOADING..." : "CLEAR"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Canvas and Post Form */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
              <div className="xl:col-span-2">
                <div className="container-pink p-3 sm:p-6">
                  <div className="flex justify-center">
                    <div className="relative w-full max-w-md">
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={500}
                        className="cursor-crosshair border-4 border-black bg-white w-full h-auto"
                        style={{ touchAction: "none" }}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        onTouchCancel={stopDrawing}
                      />
                      {isImageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 border-4 border-black">
                          <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-2"></div>
                            <div className="font-bold text-base lg:text-lg">
                              Loading Ben...
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="xl:col-span-1">
                <div className="container-90s p-4 sm:p-6">
                  <h3 className="text-lg font-bold mb-3 text-center">
                    POST YOUR BEN
                  </h3>

                  {userLoaded && !user && (
                    <div className="bg-yellow-200 p-3 mb-4 border-4 border-yellow-600">
                      <div className="text-center">
                        <p className="text-sm font-bold text-yellow-800 mb-2">
                          🔒 ACCOUNT REQUIRED 🔒
                        </p>
                        <p className="text-xs text-yellow-700">
                          Sign in to save and share your Ben masterpiece!
                        </p>
                      </div>
                    </div>
                  )}

                  <form action={benPostAction} className="space-y-3">
                    <input
                      type="text"
                      name="name"
                      placeholder="Name your Ben"
                      className={`w-full p-3 text-base lg:text-lg ${
                        !user ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      required
                      disabled={!user}
                    />

                    <textarea
                      name="birthdayMessage"
                      placeholder="Write a birthday message for Ben..."
                      className={`w-full p-3 text-base lg:text-lg resize-none ${
                        !user ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      rows={3}
                      required
                      disabled={!user}
                    />

                    {benPostState &&
                      "error" in benPostState &&
                      benPostState.error && (
                        <div className="text-red-500 font-bold text-sm">
                          {benPostState.error}
                        </div>
                      )}

                    {user ? (
                      <button
                        type="submit"
                        disabled={benPostPending}
                        className="btn-3d btn-success w-full px-6 py-3 text-lg lg:text-xl touch-manipulation"
                      >
                        {benPostPending ? "POSTING..." : "POST BEN"}
                      </button>
                    ) : (
                      <a
                        href="/login"
                        className="btn-3d btn-primary w-full px-6 py-3 text-lg lg:text-xl touch-manipulation block text-center"
                      >
                        SIGN IN TO POST
                      </a>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
