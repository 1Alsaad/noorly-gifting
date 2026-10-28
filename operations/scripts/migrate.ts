import { getStore, getRecords, closeDatabase } from "../src/database.js";
try {
  await getStore();
  await getRecords();
  console.log("Operations tables initialized.");
} finally {
  await closeDatabase();
}
