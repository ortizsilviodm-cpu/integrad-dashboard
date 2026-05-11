import type { CSSProperties } from "react";

type PatientWorkspaceHeaderProps = {
  onBackToCaseload?: () => void;
  backButtonStyle: CSSProperties;
  patientName: string | null;
  patientId: string | null;
};

export default function PatientWorkspaceHeader({
  onBackToCaseload,
  backButtonStyle,
  patientName,
  patientId,
}: PatientWorkspaceHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
        flexWrap: "wrap",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#94a3b8",
            }}
          >
            Caseload
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#1e293b",
              lineHeight: 1.2,
              marginTop: 2,
            }}
          >
            {patientName || "—"}
          </div>
        </div>
      </div>

      {onBackToCaseload && (
        <button type="button" onClick={onBackToCaseload} style={backButtonStyle}>
          ← Volver a bandeja
        </button>
      )}

      <div
        style={{
          fontSize: 12,
          color: "#94a3b8",
          marginLeft: "auto",
          whiteSpace: "nowrap",
        }}
      >
        {patientId ? `ID: ${patientId.slice(0, 8)}` : ""}
      </div>
    </div>
  );
}