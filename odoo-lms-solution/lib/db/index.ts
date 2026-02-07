// import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
// const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(pool, { schema });
