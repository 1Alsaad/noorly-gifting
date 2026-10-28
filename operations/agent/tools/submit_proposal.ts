import { defineTool } from "eve/tools";
import { proposalSchema } from "../../src/schemas.js";
import { submitProposal } from "../../src/runtime.js";
export default defineTool({
  description:
    "Persist a proposed action with rationale, exact sources and remaining validation. Does not certify evidence or perform the action.",
  inputSchema: proposalSchema,
  execute: submitProposal,
});
