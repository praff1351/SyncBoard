import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2, Pencil, Eraser, Copy, Check } from "lucide-react";
import Canvas from "@/components/Canvas";
import useSocket from "@/hooks/useSocket";
import api from "@/api/axios";

const COLORS = [
  "#000000",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

const BRUSH_SIZES = [2, 5, 10, 20];

const Whiteboard = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const token = localStorage.getItem("token");

  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [copied, setCopied] = useState(false);

  const { data: roomData } = useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}`);
      return res.data.room;
    },
  });

  useEffect(() => {
    if (!roomId || !token) return;

    const joinRoom = () => {
      console.log("Joining room:", roomId, "Socket ID:", socket.id);
      socket.emit("join-room", { roomId, token });
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.on("connect", joinRoom);
    }

    socket.on("reconnect", ()=>{
      console.log("Reconnected! Rejoining room...");
      joinRoom();
    })

    socket.on("load-strokes", (strokes) => {
      console.log("Loaded strokes:", strokes);
    });

    return () => {
      socket.off("connect", joinRoom);
      socket.off("load-strokes");
    };
  }, [roomId, token, socket]);

  const handleClear = () => {
    socket.emit("clear-canvas");
  };

  const copyShareKey = () => {
    if (!roomData?.share_key) return;
    navigator.clipboard.writeText(roomData.share_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/*TOOLBAR */}
      <div className="h-16 border-b border-border bg-background flex items-center px-4 gap-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={18} />
        </Button>
        <span className="font-semibold text-sm">
          {roomData?.name ?? "Loading..."}
        </span>

        <div className="h-6 w-px bg-border" />

        {/*TOOLS */}
        <div className="flex gap-1">
          <Button
            variant={tool === "pen" ? "default" : "ghost"}
            size="icon"
            className={
              tool === "pen"
                ? "bg-purple-600 hover: bg-purple-700 text-white"
                : ""
            }
            onClick={() => setTool("pen")}
          >
            <Pencil size={16} />
          </Button>
          <Button
            variant={tool === "eraser" ? "default" : "ghost"}
            size="icon"
            className={
              tool === "eraser"
                ? "bg-purple-600 hover: bg-purple-700 text-white"
                : ""
            }
            onClick={() => setTool("eraser")}
          >
            <Eraser size={16} />
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        {/*COLORS*/}
        <div className="flex gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: color === c ? "#8b5cf6" : "transparent",
                transform: color === c ? "scale(1.2)" : "Scale(1)",
              }}
              onClick={() => {
                setColor(c);
                setTool("pen");
              }}
            />
          ))}
        </div>
        <div className="h-6 w-px bg-border" />

        {/*BRUSH SIZES */}
        <div className="flex items-center gap-2">
          {BRUSH_SIZES.map((size) => (
            <button
              key={size}
              className="flex items-center justify-center w-7 h-7 rounded hover:bg-muted transition-colors"
              style={{
                border:
                  brushSize === size
                    ? "2px solid #8b5cf6"
                    : "2px solid transparent",
              }}
              onClick={() => setBrushSize(size)}
            >
              <div
                className="rounded-full bg-foreground"
                style={{ width: size, height: size }}
              />
            </button>
          ))}
        </div>
        <div className="h-6 w-px bg-border" />

        {/*CLEAR*/}
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover: text-destructive"
          onClick={handleClear}
        >
          <Trash2 size={16} />
        </Button>

        {/*SHARE KEY*/}
        <div className="ml-auto flex items-center gap-2">
          <Badge
            variant="outline"
            className="font-mono text-purple-600 dark:text-purple-400 border-purple-200"
          >
            {roomData?.share_key}
          </Badge>
          <Button variant="ghost" size="icon" onClick={copyShareKey}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </Button>
        </div>
      </div>

      {/*CANVAS*/}
      <Canvas
        socket={socket}
        roomId={roomId!}
        color={color}
        brushSize={brushSize}
        tool={tool}
      />
    </div>
  );
};
export default Whiteboard;
