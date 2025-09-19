const fs = require("fs");
const path = require("path");

const type = process.argv[2] || "patch"; // default to patch
const versionFile = path.join(__dirname, "..", "VERSION");

let version = "0.0.0";
if (fs.existsSync(versionFile)) {
  version = fs.readFileSync(versionFile, "utf8").trim();
}

let [major, minor, patch] = version.split(".").map(Number);

if (type === "major") major++;
else if (type === "minor") minor++;
else patch++;

const newVersion = `${major}.${minor}.${patch}`;
fs.writeFileSync(versionFile, newVersion);

console.log(`Bumped version: ${version} → ${newVersion}`);

