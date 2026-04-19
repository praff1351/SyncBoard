import dotenv from "dotenv";
import { Client } from "pg";
dotenv.config();

async function setup() {
  const client = new Client({
    user: "postgres",
    host: "localhost",
    database: "postgres",
    password: process.env.DB_PASSWORD,
    port: 5432,
  });

  await client.connect();
  console.log("Connected to postgreSQL");

  const res = await client.query(`
    SELECT 1 FROM pg_database WHERE datname = 'whiteboard'
    `);

  if (res.rowCount === 0) {
    await client.query(`
      CREATE DATABASE whiteboard`);
    console.log("Database created!");
  } else {
    console.log("Database already exists, skipping!!");
  }
  await client.end();

  const appClient = new Client({
    user: "postgres",
    host: "localhost",
    database: "whiteboard",
    password: process.env.DB_PASSWORD,
    port: 5432,
  });
  await appClient.connect();

  await appClient.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      share_key VARCHAR(20) UNIQUE NOT NULL,
      owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS room_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      joined_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(room_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS strokes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stroke_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
    );
    `);

  console.log("All tables created!");
  await appClient.end();
}

setup().catch(console.error);
