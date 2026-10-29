import { defineChannel, GET } from "eve/channels";
import { handleHttp } from "../../src/http.js";

// Replaces eve's implicit public home channel with the authenticated dashboard.
export default defineChannel({
  routes: [GET("/", (request) => handleHttp(request))],
});
