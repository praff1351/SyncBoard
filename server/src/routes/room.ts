import { Router } from "express";
import {
  createRoom,
  joinRoom,
  getUserRooms,
  getRoom,
  getRoomStrokes,
} from "../controllers/roomController";
import { authMiddleware } from "../middleware/auth";


const router = Router();

router.post("/create", authMiddleware, createRoom);
router.post("/join", authMiddleware, joinRoom);
router.get("/", authMiddleware, getUserRooms);
router.get("/:id", authMiddleware, getRoom);
router.post("/:id/strokes", authMiddleware, getRoomStrokes);

export default router;