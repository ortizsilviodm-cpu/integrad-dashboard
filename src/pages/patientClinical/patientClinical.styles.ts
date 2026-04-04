/*integrad-dashboard\src\pages\patientClinical\patientClinical.styles.ts*/
import { TOKENS } from "../../theme/tokens";

/**
 * Estilos del módulo.
 */
export const S = {
  pageShell: {
    width: "100%",
    maxWidth: 1560,
    margin: "0 auto",
    boxSizing: "border-box",
    overflowX: "hidden",
  } as const,

  h3: {
    marginTop: 0,
    marginBottom: 0,
    fontSize: "1rem",
    fontWeight: 600,
    color: "#111827",
  } as const,

  sectionGrid2: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 0.8fr)",
    gap: 16,
    marginBottom: 16,
    minWidth: 0,
  } as const,

  sectionGridKpis: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 0.8fr)",
    gap: 16,
    marginBottom: 16,
    minWidth: 0,
  } as const,

  indicatorsHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    gap: 12,
    minWidth: 0,
  } as const,

  registerIndicatorButton: {
    border: `1px solid ${TOKENS.COLOR_PRIMARY}`,
    borderRadius: 999,
    padding: "4px 10px",
    cursor: "pointer",
    background: TOKENS.COLOR_PRIMARY,
    color: "#ffffff",
    fontSize: "0.8rem",
    fontWeight: 600,
    flexShrink: 0,
  } as const,

  indicatorsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
    fontSize: "0.85rem",
    minWidth: 0,
  } as const,

  kpisCard: {
    fontSize: "0.85rem",
    minWidth: 0,
  } as const,

  kpisTitle: {
    marginBottom: 10,
  } as const,
};