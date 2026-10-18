/** Sentry-ready seam. Register the installed SDK here after its privacy review. */
export type ErrorContext = {
  code: string;
  requestId?: string;
  runtime?: string;
};
type ErrorReporter = (error: unknown, context: ErrorContext) => void;
let reporter: ErrorReporter | undefined;
export function registerErrorReporter(adapter: ErrorReporter) {
  reporter = adapter;
}
export function captureApplicationError(error: unknown, context: ErrorContext) {
  console.error(JSON.stringify({ level: "error", ...context }));
  try {
    reporter?.(error, context);
  } catch {
    /* Monitoring must not affect request handling. */
  }
}
