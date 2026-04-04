/* integrad-dashboard/src/components/medications/AddMedicationModal.tsx */

import { useState } from "react";
import { API_URL } from "../../config/api";
import { safeFetch } from "../../api/safeFetch";

export interface AddMedicationModalProps {
  patientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontSize: "0.8rem",
  fontWeight: 600,
  color: "#374151",
};

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: 38,
  padding: "8px 10px",
  border: "1px solid #d1d5db",
  borderRadius: 10,
  fontSize: "0.9rem",
  color: "#111827",
  background: "#ffffff",
};

const TEXTAREA_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  minHeight: 88,
  resize: "vertical",
  fontFamily: "inherit",
};

export default function AddMedicationModal({
  patientId,
  onClose,
  onSuccess,
}: AddMedicationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    medicationCode: "",
    medicationName: "",
    type: "CRONICO",
    dose: "",
    frequency: "",
    schedulePattern: "",
    route: "",
    startDate: "",
    endDate: "",
    prescriberName: "",
    notes: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setError(null);

    if (!form.medicationCode.trim()) {
      setError("El código del medicamento es obligatorio.");
      return;
    }
    if (!form.dose.trim()) {
      setError("La dosis es obligatoria.");
      return;
    }
    if (!form.frequency.trim()) {
      setError("La frecuencia es obligatoria.");
      return;
    }
    if (!form.startDate.trim()) {
      setError("La fecha de inicio es obligatoria.");
      return;
    }

    setLoading(true);

    const endpoint = `${API_URL}/patients/${patientId}/medications`;

    const payload = {
      medicationCode: form.medicationCode,
      medicationName: form.medicationName || undefined,
      type: form.type,
      dose: form.dose,
      frequency: form.frequency,
      schedulePattern: form.schedulePattern || undefined,
      route: form.route || undefined,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      prescriberName: form.prescriberName || undefined,
      notes: form.notes || undefined,
    };

    const result = await safeFetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? "No se pudo registrar la medicación.");
      return;
    }

    onSuccess();
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(8px)",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 18,
          padding: 24,
          width: "100%",
          maxWidth: 720,
          boxShadow: "0 16px 48px rgba(0,0,0,0.2)",
          boxSizing: "border-box",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: 18 }}>
          <h2
            style={{
              marginTop: 0,
              marginBottom: 6,
              fontSize: "1.35rem",
              color: "#1f2937",
            }}
          >
            Agregar medicación
          </h2>
          <p
            className="chart-subtitle"
            style={{
              margin: 0,
              fontSize: "0.9rem",
              color: "#6b7280",
              lineHeight: 1.45,
            }}
          >
            Registrar un nuevo tratamiento farmacológico para el paciente.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 14,
            marginBottom: 16,
          }}
        >
          <div style={{ gridColumn: "1 / 3" }}>
            <label style={LABEL_STYLE}>Código del medicamento</label>
            <input
              type="text"
              value={form.medicationCode}
              onChange={(e) =>
                handleChange("medicationCode", e.target.value.toUpperCase())
              }
              style={INPUT_STYLE}
            />
          </div>

          <div style={{ gridColumn: "1 / 3" }}>
            <label style={LABEL_STYLE}>Nombre (opcional)</label>
            <input
              type="text"
              value={form.medicationName}
              onChange={(e) => handleChange("medicationName", e.target.value)}
              style={INPUT_STYLE}
            />
          </div>

          <div>
            <label style={LABEL_STYLE}>Tipo</label>
            <select
              value={form.type}
              onChange={(e) => handleChange("type", e.target.value)}
              style={INPUT_STYLE}
            >
              <option value="CRONICO">Crónico</option>
              <option value="OCASIONAL">Ocasional</option>
            </select>
          </div>

          <div>
            <label style={LABEL_STYLE}>Vía</label>
            <input
              type="text"
              placeholder="oral / subcutánea / etc."
              value={form.route}
              onChange={(e) => handleChange("route", e.target.value)}
              style={INPUT_STYLE}
            />
          </div>

          <div>
            <label style={LABEL_STYLE}>Dosis</label>
            <input
              type="text"
              placeholder="500 mg / 20 UI"
              value={form.dose}
              onChange={(e) => handleChange("dose", e.target.value)}
              style={INPUT_STYLE}
            />
          </div>

          <div>
            <label style={LABEL_STYLE}>Frecuencia</label>
            <input
              type="text"
              placeholder="2 veces por día"
              value={form.frequency}
              onChange={(e) => handleChange("frequency", e.target.value)}
              style={INPUT_STYLE}
            />
          </div>

          <div style={{ gridColumn: "1 / 3" }}>
            <label style={LABEL_STYLE}>Patrón (opcional)</label>
            <input
              type="text"
              placeholder="mañana / noche"
              value={form.schedulePattern}
              onChange={(e) => handleChange("schedulePattern", e.target.value)}
              style={INPUT_STYLE}
            />
          </div>

          <div>
            <label style={LABEL_STYLE}>Fecha inicio</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
              style={INPUT_STYLE}
            />
          </div>

          <div>
            <label style={LABEL_STYLE}>Fecha fin (opcional)</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => handleChange("endDate", e.target.value)}
              style={INPUT_STYLE}
            />
          </div>

          <div style={{ gridColumn: "1 / 3" }}>
            <label style={LABEL_STYLE}>Prescriptor (opcional)</label>
            <input
              type="text"
              value={form.prescriberName}
              onChange={(e) => handleChange("prescriberName", e.target.value)}
              style={INPUT_STYLE}
            />
          </div>

          <div style={{ gridColumn: "1 / 3" }}>
            <label style={LABEL_STYLE}>Notas clínicas</label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              style={TEXTAREA_STYLE}
            />
          </div>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 14,
              padding: "10px 12px",
              borderRadius: 10,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: "0.88rem",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            marginTop: 4,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              minWidth: 96,
              padding: "8px 16px",
              borderRadius: 999,
              border: "1px solid #d1d5db",
              background: "#e5e7eb",
              color: "#374151",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              minWidth: 150,
              padding: "8px 16px",
              borderRadius: 999,
              border: "1px solid #2563eb",
              background: "#2563eb",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: 600,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Guardando..." : "Guardar medicación"}
          </button>
        </div>
      </div>
    </div>
  );
}