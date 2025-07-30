import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🚀 Starting Restaurant Backend Server...\n");

// Start the backend server
const backendProcess = spawn("npm", ["run", "dev"], {
  cwd: path.join(__dirname, "back"),
  stdio: "inherit",
  shell: true,
});

backendProcess.on("error", (error) => {
  console.error("❌ Failed to start backend server:", error);
});

backendProcess.on("close", (code) => {
  console.log(`Backend server process exited with code ${code}`);
});

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down backend server...");
  backendProcess.kill("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down backend server...");
  backendProcess.kill("SIGTERM");
  process.exit(0);
});
