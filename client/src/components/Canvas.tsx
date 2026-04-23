import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

interface CanvasProps {
  socket: Socket;
  roomId: string;
  color: string;
  brushSize: number;
  tool: "pen" | "eraser";
}

const Canvas = ({ socket, color, brushSize, tool }: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const currentStroke = useRef<{ x: number; y: number }[]>([]);

  const getCtx = () => canvasRef.current?.getContext("2d") || null;

  const drawStroke = (stroke: Stroke) => {
    const ctx = getCtx();
    if (!ctx || !stroke?.points || stroke.points.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    stroke.points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.stroke();
  };

  useEffect(() => {
    const handleLoadStrokes = (strokes: any[]) => {
      console.log("Loading strokes onto canvas:", strokes.length);
      strokes.forEach((item) => {
        const stroke = item?.points ? item : item?.stroke_data ?? item;
        drawStroke(stroke);
      });
    };

    const handleDraw = (stroke: Stroke) => {
      console.log("Received draw event:", stroke);
      drawStroke(stroke);
    };

    const handleClear = () => {
      const canvas = canvasRef.current;
      const ctx = getCtx();
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    socket.on("load-strokes", handleLoadStrokes);
    socket.on("draw", handleDraw);
    socket.on("clear-canvas", handleClear);

    return () => {
      socket.off("load-strokes", handleLoadStrokes);
      socket.off("draw", handleDraw);
      socket.off("clear-canvas", handleClear);
    };
  }, [socket]);

  const getPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent) => {
    isDrawing.current = true;
    currentStroke.current = [getPos(e)];
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing.current) return;
    const pos = getPos(e);
    currentStroke.current.push(pos);

    const ctx = getCtx();
    if (!ctx) return;

    const points = currentStroke.current;
    const strokeColor = tool === "eraser" ? "#ffffff" : color;
    const strokeWidth = tool === "eraser" ? brushSize * 3 : brushSize;

    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (points.length >= 2) {
      ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (currentStroke.current.length < 2) return;

    const stroke: Stroke = {
      points: currentStroke.current,
      color: tool === "eraser" ? "#ffffff" : color,
      width: tool === "eraser" ? brushSize * 3 : brushSize,
    };

    console.log("Emitting draw:", stroke);
    socket.emit("draw", stroke);
    currentStroke.current = [];
  };

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight - 64}
      className="bg-white cursor-crosshair"
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
    />
  );
};

export default Canvas;