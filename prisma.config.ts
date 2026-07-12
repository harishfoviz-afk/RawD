import { defineConfig } from "prisma/config";
import fs from "fs";
import path from "path";

// Helper to manually parse .env file
function getDatabaseUrl(): string | undefined {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      const match = envContent.match(/DATABASE_URL\s*=\s*["']?([^"\r\n']+)["']?/);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  } catch (err) {
    // Fallback
  }
  return process.env.DATABASE_URL;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: getDatabaseUrl(),
  },
});
