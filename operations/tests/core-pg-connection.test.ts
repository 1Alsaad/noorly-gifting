import test from "node:test";
import assert from "node:assert/strict";
import { postgresClientEnvironment } from "../src/core/pg-connection.js";

test("backup URI fields override inherited PostgreSQL defaults without placing URI in child env", () => {
  const env = postgresClientEnvironment(
    "postgresql://ops:p%3Ass%40word@127.0.0.1:6543/restore_fixture?sslmode=require&channel_binding=require",
    {
      PATH: "tools",
      PGHOST: "wrong-host",
      PGHOSTADDR: "192.0.2.1",
      PGDATABASE: "wrong-db",
      PGSERVICE: "unexpected-service",
      DATABASE_URL: "never-copy-uri",
    },
  );
  assert.equal(env.PGHOST, "127.0.0.1");
  assert.equal(env.PGPORT, "6543");
  assert.equal(env.PGUSER, "ops");
  assert.equal(env.PGPASSWORD, "p:ss@word");
  assert.equal(env.PGDATABASE, "restore_fixture");
  assert.equal(env.PGSSLMODE, "require");
  assert.equal(env.PGCHANNELBINDING, "require");
  assert.equal(env.PATH, "tools");
  assert.equal(env.DATABASE_URL, undefined);
  assert.equal(env.PGHOSTADDR, undefined);
  assert.equal(env.PGSERVICE, undefined);
});
test("incomplete or unsupported backup connections fail instead of falling back to local defaults", () => {
  for (const uri of [
    "not-a-uri",
    "https://ops:pw@example.com/db",
    "postgres://localhost/db",
    "postgres://ops:pw@localhost/",
    "postgres://ops:pw@localhost/db?unknown_option=yes",
  ])
    assert.throws(() => postgresClientEnvironment(uri, {}));
});
