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

import PharmaHeader from "../components/patientPharma/PharmaHeader";
import PharmaMedicationsTable from "../components/patientPharma/PharmaMedicationsTable";
import PharmaDispenseSummary from "../components/patientPharma/PharmaDispenseSummary";
import PharmaActiveTreatments from "../components/patientPharma/PharmaActiveTreatments";
import PharmaDrugsTable from "../components/patientPharma/PharmaDrugsTable";
import PharmaFamiliesTable from "../components/patientPharma/PharmaFamiliesTable";
import PharmaAdherenceBars from "../components/patientPharma/PharmaAdherenceBars";

import type { DrugFamilySummary } from "../components/patientPharma/types";

interface PatientPharmaFullPageProps {
  patient: PatientRow;
  onClose: () => void;
}

/**
 * Vista completa del Perfil Farmacológico del Paciente.
 * Se renderiza dentro de un contenedor flotante externo.
 */
export default function PatientPharmaFullPage({
  patient,
  onClose,
}: PatientPharmaFullPageProps) {
  const [pharma, setPharma] = useState<PatientPharmaProfile | null>(null);
  const [loadingPharma, setLoadingPharma] = useState<boolean>(false);
  const [pharmaError, setPharmaError] = useState<string | null>(null);

  const [medications, setMedications] = useState<PatientMedicationRow[]>([]);
  const [loadingMeds, setLoadingMeds] = useState<boolean>(false);
  const [medsError, setMedsError] = useState<string | null>(null);

  useEffect(() => {
    if (!patient?.id) return;

    setLoadingPharma(true);
    setPharmaError(null);

    fetchPharmaProfile(patient.id, 365)
      .then((data) => setPharma(data))
      .catch(() => {
        setPharmaError("No se pudo cargar el perfil farmacológico.");
      })
      .finally(() => setLoadingPharma(false));
  }, [patient?.id]);

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
      .catch(() => {
        if (cancelled) return;
        setMedsError("No se pudo cargar la medicación del paciente.");
      })
      .finally(() => {
        if (!cancelled) setLoadingMeds(false);
      });

    return () => {
      cancelled = true;
    };
  }, [patient?.id]);

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("es-AR");
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

  const renderMedicationTypeChip = (type: "CRONICO" | "OCASIONAL") =>
    renderChronicChip(type === "CRONICO");

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

  return (
    <section
      style={{
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <PharmaHeader patient={patient} onClose={onClose} />

      <main
        style={{
          padding: "0.75rem 1.25rem 1rem 1.25rem",
          boxSizing: "border-box",
        }}
      >
        <PharmaMedicationsTable
          medications={medications}
          loading={loadingMeds}
          error={medsError}
          formatDate={formatDate}
          renderMedicationTypeChip={renderMedicationTypeChip}
        />

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

        <PharmaDrugsTable
          drugs={pharma?.drugs}
          loading={loadingPharma}
          error={pharmaError}
        />

        <PharmaFamiliesTable
          families={families}
          loading={loadingPharma}
          error={pharmaError}
        />

        <PharmaAdherenceBars
          pharma={pharma}
          loading={loadingPharma}
          error={pharmaError}
        />
      </main>
    </section>
  );
}