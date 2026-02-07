import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function flush() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set in .env.local");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    console.log("Dropping public schema...");
    await pool.query("DROP SCHEMA IF EXISTS public CASCADE");

    console.log("Recreating public schema...");
    await pool.query("CREATE SCHEMA public");

    console.log("Granting default privileges...");
    await pool.query("GRANT ALL ON SCHEMA public TO public");
    await pool.query("GRANT ALL ON SCHEMA public TO current_user");

    console.log("Database flushed successfully.");
  } finally {
    await pool.end();
  }
}

flush().catch((err) => {
  console.error("Flush failed:", err);
  process.exit(1);
});
