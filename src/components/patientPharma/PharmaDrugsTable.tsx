/* integrad-dashboard/src/components/patientPharma/PharmaDrugsTable.tsx */

import type { PatientPharmaProfile } from "../../api/pharmaProfile";

interface PharmaDrugsTableProps {
  // Recibe directamente el arreglo de drugs (o queda undefined)
  drugs?: PatientPharmaProfile["drugs"];
  loading: boolean;
  error: string | null;
}

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-AR");
};

const diffInDays = (from: Date, to: Date) => {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};

const renderChronicChip = (chronic: boolean) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "2px 8px",
      borderRadius: 999,
      fontSize: "0.75rem",
      fontWeight: 600,
      backgroundColor: chronic ? "#dcfce7" : "#e5e7eb",
      color: chronic ? "#166534" : "#374151",
    }}
  >
    {chronic ? "Crónico" : "Ocasional"}
  </span>
);

const renderAdherenceChip = (percent: number) => {
  let bg = "#fee2e2";
  let color = "#b91c1c";
  const label = `${percent}%`;

  if (percent >= 80) {
    bg = "#dcfce7";
    color = "#166534";
  } else if (percent >= 60) {
    bg = "#fef3c7";
    color = "#92400e";
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: "0.75rem",
        fontWeight: 600,
        backgroundColor: bg,
        color,
      }}
    >
      {label}
    </span>
  );
};

const renderStatusChip = (drug: PatientPharmaProfile["drugs"][number]) => {
  const now = new Date();
  const last = new Date(drug.lastDispenseDate);
  if (Number.isNaN(last.getTime())) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "2px 8px",
          borderRadius: 999,
          fontSize: "0.75rem",
          fontWeight: 600,
          backgroundColor: "#fee2e2",
          color: "#b91c1c",
        }}
      >
        Sin registros recientes
      </span>
    );
  }

  const coverageEnd = new Date(
    last.getTime() + (drug.daysCovered || 0) * 24 * 60 * 60 * 1000
  );
  const daysSinceCoverageEnd = diffInDays(coverageEnd, now);

  let bg = "#e5e7eb";
  let color = "#374151";
  let label = "Uso esporádico";

  if (!drug.daysCovered || drug.daysCovered <= 0) {
    label = "Uso esporádico";
  } else if (daysSinceCoverageEnd <= 0) {
    bg = "#dcfce7";
    color = "#166534";
    label = "En cobertura";
  } else if (daysSinceCoverageEnd > 0 && daysSinceCoverageEnd <= 15) {
    bg = "#fef3c7";
    color = "#92400e";
    label = "Posible retraso";
  } else if (daysSinceCoverageEnd > 15) {
    bg = "#fee2e2";
    color = "#b91c1c";
    label = "Sin retiro reciente";
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: "0.75rem",
        fontWeight: 600,
        backgroundColor: bg,
        color,
      }}
    >
      {label}
    </span>
  );
};

export default function PharmaDrugsTable({
  drugs,
  loading,
  error,
}: PharmaDrugsTableProps) {
  // Nunca trabajamos directamente con `drugs` sin protegerlo
  const list = drugs ?? [];

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
        Detalle por medicamento
      </h3>

      {loading && <p>Cargando…</p>}

      {error && !loading && (
        <p style={{ fontSize: "0.8rem", color: "#b91c1c" }}>{error}</p>
      )}

      {!loading && !error && list.length > 0 && (
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
                <th style={{ padding: "8px 4px" }}>Medicamento</th>
                <th style={{ padding: "8px 4px" }}>Código</th>
                <th style={{ padding: "8px 4px" }}>Dispensas</th>
                <th style={{ padding: "8px 4px" }}>Total unidades</th>
                <th style={{ padding: "8px 4px" }}>Días cubiertos</th>
                <th style={{ padding: "8px 4px" }}>Primera dispensa</th>
                <th style={{ padding: "8px 4px" }}>Última dispensa</th>
                <th style={{ padding: "8px 4px" }}>Estado</th>
                <th style={{ padding: "8px 4px" }}>Adherencia</th>
                <th style={{ padding: "8px 4px" }}>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {list.map((drug) => (
                <tr key={drug.drugCode || drug.drugName}>
                  <td style={{ padding: "6px 4px" }}>{drug.drugName}</td>
                  <td style={{ padding: "6px 4px" }}>{drug.drugCode}</td>
                  <td style={{ padding: "6px 4px" }}>{drug.fills}</td>
                  <td style={{ padding: "6px 4px" }}>{drug.totalQuantity}</td>
                  <td style={{ padding: "6px 4px" }}>{drug.daysCovered}</td>
                  <td style={{ padding: "6px 4px" }}>
                    {formatDate(drug.firstDispenseDate)}
                  </td>
                  <td style={{ padding: "6px 4px" }}>
                    {formatDate(drug.lastDispenseDate)}
                  </td>
                  <td style={{ padding: "6px 4px" }}>
                    {renderStatusChip(drug)}
                  </td>
                  <td style={{ padding: "6px 4px" }}>
                    {renderAdherenceChip(drug.adherencePercentApprox ?? 0)}
                  </td>
                  <td style={{ padding: "6px 4px" }}>
                    {renderChronicChip(drug.chronic)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && list.length === 0 && (
        <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: 0 }}>
          No se registran dispensas de medicamentos en la ventana analizada.
        </p>
      )}
    </section>
  );
}
