/* integrad-dashboard/src/pages/AmbulatoryPage.tsx */

import React, { useState } from "react";
import {
  fetchAmbulatoryEpisodes,
  type AmbulatoryRow,
} from "../api/ambulatory";

const DEFAULT_PAYER = "APOS";
const CURRENT_YEAR = new Date().getFullYear();

const AmbulatoryPage: React.FC = () => {
  const [payer] = useState<string>(DEFAULT_PAYER);
  const [membershipCode, setMembershipCode] = useState<string>("");
  const [year, setYear] = useState<number>(CURRENT_YEAR);

  const [episodes, setEpisodes] = useState<AmbulatoryRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [metaInfo, setMetaInfo] = useState<string | null>(null);

  const hasData = episodes.length > 0;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = membershipCode.trim();
    if (!trimmed) {
      setError("Ingresá un código de afiliado para buscar.");
      setEpisodes([]);
      setMetaInfo(null);
      return;
    }

    setLoading(true);
    setError(null);
    setMetaInfo(null);

    try {
      const result = await fetchAmbulatoryEpisodes({
        payer,
        membershipCode: trimmed,
        year,
      });

      if (!result.ok) {
        setEpisodes([]);
        setError(
          result.error ??
            "No se pudieron obtener los consumos ambulatorios."
        );
        setMetaInfo(null);
      } else {
        setEpisodes(result.data);

        if (result.meta) {
          setMetaInfo(
            `Obra social: ${result.meta.payer} · Afiliado: ${
              result.meta.membershipCode
            } · Año: ${result.meta.year} · Episodios: ${
              result.meta.count ?? result.data.length
            }`
          );
        } else {
          setMetaInfo(null);
        }
      }
    } catch (err) {
      console.error("Error inesperado consultando ambulatorios:", err);
      setEpisodes([]);
      setError("Error inesperado consultando ambulatorios.");
      setMetaInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (value: string) => {
    const n = Number(value);
    if (!Number.isNaN(n)) {
      setYear(n);
    } else if (value === "") {
      // permitir limpiar el input sin romper el state
      setYear(CURRENT_YEAR);
    }
  };

  return (
    <section className="app-table">
      <header className="section-header">
        <h2>Consumos Ambulatorios</h2>
        <p className="chart-subtitle">
          Búsqueda de prácticas / consumos ambulatorios por afiliado y año
          (fuente: APOS).
        </p>
      </header>

      {/* Filtros de búsqueda */}
      <form
        onSubmit={handleSearch}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "flex-end",
          marginBottom: "1rem",
        }}
      >
        <div style={{ minWidth: 160 }}>
          <label
            htmlFor="payer"
            style={{ display: "block", fontSize: 12, color: "#6b7280" }}
          >
            Obra Social / Payer
          </label>
          <select
            id="payer"
            value={payer}
            disabled
            style={{
              width: "100%",
              padding: "6px 8px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              fontSize: 13,
              backgroundColor: "#f9fafb",
            }}
          >
            <option value="APOS">APOS</option>
          </select>
        </div>

        <div style={{ minWidth: 220 }}>
          <label
            htmlFor="membershipCode"
            style={{ display: "block", fontSize: 12, color: "#6b7280" }}
          >
            Código de afiliado
          </label>
          <input
            id="membershipCode"
            type="text"
            value={membershipCode}
            onChange={(e) => setMembershipCode(e.target.value)}
            placeholder="Ej: 11103894100"
            style={{
              width: "100%",
              padding: "6px 8px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              fontSize: 13,
            }}
          />
        </div>

        <div style={{ width: 120 }}>
          <label
            htmlFor="year"
            style={{ display: "block", fontSize: 12, color: "#6b7280" }}
          >
            Año
          </label>
          <input
            id="year"
            type="number"
            value={year}
            onChange={(e) => handleYearChange(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 8px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              fontSize: 13,
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "7px 16px",
            borderRadius: 999,
            border: "none",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {metaInfo && (
        <p
          style={{
            fontSize: 12,
            color: "#4b5563",
            marginBottom: "0.75rem",
          }}
        >
          {metaInfo}
        </p>
      )}

      {/* Estados */}
      {loading && (
        <div className="chart-placeholder">
          Consultando consumos ambulatorios en la obra social...
        </div>
      )}

      {!loading && error && (
        <div className="chart-placeholder">
          <p
            style={{
              margin: 0,
              marginBottom: "0.8rem",
              width: "100%",
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            Error al obtener consumos ambulatorios:
            <br />
            <strong>{error}</strong>
          </p>
        </div>
      )}

      {!loading && !error && !hasData && membershipCode.trim() !== "" && (
        <div className="chart-placeholder">
          No se encontraron consumos ambulatorios para el afiliado y año
          seleccionados.
        </div>
      )}

      {!loading && !error && hasData && (
        <div style={{ overflowX: "auto", marginTop: 10 }}>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Prestador</th>
                <th>Centro</th>
                <th>Estado (raw)</th>
              </tr>
            </thead>
            <tbody>
              {episodes.map((e) => (
                <tr key={e.id}>
                  <td>{e.date}</td>
                  <td>{e.provider}</td>
                  <td>{e.center}</td>
                  <td>{e.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default AmbulatoryPage;
