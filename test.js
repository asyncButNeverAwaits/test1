const fs = require("fs");
const https = require("https");
const { execSync } = require("child_process");

// URL to fetch
const URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";

console.log("🔎 Fetching data from:", URL);

https.get(URL, res => {
  let data = "";

  res.on("data", chunk => data += chunk);
  res.on("end", () => {
    try {
      const json = JSON.parse(data);

      // Build time-based folder path
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = String(now.getUTCMonth() + 1).padStart(2, "0");
      const day = String(now.getUTCDate()).padStart(2, "0");
      const hour = String(now.getUTCHours()).padStart(2, "0");

      const dirPath = `${year}/${month}/${day}/${hour}`;
      const filePath = `${dirPath}/data.json`;

      fs.mkdirSync(dirPath, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
      console.log(`✅ Data saved to ${filePath}`);

      // Git commit and push
      try {
        execSync("git config user.name 'github-actions[bot]'");
        execSync("git config user.email 'github-actions[bot]@users.noreply.github.com'");
        execSync(`git add "${filePath}"`);
        execSync(`git diff --quiet || git commit -m "Add data for ${year}-${month}-${day} ${hour}:00 UTC"`);
        execSync("git push");
        console.log("✅ Data committed & pushed to repository");
      } catch (err) {
        console.error("❌ Git push failed:", err.message);
      }

    } catch (err) {
      console.error("❌ Error parsing JSON:", err.message);
    }
  });
}).on("error", err => {
  console.error("❌ HTTPS request failed:", err.message);
});
