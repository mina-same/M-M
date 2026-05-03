import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";

interface ScratchCardProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  onReveal?: () => void;
  scratchColor?: string;
  revealed?: boolean;
  label?: string;
}

const ScratchCard = ({
  children,
  width = 150,
  height = 150,
  onReveal,
  scratchColor = "#C0C0C0",
  revealed = false,
  label = "Scratch",
}: ScratchCardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = scratchColor;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#666";
    ctx.font = "bold 14px Montserrat";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, width / 2, height / 2);
  }, [width, height, scratchColor, label]);

  useEffect(() => { initCanvas(); }, [initCanvas]);

  useEffect(() => {
    if (revealed && canvasRef.current) {
      canvasRef.current.style.opacity = "0";
      setIsRevealed(true);
    }
  }, [revealed]);

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const touch = e.touches[0];
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const doScratch = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDrawing.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentPoint = getPos(e, canvas);
    if (lastPoint.current) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 36;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();
    }
    lastPoint.current = currentPoint;

    const imageData = ctx.getImageData(0, 0, width, height);
    let transparent = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) transparent++;
    }
    if ((transparent / (imageData.data.length / 4)) * 100 > 50 && !isRevealed) {
      setIsRevealed(true);
      canvas.style.opacity = "0";
      onReveal?.();
    }
  }, [isRevealed, width, height, onReveal]);

  // Non-passive touch listeners so we can call preventDefault and stop page scroll
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      isDrawing.current = true;
      lastPoint.current = getPos(e, canvas);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      doScratch(e);
    };
    const onTouchEnd = () => {
      isDrawing.current = false;
      lastPoint.current = null;
    };

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);

    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [doScratch]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl shadow-md"
      style={{ width, height, touchAction: "none" }}
    >
      <div className="absolute inset-0 flex items-center justify-center bg-w6-paper">
        {children}
      </div>
      <motion.canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0 cursor-pointer"
        style={{ opacity: isRevealed ? 0 : 1, touchAction: "none" }}
        transition={{ duration: 0.7 }}
        onMouseDown={(e) => {
          isDrawing.current = true;
          const canvas = canvasRef.current;
          if (canvas) lastPoint.current = getPos(e.nativeEvent, canvas);
        }}
        onMouseMove={(e) => doScratch(e.nativeEvent)}
        onMouseUp={() => { isDrawing.current = false; lastPoint.current = null; }}
        onMouseLeave={() => { isDrawing.current = false; lastPoint.current = null; }}
      />
    </div>
  );
};

export default ScratchCard;
