/* integrad-dashboard/src/components/clinical/AddClinicalIndicatorModal.tsx */

import { useState } from "react";
import {
  postClinicalIndicators,
  type ClinicalIndicatorType,
  type ClinicalIndicatorSource,
} from "../../api/clinicalIndicators";

interface AddClinicalIndicatorModalProps {
  patientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const INDICATOR_OPTIONS: { value: ClinicalIndicatorType; label: string }[] = [
  { value: "HBA1C", label: "HbA1c" },
  { value: "GLUCOSE_FASTING", label: "Glucemia en ayunas" },
  { value: "GLUCOSE_POSTPRANDIAL", label: "Glucemia postprandial" },
  { value: "SYSTOLIC_BP", label: "PA sistólica (mmHg)" },
  { value: "DIASTOLIC_BP", label: "PA diastólica (mmHg)" },
  { value: "TOTAL_CHOLESTEROL", label: "Colesterol total" },
  { value: "TRIGLYCERIDES", label: "Triglicéridos" },
  { value: "BMI", label: "IMC" },
];

const SOURCE_OPTIONS: { value: ClinicalIndicatorSource; label: string }[] = [
  { value: "MANUAL", label: "Carga manual" },
  { value: "IMPORTED", label: "Importado" },
  { value: "DEVICE", label: "Dispositivo" },
];

/**
 * Unidad sugerida según tipo de indicador clínico.
 */
function getDefaultUnit(type: ClinicalIndicatorType): string {
  switch (type) {
    case "HBA1C":
      return "%";
    case "GLUCOSE_FASTING":
    case "GLUCOSE_POSTPRANDIAL":
    case "TOTAL_CHOLESTEROL":
    case "TRIGLYCERIDES":
      return "mg/dL";
    case "SYSTOLIC_BP":
    case "DIASTOLIC_BP":
      return "mmHg";
    case "BMI":
      return "kg/m²";
    default:
      return "";
  }
}

/**
 * Rango sugerido por tipo (para evitar cosas locas tipo HbA1c 300%).
 * Son rangos amplios, solo para validación básica.
 */
function getIndicatorRange(type: ClinicalIndicatorType): {
  min: number;
  max: number;
  step: string;
} {
  switch (type) {
    case "HBA1C":
      return { min: 3, max: 20, step: "0.1" }; // %
    case "GLUCOSE_FASTING":
    case "GLUCOSE_POSTPRANDIAL":
      return { min: 40, max: 800, step: "1" }; // mg/dL
    case "SYSTOLIC_BP":
      return { min: 70, max: 260, step: "1" }; // mmHg
    case "DIASTOLIC_BP":
      return { min: 40, max: 160, step: "1" }; // mmHg
    case "TOTAL_CHOLESTEROL":
      return { min: 70, max: 500, step: "1" }; // mg/dL
    case "TRIGLYCERIDES":
      return { min: 30, max: 1500, step: "1" }; // mg/dL
    case "BMI":
      return { min: 10, max: 80, step: "0.1" }; // kg/m²
    default:
      return { min: 0, max: 10000, step: "0.01" };
  }
}

/**
 * Devuelve el label humano del tipo (para mensajes de error).
 */
function getIndicatorLabel(type: ClinicalIndicatorType): string {
  const found = INDICATOR_OPTIONS.find((opt) => opt.value === type);
  return found?.label ?? type;
}

export default function AddClinicalIndicatorModal({
  patientId,
  onClose,
  onSuccess,
}: AddClinicalIndicatorModalProps) {
  const [type, setType] = useState<ClinicalIndicatorType>("HBA1C");
  const [value, setValue] = useState<string>("");

  // Arrancamos con la unidad sugerida para HBA1C
  const [unit, setUnit] = useState<string>(() => getDefaultUnit("HBA1C"));

  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    // yyyy-mm-dd
    return today.toISOString().slice(0, 10);
  });
  const [source, setSource] = useState<ClinicalIndicatorSource>("MANUAL");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChangeType = (newType: ClinicalIndicatorType) => {
    setType(newType);

    // Actualizamos unidad solo si:
    // - estaba vacía, o
    // - era la unidad por defecto del tipo anterior (para no pisar algo escrito a mano)
    setUnit((prevUnit) => {
      const prevDefault = getDefaultUnit(type);
      if (!prevUnit || prevUnit === prevDefault) {
        return getDefaultUnit(newType);
      }
      return prevUnit;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const label = getIndicatorLabel(type);
    const { min, max } = getIndicatorRange(type);

    const numeric = value !== "" ? Number(value.replace(",", ".")) : NaN;
    if (!Number.isFinite(numeric)) {
      setError("Ingresá un valor numérico válido.");
      return;
    }

    if (numeric < min || numeric > max) {
      setError(
        `El valor para "${label}" parece fuera de rango (${min}–${max}). Revisalo.`
      );
      return;
    }

    const takenAt = new Date(date);
    if (Number.isNaN(takenAt.getTime())) {
      setError("La fecha no es válida.");
      return;
    }

    setSaving(true);
    try {
      await postClinicalIndicators(patientId, [
        {
          type,
          valueNumeric: numeric,
          unit: unit || null,
          takenAt: takenAt.toISOString(),
          source,
        },
      ]);

      onSuccess();
    } catch (err) {
      console.error("Error al registrar indicador clínico:", err);
      setError("No se pudo guardar el indicador. Intente nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  const { min, max, step } = getIndicatorRange(type);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15,23,42,0.45)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#ffffff",
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 15px 40px rgba(15,23,42,0.35)",
          fontSize: "0.9rem",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>
          Registrar indicador clínico
        </h3>
        <p style={{ marginTop: 0, marginBottom: 16, color: "#6b7280" }}>
          Este valor se usará para actualizar el resumen clínico y el riesgo del
          paciente.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "block", marginBottom: 4 }}>
              Tipo de indicador
            </label>
            <select
              value={type}
              onChange={(e) =>
                handleChangeType(e.target.value as ClinicalIndicatorType)
              }
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
              }}
            >
              {INDICATOR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: 4 }}>Valor</label>
              <input
                type="number"
                step={step}
                min={min}
                max={max}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                }}
                required
              />
            </div>
            <div style={{ width: 110 }}>
              <label style={{ display: "block", marginBottom: 4 }}>Unidad</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="% / mg/dL / mmHg"
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "block", marginBottom: 4 }}>
              Fecha de toma
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
              }}
              required
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "block", marginBottom: 4 }}>
              Origen del dato
            </label>
            <select
              value={source}
              onChange={(e) =>
                setSource(e.target.value as ClinicalIndicatorSource)
              }
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
              }}
            >
              {SOURCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p style={{ color: "#b91c1c", fontSize: "0.8rem", marginTop: 4 }}>
              {error}
            </p>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 16,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                border: "none",
                borderRadius: 999,
                padding: "6px 14px",
                background: "#e5e7eb",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 500,
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                border: "none",
                borderRadius: 999,
                padding: "6px 14px",
                background: "#2563eb",
                color: "#ffffff",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              {saving ? "Guardando..." : "Guardar indicador"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
