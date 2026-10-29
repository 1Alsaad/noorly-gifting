/** Explicit libpq fields avoid treating a URL in PGDATABASE as a literal database name.
 * The URI is authoritative: inherited PG* values must not redirect a backup.
 */
export function postgresClientEnvironment(
  connection: string,
  inherited: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  let url: URL;
  try {
    url = new URL(connection);
  } catch {
    throw new Error("DATABASE_URL must be an explicit PostgreSQL URI");
  }
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname ||
    !url.username ||
    url.pathname.length < 2 ||
    url.hash
  )
    throw new Error(
      "DATABASE_URL requires an explicit PostgreSQL host, user and database",
    );
  const env: NodeJS.ProcessEnv = Object.fromEntries(
    Object.entries(inherited).filter(
      ([key]) =>
        !key.toUpperCase().startsWith("PG") &&
        key.toUpperCase() !== "DATABASE_URL",
    ),
  );
  Object.assign(env, {
    PGHOST: url.hostname.replace(/^\[|\]$/g, ""),
    PGPORT: url.port || "5432",
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
    PGCONNECT_TIMEOUT: "15",
    PGAPPNAME: "noorly-backup",
  });
  const options: Record<string, string> = {
    application_name: "PGAPPNAME",
    connect_timeout: "PGCONNECT_TIMEOUT",
    options: "PGOPTIONS",
    sslmode: "PGSSLMODE",
    sslcert: "PGSSLCERT",
    sslkey: "PGSSLKEY",
    sslrootcert: "PGSSLROOTCERT",
    sslcrl: "PGSSLCRL",
    sslcrldir: "PGSSLCRLDIR",
    sslsni: "PGSSLSNI",
    sslnegotiation: "PGSSLNEGOTIATION",
    channel_binding: "PGCHANNELBINDING",
    target_session_attrs: "PGTARGETSESSIONATTRS",
    gssencmode: "PGGSSENCMODE",
  };
  for (const [key, value] of url.searchParams) {
    if (!Object.hasOwn(options, key))
      throw new Error(
        `Unsupported PostgreSQL backup connection option: ${key}`,
      );
    env[options[key]] = value;
  }
  return env;
}
