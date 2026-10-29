import { configurationStatus } from "../src/config.js";
import { getStore, closeDatabase } from "../src/database.js";
const configuration = configurationStatus();
console.log(JSON.stringify({ configuration }, null, 2));
try {
  const store = await getStore();
  const snapshot = await store.snapshot();
  console.log(
    JSON.stringify(
      {
        database: "connected",
        mode: snapshot.control.mode,
        budgets: snapshot.budgets,
        readiness: snapshot.control.readiness,
      },
      null,
      2,
    ),
  );
} catch {
  console.error("Database is unavailable; live operations remain disabled.");
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
if (configuration.some((c) => !c.ready)) process.exitCode = 1;
