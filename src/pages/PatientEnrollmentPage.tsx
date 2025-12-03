/* integrad-dashboard/src/pages/PatientEnrollmentPage.tsx */

import React, { useState } from "react";
import {
  enrollChronicPatient,
  type EnrollmentRequest,
  type EnrollmentResponse,
} from "../api/patientEnrollment";
import {
  saveClinicalIndicators,
  type SaveClinicalIndicatorsRequest,
} from "../api/clinicalIndicators";

/**
 * 🧩 IntegraD — Enrolamiento Paciente Crónico (Diabetes)
 *
 * - Soporta alta / actualización administrativa del paciente crónico.
 * - No realiza diagnóstico ni prescripción.
 * - Ahora también permite registrar un PERFIL CLÍNICO INICIAL
 *   con indicadores básicos (glucemia, HbA1c, PA, lípidos, etc.).
 * - Usa estilos coherentes con el Dashboard (card .app-table).
 */

// 🎨 Estilos reutilizables (solo para este formulario)
const formWrapperStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  marginTop: 8,
};

const formGridStyle: React.CSSProperties = {
  /* La definición de columnas ahora está en .enrollment-grid (App.css) */
  display: "grid",
  gap: 16,
  alignItems: "flex-start",
};

const fieldsetStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 16,
  minWidth: 0,
  backgroundColor: "#f9fafb",
  boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
};

const legendStyle: React.CSSProperties = {
  padding: "0 8px",
  fontSize: "var(--font-size-sm)",
  fontWeight: 600,
  color: "#374151",
};

const groupStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  marginTop: 10,
};

const labelStyle: React.CSSProperties = {
  fontSize: "var(--font-size-sm)",
  fontWeight: 600,
  color: "#4b5563",
};

const helperStyle: React.CSSProperties = {
  fontSize: "var(--font-size-xs)",
  color: "#9ca3af",
};

const inputBaseStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  fontSize: "var(--font-size-md)",
  outline: "none",
  backgroundColor: "#ffffff",
};

const inputFocusStyle: React.CSSProperties = {
  borderColor: "#2f42ad",
  boxShadow: "0 0 0 1px rgba(47,66,173,0.3)",
};

const textareaStyle: React.CSSProperties = {
  ...inputBaseStyle,
  resize: "vertical",
  minHeight: 90,
};

const submitRowStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  marginTop: 8,
};

const submitButtonStyle: React.CSSProperties = {
  padding: "0.6rem 1.4rem",
  backgroundColor: "var(--color-primary)",
  color: "#ffffff",
  border: "none",
  borderRadius: 999,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "var(--font-size-sm)",
  boxShadow: "0 2px 6px rgba(15, 23, 42, 0.18)",
  transition:
    "background-color 0.15s ease, box-shadow 0.15s ease, transform 0.05s ease, opacity 0.1s ease",
  alignSelf: "flex-start",
};

const submitButtonDisabledStyle: React.CSSProperties = {
  opacity: 0.7,
  cursor: "default",
  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.12)",
};

const successBoxStyle: React.CSSProperties = {
  marginTop: 4,
  padding: 10,
  borderRadius: 10,
  backgroundColor: "#e8f5e9",
  color: "#166534",
  fontSize: "var(--font-size-sm)",
  maxWidth: 640,
  border: "1px solid #bbf7d0",
};

const readOnlyPillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: "var(--font-size-xs)",
  backgroundColor: "#eff6ff",
  color: "#1d4ed8",
  border: "1px solid #bfdbfe",
};

const DEFAULT_PAYER_CODE = "APOS";
const DEFAULT_HEALTH_PLAN = "APOS DIABETES";

// Estado local para la ficha clínica inicial
interface ClinicalFormState {
  // Perfil metabólico
  glucoseFasting: string;
  glucosePostprandial: string;
  hba1c: string;
  totalCholesterol: string;
  hdl: string;
  ldl: string;
  triglycerides: string;
  bmi: string;

  // Perfil renal
  microalbuminuria: string;
  proteinuria: string;

  // Perfil cardiovascular
  systolicBP: string;
  diastolicBP: string;
  smokingStatus: string;
}

const defaultClinicalForm: ClinicalFormState = {
  glucoseFasting: "",
  glucosePostprandial: "",
  hba1c: "",
  totalCholesterol: "",
  hdl: "",
  ldl: "",
  triglycerides: "",
  bmi: "",
  microalbuminuria: "",
  proteinuria: "",
  systolicBP: "",
  diastolicBP: "",
  smokingStatus: "",
};

// 🔁 Estado inicial reutilizable para el formulario de enrolamiento
const defaultEnrollmentForm: EnrollmentRequest = {
  personal: {
    firstName: "",
    lastName: "",
    documentId: "",
    phone: "",
  },
  coverage: {
    payerCode: DEFAULT_PAYER_CODE,
    membershipCode: "",
    affiliateNumber: "",
    healthPlan: DEFAULT_HEALTH_PLAN,
    planCode: "",
  },
  appUser: {
    email: "",
  },
  program: {
    mainProvider: "",
    notes: "",
  },
};

const PatientEnrollmentPage: React.FC = () => {
  const [form, setForm] = useState<EnrollmentRequest>(defaultEnrollmentForm);
  const [clinicalForm, setClinicalForm] =
    useState<ClinicalFormState>(defaultClinicalForm);

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<EnrollmentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clinicalError, setClinicalError] = useState<string | null>(null);

  function handleChange(
    section: keyof EnrollmentRequest,
    field: string,
    value: string
  ) {
    setForm((prev) => {
      const clone: any = { ...prev };

      if (section === "personal" || section === "coverage") {
        clone[section] = {
          ...clone[section],
          [field]: value,
        };
      } else if (section === "appUser" || section === "program") {
        clone[section] = {
          ...(clone[section] ?? {}),
          [field]: value,
        };
      }

      return clone;
    });
  }

  function handleClinicalChange(field: keyof ClinicalFormState, value: string) {
    setClinicalForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  // Construye el payload de indicadores clínicos a partir del formulario local
  const buildClinicalIndicatorsPayload = (): SaveClinicalIndicatorsRequest => {
    const indicators: SaveClinicalIndicatorsRequest["indicators"] = [];
    const nowIso = new Date().toISOString();

    const pushNumeric = (
      value: string,
      type: string,
      unit?: string,
      _context?: string
    ) => {
      const trimmed = value.trim();
      if (!trimmed) return;

      const num = Number(trimmed.replace(",", "."));
      if (Number.isNaN(num)) return;

      indicators.push({
        type: type as any,
        valueNumeric: num,
        unit: unit ?? null,
        takenAt: nowIso,
        // ⚠️ FIX: se eliminó `context` porque no existe en ClinicalIndicatorInput
        source: "MANUAL",
      });
    };

    const pushText = (
      value: string,
      type: string,
      unit?: string,
      _context?: string
    ) => {
      const trimmed = value.trim();
      if (!trimmed) return;

      indicators.push({
        type: type as any,
        valueText: trimmed,
        unit: unit ?? null,
        takenAt: nowIso,
        // ⚠️ FIX: se eliminó `context`
        source: "MANUAL",
      });
    };

    // Perfil metabólico
    pushNumeric(
      clinicalForm.glucoseFasting,
      "GLUCOSE_FASTING",
      "mg/dL",
      "ayunas"
    );
    pushNumeric(
      clinicalForm.glucosePostprandial,
      "GLUCOSE_POSTPRANDIAL",
      "mg/dL",
      "posprandial"
    );
    pushNumeric(clinicalForm.hba1c, "HBA1C", "%");
    pushNumeric(clinicalForm.totalCholesterol, "TOTAL_CHOLESTEROL", "mg/dL");
    pushNumeric(clinicalForm.hdl, "HDL_C", "mg/dL");
    pushNumeric(clinicalForm.ldl, "LDL_C", "mg/dL");
    pushNumeric(clinicalForm.triglycerides, "TRIGLYCERIDES", "mg/dL");
    pushNumeric(clinicalForm.bmi, "BMI", "kg/m2");

    // Perfil renal
    pushNumeric(clinicalForm.microalbuminuria, "MICROALBUMINURIA", "mg/g");
    pushNumeric(clinicalForm.proteinuria, "PROTEINURIA");

    // Perfil cardiovascular
    pushNumeric(clinicalForm.systolicBP, "SYSTOLIC_BP", "mmHg");
    pushNumeric(clinicalForm.diastolicBP, "DIASTOLIC_BP", "mmHg");
    pushText(clinicalForm.smokingStatus, "SMOKING_STATUS");

    return { indicators };
  };

  // 🔁 Reset controlado de formularios tras enrolamiento exitoso
  const resetFormsAfterSuccess = () => {
    setForm(defaultEnrollmentForm);
    setClinicalForm(defaultClinicalForm);
    setFocusedField(null);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setClinicalError(null);
    setSuccess(null);

    const payload: EnrollmentRequest = {
      ...form,
      appUser: form.appUser && form.appUser.email ? form.appUser : undefined,
      program:
        form.program && (form.program.mainProvider || form.program.notes)
          ? form.program
          : undefined,
    };

    try {
      // 1) Enrolar paciente crónico (parte administrativa)
      const response = await enrollChronicPatient(payload);
      setSuccess(response);

      // 2) Si hay indicadores clínicos cargados, los enviamos
      const indicatorsPayload = buildClinicalIndicatorsPayload();

      if (
        response?.patient?.id &&
        indicatorsPayload.indicators &&
        indicatorsPayload.indicators.length > 0
      ) {
        try {
          await saveClinicalIndicators(response.patient.id, indicatorsPayload);
        } catch (err: any) {
          console.error("Error guardando ficha clínica inicial:", err);
          setClinicalError(
            "El enrolamiento se guardó, pero hubo un problema guardando la ficha clínica inicial."
          );
        }
      }

      // 3) Tras éxito, limpiamos los formularios para permitir nuevas altas
      resetFormsAfterSuccess();
    } catch (err: any) {
      console.error("Error enrolando paciente crónico:", err);
      setError(
        err?.message ?? "No se pudo enrolar el paciente. Intente nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }

  const getInputStyle = (name: string): React.CSSProperties => ({
    ...inputBaseStyle,
    ...(focusedField === name ? inputFocusStyle : {}),
  });

  return (
    <section className="app-table">
      {/* Encabezado consistente con el resto del dashboard */}
      <header className="section-header">
        <h2>Enrolar paciente crónico — Diabetes</h2>
        <p className="chart-subtitle">
          Registrá o actualizá los datos del paciente, su cobertura y la
          inscripción al programa crónico de diabetes. Este proceso es
          administrativo y forma parte del modelo de gestión IntegraD (sin
          decisiones clínicas automatizadas). Además, podés registrar un perfil
          clínico inicial con indicadores básicos para seguimiento, alertas e IA
          (sin emitir diagnósticos).
        </p>
      </header>

      <form onSubmit={handleSubmit} style={formWrapperStyle}>
        {/* 🧱 Grilla principal de tarjetas */}
        <div style={formGridStyle} className="enrollment-grid">
          {/* DATOS PERSONALES */}
          <fieldset style={fieldsetStyle}>
            <legend style={legendStyle}>Datos personales</legend>

            <div style={groupStyle}>
              <label style={labelStyle}>Nombre</label>
              <input
                type="text"
                style={getInputStyle("firstName")}
                value={form.personal.firstName}
                onFocus={() => setFocusedField("firstName")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) =>
                  handleChange("personal", "firstName", e.target.value)
                }
              />
            </div>

            <div style={groupStyle}>
              <label style={labelStyle}>Apellido</label>
              <input
                type="text"
                style={getInputStyle("lastName")}
                value={form.personal.lastName}
                onFocus={() => setFocusedField("lastName")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) =>
                  handleChange("personal", "lastName", e.target.value)
                }
              />
            </div>

            <div style={groupStyle}>
              <label style={labelStyle}>Documento</label>
              <input
                type="text"
                style={getInputStyle("documentId")}
                value={form.personal.documentId}
                onFocus={() => setFocusedField("documentId")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) =>
                  handleChange("personal", "documentId", e.target.value)
                }
              />
            </div>

            <div style={groupStyle}>
              <label style={labelStyle}>Teléfono</label>
              <input
                type="text"
                style={getInputStyle("phone")}
                value={form.personal.phone ?? ""}
                onFocus={() => setFocusedField("phone")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) =>
                  handleChange("personal", "phone", e.target.value)
                }
              />
            </div>

            <div style={groupStyle}>
              <label style={labelStyle}>Fecha de nacimiento (opcional)</label>
              <input
                type="date"
                style={getInputStyle("birthDate")}
                onFocus={() => setFocusedField("birthDate")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) =>
                  handleChange(
                    "personal",
                    "birthDate",
                    e.target.value ? new Date(e.target.value).toISOString() : ""
                  )
                }
              />
            </div>

            <div style={groupStyle}>
              <label style={labelStyle}>Género (opcional)</label>
              <input
                type="text"
                placeholder="M / F / X, etc."
                style={getInputStyle("gender")}
                value={form.personal.gender ?? ""}
                onFocus={() => setFocusedField("gender")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) =>
                  handleChange("personal", "gender", e.target.value)
                }
              />
            </div>
          </fieldset>

          {/* COBERTURA */}
          <fieldset style={fieldsetStyle}>
            <legend style={legendStyle}>Cobertura / Obra social</legend>

            <div style={groupStyle}>
              <label style={labelStyle}>Obra social (payerCode)</label>
              <input
                type="text"
                style={getInputStyle("payerCode")}
                value={form.coverage.payerCode}
                onFocus={() => setFocusedField("payerCode")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) =>
                  handleChange("coverage", "payerCode", e.target.value)
                }
              />
              <span style={helperStyle}>
                Ejemplo: <span style={readOnlyPillStyle}>APOS</span>, INSSSEP,
                etc.
              </span>
            </div>

            <div style={groupStyle}>
              <label style={labelStyle}>
                Número de afiliado (membershipCode)
              </label>
              <input
                type="text"
                style={getInputStyle("membershipCode")}
                value={form.coverage.membershipCode}
                onFocus={() => setFocusedField("membershipCode")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) =>
                  handleChange("coverage", "membershipCode", e.target.value)
                }
              />
            </div>

            <div style={groupStyle}>
              <label style={labelStyle}>
                Número de afiliado (affiliateNumber, opcional)
              </label>
              <input
                type="text"
                style={getInputStyle("affiliateNumber")}
                value={form.coverage.affiliateNumber ?? ""}
                onFocus={() => setFocusedField("affiliateNumber")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) =>
                  handleChange("coverage", "affiliateNumber", e.target.value)
                }
              />
            </div>

            <div style={groupStyle}>
              <label style={labelStyle}>Plan / cobertura</label>
              <input
                type="text"
                style={getInputStyle("healthPlan")}
                value={form.coverage.healthPlan ?? ""}
                onFocus={() => setFocusedField("healthPlan")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) =>
                  handleChange("coverage", "healthPlan", e.target.value)
                }
              />
            </div>

            <div style={groupStyle}>
              <label style={labelStyle}>
                Código de plan interno (planCode, opcional)
              </label>
              <input
                type="text"
                style={getInputStyle("planCode")}
                value={form.coverage.planCode ?? ""}
                onFocus={() => setFocusedField("planCode")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) =>
                  handleChange("coverage", "planCode", e.target.value)
                }
              />
            </div>
          </fieldset>

          {/* APP + PROGRAMA */}
          <fieldset style={fieldsetStyle}>
            <legend style={legendStyle}>App del paciente y programa</legend>

            <div style={groupStyle}>
              <label style={labelStyle}>
                Email del paciente en la App (rol PATIENT)
              </label>
              <input
                type="email"
                style={getInputStyle("appEmail")}
                value={form.appUser?.email ?? ""}
                onFocus={() => setFocusedField("appEmail")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) =>
                  handleChange("appUser", "email", e.target.value)
                }
                placeholder="ej: americo.paciente@test.dev"
              />
              <span style={helperStyle}>
                El backend enlaza este usuario PATIENT con el Patient enrolado.
              </span>
            </div>

            <div style={groupStyle}>
              <label style={labelStyle}>
                Profesional responsable (mainProvider)
              </label>
              <input
                type="text"
                style={getInputStyle("mainProvider")}
                value={form.program?.mainProvider ?? ""}
                onFocus={() => setFocusedField("mainProvider")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) =>
                  handleChange("program", "mainProvider", e.target.value)
                }
                placeholder="Dr. / Lic. ..."
              />
            </div>

            <div style={groupStyle}>
              <label style={labelStyle}>Notas / Observaciones</label>
              <textarea
                style={textareaStyle}
                value={form.program?.notes ?? ""}
                onChange={(e) =>
                  handleChange("program", "notes", e.target.value)
                }
              />
            </div>
          </fieldset>

          {/* 🩺 PERFIL CLÍNICO INICIAL */}
          <fieldset
            style={{
              ...fieldsetStyle,
              gridColumn: "1 / -1", // ocupa todo el ancho de la grilla
            }}
          >
            <legend style={legendStyle}>
              Perfil clínico inicial — Diabetes
            </legend>

            <div className="clinical-grid">
              {/* Perfil metabólico */}
              <div style={groupStyle}>
                <label style={labelStyle}>Glucemia en ayunas (mg/dL)</label>
                <input
                  type="number"
                  style={getInputStyle("glucoseFasting")}
                  value={clinicalForm.glucoseFasting}
                  onFocus={() => setFocusedField("glucoseFasting")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) =>
                    handleClinicalChange("glucoseFasting", e.target.value)
                  }
                />
              </div>

              <div style={groupStyle}>
                <label style={labelStyle}>Glucemia posprandial (mg/dL)</label>
                <input
                  type="number"
                  style={getInputStyle("glucosePostprandial")}
                  value={clinicalForm.glucosePostprandial}
                  onFocus={() => setFocusedField("glucosePostprandial")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) =>
                    handleClinicalChange("glucosePostprandial", e.target.value)
                  }
                />
              </div>

              <div style={groupStyle}>
                <label style={labelStyle}>
                  Hemoglobina glicosilada (HbA1c %)
                </label>
                <input
                  type="number"
                  step="0.1"
                  style={getInputStyle("hba1c")}
                  value={clinicalForm.hba1c}
                  onFocus={() => setFocusedField("hba1c")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) =>
                    handleClinicalChange("hba1c", e.target.value)
                  }
                />
              </div>

              <div style={groupStyle}>
                <label style={labelStyle}>Colesterol total (mg/dL)</label>
                <input
                  type="number"
                  style={getInputStyle("totalCholesterol")}
                  value={clinicalForm.totalCholesterol}
                  onFocus={() => setFocusedField("totalCholesterol")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) =>
                    handleClinicalChange("totalCholesterol", e.target.value)
                  }
                />
              </div>

              <div style={groupStyle}>
                <label style={labelStyle}>HDL (mg/dL)</label>
                <input
                  type="number"
                  style={getInputStyle("hdl")}
                  value={clinicalForm.hdl}
                  onFocus={() => setFocusedField("hdl")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => handleClinicalChange("hdl", e.target.value)}
                />
              </div>

              <div style={groupStyle}>
                <label style={labelStyle}>LDL (mg/dL)</label>
                <input
                  type="number"
                  style={getInputStyle("ldl")}
                  value={clinicalForm.ldl}
                  onFocus={() => setFocusedField("ldl")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => handleClinicalChange("ldl", e.target.value)}
                />
              </div>

              <div style={groupStyle}>
                <label style={labelStyle}>Triglicéridos (mg/dL)</label>
                <input
                  type="number"
                  style={getInputStyle("triglycerides")}
                  value={clinicalForm.triglycerides}
                  onFocus={() => setFocusedField("triglycerides")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) =>
                    handleClinicalChange("triglycerides", e.target.value)
                  }
                />
              </div>

              <div style={groupStyle}>
                <label style={labelStyle}>IMC (kg/m²)</label>
                <input
                  type="number"
                  step="0.1"
                  style={getInputStyle("bmi")}
                  value={clinicalForm.bmi}
                  onFocus={() => setFocusedField("bmi")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => handleClinicalChange("bmi", e.target.value)}
                />
              </div>

              {/* Perfil renal */}
              <div style={groupStyle}>
                <label style={labelStyle}>
                  Microalbuminuria (mg/g) — valor numérico
                </label>
                <input
                  type="number"
                  style={getInputStyle("microalbuminuria")}
                  value={clinicalForm.microalbuminuria}
                  onFocus={() => setFocusedField("microalbuminuria")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) =>
                    handleClinicalChange("microalbuminuria", e.target.value)
                  }
                />
              </div>

              <div style={groupStyle}>
                <label style={labelStyle}>
                  Proteinuria (valor numérico o aproximado)
                </label>
                <input
                  type="number"
                  style={getInputStyle("proteinuria")}
                  value={clinicalForm.proteinuria}
                  onFocus={() => setFocusedField("proteinuria")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) =>
                    handleClinicalChange("proteinuria", e.target.value)
                  }
                />
              </div>

              {/* Perfil cardiovascular */}
              <div style={groupStyle}>
                <label style={labelStyle}>
                  Presión arterial sistólica (mmHg)
                </label>
                <input
                  type="number"
                  style={getInputStyle("systolicBP")}
                  value={clinicalForm.systolicBP}
                  onFocus={() => setFocusedField("systolicBP")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) =>
                    handleClinicalChange("systolicBP", e.target.value)
                  }
                />
              </div>

              <div style={groupStyle}>
                <label style={labelStyle}>
                  Presión arterial diastólica (mmHg)
                </label>
                <input
                  type="number"
                  style={getInputStyle("diastolicBP")}
                  value={clinicalForm.diastolicBP}
                  onFocus={() => setFocusedField("diastolicBP")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) =>
                    handleClinicalChange("diastolicBP", e.target.value)
                  }
                />
              </div>

              <div style={groupStyle}>
                <label style={labelStyle}>
                  Tabaquismo (ej: "no fumador", "ex fumador", "fumador activo")
                </label>
                <input
                  type="text"
                  style={getInputStyle("smokingStatus")}
                  value={clinicalForm.smokingStatus}
                  onFocus={() => setFocusedField("smokingStatus")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) =>
                    handleClinicalChange("smokingStatus", e.target.value)
                  }
                />
                <span style={helperStyle}>
                  Solo registro del estado, sin emitir diagnósticos.
                </span>
              </div>
            </div>
          </fieldset>
        </div>

        {/* BOTÓN + MENSAJES */}
        <div style={submitRowStyle}>
          <button
            type="submit"
            disabled={loading}
            style={{
              ...submitButtonStyle,
              ...(loading ? submitButtonDisabledStyle : {}),
            }}
          >
            {loading ? "Guardando..." : "Enrolar paciente"}
          </button>

          {error && <div className="table-error">{error}</div>}

          {clinicalError && <div className="table-error">{clinicalError}</div>}

          {success && (
            <div style={successBoxStyle}>
              <strong>Paciente enrolado correctamente.</strong>
              <div>
                {success.patient.firstName} {success.patient.lastName} —{" "}
                {success.patient.documentId}
              </div>
              <div>
                Programa: {success.enrollment.programType} (
                {success.enrollment.status})
              </div>
              {/* 🔜 Aquí después podemos sumar un botón "Ver ficha clínica completa"
                  cuando tengamos clara la ruta del router de pacientes */}
            </div>
          )}
        </div>
      </form>
    </section>
  );
};

export default PatientEnrollmentPage;
