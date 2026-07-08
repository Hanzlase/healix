import { Pool } from 'pg';
import 'dotenv/config';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  console.log("Direct PG Query to pipeline_failures...");
  const res = await pool.query("SELECT id, repo_id, commit_sha, workflow_run_id, status FROM pipeline_failures;");
  console.log("Rows count:", res.rows.length);
  for (const row of res.rows) {
    console.log(row);
    console.log(`workflow_run_id type: ${typeof row.workflow_run_id}, value:`, row.workflow_run_id);
  }

  const jobsRes = await pool.query("SELECT * FROM analysis_jobs;");
  console.log("Jobs count:", jobsRes.rows.length);
  for (const row of jobsRes.rows) {
    console.log(row);
  }

  const runsRes = await pool.query("SELECT * FROM analysis_runs;");
  console.log("Runs count:", runsRes.rows.length);
  for (const row of runsRes.rows) {
    console.log(row);
  }

  const timeRes = await pool.query("SELECT NOW();");
  console.log("Database NOW():", timeRes.rows[0].now);
  console.log("Node.js new Date():", new Date().toISOString());

  await pool.end();
}

main().catch(err => {
  console.error("Error:", err);
});
