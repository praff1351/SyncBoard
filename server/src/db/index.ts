import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "whiteboard",
  password: process.env.DB_PASSWORD,
  port: 5432,
});

pool
  .connect()
  .then(() => console.log("Connected to the database"))
  .catch((err) => console.log("DB connection error: ", err));

export default pool;
