import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/auth";
import roomRoutes from "./routes/room";
import jwt from "jsonwebtoken";
import pool from "./db/index";
import "./db/index";

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

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Syncboard API running!" });
});

//SOCKET IO CONNECTION:
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // JOIN A ROOM:
  socket.on("join-room", async(data: {roomId: string; token: string})=>{
    try {
      const decoded = jwt.verify(
        data.token,
        process.env.JWT_SECRET as string
      ) as {userId: string};

      socket.data.userId = decoded.userId;
      socket.data.roomId = data.roomId;

      socket.join(data.roomId);
      console.log(`User ${decoded.userId} has joined room ${data.roomId}`);

      //SEND EXISTING STROKES TO THE NEW USER:
      const strokes = await pool.query(`
        SELECT * FROM strokes WHERE room_id = $1 ORDER BY created_at ASC
        `,
        [data.roomId]
      );
      socket.emit("load-strokes", strokes.rows.map((s)=>s.stroke_data));
    } catch (error) {
      console.error("Socket auth error: ", error);
      socket.disconnect();
      
    }
  });

  //RECEIEVE A STROKE AND BROADCAST IT TO OTHERS IN THE ROOM:

  socket.on("draw", async(strokeData: object)=>{
    const {roomId, userId} = socket.data;
    if(!roomId || !userId) return;

    try {
      //SAVING THE STROKE TO THE DB:
      await pool.query(
        `INSERT INTO strokes (room_id, user_id, stroke_data)
        VALUES ($1, $2, $3)`,
        [roomId, userId, JSON.stringify(strokeData)]
      );

      //BROADCAST IT TO OTHERS IN THE ROOM:
      socket.to(roomId).emit("draw", strokeData);

    } catch (error) {
      console.error("Draw error: ", error);
    }
  });
  //CLEAR THE CANVAS:
  socket.on("clear-canvas", async ()=>{
    const {roomId} = socket.data;
    if(!roomId) return;

    try {
      await pool.query(`
        DELETE FROM strokes where room_id = $1
        `, [roomId]);
        io.to(roomId).emit("clear-canvas");
    } catch (error) {
      console.error("Clear error: ", error);
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
