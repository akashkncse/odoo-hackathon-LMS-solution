// import { neon } from "@neondatabase/serverless";
// // import { Pool } from "pg";
// import { drizzle } from "drizzle-orm/neon-http";
// import * as schema from "./schema";
// import * as dotenv from "dotenv";
// dotenv.config({ path: ".env.local" });
// // const pool = new Pool({
// //   connectionString: process.env.DATABASE_URL,
// // });
// const sql = neon(process.env.DATABASE_URL!);
// export const db = drizzle(sql, { schema });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Ensure the variable is captured from the environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
