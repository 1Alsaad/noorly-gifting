import { eveChannel } from "eve/channels/eve";
import { bearer, owner } from "../../src/auth.js";
export default eveChannel({
  auth: async (request) =>
    bearer(request, "OPS_SERVICE_TOKEN") || owner(request)
      ? {
          authenticator: "noorly",
          principalId: "noorly-operator",
          principalType: "service",
          attributes: {},
        }
      : null,
});
