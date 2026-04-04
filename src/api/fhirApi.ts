import { keycloak } from "../auth/keycloak";

const GATEWAY_BASE = "http://localhost:4000";

async function authHeaders(): Promise<Record<string, string>> {
  const token = keycloak.token;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function fhirMetadata() {
  const res = await fetch(`${GATEWAY_BASE}/fhir/metadata`, {
    headers: {
      Accept: "application/fhir+json",
    },
  });

  if (!res.ok) throw new Error(`metadata failed: ${res.status}`);
  return res.json();
}

export async function fhirPatients(count = 10) {
  const headers: Record<string, string> = {
    Accept: "application/fhir+json",
    ...(await authHeaders()),
  };

  const res = await fetch(`${GATEWAY_BASE}/fhir/Patient?_count=${count}`, {
    headers,
  });

  if (res.status === 401) throw new Error("401");
  if (res.status === 403) throw new Error("403");
  if (!res.ok) throw new Error(`Patient search failed: ${res.status}`);

  return res.json();
}