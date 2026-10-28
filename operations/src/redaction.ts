const sensitiveName =
  /password|token|secret|authorization|api.?key|cookie|database.?url/i;

/** Reports are allowed to contain evidence, never deployment credentials. */
export function safeText(
  value: unknown,
  env: NodeJS.ProcessEnv = process.env,
): string {
  let text = String(value ?? "");
  for (const [name, secret] of Object.entries(env)) {
    if (sensitiveName.test(name) && secret && secret.length >= 8)
      text = text.split(secret).join("[redacted]");
  }
  return text
    .replace(
      /\b(?:postgres(?:ql)?):\/\/[^\s<>"']+/gi,
      "[database connection redacted]",
    )
    .replace(
      /\b(?:Bearer|Basic)\s+[a-zA-Z0-9+/_.=-]+/gi,
      "[authorization redacted]",
    )
    .replace(
      /\b(?:sk-|shpat_|shpca_|re_)[a-zA-Z0-9_-]{16,}/g,
      "[credential redacted]",
    )
    .replace(/https?:\/\/[^\s<>"']+/g, (raw) => {
      try {
        const url = new URL(raw);
        url.username = "";
        url.password = "";
        url.search = "";
        url.hash = "";
        return url.href;
      } catch {
        return "[invalid URL]";
      }
    })
    .slice(0, 12000);
}

export function redactOperationalData<T>(
  value: T,
  env: NodeJS.ProcessEnv = process.env,
): T {
  function walk(input: unknown): unknown {
    if (typeof input === "string") return safeText(input, env);
    if (Array.isArray(input)) return input.map(walk);
    if (input && typeof input === "object")
      return Object.fromEntries(
        Object.entries(input).map(([key, item]) => [
          key,
          sensitiveName.test(key) ? "[redacted]" : walk(item),
        ]),
      );
    return input;
  }
  return walk(value) as T;
}
