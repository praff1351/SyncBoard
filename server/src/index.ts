import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import "./db/index";
import authRoutes from "./routes/auth";
import roomRoutes from "./routes/room";
import pool from "./db/index";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Collaborative Whiteboard API running!" });
});

// Socket.IO
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join a room
  socket.on("join-room", async (data: { roomId: string; token: string }) => {
    try {
      const decoded = jwt.verify(
        data.token,
        process.env.JWT_SECRET as string,
      ) as { userId: string };

      socket.data.userId = decoded.userId;
      socket.data.roomId = data.roomId;

      socket.join(data.roomId);
      console.log(`User ${decoded.userId} joined room ${data.roomId}`);

      // Send existing strokes to the new user
      const strokes = await pool.query(
        `SELECT * FROM strokes WHERE room_id = $1 ORDER BY created_at ASC`,
        [data.roomId],
      );
      socket.emit(
        "load-strokes",
        strokes.rows.map((s) => s.stroke_data),
      );
    } catch (err) {
      console.error("Socket auth error:", err);
      socket.disconnect();
    }
  });

  // Receive a stroke and broadcast to others in the room
  socket.on("draw", async (strokeData: object) => {
    const { roomId, userId } = socket.data;
    if (!roomId || !userId) return;

    try {
      // Save stroke to DB
      await pool.query(
        `INSERT INTO strokes (room_id, user_id, stroke_data)
         VALUES ($1, $2, $3)`,
        [roomId, userId, JSON.stringify(strokeData)],
      );

      // Broadcast to everyone else in the room
      socket.to(roomId).emit("draw", strokeData);
    } catch (err) {
      console.error("Draw error:", err);
    }
  });

  // Clear the canvas
  socket.on("clear-canvas", async () => {
    const { roomId } = socket.data;
    if (!roomId) return;

    try {
      await pool.query(`DELETE FROM strokes WHERE room_id = $1`, [roomId]);
      io.to(roomId).emit("clear-canvas");
    } catch (err) {
      console.error("Clear error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };
export default app;
