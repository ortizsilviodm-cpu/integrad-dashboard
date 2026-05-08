import type { CSSProperties } from "react";
import type { PatientSummaryResponse } from "../../api/patientSummary";
import type { PatientContextData } from "../../hooks/usePatientContext";

type PatientWorkspaceHeaderProps = {
  isWorkspacePanelOpen: boolean;
  onBackToCaseload?: () => void;
  backButtonStyle: CSSProperties;
  patientLoading: boolean;
  patientError: string | null;
  patientSummary: PatientSummaryResponse | null;
  initialPatientId: string | null;
  initialEventId: string | null;
  patientContext: PatientContextData;
  patientContextLoading: boolean;
  patientContextError: string | null;
};

export default function PatientWorkspaceHeader({
  isWorkspacePanelOpen,
  onBackToCaseload,
  backButtonStyle,
  patientLoading,
  patientError,
  patientSummary,
  initialPatientId,
  initialEventId,
  patientContext,
  patientContextLoading,
  patientContextError,
}: PatientWorkspaceHeaderProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0.3,
              textTransform: "uppercase",
              color: "#6b7280",
              marginBottom: 6,
            }}
          >
            Caseload &gt; Workspace del paciente
          </div>

          <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.5 }}>
            {isWorkspacePanelOpen
              ? "Intervención abierta. Estás trabajando dentro del caso seleccionado."
              : "Resumen del workspace. Cerraste el panel de intervención, pero seguís dentro del caso del paciente."}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {onBackToCaseload ? (
            <button type="button" onClick={onBackToCaseload} style={backButtonStyle}>
              Volver al caseload
            </button>
          ) : null}
        </div>
      </div>

      <div
        style={{
          color: "#065f46",
          background: "#d1fae5",
          border: "1px solid #6ee7b7",
          borderRadius: 12,
          padding: "12px 14px",
          marginBottom: 12,
          fontSize: 13,
        }}
      >
        {patientLoading ? (
          <>Cargando datos del paciente...</>
        ) : patientError ? (
          <>Workspace del paciente: {initialPatientId}</>
        ) : patientSummary ? (
          <>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {patientSummary.patient.fullName}
            </div>
            <div style={{ fontSize: 12, color: "#374151" }}>
              DOC: {patientSummary.patient.documentNumber || patientSummary.patient.documentId} | {patientSummary.patient.healthPlan || patientSummary.patient.payerCode || "Sin obra social"} | ADH: {patientSummary.adherence.coveragePercent}% en {patientSummary.adherence.daysWindow} días
              {initialEventId ? ` | contexto: ${initialEventId.slice(0, 8)}` : ""}
            </div>
          </>
        ) : (
          <>Workspace del paciente: {initialPatientId}</>
        )}
      </div>

      {!isWorkspacePanelOpen ? (
        <div
          style={{
            marginTop: -2,
            marginBottom: 12,
            fontSize: 13,
            color: "#475569",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "10px 12px",
            lineHeight: 1.5,
          }}
        >
          Estás viendo el <strong>workspace del paciente</strong>. Si querés salir de este contexto y volver a la bandeja completa, usá <strong>“Volver al caseload”</strong>. Si querés retomar la intervención puntual, usá <strong>“Gestionar”</strong> en la fila del evento.
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 12,
        }}
      >
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Glucemias</div>
          {patientContextLoading ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>Cargando contexto...</div>
          ) : patientContext.glucoseSeries.length > 0 ? (
            patientContext.glucoseSeries.slice(-5).reverse().map((entry, index) => (
              <div key={`${entry.timestamp}-${index}`} style={{ fontSize: 13, marginBottom: 6, color: "#374151" }}>
                {entry.value} · {new Date(entry.timestamp).toLocaleString("es-AR")}
              </div>
            ))
          ) : (
            <div style={{ fontSize: 13, color: "#6b7280" }}>Sin glucemias visibles.</div>
          )}
        </section>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Eventos</div>
          {patientContextLoading ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>Cargando contexto...</div>
          ) : patientContext.events.length > 0 ? (
            patientContext.events.slice(-5).reverse().map((entry, index) => (
              <div key={`${entry.timestamp}-${entry.type}-${index}`} style={{ fontSize: 13, marginBottom: 8, color: "#374151" }}>
                <div style={{ fontWeight: 500 }}>{entry.type}</div>
                <div>{entry.description}</div>
                <div>{new Date(entry.timestamp).toLocaleString("es-AR")}</div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: 13, color: "#6b7280" }}>Sin eventos visibles.</div>
          )}
        </section>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Notas</div>
          {patientContextLoading ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>Cargando contexto...</div>
          ) : patientContext.notes.length > 0 ? (
            patientContext.notes.slice(-5).reverse().map((entry, index) => (
              <div key={`${entry.createdAt}-${entry.type}-${index}`} style={{ fontSize: 13, marginBottom: 8, color: "#374151" }}>
                <div>{entry.text}</div>
                <div style={{ color: "#6b7280", marginTop: 2 }}>
                  {new Date(entry.createdAt).toLocaleString("es-AR")}
                </div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: 13, color: "#6b7280" }}>Sin notas visibles.</div>
          )}
        </section>
      </div>

      {patientContextError ? (
        <div
          style={{
            marginTop: 12,
            fontSize: 13,
            color: "#92400e",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: 12,
            padding: "10px 12px",
          }}
        >
          Contexto del paciente no disponible: {patientContextError}
        </div>
      ) : null}
    </div>
  );
}
