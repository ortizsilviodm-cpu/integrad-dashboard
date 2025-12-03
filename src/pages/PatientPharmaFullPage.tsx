/* integrad-dashboard/src/pages/PatientPharmaFullPage.tsx */

import { useEffect, useState } from "react";
import {
  fetchPatientMedications,
  type PatientRow,
  type PatientMedicationRow,
} from "../api/patients";
import {
  fetchPharmaProfile,
  type PatientPharmaProfile,
} from "../api/pharmaProfile";

// 🧩 Componentes modulares de perfil farmacológico
import PharmaHeader from "../components/patientPharma/PharmaHeader";
import PharmaMedicationsTable from "../components/patientPharma/PharmaMedicationsTable";
import PharmaDispenseSummary from "../components/patientPharma/PharmaDispenseSummary";
import PharmaActiveTreatments from "../components/patientPharma/PharmaActiveTreatments";
import PharmaDrugsTable from "../components/patientPharma/PharmaDrugsTable";
import PharmaFamiliesTable from "../components/patientPharma/PharmaFamiliesTable";
import PharmaAdherenceBars from "../components/patientPharma/PharmaAdherenceBars";

// Tipos auxiliares para familias terapéuticas
import type { DrugFamilySummary } from "../components/patientPharma/types";

interface PatientPharmaFullPageProps {
  patient: PatientRow;
  onClose: () => void;
}

/**
 * Vista completa del Perfil Farmacológico del Paciente.
 * Ocupa casi toda la pantalla dentro de la sección Pacientes.
 */
export default function PatientPharmaFullPage({
  patient,
  onClose,
}: PatientPharmaFullPageProps) {
  // Perfil farmacológico basado en DISPENSAS
  const [pharma, setPharma] = useState<PatientPharmaProfile | null>(null);
  const [loadingPharma, setLoadingPharma] = useState<boolean>(false);
  const [pharmaError, setPharmaError] = useState<string | null>(null);

  // Tratamiento farmacológico ACTUAL (prescripción registrada)
  const [medications, setMedications] = useState<PatientMedicationRow[]>([]);
  const [loadingMeds, setLoadingMeds] = useState<boolean>(false);
  const [medsError, setMedsError] = useState<string | null>(null);

  // Bloquear scroll del body mientras está abierta la vista completa
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  /* -------------------------------------------------------
   * 1) PERFIL FARMACOLÓGICO (dispensas)
   * -------------------------------------------------------*/
  useEffect(() => {
    if (!patient?.id) return;

    setLoadingPharma(true);
    setPharmaError(null);

    fetchPharmaProfile(patient.id, 365)
      .then((data) => setPharma(data))
      .catch((err) => {
        console.error("Error al obtener perfil farmacológico (full view):", err);
        setPharmaError("No se pudo cargar el perfil farmacológico.");
      })
      .finally(() => setLoadingPharma(false));
  }, [patient?.id]);

  /* -------------------------------------------------------
   * 2) MEDICACIÓN ACTUAL (prescripción)
   * -------------------------------------------------------*/
  useEffect(() => {
    if (!patient?.id) return;

    let cancelled = false;
    setLoadingMeds(true);
    setMedsError(null);

    fetchPatientMedications(patient.id)
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          setMedications(res.data);
        } else {
          setMedsError(
            res.error ?? "No se pudo cargar la medicación del paciente."
          );
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Error medicación indicada del paciente:", err);
        setMedsError("No se pudo cargar la medicación del paciente.");
      })
      .finally(() => {
        if (!cancelled) setLoadingMeds(false);
      });

    return () => {
      cancelled = true;
    };
  }, [patient?.id]);

  /* -------------------------------------------------------
   * Helpers
   * -------------------------------------------------------*/

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("es-AR");
  };

  // Chip reutilizable para “Crónico / Ocasional”
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

  // Para la medicación indicada (usa el mismo estilo que el chip crónico)
  const renderMedicationTypeChip = (type: "CRONICO" | "OCASIONAL") =>
    renderChronicChip(type === "CRONICO");

  // Clasificación simplificada por familia terapéutica
  const getDrugFamily = (drugName: string, drugCode: string | null) => {
    const name = (drugName || "").toLowerCase();
    const code = (drugCode || "").toLowerCase();

    if (name.includes("metformina") || code.startsWith("metf")) {
      return "ADO — Metformina";
    }
    if (
      name.includes("glibenclamida") ||
      name.includes("glimepirida") ||
      code.startsWith("glib")
    ) {
      return "ADO — Sulfonilureas";
    }
    if (name.includes("insulina") || code.startsWith("ins")) {
      if (name.includes("lenta") || name.includes("glargina")) {
        return "Insulina basal";
      }
      return "Insulina";
    }
    return "Otros antidiabéticos";
  };

  const buildFamiliesSummary = (
    drugs: PatientPharmaProfile["drugs"]
  ): DrugFamilySummary[] => {
    const map = new Map<
      string,
      { drugs: Set<string>; chronic: number; adh: number[] }
    >();

    for (const d of drugs) {
      const family = getDrugFamily(d.drugName, d.drugCode);
      const entry =
        map.get(family) ??
        ({
          drugs: new Set<string>(),
          chronic: 0,
          adh: [],
        } as { drugs: Set<string>; chronic: number; adh: number[] });

      entry.drugs.add(d.drugName);
      if (d.chronic) entry.chronic += 1;
      if (typeof d.adherencePercentApprox === "number") {
        entry.adh.push(d.adherencePercentApprox);
      }
      map.set(family, entry);
    }

    const result: DrugFamilySummary[] = [];
    for (const [family, info] of map.entries()) {
      const avg =
        info.adh.length === 0
          ? null
          : Math.round(info.adh.reduce((a, b) => a + b, 0) / info.adh.length);

      result.push({
        family,
        drugs: Array.from(info.drugs),
        chronicCount: info.chronic,
        averageAdherence: avg,
      });
    }

    result.sort((a, b) => b.chronicCount - a.chronicCount);
    return result;
  };

  const families: DrugFamilySummary[] =
    pharma && pharma.drugs.length > 0 ? buildFamiliesSummary(pharma.drugs) : [];

  /* -------------------------------------------------------
   * Render
   * -------------------------------------------------------*/

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#f3f4f6",
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden", // evita scroll extra en el overlay raíz
      }}
    >
      {/* Barra superior */}
      <PharmaHeader patient={patient} onClose={onClose} />

      {/* Contenido scrollable */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0.75rem 1.5rem 0.75rem 1.5rem",
        }}
      >
        {/* 1) Tratamiento indicado (medicación registrada) */}
        <PharmaMedicationsTable
          medications={medications}
          loading={loadingMeds}
          error={medsError}
          formatDate={formatDate}
          renderMedicationTypeChip={renderMedicationTypeChip}
        />

        {/* 2) Resumen de medicación + badges de tratamientos activos */}
        <PharmaDispenseSummary
          pharma={pharma}
          loading={loadingPharma}
          error={pharmaError}
        />

        <PharmaActiveTreatments
          drugs={pharma?.drugs}
          loading={loadingPharma}
          error={pharmaError}
        />

        {/* 3) Detalle por medicamento */}
        <PharmaDrugsTable
          drugs={pharma?.drugs}
          loading={loadingPharma}
          error={pharmaError}
        />

        {/* 4) Resumen por familia terapéutica */}
        <PharmaFamiliesTable
          families={families}
          loading={loadingPharma}
          error={pharmaError}
        />

        {/* 5) Barras de adherencia por medicamento */}
        <PharmaAdherenceBars
          pharma={pharma}
          loading={loadingPharma}
          error={pharmaError}
        />
      </main>
    </div>
  );
}
