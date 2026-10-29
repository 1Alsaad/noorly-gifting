import { spawnSync } from "node:child_process";
import { mkdir, rename, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { postgresClientEnvironment } from "../src/core/pg-connection.js";
// pg_dump custom format includes all durable app tables. Restore only to a separate test database first.
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
process.umask(0o077);
const connectionEnvironment = postgresClientEnvironment(
  process.env.DATABASE_URL,
);
const directory = resolve(process.env.OPS_BACKUP_DIRECTORY ?? ".data/backups");
await mkdir(directory, { recursive: true });
const path = resolve(
  directory,
  `noorly-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID()}.dump`,
);
const partialPath = `${path}.partial`;
const result = spawnSync(
  "pg_dump",
  ["--format=custom", "--no-owner", "--no-password", `--file=${partialPath}`],
  {
    env: connectionEnvironment,
    stdio: ["ignore", "inherit", "inherit"],
    shell: false,
    windowsHide: true,
  },
);
if (result.status !== 0) {
  await unlink(partialPath).catch(() => undefined);
  throw new Error(
    "Database backup failed. Install PostgreSQL client tools and check access.",
  );
}
await rename(partialPath, path);
console.log(`Backup created: ${path}`);
