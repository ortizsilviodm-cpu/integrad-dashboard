/*integrad-dashboard\src\auth\keycloak.ts*/
import Keycloak from "keycloak-js";

export const keycloak = new Keycloak({
  url: "http://localhost:8081",
  realm: "integrad",
  clientId: "integrad-dashboard",
});