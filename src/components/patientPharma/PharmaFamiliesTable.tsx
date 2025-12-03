// integrad-dashboard/src/components/pharma/PharmaFamiliesTable.tsx

import type { DrugFamilySummary } from "./types";

interface Props {
  families: DrugFamilySummary[];
  loading: boolean;
  error: string | null;
}

export default function PharmaFamiliesTable({
  families,
  loading,
  error,
}: Props) {
  return (
    <section
      style={{
        background: "#ffffff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
      }}
    >
      <h3 style={{ margin: 0, marginBottom: 8, fontSize: "0.95rem" }}>
        Resumen por familia terapéutica
      </h3>

      {loading && <p>Cargando…</p>}

      {error && (
        <p style={{ color: "#b91c1c", fontSize: "0.8rem" }}>{error}</p>
      )}

      {!loading && !error && families.length === 0 && (
        <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>
          No se detectaron familias terapéuticas.
        </p>
      )}

      {!loading && !error && families.length > 0 && (
        <div style={{ overflowX: "auto", marginTop: 4 }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.85rem",
            }}
          >
            <thead>
              <tr
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <th style={{ padding: "6px 4px" }}>Familia</th>
                <th style={{ padding: "6px 4px" }}>Medicamentos</th>
                <th style={{ padding: "6px 4px" }}>Crónicos</th>
                <th style={{ padding: "6px 4px" }}>Adherencia promedio</th>
              </tr>
            </thead>

            <tbody>
              {families.map((fam) => (
                <tr key={fam.family}>
                  <td style={{ padding: "6px 4px" }}>{fam.family}</td>
                  <td style={{ padding: "6px 4px" }}>
                    {fam.drugs.join(", ")}
                  </td>
                  <td style={{ padding: "6px 4px" }}>{fam.chronicCount}</td>
                  <td style={{ padding: "6px 4px" }}>
                    {fam.averageAdherence == null
                      ? "—"
                      : `${fam.averageAdherence}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
