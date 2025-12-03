// integrad-dashboard/src/components/medications/AddMedicationModal.tsx

import { useState } from "react";
import { API_URL } from "../../config/api";
import { safeFetch } from "../../api/safeFetch";

export interface AddMedicationModalProps {
  patientId: string;
  onClose: () => void;
  onSuccess: () => void; // refresca la ficha
}

export default function AddMedicationModal({
  patientId,
  onClose,
  onSuccess,
}: AddMedicationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campos del formulario
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

    // Validación mínima
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

    // 👇 Payload separado y serializado a JSON (para que type body sea válido)
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

    onSuccess(); // Actualizar vista padre
    onClose(); // Cerrar modal
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
          borderRadius: 16,
          padding: 24,
          width: "100%",
          maxWidth: 560,
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: 12 }}>Agregar medicación</h2>
        <p className="chart-subtitle" style={{ marginBottom: 16 }}>
          Registrar un nuevo tratamiento farmacológico para el paciente.
        </p>

        {/* FORMULARIO */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div style={{ gridColumn: "1 / 3" }}>
            <label>Código del medicamento</label>
            <input
              type="text"
              value={form.medicationCode}
              onChange={(e) =>
                handleChange("medicationCode", e.target.value.toUpperCase())
              }
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ gridColumn: "1 / 3" }}>
            <label>Nombre (opcional)</label>
            <input
              type="text"
              value={form.medicationName}
              onChange={(e) => handleChange("medicationName", e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label>Tipo</label>
            <select
              value={form.type}
              onChange={(e) => handleChange("type", e.target.value)}
              style={{ width: "100%" }}
            >
              <option value="CRONICO">Crónico</option>
              <option value="OCASIONAL">Ocasional</option>
            </select>
          </div>

          <div>
            <label>Vía</label>
            <input
              type="text"
              placeholder="oral / subcutánea / etc."
              value={form.route}
              onChange={(e) => handleChange("route", e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label>Dosis</label>
            <input
              type="text"
              placeholder="500 mg / 20 UI"
              value={form.dose}
              onChange={(e) => handleChange("dose", e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label>Frecuencia</label>
            <input
              type="text"
              placeholder="2 veces por día"
              value={form.frequency}
              onChange={(e) => handleChange("frequency", e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ gridColumn: "1 / 3" }}>
            <label>Patrón (opcional)</label>
            <input
              type="text"
              placeholder="mañana / noche"
              value={form.schedulePattern}
              onChange={(e) =>
                handleChange("schedulePattern", e.target.value)
              }
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label>Fecha inicio</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label>Fecha fin (opcional)</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => handleChange("endDate", e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ gridColumn: "1 / 3" }}>
            <label>Prescriptor (opcional)</label>
            <input
              type="text"
              value={form.prescriberName}
              onChange={(e) => handleChange("prescriberName", e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ gridColumn: "1 / 3" }}>
            <label>Notas clínicas</label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              style={{ width: "100%", minHeight: 70 }}
            />
          </div>
        </div>

        {error && (
          <p style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</p>
        )}

        {/* ACCIONES */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              background: "#e5e7eb",
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              background: "#2563eb",
              color: "#fff",
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
