import { Pool } from 'pg';
import 'dotenv/config';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  console.log("Altering column workflow_run_id in analysis_jobs to TYPE TEXT...");
  
  try {
    const res = await pool.query(`
      ALTER TABLE "analysis_jobs" 
      ALTER COLUMN "workflow_run_id" TYPE TEXT;
    `);
    console.log("Success! Table altered successfully.");
  } catch (err: any) {
    console.error("Failed to alter table:", err.message || err);
  }

  await pool.end();
}

main();
