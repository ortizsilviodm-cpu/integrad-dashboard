/* integrad-dashboard\src\components\clinicalSignals\ClinicalSignalItem.tsx  */

import type { ClinicalSignal } from "../../types/clinicalSignals.types";
import {
  getPatientLabel,
  getSeverityColor,
  getSeverityLabel,
  getSignalDescription,
} from "../../logic/clinicalSignals.logic";

type Props = {
  signal: ClinicalSignal;
};

export function ClinicalSignalItem({ signal }: Props) {
  return (
    <div
      className="status-message"
      style={{
        backgroundColor: "var(--color-card-bg)",
        border: "1px solid var(--color-border)",
        marginBottom: "1rem",
        borderLeft: `4px solid ${getSeverityColor(signal.severity)}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 600,
              fontSize: "0.95rem",
              color: "var(--color-text)",
              marginBottom: "6px",
            }}
          >
            {getPatientLabel(signal)}
          </div>

          <div
            style={{
              fontSize: "0.95rem",
              fontWeight: 500,
              color: "var(--color-text)",
              lineHeight: 1.4,
            }}
          >
            {getSignalDescription(signal)}
          </div>
        </div>

        <span
          style={{
            fontWeight: "bold",
            color: getSeverityColor(signal.severity),
            whiteSpace: "nowrap",
          }}
        >
          {getSeverityLabel(signal.severity)}
        </span>
      </div>

      <div
        style={{
          fontSize: "12px",
          color: "var(--color-text-secondary)",
          marginTop: "10px",
        }}
      >
        Última detección:{" "}
        {new Date(signal.lastDetectedAt).toLocaleString("es-AR")}
      </div>
    </div>
  );
}