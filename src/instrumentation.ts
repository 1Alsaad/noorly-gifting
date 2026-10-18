import type { Instrumentation } from "next";
import { captureApplicationError } from "@/lib/security/observability";

export const onRequestError: Instrumentation.onRequestError = (
  error,
  _request,
  context,
) => {
  captureApplicationError(error, {
    code: "UNHANDLED_REQUEST",
    runtime: context.routerKind,
  });
};
