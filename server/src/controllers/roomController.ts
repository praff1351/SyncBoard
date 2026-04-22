import { Response } from "express";
import pool from "../db/index";
import { AuthRequest } from "../middleware/auth";
import crypto from "crypto";

// GENERATE A RANDOM SHARE KEY:

const generateShareKey = ()=>{
  return crypto.randomBytes(6).toString("hex").toUpperCase();
}

// CREATE A ROOM:
export const createRoom = async (req:AuthRequest, res:Response):Promise<void> => {
  const {name} = req.body;
  const userId = req.userId;

  if(!name){
    res.status(400).json({message: 
      "Room name is required"
    });
    return;
  }

  try {
    const shareKey = generateShareKey();

    const result = await pool.query(
      `INSERT INTO rooms (name, share_key, owner_id)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [name, shareKey, userId]
    );
    const room = result.rows[0];

    //ADD OWNER AS A MEMBER:
    await pool.query(`
      INSERT INTO room_members (room_id, user_id)
      VALUES ($1, $2)
      `,
      [room.id, userId]
    );
    res.status(201).json({room});
  } catch (error) {
    console.error(error);
    res.status(500).json({message: "Server error"});
  }
}

  //JOIN A ROOM USING THE SHARE KEY:
  export const joinRoom = async (req: AuthRequest, res:Response): Promise<void> =>{
    const {shareKey} = req.body;
    const userId = req.userId;

    if(!shareKey){
      res.status(400).json({message: "Share key is required!!"});
      return;
    }

    try {
      const result = await pool.query(`
        SELECT * FROM rooms WHERE share_key = $1`,
        [shareKey.toUpperCase()]
      );
      if(result.rows.length === 0){
        res.status(404).json({message: "Room not found"});
        return;
      }
      const room = result.rows[0];

      //ADD USER AS A MEMBER IF NOT ALREADY:
      await pool.query(`
        INSERT INTO room_members (room_id, user_id)
        VALUES ($1, $2)
        ON CONFLICT (room_id, user_id) DO NOTHING
        `,
        [room.id, userId]
      );
      res.status(200).json({room});
    } catch (error) {
      console.error(error);
      res.status(500).json({message: "Server error"});
    }
  };

  //GET ALL ROOMS FOR A USER:
  export const getUserRooms = async(req: AuthRequest, res:Response):Promise<void> =>{
    const userId =req.userId;

    try {
      const result = await pool.query(`
        SELECT r.*,
        (SELECT COUNT(*) FROM room_members rm WHERE rm.room_id = r.id) as member_count
        FROM rooms r
        JOIN room_members rm ON rm.room_id = r.id
        WHERE rm.user_id = $1
        ORDER BY r.created_at DESC        
        `,[userId]);

        res.status(200).json({rooms: result.rows});
    } catch (error) {
      console.error(error);
      res.status(500).json({message: 'Server error'});
    }
  };

  //GET A SINGLE ROOM BY ID:
  export const getRoom = async (req:AuthRequest, res:Response): Promise<void> =>{
    const {id} = req.params;
    const userId = req.userId;

    try {
      const result = await pool.query(`
        SELECT r.* FROM rooms r
        JOIN room_members rm ON rm.room_id = r.id
        WHERE r.id = $1 AND rm.user_id = $2
        `,
        [id, userId]
      );
      if(result.rows.length === 0){
        res.status(404).json({message: "Room not found or access denied"});
        return;
      }
      res.status(200).json({room: result.rows[0]});
    } catch (error) {
      console.error(error);
      res.status(500).json({message: "Server error"});
    }
  };

  //GET STROKE HISTORY FOR A ROOM:
  export const getRoomStrokes = async(req:AuthRequest, res:Response): Promise<void> =>{
    const {id}= req.params;

    try {
      const result = await pool.query(`
        SELECT * FROM strokes WHERE room_id = $1 ORDER BY created_at ASC
        `,[id]);
        res.status(200).json({strokes: result.rows});
    } catch (error) {
      console.error(error);
      res.status(500).json({message:"Server error"});
    }
  }









