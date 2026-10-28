import { defineTool } from "eve/tools";
import { socialDraftSchema } from "../../src/schemas.js";
import { prepareSocial } from "../../src/runtime.js";
export default defineTool({
  description:
    "Save a Swedish social draft using existing authorized photographs. Scheduling requires trusted caption, exact image-byte and channel verification.",
  inputSchema: socialDraftSchema,
  execute: (input) => prepareSocial(input),
});
