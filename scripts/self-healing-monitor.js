// Self-Healing Monitoring Agent (Node.js)
// Scans logs for recurring errors and creates GitHub issues with recommendations
const { Octokit } = require("@octokit/rest");
const fs = require("fs");
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const octokit = new Octokit({ auth: GITHUB_TOKEN });
const OWNER = "yalka2024";
const REPO = "beauty-crafter";

async function main() {
  const log = fs.readFileSync("logs/app.log", "utf-8");
  const errorCounts = {};
  log.split("\n").forEach(line => {
    if (line.includes("ERROR")) {
      const msg = line.split("ERROR")[1].trim();
      errorCounts[msg] = (errorCounts[msg] || 0) + 1;
    }
  });
  for (const [msg, count] of Object.entries(errorCounts)) {
    if (count > 5) { // Threshold for recurring error
      await octokit.issues.create({
        owner: OWNER,
        repo: REPO,
        title: `Recurring error detected: ${msg}`,
        body: `The following error occurred ${count} times in the last scan. Please investigate.\n\nError: ${msg}`
      });
    }
  }
}

main().catch(console.error);
