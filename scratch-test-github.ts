import { Octokit } from '@octokit/rest';
import 'dotenv/config';

async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("GITHUB_TOKEN is not set in env");
    return;
  }
  console.log("GITHUB_TOKEN is set. Length:", token.length);

  const octokit = new Octokit({ auth: token });

  const owner = 'Hanzlase';
  const repo = 'healixtesting';
  const run_id = 28875405443;
  const job_id = 85649026364;

  try {
    console.log("Testing octokit.actions.listJobsForWorkflowRun...");
    const jobs = await octokit.actions.listJobsForWorkflowRun({
      owner,
      repo,
      run_id,
    });
    console.log("Success! Found jobs count:", jobs.data.jobs.length);
  } catch (err: any) {
    console.error("Failed listJobsForWorkflowRun:", err.message || err);
  }

  try {
    console.log(`Testing actions.downloadJobLogsForWorkflowRun for job ${job_id}...`);
    const logs = await octokit.actions.downloadJobLogsForWorkflowRun({
      owner,
      repo,
      job_id,
    });
    console.log("Success! Logs downloaded. Data length:", logs.data ? (logs.data as any).length || typeof logs.data : "empty");
  } catch (err: any) {
    console.error("Failed downloadJobLogsForWorkflowRun:", err.message || err);
  }

  try {
    console.log(`Testing actions.downloadWorkflowRunLogs for run ${run_id}...`);
    const runLogs = await octokit.actions.downloadWorkflowRunLogs({
      owner,
      repo,
      run_id,
    });
    console.log("Success! Run logs downloaded. Data type/length:", typeof runLogs.data);
  } catch (err: any) {
    console.error("Failed downloadWorkflowRunLogs:", err.message || err);
  }
}

main();
