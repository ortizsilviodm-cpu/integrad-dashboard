/* integrad-dashboard/src/views/AmbulatoryView.tsx */

import type { AmbulatoryRow, AmbulatoryMeta } from "../api/externalAmbulatory";

export type AmbulatoryViewProps = {
  // Filtros
  payer: string;
  membershipCode: string;
  year: string;

  onChangePayer: (value: string) => void;
  onChangeMembershipCode: (value: string) => void;
  onChangeYear: (value: string) => void;
  onSubmit: () => void;

  // Datos
  loading: boolean;
  error: string | null;
  rows: AmbulatoryRow[];
  meta: AmbulatoryMeta | null;

  // Paginación (local)
  currentPage: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;
};

export default function AmbulatoryView({
  payer,
  membershipCode,
  year,
  onChangePayer,
  onChangeMembershipCode,
  onChangeYear,
  onSubmit,
  loading,
  error,
  rows,
  meta,
  currentPage,
  totalPages,
  onNextPage,
  onPrevPage,
}: AmbulatoryViewProps) {
  const hasData = rows.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <section className="app-table">
      {/* Encabezado */}
      <header className="section-header">
        <h2>Consumos Ambulatorios</h2>
        <p className="chart-subtitle">
          Búsqueda de prácticas / consumos ambulatorios por afiliado y año (fuente: {payer}).
        </p>
      </header>

      {/* Filtros */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "flex-end",
          marginBottom: "1rem",
        }}
      >
        <div style={{ minWidth: 220 }}>
          <label
            htmlFor="payer"
            style={{ display: "block", fontSize: 13, marginBottom: 4 }}
          >
            Obra social / Payer
          </label>
          <select
            id="payer"
            value={payer}
            onChange={(e) => onChangePayer(e.target.value)}
            style={{ width: "100%", padding: "6px 8px", fontSize: 14 }}
          >
            <option value="APOS">APOS</option>
            {/* Futuro: otras obras sociales */}
          </select>
        </div>

        <div style={{ minWidth: 260 }}>
          <label
            htmlFor="membershipCode"
            style={{ display: "block", fontSize: 13, marginBottom: 4 }}
          >
            Código de afiliado
          </label>
          <input
            id="membershipCode"
            type="text"
            value={membershipCode}
            onChange={(e) => onChangeMembershipCode(e.target.value)}
            placeholder="Ej: 0000019955995500"
            style={{ width: "100%", padding: "6px 8px", fontSize: 14 }}
          />
        </div>

        <div style={{ width: 120 }}>
          <label
            htmlFor="year"
            style={{ display: "block", fontSize: 13, marginBottom: 4 }}
          >
            Año
          </label>
          <input
            id="year"
            type="number"
            min={2000}
            max={2100}
            value={year}
            onChange={(e) => onChangeYear(e.target.value)}
            style={{ width: "100%", padding: "6px 8px", fontSize: 14 }}
          />
        </div>

        <button
          type="submit"
          className="retry-button"
          style={{ paddingInline: "1.5rem", marginLeft: "auto" }}
          disabled={loading || !membershipCode.trim()}
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {/* Meta / Resumen */}
      {!loading && meta && (
        <p
          style={{
            fontSize: 13,
            marginBottom: "0.75rem",
            color: "#555",
          }}
        >
          Resultado para <strong>{meta.membershipCode}</strong> · Año{" "}
          <strong>{meta.year}</strong> · Episodios:{" "}
          <strong>{meta.count}</strong>
        </p>
      )}

      {/* Estado: cargando */}
      {loading && (
        <div className="chart-placeholder">
          Consultando consumos ambulatorios…
        </div>
      )}

      {/* Estado: error */}
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
            Error al cargar consumos ambulatorios:
            <br />
            <strong>{error}</strong>
          </p>
        </div>
      )}

      {/* Estado: sin datos */}
      {!loading && !error && !hasData && meta && meta.count === 0 && (
        <div className="chart-placeholder">
          No se encontraron consumos ambulatorios para el afiliado y año
          seleccionados.
        </div>
      )}

      {/* Tabla de datos */}
      {!loading && !error && hasData && (
        <>
          <div style={{ overflowX: "auto", marginTop: 10 }}>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Ticket</th>
                  <th>Prestador</th>
                  <th>Centro</th>
                  <th>Estado (crudo)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.date}</td>
                    <td>{row.ticket}</td>
                    <td>{row.provider}</td>
                    <td>{row.center}</td>
                    <td>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación local */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "1rem",
              gap: "1rem",
            }}
          >
            <button
              type="button"
              className="retry-button"
              disabled={currentPage <= 1}
              onClick={onPrevPage}
            >
              ← Anterior
            </button>

            <span style={{ justifySelf: "center", fontSize: 13 }}>
              Página {currentPage} de {totalPages}
            </span>

            <button
              type="button"
              className="retry-button"
              disabled={currentPage >= totalPages}
              onClick={onNextPage}
            >
              Siguiente →
            </button>
          </div>
        </>
      )}
    </section>
  );
}
