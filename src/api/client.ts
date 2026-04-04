const API_BASE_URL = "http://localhost:4000";

export async function apiFetch(path: string, options?: RequestInit) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Error en la API");
  }

  return res.json();
}